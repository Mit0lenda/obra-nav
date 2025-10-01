/**
 * Serviço de Geocodificação
 * Converte endereços em coordenadas geográficas automaticamente
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface GeocodeError {
  error: string;
  message: string;
}

/**
 * Geocodifica um endereço usando a API Nominatim (OpenStreetMap)
 * API gratuita e sem necessidade de chave
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 5) {
    throw new Error('Endereço deve ter pelo menos 5 caracteres');
  }

  try {
    // Adicionar "Brasil" ao final se não estiver presente
    const searchAddress = address.toLowerCase().includes('brasil') || address.toLowerCase().includes('brazil') 
      ? address 
      : `${address}, Brasil`;

    const url = `https://nominatim.openstreetmap.org/search?` + 
      `q=${encodeURIComponent(searchAddress)}&` +
      `format=json&` +
      `limit=1&` +
      `addressdetails=1&` +
      `countrycodes=br`; // Restringir ao Brasil

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OBRA-NAV/1.0 (Construction Management System)'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API de geocodificação: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null; // Endereço não encontrado
    }

    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address || {}
    };

  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    throw new Error('Não foi possível encontrar as coordenadas do endereço');
  }
}

/**
 * Valida se um endereço parece ser válido para geocodificação
 */
export function validateAddress(address: string): { isValid: boolean; message?: string } {
  if (!address || address.trim().length === 0) {
    return { isValid: false, message: 'Endereço é obrigatório' };
  }

  if (address.trim().length < 5) {
    return { isValid: false, message: 'Endereço deve ter pelo menos 5 caracteres' };
  }

  // Verificar se contém pelo menos alguns elementos básicos de endereço
  const hasNumber = /\d/.test(address);
  const hasText = /[a-zA-Z]{3,}/.test(address);
  
  if (!hasText) {
    return { isValid: false, message: 'Endereço deve conter nome de rua ou cidade' };
  }

  return { isValid: true };
}

/**
 * Formata um endereço para exibição
 */
export function formatAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ') // Remover espaços duplos
    .replace(/,\s*,/g, ',') // Remover vírgulas duplas
    .replace(/^,|,$/g, ''); // Remover vírgulas no início/fim
}

/**
 * Extrai componentes principais de um endereço
 */
export function parseAddressComponents(address: string): {
  street?: string;
  number?: string;
  city?: string;
  state?: string;
} {
  const parts = address.split(',').map(part => part.trim());
  
  // Tentar extrair número da primeira parte
  const firstPart = parts[0] || '';
  const numberMatch = firstPart.match(/(\d+)/);
  const number = numberMatch ? numberMatch[1] : undefined;
  const street = firstPart.replace(/\d+/g, '').trim();

  return {
    street: street || undefined,
    number: number || undefined,
    city: parts[1] || undefined,
    state: parts[2] || undefined,
  };
}

/**
 * Coordenadas padrão para cidades brasileiras principais
 * Usado como fallback quando geocodificação não funciona
 */
export const BRAZILIAN_CITIES_COORDS: Record<string, [number, number]> = {
  'sao paulo': [-46.6333, -23.5505],
  'rio de janeiro': [-43.1964, -22.9083],
  'brasilia': [-47.8825, -15.7942],
  'salvador': [-38.5014, -12.9714],
  'fortaleza': [-38.5434, -3.7319],
  'belo horizonte': [-43.9378, -19.9208],
  'manaus': [-60.0261, -3.1190],
  'curitiba': [-49.2780, -25.4284],
  'recife': [-34.8771, -8.0539],
  'porto alegre': [-51.2177, -30.0346],
  'belem': [-48.4518, -1.4558],
  'goiania': [-49.2539, -16.6869],
  'campinas': [-47.0608, -22.9056],
  'sao luis': [-44.3068, -2.5297],
  'natal': [-35.2094, -5.7945],
  'maceio': [-35.7353, -9.6658],
  'campo grande': [-54.6464, -20.4697],
  'joao pessoa': [-34.8641, -7.1195],
  'teresina': [-42.8034, -5.0892],
  'aracaju': [-37.0731, -10.9472],
};

/**
 * Tenta encontrar coordenadas aproximadas baseadas no nome da cidade
 */
export function getApproximateCoordinates(address: string): [number, number] | null {
  const normalizedAddress = address.toLowerCase();
  
  for (const [city, coords] of Object.entries(BRAZILIAN_CITIES_COORDS)) {
    if (normalizedAddress.includes(city)) {
      return coords;
    }
  }
  
  return null;
}