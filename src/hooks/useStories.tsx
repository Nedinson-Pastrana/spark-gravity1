import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export interface StoryWithProfile {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  profile: Profile;
}

let globalStoriesCache: StoryWithProfile[] = [];

export const useStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithProfile[]>(globalStoriesCache);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    if (!user) return;
    try {
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (storiesData && storiesData.length > 0) {
        const userIds = [...new Set(storiesData.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        
        const withProfiles = storiesData
          .filter(s => profileMap.has(s.user_id))
          .map(s => ({
            ...s,
            profile: profileMap.get(s.user_id)!,
          }));
        
        globalStoriesCache = withProfiles;
        setStories(withProfiles);
      } else {
        globalStoriesCache = [];
        setStories([]);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const addStory = async (mediaUrl: string, mediaType: 'image' | 'video' = 'image') => {
    if (!user) return;
    const { error } = await supabase.from('stories').insert({
      user_id: user.id,
      media_url: mediaUrl,
      media_type: mediaType,
    });
    if (!error) fetchStories();
    return { error };
  };

  return { stories, loading, addStory, refetch: fetchStories };
};
