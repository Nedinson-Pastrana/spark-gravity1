import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type PendingLike = Tables<'pending_likes'>;

export const usePendingLikes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingLikes = [], isLoading: loading } = useQuery({
    queryKey: ['pending-likes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_likes')
        .select('*')
        .eq('liked_user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 10000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pending-likes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-likes', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const respondToLike = async (likerId: string, action: 'like' | 'dislike') => {
    if (!user) return { error: new Error('No user') };

    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          liked_user_id: likerId,
          action,
        });

      if (error) throw error;

      // Remove from cache locally
      queryClient.setQueryData(['pending-likes', user.id], (old: PendingLike[] | undefined) =>
        (old || []).filter(like => like.liker_id !== likerId)
      );
      
      return { error: null };
    } catch (error) {
      console.error('Error responding to like:', error);
      return { error };
    }
  };

  return {
    pendingLikes,
    loading: loading && pendingLikes.length === 0,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['pending-likes', user?.id] }),
    respondToLike,
  };
};
