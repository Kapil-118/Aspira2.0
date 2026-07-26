import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let activeSocket = null;

    if (user && user._id) {
      // Connect to backend socket server (dynamic based on deployment env)
      let socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_SERVER_URL;
      if (!socketUrl && import.meta.env.VITE_API_URL) {
        socketUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
      }
      if (!socketUrl) {
        socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
      }

      activeSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      setSocket(activeSocket);

      // Signal online status
      activeSocket.emit('userOnline', user._id);

      // Listen for online users array updates
      activeSocket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        if (activeSocket) {
          activeSocket.disconnect();
        }
      };
    } else {
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
