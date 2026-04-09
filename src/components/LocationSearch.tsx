import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

interface ParsedLocation {
  city: string;
  state: string;
  country: string;
  fullDisplay: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: ParsedLocation) => void;
  placeholder?: string;
  initialValue?: string;
}

const LocationSearch = ({ onLocationSelect, placeholder = "Busca tu ciudad...", initialValue = "" }: LocationSearchProps) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3 || query === selectedLocation) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const response = await fetch(
          `${supabaseUrl}/functions/v1/geocode?q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            },
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch locations');
        
        const data: LocationResult[] = await response.json();
        
        // Filter to only show places with city/town info and exclude "perímetro urbano"
        const filteredData = data.filter((r) => {
          const hasCity = r.address?.city || r.address?.town || r.address?.village || r.address?.municipality;
          return !!hasCity;
        });
        
        setResults(filteredData);
        setShowResults(filteredData.length > 0);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selectedLocation]);

  const cleanCityName = (name: string): string => {
    return name
      .replace(/perímetro urbano\s*(de\s*)?/gi, '')
      .replace(/perimetro urbano\s*(de\s*)?/gi, '')
      .trim();
  };

  const parseLocation = (result: LocationResult): ParsedLocation => {
    const { address } = result;
    const rawCity = address.city || address.town || address.village || address.municipality || '';
    const city = cleanCityName(rawCity);
    const state = address.state || address.province || address.region || '';
    const country = address.country || '';

    const parts = [city, state, country].filter(Boolean);
    
    return {
      city,
      state,
      country,
      fullDisplay: parts.join(', '),
    };
  };

  const handleSelect = (result: LocationResult) => {
    const parsed = parseLocation(result);
    setQuery(parsed.fullDisplay);
    setSelectedLocation(parsed.fullDisplay);
    setShowResults(false);
    onLocationSelect(parsed);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedLocation('');
          }}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder={placeholder}
          className="pl-10 h-12 text-lg"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((result, index) => {
            const parsed = parseLocation(result);
            return (
              <button
                key={`${result.lat}-${result.lon}-${index}`}
                type="button"
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3",
                  index !== results.length - 1 && "border-b border-border"
                )}
              >
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {parsed.city}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[parsed.state, parsed.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
