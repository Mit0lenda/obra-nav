/**
 * Serviço de Autocomplete de Endereços
 * Combina Google Places API com Nominatim para sugestões em tempo real
 */

declare global {
  interface Window {
    GOOGLE_PLACES_API_KEY?: string;
  }
}

// Tipos mínimos para respostas externas
interface NominatimResult {
  place_id?: number | string;
  display_name?: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

interface GooglePrediction {
  place_id: string;
  description: string;
  types: string[];
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

export interface AddressSuggestion {
  id: string;
  display_name: string;
  short_name: string;
  full_address: string;
  latitude?: number;
  longitude?: number;
  place_type: 'street' | 'city' | 'neighborhood' | 'establishment' | 'other';
  relevance: number;
}

export interface AutocompleteOptions {
  country?: string;
  types?: string[];
  bias?: 'brazil' | 'city' | 'address';
  maxResults?: number;
}

// Cache para evitar chamadas desnecessárias
const suggestionCache = new Map<string, AddressSuggestion[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca sugestões usando Nominatim (OpenStreetMap) - API Gratuita
 */
async function searchWithNominatim(
  query: string, 
  options: AutocompleteOptions = {}
): Promise<AddressSuggestion[]> {
  const { country = 'br', maxResults = 5 } = options;
  
  try {
    // Melhorar a query para busca brasileira
    const searchQuery = `${query}, Brasil`;
    
    const url = `https://nominatim.openstreetmap.org/search?` + 
      `q=${encodeURIComponent(searchQuery)}&` +
      `format=json&` +
      `limit=${maxResults}&` +
      `addressdetails=1&` +
      `countrycodes=${country}&` +
      `extratags=1&` +
      `namedetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OBRA-NAV/1.0 (Construction Management System)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();
    
    return data.map((item: NominatimResult, index: number): AddressSuggestion => {
      const address = item.address || {};
      const displayName = item.display_name || '';
      
      // Extrair componentes do endereço
      const road = address.road || '';
      const houseNumber = address.house_number || '';
      const neighborhood = address.neighbourhood || address.suburb || '';
      const city = address.city || address.town || address.village || '';
      const state = address.state || '';
      
      // Criar nome curto e completo
      const shortName = road ? 
        `${road}${houseNumber ? `, ${houseNumber}` : ''}` : 
        displayName.split(',')[0];
        
      const fullAddress = `${road}${houseNumber ? `, ${houseNumber}` : ''}${neighborhood ? `, ${neighborhood}` : ''}, ${city}, ${state}`.replace(/^,\s*/, '');
      
      // Determinar tipo do local
      let placeType: AddressSuggestion['place_type'] = 'other';
      if (road) placeType = 'street';
      else if (city && !road) placeType = 'city';
      else if (neighborhood) placeType = 'neighborhood';
      
      return {
        id: `nominatim-${item.place_id || index}`,
        display_name: displayName,
        short_name: shortName,
        full_address: fullAddress,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        place_type: placeType,
        relevance: Math.max(0.8 - (index * 0.1), 0.1) // Relevância decrescente
      };
    });
    
  } catch (error) {
    console.error('Erro no Nominatim:', error);
    return [];
  }
}

/**
 * Busca sugestões usando Google Places API (se disponível)
 */
async function searchWithGooglePlaces(
  query: string,
  options: AutocompleteOptions = {}
): Promise<AddressSuggestion[]> {
  // Verificar se Google Places está disponível (precisa de API key)
  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY || window.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.log('Google Places API key não encontrada, usando Nominatim');
    return [];
  }
  
  try {
    const { maxResults = 5 } = options;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(query)}&` +
      `key=${apiKey}&` +
      `components=country:br&` +
      `language=pt-BR&` +
      `types=address`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    return (data.predictions as GooglePrediction[]).slice(0, maxResults).map((prediction: GooglePrediction, index: number): AddressSuggestion => {
      const mainText = prediction.structured_formatting?.main_text || '';
      const secondaryText = prediction.structured_formatting?.secondary_text || '';
      
      return {
        id: `google-${prediction.place_id}`,
        display_name: prediction.description,
        short_name: mainText,
        full_address: prediction.description,
        place_type: getGooglePlaceType(prediction.types),
        relevance: Math.max(0.9 - (index * 0.1), 0.2)
      };
    });
    
  } catch (error) {
    console.error('Erro no Google Places:', error);
    return [];
  }
}

/**
 * Converte tipos do Google Places para nosso enum
 */
function getGooglePlaceType(types: string[]): AddressSuggestion['place_type'] {
  if (types.includes('route')) return 'street';
  if (types.includes('locality')) return 'city';
  if (types.includes('sublocality')) return 'neighborhood';
  if (types.includes('establishment')) return 'establishment';
  return 'other';
}

/**
 * Função principal de busca com fallback
 */
export async function searchAddressSuggestions(
  query: string,
  options: AutocompleteOptions = {}
): Promise<AddressSuggestion[]> {
  // Validar entrada
  if (!query || query.trim().length < 3) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  
  // Verificar cache
  const cacheKey = `${normalizedQuery}-${JSON.stringify(options)}`;
  if (suggestionCache.has(cacheKey)) {
    const cached = suggestionCache.get(cacheKey)!;
    return cached;
  }

  try {
    // Tentar Google Places primeiro, depois Nominatim
    let suggestions: AddressSuggestion[] = [];
    
    // Tentativa 1: Google Places
    suggestions = await searchWithGooglePlaces(query, options);
    
    // Tentativa 2: Nominatim se Google não retornou resultados
    if (suggestions.length === 0) {
      suggestions = await searchWithNominatim(query, options);
    }
    
    // Combinar e ranquear resultados
    const rankedSuggestions = rankSuggestions(suggestions, query);
    
    // Cachear resultado
    suggestionCache.set(cacheKey, rankedSuggestions);
    setTimeout(() => suggestionCache.delete(cacheKey), CACHE_DURATION);
    
    return rankedSuggestions;
    
  } catch (error) {
    console.error('Erro na busca de endereços:', error);
    return [];
  }
}

/**
 * Rankeia sugestões por relevância
 */
function rankSuggestions(suggestions: AddressSuggestion[], query: string): AddressSuggestion[] {
  const normalizedQuery = query.toLowerCase();
  
  return suggestions
    .map(suggestion => {
      let score = suggestion.relevance;
      
      // Boost para correspondências exatas no início
      if (suggestion.short_name.toLowerCase().startsWith(normalizedQuery)) {
        score += 0.3;
      }
      
      // Boost para ruas
      if (suggestion.place_type === 'street') {
        score += 0.2;
      }
      
      // Boost para correspondências no nome curto
      if (suggestion.short_name.toLowerCase().includes(normalizedQuery)) {
        score += 0.1;
      }
      
      return { ...suggestion, relevance: Math.min(score, 1.0) };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8); // Máximo 8 sugestões
}

/**
 * Busca rápida para sugestões locais/offline
 */
export function getLocalSuggestions(query: string): AddressSuggestion[] {
  const normalizedQuery = query.toLowerCase();
  
  // Sugestões comuns para ruas brasileiras
  const commonStreets = [
    'Rua das Flores', 'Avenida Brasil', 'Rua 15 de Novembro', 
    'Avenida Paulista', 'Rua da Consolação', 'Avenida Getúlio Vargas',
    'Rua José de Alencar', 'Avenida Presidente Vargas', 'Rua Barão do Rio Branco',
    'Rua Minas Gerais', 'Avenida Rio Grande do Sul', 'Rua São Paulo'
  ];
  
  const matches = commonStreets
    .filter(street => street.toLowerCase().includes(normalizedQuery))
    .slice(0, 3)
    .map((street, index) => ({
      id: `local-${index}`,
      display_name: street,
      short_name: street,
      full_address: `${street}, Brasil`,
      place_type: 'street' as const,
      relevance: 0.5
    }));
    
  return matches;
}

/**
 * Limpa o cache de sugestões
 */
export function clearSuggestionCache(): void {
  suggestionCache.clear();
}

/**
 * Obtém detalhes completos de um endereço (geocodificação)
 */
export async function getAddressDetails(suggestion: AddressSuggestion): Promise<{
  latitude: number;
  longitude: number;
  formatted_address: string;
}> {
  // Se já temos coordenadas, retornar
  if (suggestion.latitude && suggestion.longitude) {
    return {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      formatted_address: suggestion.full_address
    };
  }
  
  // Senão, geocodificar usando o serviço existente
  const { geocodeAddress } = await import('./geocoding');
  const result = await geocodeAddress(suggestion.full_address);
  
  if (result) {
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      formatted_address: result.display_name
    };
  }
  
  throw new Error('Não foi possível obter coordenadas do endereço');
}
