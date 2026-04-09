import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface FilterOptions {
  lookingFor?: string;
  ageRange?: [number, number];
}

export const useProfiles = (filters?: FilterOptions) => {
  const { user, loading: authLoading } = useAuth();

  const { data: userProfile, isFetched: profileChecked } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !authLoading,
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const lookingFor = filters?.lookingFor || userProfile?.looking_for;
  const ageMin = filters?.ageRange?.[0] ?? 18;
  const ageMax = filters?.ageRange?.[1] ?? 40;

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['discover-profiles', user?.id, userProfile?.location, userProfile?.city, lookingFor, ageMin, ageMax],
    queryFn: async () => {
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('liked_user_id')
        .eq('user_id', user!.id);

      const excludeIds = [
        user!.id,
        ...(existingMatches?.map(m => m.liked_user_id) || [])
      ];

      const location = userProfile!.location!;
      const buildQuery = () => {
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('location', location)
          .not('user_id', 'in', `(${excludeIds.join(',')})`)
          .gte('age', ageMin)
          .lte('age', ageMax);

        if (lookingFor === 'male') query = query.eq('gender', 'male');
        else if (lookingFor === 'female') query = query.eq('gender', 'female');
        return query;
      };

      const userCity = userProfile?.city;
      let allProfiles: Profile[] = [];

      if (userCity) {
        const { data: sameCityProfiles, error: cityError } = await buildQuery()
          .eq('city', userCity)
          .limit(50);
        if (cityError) throw cityError;
        allProfiles = sameCityProfiles || [];

        if (allProfiles.length < 50) {
          const sameCityIds = allProfiles.map(p => p.user_id);
          const excludeForCountry = [...excludeIds, ...sameCityIds];
          
          let countryQuery = supabase
            .from('profiles')
            .select('*')
            .eq('location', location)
            .not('user_id', 'in', `(${excludeForCountry.join(',')})`)
            .gte('age', ageMin)
            .lte('age', ageMax)
            .limit(50 - allProfiles.length);

          if (lookingFor === 'male') countryQuery = countryQuery.eq('gender', 'male');
          else if (lookingFor === 'female') countryQuery = countryQuery.eq('gender', 'female');

          const { data: sameCountryProfiles, error: countryError } = await countryQuery;
          if (countryError) throw countryError;
          allProfiles = [...allProfiles, ...(sameCountryProfiles || [])];
        }
      } else {
        const { data, error } = await buildQuery().limit(50);
        if (error) throw error;
        allProfiles = data || [];
      }

      return allProfiles;
    },
    enabled: !!user && !authLoading && !!userProfile?.location,
    staleTime: 15000,
    placeholderData: (prev) => prev,
  });

  const loading = authLoading || (!profileChecked && !!user) || (!!userProfile?.location && profilesLoading && profiles.length === 0);

  const refreshProfiles = () => {
    // Will be handled by query invalidation
  };

  return {
    profiles,
    loading,
    userProfile: userProfile ?? null,
    profileChecked: !authLoading && (profileChecked || !user),
    refreshProfiles,
  };
};
