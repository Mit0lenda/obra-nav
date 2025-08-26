import { useCallback, useState } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { useNavigate } from "react-router-dom";
import { useObraScope } from "@/app/obraScope";
import { mockMapWorks } from "@/data/mockMap";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMap } from '../features/map/hooks/useMapbox';
import { useCesiumMap } from '../features/map/hooks/useCesiumMap';
import { useMapData } from '../features/map/hooks/useMapData';
import { MapError } from '../features/map/components/MapError';
import { MapFallback } from '../features/map/components/MapFallback';
import "mapbox-gl/dist/mapbox-gl.css";
import 'cesium/Build/Cesium/Widgets/widgets.css';
import '@/styles/cesium.css';

export default function MapPage() {
  const navigate = useNavigate();
  const { obra: obraScope } = useObraScope();
  const [is3D, setIs3D] = useState(false);
  
  // Get filtered map data
  const { works, isLoading } = useMapData({
    works: mockMapWorks,
    scopeFilter: obraScope
  });

  // Handle marker clicks
  const handleMarkerClick = useCallback((workId: string) => {
    navigate('/obras-em-andamento');
  }, [navigate]);

  // Initialize map
  // Use o hook apropriado baseado no modo 3D
  const { error: error2D } = useMap({
    containerId: 'map-container-2d',
    works,
    onMarkerClick: handleMarkerClick,
    is3D: false
  });

  const { error: error3D } = useCesiumMap({
    containerId: 'map-container-3d',
    works,
    onMarkerClick: handleMarkerClick
  });

  const error = is3D ? error3D : error2D;

  if (error) {
    return <MapError error={error} works={works} onProjectClick={() => navigate('/projects')} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Mapa das Obras" 
          subtitle={`Visualize obras no mapa ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ""}`} 
        />
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Modo 3D</span>
          <Switch
            checked={is3D}
            onCheckedChange={setIs3D}
            aria-label="Alternar modo 3D"
          />
        </div>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[70vh] w-full" />
          </CardContent>
        </Card>
      ) : works.length > 0 ? (
        <>
          <div 
            id="map-container-2d" 
            className={`h-[70vh] w-full rounded-lg border ${is3D ? 'hidden' : ''}`} 
          />
          <div 
            id="map-container-3d" 
            className={`h-[70vh] w-full rounded-lg border ${!is3D ? 'hidden' : ''}`} 
          />
        </>
      ) : (
        <MapFallback />
      )}
      
      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIs3D(!is3D)}
        >
          {is3D ? 'Voltar para 2D' : 'Ver em 3D'}
        </Button>
      </div>
    </div>
  );
}
