import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { Toast } from '../components/ui';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, userId: string) => void;
  markAsRead: (id: string) => void;
  loading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as Notification[]);
    } catch (err: any) {
      setError(err.message);
      setToast({ message: `알림 로드 실패: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (userId) {
        fetchNotifications(userId);

        const channel = supabase.channel('notifications_channel');
        const subscription = channel
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => {
              const newNotification = payload.new as Notification;
              setNotifications((prev) => [newNotification, ...prev]);
              setToast({ message: newNotification.message, type: 'info' });
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    };
    initializeNotifications();
  }, []);;

  const addNotification = async (message: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ user_id: userId, message, read: false }]);
      if (error) throw error;
      // No need to update state here, Realtime subscription will handle it
    } catch (err: any) {
      setToast({ message: `알림 추가 실패: ${err.message}`, type: 'error' });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
      );
    } catch (err: any) {
      setToast({ message: `알림 읽음 처리 실패: ${err.message}`, type: 'error' });
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, loading, error }}>
      {children}
      {toast && <Toast id={Date.now().toString()} title={toast.message} message="" type={toast.type} onClose={() => setToast(null)} />}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
