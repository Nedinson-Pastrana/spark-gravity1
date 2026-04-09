import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { MapPin, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

const UserProfileDialog = ({ open, onOpenChange, profile }: UserProfileDialogProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!profile) return null;

  const allPhotos = (profile.photos && profile.photos.length > 0)
    ? profile.photos
    : profile.avatar_url
      ? [profile.avatar_url]
      : ['/default-avatar.svg'];

  const hasMultiplePhotos = allPhotos.length > 1;

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);

  const locationDisplay = profile.city && profile.location
    ? `${profile.city}, ${profile.location}`
    : profile.city || profile.location || '';

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCurrentPhotoIndex(0); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 bg-card max-h-[90vh] overflow-y-auto">
        {/* Main photo */}
        <div className="relative h-80 w-full overflow-hidden">
          <img
            src={allPhotos[currentPhotoIndex] || '/default-avatar.svg'}
            alt={profile.name}
            className="w-full h-full object-cover"
          />

          {hasMultiplePhotos && (
            <>
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4 z-10">
                {allPhotos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full flex-1 max-w-12 transition-colors ${
                      idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute inset-0 gradient-card-overlay" />

          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold">
              {profile.name}
            </h2>
            {locationDisplay && (
              <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                <MapPin className="w-3 h-3" />
                <span>{locationDisplay}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="font-semibold text-foreground mb-1">Sobre mí</h3>
              <p className="text-muted-foreground text-sm">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                Intereses
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos grid */}
          {allPhotos.length > 1 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                📷 Fotos
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {allPhotos.map((photo, idx) => (
                  <motion.img
                    key={idx}
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full aspect-square rounded-xl object-cover cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setCurrentPhotoIndex(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
