import { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { MapWork } from '@/data/mockMap';

// Função auxiliar para gerar imagem do marcador em SVG
const createMarkerImage = (progress: number): string => {
  const color = progress <= 30 ? '#f59e0b' : progress >= 80 ? '#10b981' : '#3b82f6';
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="15" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="20" y="20" font-size="12" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${progress}%
      </text>
    </svg>
  `;
  
  return 'data:image/svg+xml;base64,' + btoa(svgString);
};

interface UseCesiumMapProps {
  containerId: string;
  works: MapWork[];
  onMarkerClick?: (workId: string) => void;
}

export function useCesiumMap({ containerId, works, onMarkerClick }: UseCesiumMapProps) {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoizar a função de criação de marcador
  const getMarkerImage = useCallback((progress: number) => {
    return createMarkerImage(progress);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      const container = document.getElementById(containerId);
      if (!container || !mounted) return;

      try {
        // Configure o token do Cesium
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZjEzYmI0Yi1mY2FiLTQ5MTUtOGIwNi0xNjJlMjkyNDNiYjciLCJpZCI6MjE5MjM2LCJpYXQiOjE3NTYxNjUwNzZ9.g2-5VkiofCY4cfiLGtPzrNaFWqkVHWtBnUBfnw39GW0';

        // Inicialize o visualizador Cesium com configurações otimizadas
        viewerRef.current = new Cesium.Viewer(container, {
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          timeline: false,
          animation: false,
          scene3DOnly: true,
          selectionIndicator: false,
          infoBox: false,
          fullscreenButton: false,
          contextOptions: {
            webgl: {
              alpha: true,
              preserveDrawingBuffer: true
            }
          }
        });

        // Configurações adicionais para melhor performance
        if (viewerRef.current.scene) {
          viewerRef.current.scene.globe.enableLighting = false;
          viewerRef.current.scene.fog.enabled = false;
          viewerRef.current.scene.globe.showGroundAtmosphere = false;
        }

        // Configurar terreno 3D
        const worldTerrain = await Cesium.createWorldTerrainAsync({
          requestWaterMask: true,
          requestVertexNormals: true
        });
        
        if (mounted && viewerRef.current) {
          viewerRef.current.terrainProvider = worldTerrain;
          viewerRef.current.scene.globe.enableLighting = true;
          viewerRef.current.scene.globe.maximumScreenSpaceError = 2;
          viewerRef.current.scene.fog.enabled = true;
          viewerRef.current.scene.fog.density = 0.0001;
          viewerRef.current.scene.skyAtmosphere.show = true;
          viewerRef.current.scene.globe.show = true;
        }

        // Configurar imagem de satélite
        const imageryLayer = await Cesium.createWorldImageryAsync();
        
        if (mounted && viewerRef.current) {
          viewerRef.current.imageryLayers.addImageryProvider(imageryLayer);
          viewerRef.current.scene.globe.baseColor = Cesium.Color.WHITE;
          
          // Melhorar a qualidade da renderização
          viewerRef.current.scene.postProcessStages.fxaa.enabled = true;
          viewerRef.current.scene.globe.enableLighting = true;
          
          // Ajustar a visualização inicial para o Brasil
          viewerRef.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-51.9253, -14.2350, 3000000.0),
            orientation: {
              heading: 0.0,
              pitch: Cesium.Math.toRadians(-45),
              roll: 0.0
            }
          });
          
          // Habilitar iluminação e melhorar visualização
          viewerRef.current.scene.globe.enableLighting = true;
          viewerRef.current.scene.globe.maximumScreenSpaceError = 2;
          viewerRef.current.scene.globe.show = true;
          
          // Configurar cena para melhor visualização 3D
          viewerRef.current.scene.debugShowFramesPerSecond = true;
          viewerRef.current.scene.fog.enabled = true;
          viewerRef.current.scene.fog.density = 0.0001;
          viewerRef.current.scene.skyAtmosphere.show = true;

          setIsLoaded(true);
        }

        // Adicionar marcadores para as obras
        works.forEach((work) => {
          if (!mounted || !viewerRef.current) return;

          // Criar entidade para cada obra
          const pinBuilder = new Cesium.PinBuilder();
          const markerUrl = getMarkerImage(work.progresso);
          
          const entity = viewerRef.current.entities.add({
            name: work.nome,
            position: Cesium.Cartesian3.fromDegrees(work.coords[0], work.coords[1]),
            billboard: {
              image: markerUrl,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              scale: 1.0,
              disableDepthTestDistance: 0,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              eyeOffset: new Cesium.Cartesian3(0, 0, -10)
            },
            description: `
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 5px 0;">${work.nome}</h3>
                <p style="margin: 0;">Progresso: ${work.progresso}%</p>
                <button 
                  onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${work.id}' }))"
                  style="margin-top: 10px; padding: 5px 10px; cursor: pointer;"
                >
                  Ver detalhes
                </button>
              </div>
            `
          });

          // Adicionar interatividade
          if (onMarkerClick) {
            viewerRef.current.selectedEntityChanged.addEventListener((selectedEntity) => {
              if (selectedEntity === entity) {
                onMarkerClick(work.id);
              }
            });
          }
        });
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [containerId, works, onMarkerClick, getMarkerImage]);

  return {
    viewer: viewerRef.current,
    isLoaded,
    error
  };
}
