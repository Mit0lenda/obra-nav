import { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { MapWork } from '@/data/mockMap';

// Função auxiliar para gerar imagem do marcador
const createMarkerImage = (progress: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d')!;

  // Desenhar círculo
  ctx.beginPath();
  ctx.arc(20, 20, 15, 0, Math.PI * 2);
  ctx.fillStyle = progress <= 30 ? '#f59e0b' : progress >= 80 ? '#10b981' : '#3b82f6';
  ctx.fill();

  // Adicionar texto do progresso
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${progress}%`, 20, 20);

  return canvas;
};

interface Use3DMapProps {
  containerId: string;
  works: MapWork[];
  onMarkerClick?: (workId: string) => void;
}

export function use3DMap({ containerId, works, onMarkerClick }: Use3DMapProps) {
  // Memoizar a função de criação de marcador
  const getMarkerImage = useCallback((progress: number) => {
    return createMarkerImage(progress);
  }, []);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      const container = document.getElementById(containerId);
      if (!container || !mounted) return;

      try {
        // Configure o token do Cesium
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZjEzYmI0Yi1mY2FiLTQ5MTUtOGIwNi0xNjJlMjkyNDNiYjciLCJpZCI6MjE5MjM2LCJpYXQiOjE3NTYxNjUwNzZ9.g2-5VkiofCY4cfiLGtPzrNaFWqkVHWtBnUBfnw39GW0';

        // Inicialize o visualizador Cesium
        viewerRef.current = new Cesium.Viewer(container, {
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          navigationHelpButton: false,
          sceneModePicker: true,
          timeline: false,
          animation: false
        });

        // Configurar terreno 3D
        const worldTerrain = await Cesium.createWorldTerrainAsync();
        if (mounted && viewerRef.current) {
          viewerRef.current.terrainProvider = worldTerrain;
        }

        // Configurar imagem de satélite
        const imageryLayer = await Cesium.createWorldImageryAsync();
        if (mounted && viewerRef.current) {
          viewerRef.current.imageryLayers.addImageryProvider(imageryLayer);
        }

        // Configurar a visualização
        if (mounted && viewerRef.current) {
          viewerRef.current.scene.globe.enableLighting = true;
          viewerRef.current.scene.globe.maximumScreenSpaceError = 2;
          viewerRef.current.scene.skyAtmosphere.show = true;
          
          // Ajustar a visualização inicial
          viewerRef.current.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-51.9253, -14.2350, 3000000),
            orientation: {
              heading: 0.0,
              pitch: -Cesium.Math.PI_OVER_TWO,
              roll: 0.0
            }
          });

          setIsLoaded(true);
        }

        // Adicionar marcadores para as obras
        works.forEach((work) => {
          if (!mounted || !viewerRef.current) return;

          // Criar entidade para cada obra
          const entity = viewerRef.current.entities.add({
            name: work.nome,
            position: Cesium.Cartesian3.fromDegrees(work.coords[0], work.coords[1]),
            billboard: {
              image: getMarkerImage(work.progresso),
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              scale: 0.5
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

      // Adicione marcadores para cada obra
      works.forEach((work) => {
        // Crie uma entidade para representar a obra
        const entity = viewerRef.current!.entities.add({
          name: work.nome,
          position: Cesium.Cartesian3.fromDegrees(work.coords[0], work.coords[1]),
          billboard: {
            image: getProgressIcon(work.progresso),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 0.5,
          },
          description: `
            <div class="cesium-infoBox-content">
              <h3>${work.nome}</h3>
              <p>Progresso: ${work.progresso}%</p>
              <button onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${work.id}' }))">
                Ver detalhes
              </button>
            </div>
          `,
        });

        // Adicione interatividade
        if (onMarkerClick) {
          viewerRef.current!.selectedEntityChanged.addEventListener((selectedEntity) => {
            if (selectedEntity === entity) {
              onMarkerClick(work.id);
            }
          });
        }
      });

      // Configure a visualização inicial
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-51.9253, -14.2350, 3000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-60),
          roll: 0.0,
        },
      });

      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [containerId, works, onMarkerClick]);

  // Helper para gerar ícone baseado no progresso
  const getProgressIcon = (progress: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d')!;

    // Desenhe um círculo com cor baseada no progresso
    ctx.beginPath();
    ctx.arc(20, 20, 15, 0, Math.PI * 2);
    ctx.fillStyle = progress <= 30 ? '#f59e0b' : progress >= 80 ? '#10b981' : '#3b82f6';
    ctx.fill();

    // Adicione o texto do progresso
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${progress}%`, 20, 20);

    return canvas;
  };

  return {
    viewer: viewerRef.current,
    isLoaded,
    error,
  };
}
