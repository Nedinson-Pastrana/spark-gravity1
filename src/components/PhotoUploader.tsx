import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PhotoUploaderProps {
  photos: string[];
  avatarUrl: string | null;
  onPhotosChange: (photos: string[], avatarUrl: string) => void;
  maxPhotos?: number;
}

const PhotoUploader = ({ photos, avatarUrl, onPhotosChange, maxPhotos = 6 }: PhotoUploaderProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const allPhotos = [...(photos || [])];
  // Fill with empty slots
  while (allPhotos.length < maxPhotos) {
    allPhotos.push('');
  }

  const uploadPhoto = async (file: File, slot: number) => {
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${slot}.${fileExt}`;

    setUploading(slot);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newPhotos = [...(photos || [])];
      
      // If slot is beyond current photos length, fill gaps
      while (newPhotos.length <= slot) {
        newPhotos.push('');
      }
      newPhotos[slot] = publicUrl;

      // Filter out empty strings and get actual photos
      const actualPhotos = newPhotos.filter(p => p !== '');
      
      // First photo is always the avatar
      const newAvatarUrl = actualPhotos[0] || avatarUrl || '';

      onPhotosChange(actualPhotos, newAvatarUrl);
      toast.success('Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(null);
      setSelectedSlot(null);
    }
  };

  const removePhoto = async (index: number) => {
    const actualPhotos = (photos || []).filter(p => p !== '');
    if (index >= actualPhotos.length) return;

    const newPhotos = [...actualPhotos];
    newPhotos.splice(index, 1);

    const newAvatarUrl = newPhotos[0] || '';
    onPhotosChange(newPhotos, newAvatarUrl);
    toast.success('Foto eliminada');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSlot !== null) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede superar 5MB');
        return;
      }
      uploadPhoto(file, selectedSlot);
    }
    e.target.value = '';
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlot(index);
    fileInputRef.current?.click();
  };

  const actualPhotos = (photos || []).filter(p => p !== '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="w-5 h-5 text-primary" />
        <span className="font-medium text-foreground">Fotos ({actualPhotos.length}/{maxPhotos})</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {allPhotos.map((photo, index) => {
          const hasPhoto = index < actualPhotos.length;
          const photoUrl = hasPhoto ? actualPhotos[index] : '';
          const isUploading = uploading === index;
          const isMainPhoto = index === 0 && hasPhoto;

          return (
            <motion.div
              key={index}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden ${
                hasPhoto ? 'bg-card' : 'bg-muted border-2 border-dashed border-border'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {hasPhoto ? (
                <>
                  <img
                    src={photoUrl}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {isMainPhoto && (
                    <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Principal
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleSlotClick(actualPhotos.length)}
                  disabled={isUploading}
                  className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AnimatePresence mode="wait">
                    {isUploading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="plus"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs mt-1">Añadir</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        La primera foto será tu foto principal. Máximo 5MB por imagen.
      </p>
    </div>
  );
};

export default PhotoUploader;
