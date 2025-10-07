import { useEffect, useState } from 'react';
import { useObras } from '@/integrations/supabase/hooks/useObras';

export interface MapWork { 
  id: string; 
  nome: string; 
  progresso: number; 
  coords: [number, number];
  status?: string;
  endereco?: string;
}

interface UseMapDataProps {
  scopeFilter?: string;
}

export function useMapData({ scopeFilter }: UseMapDataProps) {
  const { data: obras = [], isLoading: loadingObras } = useObras();
  const [filteredWorks, setFilteredWorks] = useState<MapWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(loadingObras);
    
    if (!loadingObras && obras.length > 0) {
      // Convert Supabase obras to MapWork format
      const mapWorks: MapWork[] = obras
        .filter(obra => obra.latitude && obra.longitude) // Only obras with coordinates
        .map(obra => ({
          id: obra.id,
          nome: obra.nome,
          progresso: getProgressFromStatus(obra.status || ''),
          coords: [obra.longitude!, obra.latitude!], // [lng, lat] for Leaflet
          status: obra.status || '',
          endereco: obra.endereco || ''
        }));

      // Apply scope filter
      const filtered = scopeFilter && scopeFilter !== 'todas'
        ? mapWorks.filter(w => w.nome === scopeFilter)
        : mapWorks;
      
      setFilteredWorks(filtered);
    } else if (!loadingObras) {
      setFilteredWorks([]);
    }
  }, [obras, loadingObras, scopeFilter]);

  return {
    works: filteredWorks,
    isLoading
  };
}

// Helper function to convert status to progress percentage
function getProgressFromStatus(status: string): number {
  switch (status?.toLowerCase()) {
    case 'planejamento':
      return 15;
    case 'em andamento':
      return 60;
    case 'conclu�da':
    case 'concluido':
      return 100;
    case 'paralisada':
      return 35;
    default:
      return 45; // Default progress for unknown status
  }
}



