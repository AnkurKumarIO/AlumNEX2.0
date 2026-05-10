/**
 * Real-time notifications hook using Supabase Realtime subscriptions
 * Enables instant updates across multiple devices and eliminates polling
 * Includes polling fallback for environments where Realtime is not configured
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Normalize field names — Supabase returns snake_case, Prisma returns camelCase
function normalizeNotification(n) {
  return {
    ...n,
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read ?? false,
    request_id: n.request_id,
    // Support both snake_case and camelCase
    created_at: n.created_at || n.createdAt,
    createdAt: n.createdAt || n.created_at,
  };
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setNotifications(data.map(normalizeNotification));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  }, [userId]);

  // Subscribe to real-time notification updates + polling fallback
  useEffect(() => {
    if (!userId) return;

    // Load initial data first
    setLoading(true);
    loadNotifications().finally(() => setLoading(false));

    // Polling fallback — refresh every 10 seconds
    // This ensures notifications appear even without Supabase Realtime configured
    pollRef.current = setInterval(() => {
      loadNotifications();
    }, 10000);

    // Subscribe to INSERT events (new notifications)
    let insertSub, updateSub;
    try {
      insertSub = supabase
        .channel(`notifications:user_id=eq.${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('[Realtime] New notification:', payload.new);
            setNotifications(prev => [normalizeNotification(payload.new), ...prev]);
          }
        )
        .subscribe();

      // Subscribe to UPDATE events (read status changes)
      updateSub = supabase
        .channel(`notifications:update:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? normalizeNotification(payload.new) : n)
            );
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[Realtime] Subscription failed, using polling only:', e.message);
    }

    // Cleanup
    return () => {
      clearInterval(pollRef.current);
      try { if (insertSub) insertSub.unsubscribe(); } catch {}
      try { if (updateSub) updateSub.unsubscribe(); } catch {}
    };
  }, [userId, loadNotifications]);

  // Mark a notification as read (multi-device sync via DB)
  const markAsRead = useCallback(async (notificationId) => {
    if (!userId || !notificationId) return;
    try {
      // Optimistic local update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      // Optimistic local update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  }, [userId]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!userId || !notificationId) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  }, [userId]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount: notifications.filter(n => !n.read).length,
  };
}
