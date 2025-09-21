import React, { useEffect } from 'react';
import PageHeader from "@/components/shared/PageHeader";
import { useObraScope } from "@/app/obraScope";
import { MapComponent } from '@/components/map/MapComponent';
import useMapStore from '@/store/useMapStore';

export default function MapPage() {
  const { obra: obraScope } = useObraScope();
  const { hydrateFromStorage } = useMapStore();

  // Hydrate preferences on page load
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background z-10">
        <PageHeader 
          title="Mapa das Obras" 
          subtitle={`Visualize obras interativas em 2D/3D ${obraScope !== "todas" ? `(Escopo: ${obraScope})` : ""}`} 
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapComponent className="w-full h-full" />
      </div>
    </div>
  );
}
