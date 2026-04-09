import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Message = Tables<'messages'>;
type Profile = Tables<'profiles'>;
type ChatMessage = Message & {
  clientKey: string;
  isOptimistic?: boolean;
};

interface Conversation {
  id: string;
  otherUser: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

let globalConversationsCache: Conversation[] = [];
let globalInitialLoadDone = false;

const chatMessagesCache: Record<string, ChatMessage[]> = {};
const chatLoadDone: Record<string, boolean> = {};

const createChatMessage = (message: Message, clientKey = message.id): ChatMessage => ({
  ...message,
  clientKey,
});

const upsertConfirmedMessage = (
  previousMessages: ChatMessage[],
  confirmedMessage: Message,
  fallbackClientKey = confirmedMessage.id,
) => {
  const existingConfirmed = previousMessages.find((message) => message.id === confirmedMessage.id);
  const optimisticMatch = previousMessages.find(
    (message) =>
      message.isOptimistic &&
      message.sender_id === confirmedMessage.sender_id &&
      message.receiver_id === confirmedMessage.receiver_id &&
      message.content === confirmedMessage.content,
  );
  const clientKey = existingConfirmed?.clientKey ?? optimisticMatch?.clientKey ?? fallbackClientKey;

  const nextMessages = previousMessages
    .filter((message) => message.id !== confirmedMessage.id && message.clientKey !== clientKey)
    .concat(createChatMessage(confirmedMessage, clientKey))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return nextMessages;
};

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(globalConversationsCache);
  const [loading, setLoading] = useState(!globalInitialLoadDone);
  const initialLoadDone = useRef(globalInitialLoadDone);

  const fetchConversations = useCallback(async (showLoading = true) => {
    if (!user) return;

    try {
      if (showLoading && !initialLoadDone.current) {
        setLoading(true);
      }
      
      const { data: mutualMatches, error: matchesError } = await supabase
        .from('mutual_matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesError) throw matchesError;

      const matchedUserIds = new Set<string>();
      mutualMatches?.forEach(match => {
        if (match.user1_id !== user.id && match.user1_id) matchedUserIds.add(match.user1_id);
        if (match.user2_id !== user.id && match.user2_id) matchedUserIds.add(match.user2_id);
      });

      if (matchedUserIds.size === 0) {
        globalConversationsCache = [];
        setConversations([]);
        setLoading(false);
        initialLoadDone.current = true;
        globalInitialLoadDone = true;
        return;
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', Array.from(matchedUserIds));

      if (profilesError) throw profilesError;

      const conversationsMap = new Map<string, Conversation>();
      
      mutualMatches?.forEach(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        if (!otherUserId) return;
        
        const otherUserProfile = profiles?.find(p => p.user_id === otherUserId);
        if (!otherUserProfile) return;

        conversationsMap.set(otherUserId, {
          id: otherUserId,
          otherUser: otherUserProfile,
          lastMessage: null,
          unreadCount: 0,
        });
      });

      messages?.forEach(msg => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!matchedUserIds.has(otherUserId)) return;
        
        const conv = conversationsMap.get(otherUserId);
        if (!conv) return;

        if (!conv.lastMessage) {
          conv.lastMessage = msg;
        }

        if (msg.receiver_id === user.id && !msg.read) {
          conv.unreadCount++;
        }
      });

      const sortedConversations = Array.from(conversationsMap.values()).sort((a, b) => {
        const aTime = a.lastMessage?.created_at || '';
        const bTime = b.lastMessage?.created_at || '';
        return bTime.localeCompare(aTime);
      });

      globalConversationsCache = sortedConversations;
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
      globalInitialLoadDone = true;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConversations(true);
    }
  }, [user, fetchConversations]);

  // Subscribe to new messages in real-time + polling fallback
  useEffect(() => {
    if (!user) return;

    // Polling fallback every 5 seconds to catch missed realtime events
    const pollInterval = setInterval(() => {
      fetchConversations(false);
    }, 5000);

    const channel = supabase
      .channel(`conversations-list-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setConversations(prev => {
            const otherUserId = newMsg.sender_id;
            const exists = prev.some(c => c.otherUser.user_id === otherUserId);
            
            if (!exists) {
              fetchConversations(false);
              return prev;
            }

            const updated = prev.map(conv => {
              if (conv.otherUser.user_id === otherUserId) {
                return {
                  ...conv,
                  lastMessage: newMsg,
                  unreadCount: conv.unreadCount + 1,
                };
              }
              return conv;
            });
            const sorted = updated.sort((a, b) => {
              const aTime = a.lastMessage?.created_at || '';
              const bTime = b.lastMessage?.created_at || '';
              return bTime.localeCompare(aTime);
            });
            globalConversationsCache = sorted;
            return sorted;
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    loading: loading && !initialLoadDone.current,
    refetch: () => fetchConversations(false),
  };
};

export const useChat = (otherUserId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessagesCache[otherUserId] || []);
  const [loading, setLoading] = useState(!chatLoadDone[otherUserId]);

  const fetchMessages = useCallback(async () => {
    if (!user || !otherUserId) return;

    try {
      if (!chatLoadDone[otherUserId]) setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const formattedMessages = (data || []).map((message) => createChatMessage(message));
      chatMessagesCache[otherUserId] = formattedMessages;
      chatLoadDone[otherUserId] = true;
      setMessages(formattedMessages);

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, otherUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!user || !otherUserId) return;

    const channelName = `chat-${[user.id, otherUserId].sort().join('-')}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === otherUserId) ||
            (newMessage.sender_id === otherUserId && newMessage.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              const updated = upsertConfirmedMessage(prev, newMessage);
              chatMessagesCache[otherUserId] = updated;
              return updated;
            });
            
            if (newMessage.receiver_id === user.id) {
              supabase
                .from('messages')
                .update({ read: true })
                .eq('id', newMessage.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  const sendMessage = async (content: string) => {
    if (!user || !otherUserId || !content.trim()) return { error: new Error('Invalid input') };

    const trimmed = content.trim();
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      sender_id: user.id,
      receiver_id: otherUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
      read: false,
      clientKey: optimisticId,
      isOptimistic: true,
    };

    setMessages(prev => {
      const next = [...prev, optimisticMessage];
      chatMessagesCache[otherUserId] = next;
      return next;
    });

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content: trimmed,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setMessages((prev) => {
          const updated = upsertConfirmedMessage(prev, data, optimisticId);
          chatMessagesCache[otherUserId] = updated;
          return updated;
        });
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const next = prev.filter(message => message.clientKey !== optimisticId);
        chatMessagesCache[otherUserId] = next;
        return next;
      });
      return { data: null, error };
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
};
