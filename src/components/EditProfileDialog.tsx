import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, Lock, CalendarIcon } from 'lucide-react';
import { PREDEFINED_INTERESTS } from '@/constants/interests';
import { getInterestIcon } from '@/utils/interestIcons';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import LocationSearch from '@/components/LocationSearch';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSave: (data: {
    name: string;
    age: number;
    bio: string;
    location: string;
    city: string;
    state?: string;
    interests: string[];
    gender?: string;
    looking_for?: string;
  }) => Promise<void>;
}

const DRAFT_KEY = 'edit-profile-draft';

const getDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const EditProfileDialog = ({ open, onOpenChange, profile, onSave }: EditProfileDialogProps) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const birthDate = profile?.birth_date ? new Date(profile.birth_date) : null;
  const age = birthDate ? differenceInYears(new Date(), birthDate) : (profile?.age || 0);

  // Initialize from draft or profile (only once per profile load)
  useEffect(() => {
    if (profile) {
      const draft = getDraft();
      if (draft) {
        setName(draft.name ?? profile.name ?? '');
        setBio(draft.bio ?? profile.bio ?? '');
        setCity(draft.city ?? profile.city ?? '');
        setState(draft.state ?? profile.state ?? '');
        setCountry(draft.country ?? profile.location ?? '');
        setInterests(draft.interests ?? profile.interests ?? []);
        setGender(draft.gender ?? profile.gender ?? '');
        setLookingFor(draft.lookingFor ?? profile.looking_for ?? 'all');
      } else {
        setName(profile.name || '');
        setBio(profile.bio || '');
        setCity(profile.city || '');
        setState(profile.state || '');
        setCountry(profile.location || '');
        setInterests(profile.interests || []);
        setGender(profile.gender || '');
        setLookingFor(profile.looking_for || 'all');
      }
      setInitialized(true);
    }
  }, [profile]);

  // Save draft on every change
  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, bio, city, state, country, interests, gender, lookingFor }));
  }, [name, bio, city, state, country, interests, gender, lookingFor, initialized]);

  const handleLocationSelect = (location: { city: string; state: string; country: string }) => {
    setCity(location.city);
    setState(location.state);
    setCountry(location.country);
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ 
        name, 
        age, 
        bio, 
        location: country, 
        city, 
        state,
        interests, 
        gender, 
        looking_for: lookingFor 
      });
      clearDraft();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    clearDraft();
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setCountry(profile.location || '');
      setInterests(profile.interests || []);
      setGender(profile.gender || '');
      setLookingFor(profile.looking_for || 'all');
    }
    onOpenChange(false);
  };

  const currentLocationDisplay = city 
    ? `${city}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              maxLength={17}
              onChange={(e) => { if (e.target.value.length <= 17) setName(e.target.value); }}
              placeholder="Tu nombre"
            />
            <p className="text-xs text-muted-foreground text-right">{name.length}/17</p>
          </div>

          {/* Birth Date (Locked) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Fecha de nacimiento
              <Lock className="w-3 h-3 text-muted-foreground" />
            </Label>
            <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50 text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {birthDate 
                  ? format(birthDate, "PPP", { locale: es })
                  : 'No especificada'
                }
              </span>
              {birthDate && (
                <span className="ml-auto text-sm">({age} años)</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              La fecha de nacimiento no se puede modificar
            </p>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Género</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`
                  p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                  ${gender === 'male' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <span>👨</span>
                <span className="font-medium text-sm">Hombre</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`
                  p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                  ${gender === 'female' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <span>👩</span>
                <span className="font-medium text-sm">Mujer</span>
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Ubicación</Label>
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              placeholder="Buscar nueva ubicación..."
            />
            {currentLocationDisplay && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground">Ubicación actual:</p>
                <p className="text-sm text-muted-foreground">{currentLocationDisplay}</p>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Sobre mí</Label>
            <Textarea
              id="bio"
              value={bio}
              maxLength={150}
              onChange={(e) => { if (e.target.value.length <= 150) setBio(e.target.value); }}
              placeholder="Cuéntanos sobre ti..."
              rows={4}
            />
            <p className={`text-xs text-right ${bio.length < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>{bio.length}/150 (mín. 10)</p>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Intereses ({interests.length}/5, mín. 4)</Label>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {PREDEFINED_INTERESTS.map((interest) => {
                const isSelected = interests.includes(interest);
                const Icon = getInterestIcon(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 border-2
                      ${isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-transparent bg-muted hover:bg-muted/80 text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving || !name.trim() || bio.trim().length < 10 || interests.length < 4}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
