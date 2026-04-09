import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingLikes } from '@/hooks/usePendingLikes';
import { useToast } from '@/hooks/use-toast';
import ProfileDetailDialog from '@/components/ProfileDetailDialog';
import type { Tables } from '@/integrations/supabase/types';

interface PendingLikesSectionProps {
  onMatch?: () => void;
}

type PendingLike = Tables<'pending_likes'>;

const PendingLikesSection = ({ onMatch }: PendingLikesSectionProps) => {
  const { pendingLikes, loading, respondToLike } = usePendingLikes();
  const { toast } = useToast();
  const [selectedProfile, setSelectedProfile] = useState<PendingLike | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRespond = async (likerId: string, likerName: string, action: 'like' | 'dislike') => {
    const result = await respondToLike(likerId, action);
    
    if (!result.error && action === 'like') {
      toast({
        title: "¡Es un Match! 💕",
        description: `Tú y ${likerName} se gustan mutuamente. ¡Ahora pueden chatear!`,
      });
      onMatch?.();
    }
  };

  const handleCardClick = (like: PendingLike) => {
    setSelectedProfile(like);
    setDialogOpen(true);
  };

  const handleDialogLike = () => {
    if (selectedProfile?.liker_id) {
      handleRespond(selectedProfile.liker_id, selectedProfile.liker_name || 'Usuario', 'like');
    }
  };

  const handleDialogDislike = () => {
    if (selectedProfile?.liker_id) {
      handleRespond(selectedProfile.liker_id, selectedProfile.liker_name || 'Usuario', 'dislike');
    }
  };

  if (loading) {
    return null;
  }

  if (pendingLikes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">
            Les gustas ({pendingLikes.length})
          </h2>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 px-2 scrollbar-hide">
          {pendingLikes.map((like, index) => (
            <motion.div
              key={like.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-32"
            >
              <div 
                className="relative rounded-2xl overflow-hidden bg-card shadow-lg cursor-pointer"
                onClick={() => handleCardClick(like)}
              >
                <img
                  src={like.liker_avatar || '/default-avatar.svg'}
                  alt={like.liker_name || 'Usuario'}
                  className="w-full h-36 object-cover"
                />
                
                {/* Superlike badge */}
                {like.action === 'superlike' && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Super
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white font-semibold text-sm truncate">
                    {like.liker_name}, {like.liker_age}
                  </p>
                  <p className="text-white/70 text-xs truncate">
                    {like.liker_city || like.liker_location}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRespond(like.liker_id!, like.liker_name || 'Usuario', 'dislike');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRespond(like.liker_id!, like.liker_name || 'Usuario', 'like');
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ProfileDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={selectedProfile ? {
          name: selectedProfile.liker_name,
          age: selectedProfile.liker_age,
          city: selectedProfile.liker_city,
          location: selectedProfile.liker_location,
          bio: selectedProfile.liker_bio,
          interests: selectedProfile.liker_interests,
          avatar_url: selectedProfile.liker_avatar,
        } : null}
        onLike={handleDialogLike}
        onDislike={handleDialogDislike}
      />
    </>
  );
};

export default PendingLikesSection;
