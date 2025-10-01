import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Search, MapPinIcon } from 'lucide-react';
import { 
  searchByCep, 
  formatCep, 
  isValidCep, 
  type AddressComponents 
} from '@/lib/address-components';
import { geocodeAddress } from '@/lib/geocoding';
import { toast } from 'sonner';

interface SimpleAddressFormProps {
  value: AddressComponents;
  onChange: (address: AddressComponents) => void;
  disabled?: boolean;
  className?: string;
}

export function SimpleAddressForm({
  value,
  onChange,
  disabled = false,
  className
}: SimpleAddressFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [addressInput, setAddressInput] = useState(value.endereco_completo || '');

  // Buscar endereço completo
  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;

    setIsSearching(true);
    try {
      const result = await geocodeAddress(addressInput);
      if (result) {
        onChange({
          logradouro: result.address.road || '',
          numero: result.address.house_number || '',
          complemento: '',
          bairro: '',
          cidade: result.address.city || '',
          estado: result.address.state || '',
          uf: '',
          cep: result.address.postcode || '',
          endereco_completo: addressInput,
          latitude: result.latitude,
          longitude: result.longitude,
          fonte: 'nominatim',
          confiabilidade: 'media'
        });
        
        toast.success('📍 Endereço localizado no mapa!');
      } else {
        toast.error('Endereço não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar endereço');
      console.error('Erro:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Buscar por CEP
  const handleCepSearch = async (cep: string) => {
    if (!isValidCep(cep)) return;

    setIsSearching(true);
    try {
      const result = await searchByCep(cep);
      if (result) {
        const formattedAddress = `${result.logradouro}, ${result.bairro}, ${result.cidade} - ${result.uf}`;
        setAddressInput(formattedAddress);
        onChange(result);
        toast.success('📮 Endereço encontrado pelo CEP!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
      console.error('Erro CEP:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Campo principal de endereço */}
        <div>
          <Label htmlFor="endereco" className="text-sm font-medium">
            Endereço da Obra *
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="endereco"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddressSearch();
                }
              }}
              placeholder="Ex: Rua das Flores, 123, Centro, São Paulo - SP"
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddressSearch}
              disabled={!addressInput.trim() || isSearching || disabled}
              size="default"
              className="px-4"
            >
              {isSearching ? (
                <Search className="h-4 w-4 animate-pulse" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Campo de CEP alternativo */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>ou busque por CEP:</span>
          <Input
            placeholder="00000-000"
            className="w-32 h-8"
            maxLength={9}
            onChange={(e) => {
              const formatted = formatCep(e.target.value);
              e.target.value = formatted;
              if (isValidCep(formatted)) {
                handleCepSearch(formatted);
              }
            }}
            disabled={disabled}
          />
        </div>

        {/* Feedback visual */}
        {value.latitude && value.longitude && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <MapPinIcon className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Endereço localizado no mapa
            </span>
          </div>
        )}
      </div>
    </div>
  );
}