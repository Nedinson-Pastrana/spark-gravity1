import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type MutualMatch = Tables<'mutual_matches'>;
type Profile = Tables<'profiles'>;

interface MatchWithProfile extends MutualMatch {
  matchedUser: Profile;
}

export const useMutualMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!user) {
      setMatches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get mutual matches where user is either user1 or user2
      const { data: matchData, error: matchError } = await supabase
        .from('mutual_matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchError) throw matchError;

      if (!matchData || matchData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get the other user's profile for each match
      const otherUserIds = matchData.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
      ).filter(Boolean) as string[];

      if (otherUserIds.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', otherUserIds);

      if (profileError) throw profileError;

      // Combine matches with profiles
      const matchesWithProfiles = matchData.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const matchedUser = profiles?.find(p => p.user_id === otherUserId);
        return {
          ...match,
          matchedUser: matchedUser!,
        };
      }).filter(m => m.matchedUser);

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error('Error fetching mutual matches:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mutual-matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMatches]);

  return {
    matches,
    loading,
    refetch: fetchMatches,
  };
};
