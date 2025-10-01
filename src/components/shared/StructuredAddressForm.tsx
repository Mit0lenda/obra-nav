import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, RefreshCw } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { 
  searchByCep, 
  formatCep, 
  isValidCep, 
  validateAddressComponents,
  formatFullAddress,
  type AddressComponents 
} from '@/lib/address-components';
import { toast } from 'sonner';

interface StructuredAddressFormProps {
  value: AddressComponents;
  onChange: (address: AddressComponents) => void;
  disabled?: boolean;
  className?: string;
}

export function StructuredAddressForm({
  value,
  onChange,
  disabled = false,
  className
}: StructuredAddressFormProps) {
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [useAutocomplete, setUseAutocomplete] = useState(true);

  // Buscar endereço por CEP
  const handleCepSearch = async (cep: string) => {
    if (!isValidCep(cep)) return;

    setIsSearchingCep(true);
    try {
      const result = await searchByCep(cep);
      if (result) {
        onChange({
          ...result,
          numero: value.numero, // Preservar número se já preenchido
          complemento: value.complemento // Preservar complemento
        });
        toast.success('Endereço encontrado pelo CEP!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
      console.error('Erro CEP:', error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Atualizar campo individual
  const updateField = (field: keyof AddressComponents, fieldValue: string) => {
    const updated = { ...value, [field]: fieldValue };
    
    // Reformatar CEP automaticamente
    if (field === 'cep') {
      updated.cep = formatCep(fieldValue);
    }
    
    // Regenerar endereço completo quando campos importantes mudam
    if (['logradouro', 'numero', 'bairro', 'cidade', 'uf'].includes(field)) {
      updated.endereco_completo = formatFullAddress(updated);
    }
    
    onChange(updated);
  };

  // Validação em tempo real
  const validation = validateAddressComponents(value);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço da Obra
          </CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={useAutocomplete ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAutocomplete(true)}
            >
              🔍 Busca Inteligente
            </Button>
            <Button
              type="button"
              variant={!useAutocomplete ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAutocomplete(false)}
            >
              📝 Preenchimento Manual
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {useAutocomplete ? (
            // Modo Autocomplete
            <div className="space-y-4">
              <AddressAutocomplete
                value={value.endereco_completo || ''}
                onChange={(address, coordinates) => {
                  // TODO: Integrar com o novo sistema de componentes
                  onChange({
                    ...value,
                    endereco_completo: address,
                    latitude: coordinates?.latitude,
                    longitude: coordinates?.longitude
                  });
                }}
                label="Buscar Endereço Completo"
                placeholder="Ex: Rua Minas Gerais, 123, Osório, RS"
                disabled={disabled}
                className="w-full"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseAutocomplete(false)}
                className="w-full"
              >
                📝 Ou preencha manualmente os campos separados
              </Button>
            </div>
          ) : (
            // Modo Manual Estruturado
            <div className="space-y-4">
              {/* CEP com busca automática */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={value.cep || ''}
                    onChange={(e) => updateField('cep', e.target.value)}
                    onBlur={(e) => {
                      const cep = e.target.value;
                      if (isValidCep(cep)) {
                        handleCepSearch(cep);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={disabled}
                    className={!isValidCep(value.cep || '') && value.cep ? 'border-red-500' : ''}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => handleCepSearch(value.cep || '')}
                    disabled={!isValidCep(value.cep || '') || isSearchingCep || disabled}
                    size="default"
                    className="w-full"
                  >
                    {isSearchingCep ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Logradouro e Número */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <Label htmlFor="logradouro">Logradouro *</Label>
                  <Input
                    id="logradouro"
                    value={value.logradouro || ''}
                    onChange={(e) => updateField('logradouro', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                    disabled={disabled}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={value.numero || ''}
                    onChange={(e) => updateField('numero', e.target.value)}
                    placeholder="123"
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* Complemento */}
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={value.complemento || ''}
                  onChange={(e) => updateField('complemento', e.target.value)}
                  placeholder="Apto, Sala, Bloco, etc."
                  disabled={disabled}
                />
              </div>

              {/* Bairro e Cidade */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={value.bairro || ''}
                    onChange={(e) => updateField('bairro', e.target.value)}
                    placeholder="Centro, Vila Nova, etc."
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={value.cidade || ''}
                    onChange={(e) => updateField('cidade', e.target.value)}
                    placeholder="São Paulo"
                    disabled={disabled}
                    required
                  />
                </div>
              </div>

              {/* Estado e UF */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={value.estado || ''}
                    onChange={(e) => updateField('estado', e.target.value)}
                    placeholder="São Paulo"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF *</Label>
                  <Input
                    id="uf"
                    value={value.uf || ''}
                    onChange={(e) => updateField('uf', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    disabled={disabled}
                    required
                  />
                </div>
              </div>

              {/* Endereço completo gerado */}
              <div>
                <Label>Endereço Completo (Gerado)</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {formatFullAddress(value) || 'Preencha os campos acima...'}
                </div>
              </div>
            </div>
          )}

          {/* Validação */}
          {validation.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800">Erros:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-medium text-yellow-800">Avisos:</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Coordenadas */}
          {value.latitude && value.longitude && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                📍 Localizado no mapa: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                <span className="ml-2 text-xs">({value.fonte})</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}