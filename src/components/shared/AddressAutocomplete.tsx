import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Building, 
  Home, 
  Search,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { 
  searchAddressSuggestions, 
  getLocalSuggestions,
  getAddressDetails,
  type AddressSuggestion 
} from '@/lib/address-autocomplete';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Ex: Rua das Flores, 123, Centro, São Paulo, SP",
  disabled = false,
  required = false,
  className,
  label = "Endereço Completo",
  error
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGeolocating, setIsGeolocating] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Busca com debounce
  const { debouncedCallback: debouncedSearch } = useDebouncedCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      
      try {
        // Buscar sugestões locais primeiro (instantâneo)
        const localSuggestions = getLocalSuggestions(query);
        if (localSuggestions.length > 0) {
          setSuggestions(localSuggestions);
          setIsOpen(true);
        }
        
        // Buscar sugestões online (com delay)
        const onlineSuggestions = await searchAddressSuggestions(query, {
          country: 'br',
          maxResults: 6,
          bias: 'brazil'
        });
        
        // Combinar resultados, removendo duplicatas
        const combined = [...localSuggestions, ...onlineSuggestions]
          .filter((suggestion, index, arr) => 
            arr.findIndex(s => s.short_name === suggestion.short_name) === index
          )
          .slice(0, 8);
        
        setSuggestions(combined);
        setIsOpen(combined.length > 0);
        setSelectedIndex(-1);
        
      } catch (error) {
        console.error('Erro na busca de endereços:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    300
  );

  // Trigger de busca quando valor muda
  useEffect(() => {
    if (value && !disabled) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value, disabled, debouncedSearch]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, selectedIndex]);

  // Scroll automático para item selecionado
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Selecionar sugestão
  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    setIsGeolocating(true);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    try {
      // Obter coordenadas se necessário
      const details = await getAddressDetails(suggestion);
      
      onChange(suggestion.full_address, {
        latitude: details.latitude,
        longitude: details.longitude
      });
      
    } catch (error) {
      console.error('Erro ao obter detalhes do endereço:', error);
      // Ainda usar o endereço mesmo sem coordenadas
      onChange(suggestion.full_address);
    } finally {
      setIsGeolocating(false);
    }
  };

  // Ícones por tipo de lugar
  const getPlaceIcon = (type: AddressSuggestion['place_type']) => {
    switch (type) {
      case 'street': return <MapPin className="h-4 w-4" />;
      case 'city': return <Building className="h-4 w-4" />;
      case 'neighborhood': return <Home className="h-4 w-4" />;
      case 'establishment': return <Building className="h-4 w-4" />;
      default: return <Navigation className="h-4 w-4" />;
    }
  };

  // Badge por tipo de lugar
  const getPlaceTypeBadge = (type: AddressSuggestion['place_type']) => {
    const labels = {
      street: 'Rua',
      city: 'Cidade', 
      neighborhood: 'Bairro',
      establishment: 'Local',
      other: 'Lugar'
    };
    
    return (
      <Badge variant="outline" className="text-xs">
        {labels[type]}
      </Badge>
    );
  };

  // Limpeza do campo
  const clearField = () => {
    onChange('');
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      {label && (
        <Label htmlFor="address-input" className="block mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id="address-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              "pr-20", // Espaço para ícones
              error && "border-red-500",
              isGeolocating && "border-blue-500"
            )}
          />
          
          {/* Ícones do lado direito */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {isGeolocating && (
              <Navigation className="h-4 w-4 animate-pulse text-blue-500" />
            )}
            
            {value && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={clearField}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {isOpen && (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Dropdown de sugestões */}
        {isOpen && suggestions.length > 0 && (
          <Card
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto shadow-lg"
          >
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  ref={el => suggestionRefs.current[index] = el}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedIndex === index && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                    {getPlaceIcon(suggestion.place_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {suggestion.short_name}
                      </span>
                      {getPlaceTypeBadge(suggestion.place_type)}
                    </div>
                    
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.display_name}
                    </div>
                  </div>
                  
                  {/* Indicador de relevância */}
                  <div className="flex-shrink-0">
                    <div 
                      className={cn(
                        "w-2 h-2 rounded-full",
                        suggestion.relevance > 0.8 ? "bg-green-500" :
                        suggestion.relevance > 0.6 ? "bg-yellow-500" :
                        "bg-gray-400"
                      )}
                    />
                  </div>
                </div>
              ))}
              
              {/* Footer do dropdown */}
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                  <span>💡 Use ↑↓ para navegar, Enter para selecionar</span>
                  <div className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    <span>OpenStreetMap</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Mensagens de erro/ajuda */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {!error && (
        <p className="text-xs text-muted-foreground mt-1">
          📍 Digite o nome da rua para ver sugestões automáticas
          {isGeolocating && (
            <span className="text-blue-600 ml-2 animate-pulse">
              🔍 Localizando no mapa...
            </span>
          )}
        </p>
      )}
    </div>
  );
}