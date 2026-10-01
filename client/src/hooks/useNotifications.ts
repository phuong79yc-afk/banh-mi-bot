import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { soundManager } from '../utils/soundManager';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function useNotifications(enabled: boolean = true, refreshInterval: number = 10000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const previousCountRef = useRef<number>(0);

  const fetchNotifications = async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      console.log('📥 Fetching notifications:', response.data);
      if (response.data.success) {
        const newNotifications = response.data.notifications;
        const newUnreadCount = response.data.unreadCount;
        
        // Play sound if there are new notifications
        if (newUnreadCount > previousCountRef.current && previousCountRef.current > 0) {
          console.log('🔊 Playing sound for new notification');
          // Get the latest notification type
          const latestNotification = newNotifications.find((n: Notification) => !n.read);
          if (latestNotification) {
            soundManager.playNotificationSound(latestNotification.type);
          }
        }
        
        previousCountRef.current = newUnreadCount;
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    if (!enabled) return;
    
    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: fetchNotifications
  };
}
