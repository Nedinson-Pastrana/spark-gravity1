import { useState, useEffect } from 'react';

import { LogOut, MapPin, Heart, Edit2, Images, Menu } from 'lucide-react';
import PhotoViewerDialog from '@/components/PhotoViewerDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import EditProfileDialog from '@/components/EditProfileDialog';
import PhotoUploader from '@/components/PhotoUploader';
import SettingsMenu from '@/components/SettingsMenu';
import { getInterestIcon } from '@/utils/interestIcons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile, createProfile } = useProfile();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveProfile = async (data: {
    name: string;
    age: number;
    bio: string;
    location: string;
    city: string;
    interests: string[];
  }) => {
    if (profile) {
      await updateProfile(data);
    } else {
      await createProfile(data);
    }
  };

  const handlePhotosChange = async (photos: string[], avatarUrl: string) => {
    if (profile) {
      await updateProfile({ photos, avatar_url: avatarUrl });
    }
  };

  const displayProfile = profile || {
    name: 'Tu Nombre',
    age: 25,
    location: 'Añade tu ubicación',
    city: '',
    bio: 'Añade una descripción sobre ti...',
    interests: [],
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    photos: []
  };

  const locationDisplay = displayProfile.city && displayProfile.location 
    ? `${displayProfile.city}, ${displayProfile.location}`
    : displayProfile.location || 'Añade tu ubicación';

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header hideLogo transparent />
        <main className="px-4 py-6" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        hideLogo 
        transparent={!isScrolled} 
        rightAction={
          <button 
            onClick={() => setSettingsOpen(true)}
            className="p-2 -mr-2 text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
        }
      />

      <main className="px-4 py-6">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <img 
              src={displayProfile.avatar_url || '/default-avatar.svg'} 
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-primary cursor-pointer"
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
              onClick={() => { 
                setViewerPhotos([displayProfile.avatar_url || '/default-avatar.svg']);
                setViewerIndex(0); 
                setViewerOpen(true); 
              }}
            />
            <button 
              onClick={() => setPhotoDialogOpen(true)}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
            >
              <Images className="w-5 h-5" />
            </button>
          </div>

          {/* Name & Age */}
          <h2 className="text-2xl font-bold text-foreground">
            {displayProfile.name}
          </h2>
          
          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground mt-1">
            <MapPin className="w-4 h-4" />
            <span>{locationDisplay}</span>
          </div>

          {/* Edit Button */}
          <Button 
            variant="outline" 
            className="mt-4 rounded-full" 
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Editar perfil
          </Button>
        </div>

        {/* Bio Section */}
        <div className="mt-8 p-4 rounded-2xl bg-card">
          <h3 className="font-semibold text-foreground mb-2">Sobre mí</h3>
          <p className="text-muted-foreground">
            {displayProfile.bio || 'Añade una descripción sobre ti...'}
          </p>
        </div>

        {/* Interests */}
        <div className="mt-4 p-4 rounded-2xl bg-card">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Intereses
          </h3>
          <div className="flex flex-wrap gap-2">
            {(displayProfile.interests && displayProfile.interests.length > 0) ? (
              displayProfile.interests.map((interest, index) => {
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
              })
            ) : (
              <p className="text-muted-foreground text-sm">Añade tus intereses</p>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="mt-4 p-4 rounded-2xl bg-card">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Images className="w-4 h-4 text-primary" />
            Fotos
          </h3>
          {(() => {
            const galleryPhotos = (displayProfile.photos || []).filter(
              (p) => p !== displayProfile.avatar_url
            );
            if (galleryPhotos.length > 0) {
              return (
                <div className="grid grid-cols-3 gap-2">
                  {galleryPhotos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-full aspect-square rounded-xl object-cover cursor-pointer"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                      onClick={() => { 
                        setViewerPhotos(galleryPhotos);
                        setViewerIndex(idx); 
                        setViewerOpen(true); 
                      }}
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
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-card">
          <h3 className="font-semibold text-foreground mb-2">Email</h3>
          <p className="text-muted-foreground">{user?.email || 'No disponible'}</p>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <Button 
            variant="destructive" 
            className="w-full rounded-full"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </main>
      
      <BottomNav />

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mis fotos</DialogTitle>
          </DialogHeader>
          <PhotoUploader
            photos={profile?.photos || []}
            avatarUrl={profile?.avatar_url || null}
            onPhotosChange={handlePhotosChange}
          />
        </DialogContent>
      </Dialog>

      <PhotoViewerDialog
        photos={viewerPhotos}
        initialIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      <SettingsMenu 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </div>
  );
};

export default Profile;
