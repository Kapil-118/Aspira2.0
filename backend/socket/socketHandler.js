const Message = require('../models/message');
const Conversation = require('../models/conversation');
const User = require('../models/user');

const onlineUsers = new Map(); // Map: userId -> socket.id

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // 1. User Online Event
    socket.on('userOnline', async (userId) => {
      if (!userId) return;
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      
      console.log(`User ${userId} is online at socket ${socket.id}`);
      
      // Update lastSeen and broadcast online list
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (err) {
        console.error('Error updating user last seen on socket connect:', err.message);
      }
      
      io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
    });

    // 2. Join Conversation Room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
    });

    // 3. Send Message
    socket.on('sendMessage', async ({ conversationId, senderId, text, fileUrl, fileType, replyTo }) => {
      try {
        if (!conversationId || !senderId) return;

        // Save message to database
        let message = await Message.create({
          conversationId,
          sender: senderId,
          text: text || '',
          fileUrl: fileUrl || '',
          fileType: fileType || 'text',
          replyTo: replyTo || null,
          isSeen: false
        });

        // Populate replyTo details for parent preview box
        if (message.replyTo) {
          message = await message.populate('replyTo', 'text sender fileUrl fileType');
        }

        // Update conversation updated timestamp
        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });

        // Emit to conversation room (including the sender for confirmation)
        io.to(conversationId).emit('receiveMessage', message);

        // Send a custom visual Notification popup to the recipient if they aren't in the conversation room!
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const recipientId = conversation.participants.find(p => p.toString() !== senderId.toString());
          if (recipientId) {
            const recipientSocketId = onlineUsers.get(recipientId.toString());
            if (recipientSocketId) {
              const senderUser = await User.findById(senderId).select('name profilePhoto');
              io.to(recipientSocketId).emit('newNotification', {
                type: 'message',
                text: `New message from ${senderUser ? senderUser.name : 'User'}`,
                sender: senderUser,
                conversationId
              });
            }
          }
        }
      } catch (error) {
        console.error('Socket sendMessage error:', error.message);
      }
    });

    // 3.1. Edit Message
    socket.on('editMessage', async ({ messageId, text }) => {
      try {
        let msg = await Message.findById(messageId);
        if (!msg) return;

        msg.text = text;
        msg.isEdited = true;
        await msg.save();

        if (msg.replyTo) {
          msg = await msg.populate('replyTo', 'text sender fileUrl fileType');
        }

        io.to(msg.conversationId.toString()).emit('messageUpdated', msg);
      } catch (error) {
        console.error('Socket editMessage error:', error.message);
      }
    });

    // 3.2. Delete Message
    socket.on('deleteMessage', async ({ messageId, type, userId }) => {
      try {
        let msg = await Message.findById(messageId);
        if (!msg) return;

        if (type === 'everyone') {
          msg.text = 'This message was deleted.';
          msg.fileUrl = '';
          msg.fileType = 'text';
          msg.isDeleted = true;
          await msg.save();

          if (msg.replyTo) {
            msg = await msg.populate('replyTo', 'text sender fileUrl fileType');
          }

          io.to(msg.conversationId.toString()).emit('messageUpdated', msg);
        } else if (type === 'me') {
          if (!msg.deletedBy) {
            msg.deletedBy = [];
          }
          const hasDeleted = msg.deletedBy.some(id => id.toString() === userId.toString());
          if (!hasDeleted) {
            msg.deletedBy.push(userId);
            await msg.save();
          }
          socket.emit('messageDeletedForMe', { messageId });
        }
      } catch (error) {
        console.error('Socket deleteMessage error:', error.message);
      }
    });

    // 3.3. React to Message
    socket.on('reactMessage', async ({ messageId, userId, emoji }) => {
      try {
        let msg = await Message.findById(messageId);
        if (!msg) return;

        const existingIndex = msg.reactions.findIndex(r => r.userId.toString() === userId.toString());
        if (existingIndex > -1) {
          if (msg.reactions[existingIndex].emoji === emoji) {
            msg.reactions.splice(existingIndex, 1);
          } else {
            msg.reactions[existingIndex].emoji = emoji;
          }
        } else {
          msg.reactions.push({ userId, emoji });
        }

        await msg.save();

        if (msg.replyTo) {
          msg = await msg.populate('replyTo', 'text sender fileUrl fileType');
        }

        io.to(msg.conversationId.toString()).emit('messageUpdated', msg);
      } catch (error) {
        console.error('Socket reactMessage error:', error.message);
      }
    });

    // 4. Typing Indicators
    socket.on('typing', ({ conversationId, username }) => {
      socket.to(conversationId).emit('typing', { conversationId, username });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(conversationId).emit('stopTyping', { conversationId });
    });

    // 5. Messages Seen Status
    socket.on('messagesSeen', async ({ conversationId, userId }) => {
      try {
        // Mark messages as seen in database
        await Message.updateMany(
          { conversationId, sender: { $ne: userId }, isSeen: false },
          { $set: { isSeen: true } }
        );
        // Dispatch event to conversation room
        socket.to(conversationId).emit('messagesSeen', { conversationId });
      } catch (error) {
        console.error('Socket messagesSeen error:', error.message);
      }
    });

    // 6. WebRTC Video Calling Signaling Relays
    socket.on('call-user', ({ offer, to, from, callerName }) => {
      const recipientSocketId = onlineUsers.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('incoming-call', { offer, from, callerName });
      }
    });

    socket.on('answer-call', ({ answer, to }) => {
      const callerSocketId = onlineUsers.get(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-answered', { answer });
      }
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      const peerSocketId = onlineUsers.get(to);
      if (peerSocketId) {
        io.to(peerSocketId).emit('ice-candidate', { candidate });
      }
    });

    socket.on('end-call', ({ to }) => {
      const peerSocketId = onlineUsers.get(to);
      if (peerSocketId) {
        io.to(peerSocketId).emit('call-ended');
      }
    });

    // 7. Disconnection
    socket.on('disconnect', async () => {
      console.log(`Socket Disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        try {
          await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
        } catch (err) {
          console.error('Error updating user last seen on disconnect:', err.message);
        }
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
      }
    });
  });
};

module.exports = {
  socketHandler,
  onlineUsers
};
