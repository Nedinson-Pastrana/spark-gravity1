import { useState, useEffect } from 'react';
import { SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DiscoverFiltersProps {
  lookingFor: string;
  ageRange: [number, number];
  onFiltersChange: (filters: { lookingFor: string; ageRange: [number, number] }) => void;
}

const DiscoverFilters = ({ lookingFor, ageRange, onFiltersChange }: DiscoverFiltersProps) => {
  const [localLookingFor, setLocalLookingFor] = useState(lookingFor);
  const [localAgeRange, setLocalAgeRange] = useState<[number, number]>(ageRange);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLocalLookingFor(lookingFor);
    setLocalAgeRange(ageRange);
  }, [lookingFor, ageRange]);

  const handleApply = () => {
    onFiltersChange({ lookingFor: localLookingFor, ageRange: localAgeRange });
    setOpen(false);
  };

  const hasActiveFilters = lookingFor !== 'all' || ageRange[0] !== 18 || ageRange[1] !== 40;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={8}>
        <div className="space-y-5">
          <h3 className="font-semibold text-foreground">Filtros</h3>

          {/* Looking For */}
          <div className="space-y-2">
            <Label>¿Qué buscas?</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocalLookingFor('female')}
                className={`
                  p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1
                  ${localLookingFor === 'female'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <span>👩</span>
                <span className="font-medium text-xs">Mujeres</span>
              </button>
              <button
                type="button"
                onClick={() => setLocalLookingFor('male')}
                className={`
                  p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1
                  ${localLookingFor === 'male'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <span>👨</span>
                <span className="font-medium text-xs">Hombres</span>
              </button>
              <button
                type="button"
                onClick={() => setLocalLookingFor('all')}
                className={`
                  p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1
                  ${localLookingFor === 'all'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted bg-muted/50 hover:bg-muted'
                  }
                `}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium text-xs">Todos</span>
              </button>
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label>Rango de edad</Label>
            <div className="px-1">
              <Slider
                min={18}
                max={40}
                step={1}
                value={localAgeRange}
                onValueChange={(val) => setLocalAgeRange(val as [number, number])}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>De {localAgeRange[0]} años</span>
              <span>Hasta {localAgeRange[1]} años</span>
            </div>
          </div>

          <Button className="w-full" onClick={handleApply}>
            Aplicar filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DiscoverFilters;
