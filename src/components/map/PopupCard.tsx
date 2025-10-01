import React from 'react';
import { MapPin, Calendar, BarChart3, Eye, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WorkItem } from '@/types/map';

interface PopupCardProps {
  work: WorkItem;
  onClose: () => void;
  onTrack: () => void;
  onViewDetails: () => void;
}

export function PopupCard({ work, onClose, onTrack, onViewDetails }: PopupCardProps) {
  const statusColors = {
    Initial: 'bg-yellow-500',
    InProgress: 'bg-blue-500',
    Advanced: 'bg-green-500',
  };

  const statusLabels = {
    Initial: 'Planejamento',
    InProgress: 'Em Andamento',
    Advanced: 'Concluída',
  };

  return (
    <div className="w-96 p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight mb-1 truncate">
              {work.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {work.description}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{work.address}</span>
            </div>
          </div>
          
          <Badge 
            className={`${statusColors[work.status]} text-white text-xs shrink-0`}
          >
            {statusLabels[work.status]}
          </Badge>
        </div>
      </div>

      {/* Status e Data */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Status da obra</span>
          </div>
          <span className="text-sm font-semibold text-primary">{statusLabels[work.status]}</span>
        </div>
        
        {/* Data de início */}
        {work.startedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Iniciada em: {new Date(work.startedAt).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              onViewDetails();
              onClose();
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver Detalhes
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              onTrack();
              onClose();
            }}
          >
            <Target className="w-4 h-4 mr-1" />
            Centralizar
          </Button>
        </div>
      </div>

      {/* Hidden content for screen readers */}
      <div className="sr-only">
        <div id={`marker-${work.id}`}>
          Obra {work.name} localizada em {work.address}. 
          Status atual: {statusLabels[work.status]}. 
          {work.startedAt && `Iniciada em ${new Date(work.startedAt).toLocaleDateString('pt-BR')}.`}
        </div>
      </div>
    </div>
  );
}