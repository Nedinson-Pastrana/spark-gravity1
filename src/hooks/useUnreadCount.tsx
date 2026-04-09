import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fetchUnreadCounts = async (userId: string) => {
  const [messagesResult, likesResult] = await Promise.all([
    supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .eq('read', false),
    supabase
      .from('pending_likes')
      .select('*', { count: 'exact', head: true })
      .eq('liked_user_id', userId),
  ]);

  let unreadConversations = 0;
  if (!messagesResult.error && messagesResult.data) {
    const uniqueSenders = new Set(messagesResult.data.map(msg => msg.sender_id));
    unreadConversations = uniqueSenders.size;
  }

  const pendingLikesCount = (!likesResult.error && likesResult.count) ? likesResult.count : 0;

  return { unreadConversations, pendingLikesCount };
};

export const useUnreadCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['unread-counts', user?.id],
    queryFn: () => fetchUnreadCounts(user!.id),
    enabled: !!user,
    refetchInterval: 4000,
    staleTime: 2000,
    placeholderData: (prev) => prev,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['unread-counts', user?.id] });
  }, [queryClient, user?.id]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`unread-counts-${user.id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => refetch())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, refetch]);

  const unreadConversations = data?.unreadConversations ?? 0;
  const pendingLikesCount = data?.pendingLikesCount ?? 0;

  return {
    unreadMessages: unreadConversations,
    pendingLikesCount,
    totalNotifications: unreadConversations + pendingLikesCount,
    refetch,
  };
};
