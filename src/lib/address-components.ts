/**
 * Serviço de CEP e Endereços Completos
 * Integra ViaCEP, OpenStreetMap e outras APIs para dados estruturados
 */

export interface AddressComponents {
  // Endereço estruturado
  logradouro: string;           // Rua/Avenida
  numero: string;               // Número
  complemento: string;          // Apartamento, sala, etc.
  bairro: string;               // Bairro/distrito
  cidade: string;               // Município
  estado: string;               // Estado (nome completo)
  uf: string;                   // UF (sigla)
  cep: string;                  // CEP formatado 00000-000
  endereco_completo: string;    // Endereço formatado completo
  
  // Coordenadas
  latitude?: number;
  longitude?: number;
  
  // Metadados
  fonte: 'viacep' | 'nominatim' | 'google' | 'manual';
  confiabilidade: 'alta' | 'media' | 'baixa';
}

export interface CepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;  // cidade
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

// Cache para CEPs e endereços
const addressCache = new Map<string, AddressComponents>();
const cepCache = new Map<string, CepResult>();

/**
 * Formatar CEP (apenas números para 00000-000)
 */
export function formatCep(cep: string): string {
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length !== 8) return cep;
  return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

/**
 * Validar CEP brasileiro
 */
export function isValidCep(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8 && /^\d{8}$/.test(numbers);
}

/**
 * Buscar endereço por CEP usando ViaCEP
 */
export async function searchByCep(cep: string): Promise<AddressComponents | null> {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (!isValidCep(cleanCep)) {
    throw new Error('CEP inválido');
  }

  // Verificar cache
  const cacheKey = cleanCep;
  if (cepCache.has(cacheKey)) {
    return convertCepToAddressComponents(cepCache.get(cacheKey)!);
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error(`Erro na API ViaCEP: ${response.status}`);
    }

    const data: CepResult = await response.json();
    
    if (data.erro) {
      return null; // CEP não encontrado
    }

    // Cachear resultado
    cepCache.set(cacheKey, data);
    
    return convertCepToAddressComponents(data);
    
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw new Error('Não foi possível buscar o CEP');
  }
}

/**
 * Converter resultado do ViaCEP para AddressComponents
 */
function convertCepToAddressComponents(cepData: CepResult): AddressComponents {
  const components = {
    logradouro: cepData.logradouro || '',
    numero: '',
    complemento: cepData.complemento || '',
    bairro: cepData.bairro || '',
    cidade: cepData.localidade || '',
    estado: getEstadoNome(cepData.uf) || cepData.uf,
    uf: cepData.uf || '',
    cep: formatCep(cepData.cep),
    endereco_completo: '',
    fonte: 'viacep' as const,
    confiabilidade: 'alta' as const
  };
  
  // Gerar endereço completo
  components.endereco_completo = formatFullAddress(components);
  
  return components;
}

/**
 * Buscar CEP por endereço (geocodificação reversa de CEP)
 */
export async function searchCepByAddress(
  uf: string, 
  cidade: string, 
  logradouro: string
): Promise<CepResult[]> {
  try {
    const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(cidade)}/${encodeURIComponent(logradouro)}/json/`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API ViaCEP: ${response.status}`);
    }

    const data = await response.json();
    
    // ViaCEP retorna array ou objeto com erro
    if (Array.isArray(data)) {
      return data.slice(0, 5); // Máximo 5 resultados
    }
    
    return [];
    
  } catch (error) {
    console.error('Erro ao buscar CEP por endereço:', error);
    return [];
  }
}

/**
 * Extrair componentes de endereço a partir de texto livre
 */
export function parseAddressText(addressText: string): Partial<AddressComponents> {
  const parts = addressText.split(',').map(part => part.trim());
  
  const components: Partial<AddressComponents> = {
    fonte: 'manual',
    confiabilidade: 'baixa'
  };

  // Tentar extrair CEP (padrão 00000-000 ou 00000000)
  const cepMatch = addressText.match(/\d{5}-?\d{3}/);
  if (cepMatch) {
    components.cep = formatCep(cepMatch[0]);
  }

  // Tentar extrair número (números no início ou após vírgula)
  const numeroMatch = parts[0]?.match(/(\d+)/);
  if (numeroMatch) {
    components.numero = numeroMatch[1];
    components.logradouro = parts[0].replace(/\d+/g, '').trim();
  } else {
    components.logradouro = parts[0] || '';
  }

  // Outros componentes por posição
  if (parts.length >= 2) components.bairro = parts[1];
  if (parts.length >= 3) components.cidade = parts[2];
  if (parts.length >= 4) {
    const lastPart = parts[parts.length - 1];
    // Verificar se é UF (2 letras)
    if (lastPart.length === 2 && /^[A-Z]{2}$/i.test(lastPart)) {
      components.uf = lastPart.toUpperCase();
      components.estado = getEstadoNome(components.uf);
    }
  }

  return components;
}

/**
 * Integrar dados do autocomplete com componentes estruturados
 */
export async function enrichAddressWithComponents(
  suggestion: any,
  userInput?: string
): Promise<AddressComponents> {
  
  // Se temos coordenadas do Nominatim, extrair componentes
  if (suggestion.address) {
    const addr = suggestion.address;
    
    const components: AddressComponents = {
      logradouro: addr.road || '',
      numero: addr.house_number || '',
      complemento: '',
      bairro: addr.neighbourhood || addr.suburb || addr.district || '',
      cidade: addr.city || addr.town || addr.village || addr.municipality || '',
      estado: getEstadoNome(addr.state) || addr.state || '',
      uf: getUfFromEstado(addr.state) || '',
      cep: addr.postcode ? formatCep(addr.postcode) : '',
      endereco_completo: '',
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      fonte: 'nominatim' as const,
      confiabilidade: 'media' as const
    };

    // Gerar endereço completo
    components.endereco_completo = formatFullAddress(components);

    // Tentar melhorar CEP se não temos
    if (!components.cep && components.uf && components.cidade && components.logradouro) {
      try {
        const cepResults = await searchCepByAddress(
          components.uf,
          components.cidade,
          components.logradouro
        );
        if (cepResults.length > 0) {
          components.cep = formatCep(cepResults[0].cep);
          components.confiabilidade = 'alta';
        }
      } catch (error) {
        console.log('Não foi possível encontrar CEP:', error);
      }
    }

    return components;
  }

  // Fallback: parse manual do texto
  const parsed = parseAddressText(suggestion.display_name || suggestion.full_address || '');
  
  const fallbackComponents = {
    logradouro: parsed.logradouro || '',
    numero: parsed.numero || '',
    complemento: parsed.complemento || '',
    bairro: parsed.bairro || '',
    cidade: parsed.cidade || '',
    estado: parsed.estado || '',
    uf: parsed.uf || '',
    cep: parsed.cep || '',
    endereco_completo: '',
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    fonte: 'manual' as const,
    confiabilidade: 'baixa' as const
  };
  
  // Gerar endereço completo
  fallbackComponents.endereco_completo = formatFullAddress(fallbackComponents);
  
  return fallbackComponents;
}

/**
 * Estados brasileiros
 */
const ESTADOS_BRASIL: Record<string, string> = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
};

/**
 * Obter nome do estado pela UF
 */
export function getEstadoNome(uf: string): string {
  return ESTADOS_BRASIL[uf?.toUpperCase()] || uf;
}

/**
 * Obter UF pelo nome do estado
 */
export function getUfFromEstado(estadoNome: string): string {
  const entry = Object.entries(ESTADOS_BRASIL).find(([, nome]) => 
    nome.toLowerCase() === estadoNome?.toLowerCase()
  );
  return entry ? entry[0] : '';
}

/**
 * Validar endereço completo
 */
export function validateAddressComponents(components: Partial<AddressComponents>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Campos obrigatórios
  if (!components.logradouro?.trim()) {
    errors.push('Logradouro é obrigatório');
  }

  if (!components.cidade?.trim()) {
    errors.push('Cidade é obrigatória');
  }

  if (!components.uf?.trim()) {
    errors.push('Estado (UF) é obrigatório');
  }

  // Validações específicas
  if (components.cep && !isValidCep(components.cep)) {
    errors.push('CEP inválido (deve ter 8 dígitos)');
  }

  if (components.uf && !ESTADOS_BRASIL[components.uf.toUpperCase()]) {
    errors.push('UF inválida');
  }

  // Warnings para campos recomendados
  if (!components.bairro?.trim()) {
    warnings.push('Bairro não informado');
  }

  if (!components.numero?.trim()) {
    warnings.push('Número não informado');
  }

  if (!components.cep?.trim()) {
    warnings.push('CEP não informado');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formatar endereço completo a partir dos componentes
 */
export function formatFullAddress(components: AddressComponents): string {
  const parts: string[] = [];

  // Logradouro + número
  if (components.logradouro) {
    let logradouro = components.logradouro;
    if (components.numero) {
      logradouro += `, ${components.numero}`;
    }
    parts.push(logradouro);
  }

  // Complemento
  if (components.complemento) {
    parts.push(components.complemento);
  }

  // Bairro
  if (components.bairro) {
    parts.push(components.bairro);
  }

  // Cidade
  if (components.cidade) {
    parts.push(components.cidade);
  }

  // Estado
  if (components.uf) {
    parts.push(components.uf);
  }

  // CEP
  if (components.cep) {
    parts.push(components.cep);
  }

  return parts.join(', ');
}

/**
 * Buscar sugestões com componentes estruturados
 */
export async function searchAddressWithComponents(
  query: string
): Promise<{ suggestion: any; components: AddressComponents }[]> {
  
  // Importar função de busca existente
  const { searchAddressSuggestions } = await import('./address-autocomplete');
  
  try {
    const suggestions = await searchAddressSuggestions(query, {
      country: 'br',
      maxResults: 5
    });

    const enrichedResults = await Promise.all(
      suggestions.map(async (suggestion) => {
        const components = await enrichAddressWithComponents(suggestion);
        return { suggestion, components };
      })
    );

    return enrichedResults;
    
  } catch (error) {
    console.error('Erro na busca com componentes:', error);
    return [];
  }
}

/**
 * Limpar cache
 */
export function clearAddressCache(): void {
  addressCache.clear();
  cepCache.clear();
}