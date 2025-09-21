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
    Initial: 'bg-muted-foreground',
    InProgress: 'bg-primary',
    Advanced: 'bg-green-500',
  };

  const statusLabels = {
    Initial: 'Inicial',
    InProgress: 'Em Andamento',
    Advanced: 'Avançado',
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
            <p className="text-sm text-muted-foreground mb-2 truncate">
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

      {/* Progress Section */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Progresso da obra</span>
          </div>
          <span className="text-lg font-bold text-primary">{work.progress}%</span>
        </div>
        
        <Progress 
          value={work.progress} 
          className="h-3 mb-1"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Metadata */}
      {(work.startedAt || work.updatedAt) && (
        <div className="px-4 pb-4 space-y-2 text-xs">
          {work.startedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Iniciada: {new Date(work.startedAt).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {work.updatedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Atualizada: {new Date(work.updatedAt).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
      )}

      {/* Additional Info */}
      {work.meta && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {work.meta.contractor && (
              <div>
                <span className="text-muted-foreground">Construtora:</span>
                <div className="font-medium truncate">{work.meta.contractor as string}</div>
              </div>
            )}
            {work.meta.budget && (
              <div>
                <span className="text-muted-foreground">Orçamento:</span>
                <div className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  }).format(work.meta.budget as number)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            Rastrear
          </Button>
        </div>
      </div>

      {/* Hidden content for screen readers */}
      <div className="sr-only">
        <div id={`marker-${work.id}`}>
          Obra {work.name} localizada em {work.address}. 
          Status atual: {statusLabels[work.status]}. 
          Progresso: {work.progress} por cento concluído.
          {work.meta?.contractor && ` Construtora: ${work.meta.contractor}.`}
        </div>
      </div>
    </div>
  );
}