import PageHeader from "@/components/shared/PageHeader";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapPage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    mapboxgl.accessToken = "MAPBOX_TOKEN_AQUI";
    mapRef.current = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-47.8825, -15.7942],
      zoom: 3,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title="Mapa das Obras" subtitle="Visualize obras no mapa (mock)" />
      <div ref={ref} className="h-[60vh] w-full rounded-lg border" />
    </div>
  );
}
