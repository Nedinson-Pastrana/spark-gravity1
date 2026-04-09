import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MapPin, Heart, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ProfileDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    name?: string | null;
    age?: number | null;
    city?: string | null;
    location?: string | null;
    bio?: string | null;
    interests?: string[] | null;
    avatar_url?: string | null;
    photos?: string[] | null;
  } | null;
  onLike?: () => void;
  onDislike?: () => void;
  showActions?: boolean;
}

const ProfileDetailDialog = ({
  open,
  onOpenChange,
  profile,
  onLike,
  onDislike,
  showActions = true,
}: ProfileDetailDialogProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  if (!profile) return null;

  // Combine avatar and photos
  const allPhotos = [
    profile.avatar_url,
    ...(profile.photos || []),
  ].filter(Boolean) as string[];

  const hasMultiplePhotos = allPhotos.length > 1;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const locationDisplay = profile.city && profile.location
    ? `${profile.city}`
    : profile.city || profile.location || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 bg-card">
        {/* Photo carousel */}
        <div className="relative h-80 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentPhotoIndex}
              src={allPhotos[currentPhotoIndex] || '/default-avatar.svg'}
              alt={profile.name || 'Usuario'}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          {/* Photo indicators */}
          {hasMultiplePhotos && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4">
              {allPhotos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full flex-1 max-w-12 transition-colors ${
                    idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navigation buttons */}
          {hasMultiplePhotos && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 gradient-card-overlay" />
          
          {/* Name and age overlay */}
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

        {/* Profile info */}
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
                <Sparkles className="w-4 h-4 text-primary" />
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

          {/* Action buttons */}
          {showActions && (onLike || onDislike) && (
            <div className="flex justify-center gap-6 pt-4">
              {onDislike && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-14 h-14 rounded-full"
                  onClick={() => {
                    onDislike();
                    onOpenChange(false);
                  }}
                >
                  <X className="w-6 h-6 text-destructive" />
                </Button>
              )}
              {onLike && (
                <Button
                  size="lg"
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  onClick={() => {
                    onLike();
                    onOpenChange(false);
                  }}
                >
                  <Heart className="w-6 h-6" fill="currentColor" />
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDetailDialog;
