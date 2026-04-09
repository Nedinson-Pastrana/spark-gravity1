import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

let globalProfileCache: Profile | null = null;

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(globalProfileCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async (showLoading = true) => {
    if (!user) return;
    
    try {
      if (showLoading && !profile) setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      globalProfileCache = data;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Omit<ProfileInsert, 'user_id'>) => {
    if (!user) return { error: new Error('No user') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      globalProfileCache = data;
      setProfile(data);
      toast({
        title: "Perfil creado",
        description: "Tu perfil ha sido creado exitosamente",
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el perfil",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user || !profile) return { error: new Error('No user or profile') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      globalProfileCache = data;
      setProfile(data);
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado",
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  return {
    profile,
    loading,
    fetchProfile,
    createProfile,
    updateProfile,
  };
};
