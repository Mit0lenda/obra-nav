import { useEffect, useState } from 'react';
import { MapWork } from '@/data/mockMap';

interface UseMapDataProps {
  works: MapWork[];
  scopeFilter?: string;
}

export function useMapData({ works, scopeFilter }: UseMapDataProps) {
  const [filteredWorks, setFilteredWorks] = useState<MapWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay for demo purposes
    setTimeout(() => {
      const filtered = scopeFilter && scopeFilter !== 'todas'
        ? works.filter(w => w.nome === scopeFilter)
        : works;
      
      setFilteredWorks(filtered);
      setIsLoading(false);
    }, 500);
  }, [works, scopeFilter]);

  return {
    works: filteredWorks,
    isLoading
  };
}
