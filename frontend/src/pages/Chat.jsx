import React, { useState, useEffect, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  Send, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  PhoneCall, 
  Circle,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  File,
  Download,
  X,
  Smile,
  Pencil,
  Trash2,
  CornerUpLeft
} from 'lucide-react';

import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { getMediaUrl } from '../utils/media';

const peerConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const popularEmojis = ['😄', '😂', '😍', '👍', '❤️', '🔥', '🎉', '👏', '🙌', '💡', '🤔', '🚀', '💯', '✔️', '❌'];

const Chat = () => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);

  // Conversations and Messages States
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Sockets States
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserConvoId, setTypingUserConvoId] = useState(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // WebRTC Video Call States
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerDetails, setCallerDetails] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch initial conversations list
  const fetchConversations = async (selectId = null) => {
    try {
      const res = await API.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
        if (selectId) {
          const match = res.data.conversations.find(c => c._id === selectId);
          if (match) setActiveConvo(match);
        } else if (res.data.conversations.length > 0 && !activeConvo) {
          setActiveConvo(res.data.conversations[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load conversations.', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvo) return;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/chat/messages/${activeConvo._id}`);
        if (res.data.success) {
          setMessages(res.data.messages);
          // Mark as seen on open
          if (socket) {
            socket.emit('messagesSeen', { conversationId: activeConvo._id, userId: user._id });
          }
          await API.put(`/chat/messages-seen/${activeConvo._id}`);
        }
      } catch (err) {
        toast.error('Error fetching chat history.', { theme: 'dark' });
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit('joinConversation', activeConvo._id);
    }
  }, [activeConvo, socket]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Listen to Socket events
  useEffect(() => {
    if (!socket) return;

    // Receive message
    socket.on('receiveMessage', (message) => {
      if (activeConvo && message.conversationId === activeConvo._id) {
        setMessages((prev) => [...prev, message]);
        // Trigger seen emission if this conversation is active
        if (message.sender?.toString() !== user?._id?.toString()) {
          socket.emit('messagesSeen', { conversationId: activeConvo._id, userId: user._id });
        }
      }
      fetchConversations(activeConvo?._id); // Refresh left pane
    });

    // Message updated (reaction, edit, delete for everyone)
    socket.on('messageUpdated', (updatedMessage) => {
      const updatedConvoId = updatedMessage.conversationId?._id || updatedMessage.conversationId;
      const activeId = activeConvo?._id;
      if (activeId && updatedConvoId && updatedConvoId.toString() === activeId.toString()) {
        setMessages((prev) => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      }
      fetchConversations(activeId);
    });

    // Message deleted for me
    socket.on('messageDeletedForMe', ({ messageId }) => {
      setMessages((prev) => prev.filter(m => m._id !== messageId));
      fetchConversations(activeConvo?._id);
    });

    // Typing handlers
    socket.on('typing', ({ conversationId, username }) => {
      if (activeConvo && conversationId === activeConvo._id) {
        setIsTyping(true);
        setTypingUserConvoId(conversationId);
      }
    });

    socket.on('stopTyping', ({ conversationId }) => {
      if (activeConvo && conversationId === activeConvo._id) {
        setIsTyping(false);
        setTypingUserConvoId(null);
      }
    });

    // Message seen list synchronization
    socket.on('messagesSeen', ({ conversationId }) => {
      if (activeConvo && conversationId === activeConvo._id) {
        setMessages((prev) => prev.map(m => ({ ...m, isSeen: true })));
      }
    });

    // WebRTC connection listeners
    socket.on('incoming-call', ({ offer, from, callerName }) => {
      setCallerDetails({ offer, from, name: callerName });
      setIncomingCall(true);
    });

    socket.on('call-answered', async ({ answer }) => {
      try {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCallActive(true);
        }
      } catch (err) {
        console.error('Error setting remote answer description:', err);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (pcRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding remote ice candidate:', err);
      }
    });

    socket.on('call-ended', () => {
      cleanupCall();
      toast.info('Call ended by peer.', { theme: 'dark' });
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageUpdated');
      socket.off('messageDeletedForMe');
      socket.off('typing');
      socket.off('stopTyping');
      socket.off('messagesSeen');
      socket.off('incoming-call');
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [activeConvo, socket]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeConvo) return;

    socket.emit('typing', { conversationId: activeConvo._id, username: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: activeConvo._id });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!socket || !activeConvo) return;
    if (!inputText.trim() && !selectedFile) return;

    if (editingMessage) {
      socket.emit('editMessage', {
        messageId: editingMessage._id,
        text: inputText
      });
      setEditingMessage(null);
      setInputText('');
      return;
    }

    let fileUrl = '';
    let fileType = 'text';

    if (selectedFile) {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('chatFile', selectedFile);

      try {
        const res = await API.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          fileUrl = res.data.fileUrl;
          fileType = res.data.fileType;
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error uploading chat file attachment.', { theme: 'dark' });
        setUploadingFile(false);
        return;
      }
    }

    // Send via socket
    socket.emit('sendMessage', {
      conversationId: activeConvo._id,
      senderId: user._id,
      text: inputText,
      fileUrl,
      fileType,
      replyTo: replyingToMessage ? replyingToMessage._id : null
    });

    // Reset typing and inputs
    socket.emit('stopTyping', { conversationId: activeConvo._id });
    setInputText('');
    setSelectedFile(null);
    setReplyingToMessage(null);
    setUploadingFile(false);
  };

  // Delete message handler
  const handleDeleteMessage = async (message) => {
    if (!socket) return;
    const isMyMessage = message.sender?.toString() === user?._id?.toString();

    if (isMyMessage) {
      const result = await Swal.fire({
        title: 'Delete Message',
        text: 'Do you want to delete this message for yourself or for everyone?',
        icon: 'warning',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: '#4F46E5',
        denyButtonColor: '#EF4444',
        cancelButtonColor: '#1F2937',
        confirmButtonText: 'Delete for Everyone',
        denyButtonText: 'Delete for Me',
        background: '#151D30',
        color: '#F3F4F6'
      });

      if (result.isConfirmed) {
        socket.emit('deleteMessage', { messageId: message._id, type: 'everyone', userId: user._id });
      } else if (result.isDenied) {
        socket.emit('deleteMessage', { messageId: message._id, type: 'me', userId: user._id });
      }
    } else {
      const result = await Swal.fire({
        title: 'Delete Message',
        text: 'Do you want to delete this message for yourself?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#1F2937',
        confirmButtonText: 'Delete for Me',
        background: '#151D30',
        color: '#F3F4F6'
      });

      if (result.isConfirmed) {
        socket.emit('deleteMessage', { messageId: message._id, type: 'me', userId: user._id });
      }
    }
  };

  // React to message handler
  const handleReactMessage = (messageId, emoji) => {
    if (!socket) return;
    socket.emit('reactMessage', { messageId, userId: user._id, emoji });
  };

  // WebRTC Code: Initiates video call
  const startCall = async () => {
    if (!activeConvo || !socket) return;
    const recipientId = activeConvo.recipient._id;

    try {
      // Get Media Devices
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(peerConfig);
      pcRef.current = pc;

      // Add local tracks to peer
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Track ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, to: recipientId });
        }
      };

      // Remote stream received
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      // Create Offer SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call-user', {
        offer,
        to: recipientId,
        from: user._id,
        callerName: user.name
      });

      setCallActive(true);
      toast.info('Calling peer... waiting for answer.', { theme: 'dark' });
    } catch (err) {
      console.error('WebRTC Start Call Error:', err);
      toast.error('Could not access camera/microphone media devices.', { theme: 'dark' });
    }
  };

  // Accept incoming call
  const acceptIncomingCall = async () => {
    if (!callerDetails || !socket) return;
    setIncomingCall(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(peerConfig);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, to: callerDetails.from });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      // Set Remote Description
      await pc.setRemoteDescription(new RTCSessionDescription(callerDetails.offer));

      // Create Answer SDP
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer-call', { answer, to: callerDetails.from });
      setCallActive(true);
    } catch (err) {
      console.error('Accept call error:', err);
      toast.error('Failed to connect call devices.', { theme: 'dark' });
    }
  };

  // Reject / decline call
  const declineIncomingCall = () => {
    if (callerDetails && socket) {
      socket.emit('end-call', { to: callerDetails.from });
    }
    setIncomingCall(false);
    setCallerDetails(null);
  };

  // Disconnect / hangup call
  const hangupCall = () => {
    if (activeConvo && socket) {
      socket.emit('end-call', { to: activeConvo.recipient._id });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);
    setIncomingCall(false);
    setCallerDetails(null);
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoActive(videoTrack.enabled);
      }
    }
  };

  const isOnline = (recipientId) => onlineUsers.includes(recipientId);

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] text-left relative">
      
      {/* Left panel: Active Conversation List */}
      <div className="w-80 glass-panel rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-400">Conversations</h3>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              No chat histories.
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = activeConvo && activeConvo._id === convo._id;
              const onlineStatus = isOnline(convo.recipient._id);

              return (
                <button
                  key={convo._id}
                  onClick={() => setActiveConvo(convo)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-glow' 
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="relative">
                    {convo.recipient.profilePhoto ? (
                      <img
                        src={getMediaUrl(convo.recipient.profilePhoto)}
                        alt={convo.recipient.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {convo.recipient.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-darkBg rounded-full ${
                      onlineStatus ? 'bg-emerald-500' : 'bg-gray-600'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{convo.recipient.name}</p>
                    <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>
                      {typingUserConvoId === convo._id 
                        ? 'typing...' 
                        : (convo.lastMessage 
                          ? (convo.lastMessage.isDeleted 
                            ? 'This message was deleted.' 
                            : (convo.lastMessage.fileUrl 
                              ? `📁 [Attachment]` 
                              : convo.lastMessage.text))
                          : convo.recipient.role)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Active chat window */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden">
        {activeConvo ? (
          <>
            {/* Header bar */}
            <div className="px-6 py-4 bg-darkCard/50 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeConvo.recipient.profilePhoto ? (
                  <img
                    src={getMediaUrl(activeConvo.recipient.profilePhoto)}
                    alt={activeConvo.recipient.name}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-85 transition border border-white/10"
                    title="Click to expand view"
                    onClick={() => setLightboxPhoto(getMediaUrl(activeConvo.recipient.profilePhoto))}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {activeConvo.recipient.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">{activeConvo.recipient.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Circle className={`w-2 h-2 ${isOnline(activeConvo.recipient._id) ? 'fill-emerald-500 stroke-none' : 'fill-gray-500 stroke-none'}`} />
                    <span className="text-[10px] text-gray-500 capitalize">
                      {isOnline(activeConvo.recipient._id) ? 'online' : 'offline'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.map((m) => {
                const isMyMessage = m.sender?.toString() === user?._id?.toString();
                return (
                  <div
                    key={m._id || Math.random()}
                    className={`flex flex-col max-w-[70%] group relative ${isMyMessage ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    {/* Hover actions bar */}
                    {!m.isDeleted && (
                      <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-20 py-2 ${
                        isMyMessage ? 'right-full pr-3.5' : 'left-full pl-3.5'
                      }`}>
                        <div className="flex items-center gap-1.5 bg-[#151D30]/95 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-xl shadow-lg">
                          {/* Reaction Quick Picker */}
                          <div className="relative group/react">
                            <button
                              type="button"
                              className="p-1 hover:text-indigo-400 text-gray-400 transition"
                              title="React"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0d121f] border border-white/15 p-1 rounded-lg shadow-xl hidden group-hover/react:flex gap-1.5 z-30">
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReactMessage(m._id, emoji)}
                                  className="hover:scale-125 transition text-sm p-0.5"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToMessage(m);
                              setEditingMessage(null);
                            }}
                            className="p-1 hover:text-indigo-400 text-gray-400 transition"
                            title="Reply"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>

                          {isMyMessage && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(m);
                                setInputText(m.text);
                                setReplyingToMessage(null);
                              }}
                              className="p-1 hover:text-indigo-400 text-gray-400 transition"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m)}
                            className="p-1 hover:text-red-400 text-gray-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMyMessage 
                        ? 'bg-indigo-600 text-white rounded-tr-none font-medium' 
                        : 'bg-darkCard text-gray-300 rounded-tl-none border border-white/5'
                    }`}>
                      {/* Replying Parent Preview */}
                      {m.replyTo && (
                        <div className="bg-black/30 border-l-2 border-indigo-400 p-2 rounded-lg text-[10px] mb-2 text-left opacity-80 max-w-xs truncate select-none">
                          <span className="font-bold text-[9px] block text-indigo-300">
                            {m.replyTo.sender?.toString() === user?._id?.toString() ? 'You' : activeConvo.recipient.name}
                          </span>
                          <span>{m.replyTo.text || '📁 Attachment'}</span>
                        </div>
                      )}

                      {m.isDeleted ? (
                        <p className="italic text-gray-500 text-left select-none">This message was deleted.</p>
                      ) : (
                        <>
                          {m.fileUrl && m.fileType === 'image' && (
                            <div className="mb-2 max-w-xs">
                              <img
                                src={getMediaUrl(m.fileUrl)}
                                alt="Chat image"
                                className="rounded-xl max-h-48 w-full object-cover cursor-pointer hover:opacity-90 transition border border-white/5 shadow-md"
                                onClick={() => window.open(getMediaUrl(m.fileUrl), '_blank')}
                              />
                            </div>
                          )}
                          {m.fileUrl && m.fileType === 'pdf' && (
                            <div className="mb-2 flex items-center gap-2.5 bg-darkBg/60 p-3 rounded-xl border border-white/5 text-left min-w-[200px]">
                              <File className="w-8 h-8 text-red-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-gray-300 truncate">PDF Attachment</p>
                                <a
                                  href={getMediaUrl(m.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 mt-0.5"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>Download PDF</span>
                                </a>
                              </div>
                            </div>
                          )}
                          {m.text && <p className="text-left leading-relaxed">{m.text}</p>}

                          {/* Reactions Display */}
                          {m.reactions && m.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 bg-black/30 py-0.5 px-1.5 rounded-full border border-white/5 w-fit select-none">
                              {Object.entries(
                                m.reactions.reduce((acc, r) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                  return acc;
                                }, {})
                              ).map(([emoji, count]) => (
                                <span key={emoji} className="text-[10px] flex items-center gap-0.5" title={`${count} reaction(s)`}>
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-[8px] text-gray-400">{count}</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 flex items-center gap-1.5 mt-1 select-none">
                      <span>{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.isEdited && <span className="text-gray-600 font-medium italic">(edited)</span>}
                      {isMyMessage && (
                        m.isSeen ? <CheckCheck className="w-3.5 h-3.5 text-indigo-400" /> : <Check className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </span>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="self-start bg-darkCard/40 border border-white/5 text-gray-400 text-[10px] px-3.5 py-2 rounded-2xl rounded-tl-none animate-pulse">
                  {activeConvo.recipient.name} is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Replying message preview panel */}
            {replyingToMessage && (
              <div className="px-4 py-2.5 bg-darkBg/95 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex-1 text-left border-l-2 border-indigo-500 pl-3 min-w-0">
                  <span className="font-bold text-[10px] text-indigo-400 block mb-0.5">
                    Replying to {replyingToMessage.sender?.toString() === user?._id?.toString() ? 'yourself' : activeConvo.recipient.name}
                  </span>
                  <p className="text-gray-450 truncate">{replyingToMessage.text || '📁 Attachment'}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setReplyingToMessage(null)} 
                  className="text-gray-500 hover:text-white p-1 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Editing message preview panel */}
            {editingMessage && (
              <div className="px-4 py-2.5 bg-darkBg/95 border-t border-white/5 flex items-center justify-between text-xs">
                <div className="flex-1 text-left border-l-2 border-indigo-500 pl-3 min-w-0">
                  <span className="font-bold text-[10px] text-indigo-400 block mb-0.5">
                    Editing Message
                  </span>
                  <p className="text-gray-455 truncate">{editingMessage.text}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingMessage(null);
                    setInputText('');
                  }} 
                  className="text-gray-500 hover:text-white p-1 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* File attachment preview panel */}
            {selectedFile && (
              <div className="px-4 py-2.5 bg-darkBg/80 border-t border-white/5 flex items-center justify-between text-xs text-indigo-400">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-indigo-400" />
                  <span className="truncate max-w-[250px] font-semibold">{selectedFile.name}</span>
                  <span className="text-[10px] text-gray-500">({Math.round(selectedFile.size / 1024)} KB)</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedFile(null)} 
                  className="text-gray-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Message input panel */}
            <form onSubmit={handleSendMessage} className="p-4 bg-darkCard/30 border-t border-white/5 flex gap-3 items-center relative">
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 bg-[#151D30] border border-white/10 p-3 rounded-2xl shadow-glass flex flex-wrap gap-2 max-w-xs z-50">
                  {popularEmojis.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputText(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error('File size exceeds 5MB limit.', { theme: 'dark' });
                      return;
                    }
                    setSelectedFile(f);
                  }
                }}
                accept="image/*,application/pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingFile}
                className="p-3 bg-darkBg/50 text-gray-400 hover:text-indigo-400 hover:bg-darkBg rounded-xl transition focus:outline-none"
                title="Attach file (image or PDF)"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={uploadingFile}
                className={`p-3 rounded-xl transition focus:outline-none ${
                  showEmojiPicker ? 'bg-indigo-600/20 text-indigo-400' : 'bg-darkBg/50 text-gray-400 hover:text-indigo-400 hover:bg-darkBg'
                }`}
                title="Insert emoji"
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 glass-input text-xs py-3"
                placeholder={uploadingFile ? 'Uploading file...' : 'Write your message here...'}
                disabled={uploadingFile}
              />
              
              <button
                type="submit"
                disabled={uploadingFile || (!inputText.trim() && !selectedFile)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition shadow-md disabled:opacity-50"
              >
                {uploadingFile ? (
                  <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4.5 h-4.5" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-500 py-16">
            <MessageSquare className="w-12 h-12 text-indigo-500/20 mb-3" />
            <p className="text-sm">Select an active conversation to begin messaging.</p>
          </div>
        )}
      </div>

      {/* Lightbox modal overlay */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-md p-4 cursor-pointer"
          onClick={() => setLightboxPhoto(null)}
        >
          <button 
            onClick={() => setLightboxPhoto(null)} 
            className="absolute top-6 right-6 text-gray-400 hover:text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxPhoto} 
            alt="Enlarged profile" 
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl cursor-default border border-white/10"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

    </div>
  );
};

export default Chat;
