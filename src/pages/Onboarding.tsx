import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft, User, MapPin, FileText, Heart, Check, Search, Users, CalendarIcon, Camera, Plus, Loader2, X } from 'lucide-react';
import { getInterestIcon } from '@/utils/interestIcons';
import { cn } from '@/lib/utils';
import LocationSearch from '@/components/LocationSearch';
import { toast } from 'sonner';

const STEPS = [
  { id: 'info', title: 'Tu información', icon: User },
  { id: 'location', title: '¿De dónde eres?', icon: MapPin },
  { id: 'bio', title: 'Cuéntanos sobre ti', icon: FileText },
  { id: 'interests', title: '¿Qué te interesa?', icon: Heart },
  { id: 'looking_for', title: '¿Qué buscas?', icon: Search },
  { id: 'photos', title: 'Tus fotos', icon: Camera },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { createProfile } = useProfile();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  
  const calculateAge = (date: Date): number => {
    return differenceInYears(new Date(), date);
  };
  
  const age = birthDate ? calculateAge(birthDate) : 0;
  const [gender, setGender] = useState<string>('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string>('');
  
  // Photo state
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length >= 2 && birthDate && age >= 18 && gender !== '';
      case 1:
        return city.length > 0 && country.length > 0;
      case 2:
        return bio.trim().length >= 10 && bio.trim().length <= 150;
      case 3:
        return selectedInterests.length >= 4;
      case 4:
        return lookingFor !== '';
      case 5:
        return true; // Photos are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLocationSelect = (location: { city: string; state: string; country: string }) => {
    setCity(location.city);
    setState(location.state);
    setCountry(location.country);
  };

  // Photo upload
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
      const newPhotos = [...photos];
      while (newPhotos.length <= slot) newPhotos.push('');
      newPhotos[slot] = publicUrl;
      setPhotos(newPhotos.filter(p => p !== ''));
      toast.success('Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(null);
      setSelectedSlot(null);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
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

  const handleSlotClick = (slot: number) => {
    setSelectedSlot(slot);
    fileInputRef.current?.click();
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const avatarUrl = photos.length > 0 ? photos[0] : null;
      const result = await createProfile({
        name: name.trim(),
        age,
        location: country,
        city: city,
        state: state,
        bio: bio.trim(),
        interests: selectedInterests,
        gender,
        looking_for: lookingFor,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
        avatar_url: avatarUrl,
        photos: photos.length > 0 ? photos : null,
      });

      if (result.data) {
        navigate('/');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { if (e.target.value.length <= 17) setName(e.target.value); }}
                  placeholder="Tu nombre"
                  maxLength={17}
                  className="text-lg h-12"
                  autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de nacimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal text-lg",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {birthDate ? format(birthDate, "PPP", { locale: es }) : "Selecciona tu fecha de nacimiento"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    defaultMonth={birthDate || new Date(new Date().getFullYear() - 20, 0)}
                    captionLayout="dropdown-buttons"
                    fromYear={1940}
                    toYear={new Date().getFullYear() - 18}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {birthDate && age < 18 && (
                <p className="text-sm text-destructive">Debes ser mayor de 18 años</p>
              )}
              {birthDate && age >= 18 && (
                <p className="text-sm text-muted-foreground">Tienes {age} años</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${gender === 'male' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-muted bg-muted/50 hover:bg-muted'
                    }
                  `}
                >
                  <span className="text-2xl">👨</span>
                  <span className="font-medium">Hombre</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${gender === 'female' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-muted bg-muted/50 hover:bg-muted'
                    }
                  `}
                >
                  <span className="text-2xl">👩</span>
                  <span className="font-medium">Mujer</span>
                </button>
              </div>
            </div>
          </motion.div>
        );
      
      case 1:
        return (
          <motion.div
            key="location"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label>¿Dónde vives?</Label>
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Escribe tu ciudad..."
              />
              {city && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-foreground">{city}</p>
                  <p className="text-xs text-muted-foreground">
                    {[state, country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Te mostraremos personas de tu misma ciudad
              </p>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="bio"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="bio">Sobre mí</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => { if (e.target.value.length <= 150) setBio(e.target.value); }}
                placeholder="Cuéntanos algo sobre ti, qué buscas, qué te hace especial..."
                maxLength={150}
                className="min-h-[150px] text-base resize-none"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Mínimo 10, máximo 150 caracteres ({bio.length}/150)
              </p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="interests"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Selecciona entre 4 y 5 intereses ({selectedInterests.length}/5)
            </p>
            <div className="flex flex-wrap gap-2 max-h-[350px] overflow-y-auto pb-4">
              {PREDEFINED_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                const Icon = getInterestIcon(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-1.5 border-2
                      ${isSelected 
                        ? 'border-primary bg-primary/10 text-primary shadow-sm scale-105' 
                        : 'border-transparent bg-muted hover:bg-muted/80 text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {interest}
                  </button>
                );
              })}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="looking_for"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <p className="text-sm text-muted-foreground">
              Selecciona qué tipo de personas te gustaría conocer
            </p>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setLookingFor('female')}
                className={`
                  p-5 rounded-xl border-2 transition-all flex items-center gap-4
                  ${lookingFor === 'female' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <span className="text-3xl">👩</span>
                <div className="text-left">
                  <span className="font-semibold text-lg">Mujeres</span>
                  <p className="text-sm text-muted-foreground">Ver solo perfiles de mujeres</p>
                </div>
                {lookingFor === 'female' && <Check className="ml-auto w-6 h-6 text-primary" />}
              </button>
              
              <button
                type="button"
                onClick={() => setLookingFor('male')}
                className={`
                  p-5 rounded-xl border-2 transition-all flex items-center gap-4
                  ${lookingFor === 'male' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <span className="text-3xl">👨</span>
                <div className="text-left">
                  <span className="font-semibold text-lg">Hombres</span>
                  <p className="text-sm text-muted-foreground">Ver solo perfiles de hombres</p>
                </div>
                {lookingFor === 'male' && <Check className="ml-auto w-6 h-6 text-primary" />}
              </button>
              
              <button
                type="button"
                onClick={() => setLookingFor('all')}
                className={`
                  p-5 rounded-xl border-2 transition-all flex items-center gap-4
                  ${lookingFor === 'all' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <Users className="w-8 h-8 text-muted-foreground" />
                <div className="text-left">
                  <span className="font-semibold text-lg">Todos</span>
                  <p className="text-sm text-muted-foreground">Ver perfiles de todos</p>
                </div>
                {lookingFor === 'all' && <Check className="ml-auto w-6 h-6 text-primary" />}
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="photos"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <p className="text-sm text-muted-foreground">
              Sube hasta 2 fotos. La primera será tu foto principal. Puedes omitir este paso.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((slot) => {
                const hasPhoto = slot < photos.length;
                const isUploading = uploading === slot;
                return (
                  <motion.div
                    key={slot}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden ${
                      hasPhoto ? 'bg-card' : 'bg-muted border-2 border-dashed border-border'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {hasPhoto ? (
                      <>
                        <img
                          src={photos[slot]}
                          alt={`Foto ${slot + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(slot)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {slot === 0 && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            Principal
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleSlotClick(photos.length)}
                        disabled={isUploading}
                        className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-8 h-8" />
                            <span className="text-sm mt-2">{slot === 0 ? 'Foto principal' : 'Otra foto'}</span>
                          </>
                        )}
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
              Máximo 5MB por imagen. Si no subes fotos, aparecerá un ícono por defecto.
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <header className="px-6 py-8">
        <div className="flex items-center gap-3">
          {STEPS[currentStep].icon && (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {(() => {
                const Icon = STEPS[currentStep].icon;
                return <Icon className="w-6 h-6 text-primary" />;
              })()}
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">
              Paso {currentStep + 1} de {STEPS.length}
            </p>
            <h1 className="text-2xl font-bold">{STEPS[currentStep].title}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 space-y-4">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Atrás
            </Button>
          )}
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 h-12"
            >
              {currentStep === 4 ? 'Siguiente' : 'Siguiente'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <div className="flex-1 flex gap-2">
              {photos.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 h-12"
                >
                  Omitir
                </Button>
              )}
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 h-12"
              >
                {saving ? 'Guardando...' : photos.length > 0 ? 'Completar perfil' : 'Completar'}
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
