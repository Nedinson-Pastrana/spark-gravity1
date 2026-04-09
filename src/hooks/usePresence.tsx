import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type PresenceContextType = {
  onlineUsers: Set<string>;
  localDisconnects: Record<string, string>;
  typingUsers: Set<string>;
  sendTypingEvent: (receiverId: string) => void;
};

const PresenceContext = createContext<PresenceContextType>({ 
  onlineUsers: new Set(),
  localDisconnects: {},
  typingUsers: new Set(),
  sendTypingEvent: () => {}
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [localDisconnects, setLocalDisconnects] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem('localDisconnects');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000);

    const channel = supabase.channel('online-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers = new Set<string>();
        
        for (const id in state) {
          activeUsers.add(id);
        }
        
        setOnlineUsers(activeUsers);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        const preciseOfflineTime = new Date().toISOString();
        setLocalDisconnects((old) => {
          const newDisconnects = { ...old, [key]: preciseOfflineTime };
          localStorage.setItem('localDisconnects', JSON.stringify(newDisconnects));
          return newDisconnects;
        });
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { sender_id, receiver_id } = payload.payload || {};
        if (receiver_id === user.id && sender_id) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.add(sender_id);
            return next;
          });

          if (typingTimeouts.current[sender_id]) {
            clearTimeout(typingTimeouts.current[sender_id]);
          }

          typingTimeouts.current[sender_id] = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Set(prev);
              next.delete(sender_id);
              return next;
            });
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      clearInterval(interval);
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const sendTypingEvent = (receiverId: string) => {
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: user.id, receiver_id: receiverId },
      }).catch(console.error);
    }
  };

  return (
    <PresenceContext.Provider value={{ onlineUsers, localDisconnects, typingUsers, sendTypingEvent }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
