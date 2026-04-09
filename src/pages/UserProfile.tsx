import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Heart, Images } from 'lucide-react';
import PhotoViewerDialog from '@/components/PhotoViewerDialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getInterestIcon } from '@/utils/interestIcons';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Perfil no encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const locationDisplay = profile.city && profile.location
    ? `${profile.city}, ${profile.location}`
    : profile.city || profile.location || '';

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Back button header */}
      <div className="px-4 py-3 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <main className="px-4 py-2">
        {/* Avatar & Info - same as Profile page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-4">
            <img
              src={profile.avatar_url || '/default-avatar.svg'}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary cursor-pointer"
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
              onClick={() => { setViewerPhotos([profile.avatar_url || '/default-avatar.svg']); setViewerIndex(0); setViewerOpen(true); }}
            />
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            {profile.name}
          </h2>

          {locationDisplay && (
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{locationDisplay}</span>
            </div>
          )}
        </motion.div>

        {/* Bio Section */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 p-4 rounded-2xl bg-card"
          >
            <h3 className="font-semibold text-foreground mb-2">Sobre mí</h3>
            <p className="text-muted-foreground">{profile.bio}</p>
          </motion.div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 rounded-2xl bg-card"
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Intereses
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => {
                const Icon = getInterestIcon(interest);
                return (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {interest}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Photos grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 rounded-2xl bg-card"
        >
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Images className="w-4 h-4 text-primary" />
            Fotos
          </h3>
          {(() => {
            const galleryPhotos = (profile.photos || []).filter(
              (p) => p !== profile.avatar_url
            );
            if (galleryPhotos.length > 0) {
              return (
                <div className="grid grid-cols-3 gap-2">
                  {galleryPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-full aspect-square rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                      onClick={() => { setViewerPhotos(galleryPhotos); setViewerIndex(idx); setViewerOpen(true); }}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Images className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No hay fotos aún</p>
              </div>
            );
          })()}
        </motion.div>

        <PhotoViewerDialog
          photos={viewerPhotos}
          initialIndex={viewerIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      </main>
    </div>
  );
};

export default UserProfile;
