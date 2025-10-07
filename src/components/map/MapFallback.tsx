import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Search, MapPin, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkItem, WorkStatus } from '@/types/map';

interface MapFallbackProps {
  error: Error;
  works: WorkItem[];
  onRetry: () => void;
}

const statusColors: Record<WorkStatus, string> = {
  Initial: 'bg-muted-foreground',
  InProgress: 'bg-primary',
  Advanced: 'bg-green-500',
};

const statusLabels: Record<WorkStatus, string> = {
  Initial: 'Inicial',
  InProgress: 'Em Andamento',
  Advanced: 'Avancado',
};

type SortOption = 'name' | 'progress' | 'status';

export function MapFallback({ error, works, onRetry }: MapFallbackProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterStatus, setFilterStatus] = useState<WorkStatus | 'all'>('all');

  const filteredWorks = works
    .filter((work) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = work.name.toLowerCase().includes(searchLower) ||
        (work.address?.toLowerCase() ?? '').includes(searchLower);
      const matchesStatus = filterStatus === 'all' || work.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return b.progress - a.progress;
        case 'status':
          return statusLabels[a.status].localeCompare(statusLabels[b.status]);
        default:
          return 0;
      }
    });

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="bg-destructive/10 border-b border-destructive/20 p-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-destructive">Não foi possível carregar o mapa</h2>
            <p className="text-sm text-destructive/80 truncate">
              {error.message || 'Erro desconhecido ao inicializar o mapa'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-2">Lista de Obras</h1>
          <p className="text-muted-foreground text-sm">
            Visualização alternativa enquanto o mapa não estiver disponível
          </p>
        </div>
      </div>

      <div className="bg-card border-b p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar obras por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value: WorkStatus | 'all') => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Initial">Inicial</SelectItem>
                  <SelectItem value="InProgress">Em Andamento</SelectItem>
                  <SelectItem value="Advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            {filteredWorks.length} de {works.length} obras
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {filteredWorks.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma obra encontrada</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou termos de busca</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredWorks.map((work) => (
                <Card key={work.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate mb-1">{work.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{work.address}</span>
                        </div>
                      </div>

                      <Badge className={`${statusColors[work.status]} text-white shrink-0`}>
                        {statusLabels[work.status]}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Progresso</span>
                          </div>
                          <span className="text-sm font-bold">{work.progress}%</span>
                        </div>
                        <Progress value={work.progress} className="h-2" />
                      </div>

                      {work.description && (
                        <p className="text-sm text-muted-foreground">{work.description}</p>
                      )}

                      {work.meta && (
                        <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                          {Object.entries(work.meta).map(([key, value]) => (
                            <div key={key} className="flex flex-col gap-1">
                              <span className="text-muted-foreground">{key}</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
