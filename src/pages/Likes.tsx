import { useState } from 'react';
import { Heart, X, Sparkles, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingLikes } from '@/hooks/usePendingLikes';
import { useToast } from '@/hooks/use-toast';

import BottomNav from '@/components/BottomNav';
import ProfileDetailDialog from '@/components/ProfileDetailDialog';
import type { Tables } from '@/integrations/supabase/types';

type PendingLike = Tables<'pending_likes'>;

const Likes = () => {
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
    }
  };

  const handleCardClick = (like: PendingLike) => {
    setSelectedProfile(like);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header 
        className="sticky top-0 z-40 px-6 py-4 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-md mx-auto flex items-center justify-center">
          <h1 className="text-xl font-bold text-foreground">Matches</h1>
        </div>
      </header>
      
      <main className="pt-20 pb-32 px-4">
        <div className="max-w-md mx-auto">

          {loading ? (
            <div className="flex items-center justify-center py-20" />
          ) : pendingLikes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <HeartOff className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Sin likes por ahora</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Cuando alguien te dé like, aparecerá aquí para que puedas aceptar o rechazar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pendingLikes.map((like) => (
                <div key={like.id}>
                  <div 
                    className="relative rounded-2xl overflow-hidden bg-card shadow-lg cursor-pointer"
                    onClick={() => handleCardClick(like)}
                  >
                    <img
                      src={like.liker_avatar || '/default-avatar.svg'}
                      alt={like.liker_name || 'Usuario'}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    
                    {like.action === 'superlike' && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Super
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
                      <p className="text-white font-bold text-base truncate">
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
                      className="flex-1 h-9 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRespond(like.liker_id!, like.liker_name || 'Usuario', 'dislike');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-9 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRespond(like.liker_id!, like.liker_name || 'Usuario', 'like');
                      }}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />

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
        onLike={() => {
          if (selectedProfile?.liker_id) {
            handleRespond(selectedProfile.liker_id, selectedProfile.liker_name || 'Usuario', 'like');
          }
        }}
        onDislike={() => {
          if (selectedProfile?.liker_id) {
            handleRespond(selectedProfile.liker_id, selectedProfile.liker_name || 'Usuario', 'dislike');
          }
        }}
      />
    </div>
  );
};

export default Likes;
