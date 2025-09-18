import { MapWork } from '@/features/map/hooks/useMapData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MapErrorProps {
  error: Error;
  works: MapWork[];
  onProjectClick: () => void;
}

export function MapError({ error, works, onProjectClick }: MapErrorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Erro ao carregar o mapa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {error.message}. Aqui estão as obras disponíveis:
        </p>
        <div className="grid gap-3">
          {works.map((work) => (
            <div key={work.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h3 className="font-medium">{work.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  Coords: {work.coords[1].toFixed(4)}, {work.coords[0].toFixed(4)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getProgressVariant(work.progresso)}>
                  {work.progresso}%
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onProjectClick}
                  aria-label={`Ver detalhes da obra ${work.nome}`}
                >
                  Ver detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getProgressVariant(progress: number) {
  if (progress <= 30) return 'warning';
  if (progress >= 80) return 'success';
  return 'default';
}
