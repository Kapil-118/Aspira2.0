import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        const unread = res.data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Handle real-time notification socket listener
  useEffect(() => {
    if (!socket) return;

    socket.on('newNotification', (data) => {
      // Append new notification dynamically
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Trigger visual toast
      toast.info(data.text, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark"
      });
    });

    return () => {
      socket.off('newNotification');
    };
  }, [socket]);

  // Mark all notifications read helper
  const markAllAsRead = async () => {
    try {
      const res = await API.put('/notifications/read');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err.message);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
