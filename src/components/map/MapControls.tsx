import React, { useState } from 'react';
import { Search, Filter, Layers, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import useMapStore from '@/store/useMapStore';
import { WorkItem, WorkStatus } from '@/types/map';
import { useDebounce } from '@/hooks/use-debounce';

interface MapControlsProps {
  works: WorkItem[];
}

export function MapControls({ works }: MapControlsProps) {
  const {
    viewMode,
    filters,
    layers,
    search,
    isPanelOpen,
    setViewMode,
    toggleStatus,
    setSearch,
    toggleLayer,
    setLayerOpacity,
    setPanelOpen,
  } = useMapStore();

  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  // Debounce search input
  const debouncedSetSearch = useDebounce(setSearch, 250);

  // Status counts
  const statusCounts = {
    Initial: works.filter(w => w.status === 'Initial').length,
    InProgress: works.filter(w => w.status === 'InProgress').length,
    Advanced: works.filter(w => w.status === 'Advanced').length,
  };

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
    <>
      {/* Mobile Panel Toggle */}
      <div className="absolute top-4 left-4 z-40 md:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPanelOpen(!isPanelOpen)}
          aria-label={isPanelOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {isPanelOpen ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      {/* 2D/3D Toggle - Always visible */}
      <div className="absolute top-4 right-20 z-40">
        <Button
          variant={viewMode === '3D' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setViewMode(viewMode === '2D' ? '3D' : '2D')}
          aria-label={`Alternar para modo ${viewMode === '2D' ? '3D' : '2D'}`}
        >
          {viewMode}
        </Button>
      </div>

      {/* Desktop Side Panel */}
      <div 
        className={`absolute top-0 right-0 h-full w-80 bg-card border-l border-border z-30 transform transition-transform duration-300 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        } hidden md:block`}
      >
        <div className="h-full flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Controles do Mapa</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPanelOpen(false)}
                aria-label="Fechar painel"
              >
                <ChevronRight />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou ID..."
                defaultValue={search}
                onChange={(e) => debouncedSetSearch(e.target.value)}
                className="pl-10"
                aria-label="Buscar obras"
              />
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Status Legend */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">STATUS DAS OBRAS</h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(Object.keys(statusCounts) as WorkStatus[]).map((status) => (
                  <div key={status} className="text-center">
                    <div className={`w-4 h-4 rounded-full ${statusColors[status]} mx-auto mb-1`} />
                    <div className="font-medium">{statusCounts[status]}</div>
                    <div className="text-muted-foreground">{statusLabels[status]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters Section */}
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filtros</span>
                </div>
                <ChevronRight className={`w-4 h-4 transform transition-transform ${isFiltersOpen ? 'rotate-90' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <div className="space-y-2">
                    {(Object.keys(statusLabels) as WorkStatus[]).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.statuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <label
                          htmlFor={`status-${status}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {statusLabels[status]} ({statusCounts[status]})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Layers Section */}
            <Collapsible open={isLayersOpen} onOpenChange={setIsLayersOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="font-medium">Camadas</span>
                </div>
                <ChevronRight className={`w-4 h-4 transform transition-transform ${isLayersOpen ? 'rotate-90' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-3">
                {/* Layer toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Prédios 3D</label>
                    <Checkbox
                      checked={layers.buildings3D}
                      onCheckedChange={() => toggleLayer('buildings3D')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Marcadores</label>
                    <Checkbox
                      checked={layers.markers}
                      onCheckedChange={() => toggleLayer('markers')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Heatmap</label>
                    <Checkbox
                      checked={layers.heatmap}
                      onCheckedChange={() => toggleLayer('heatmap')}
                      disabled
                    />
                  </div>
                </div>

                {/* Opacity controls */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Opacidade Prédios: {Math.round(layers.opacity.buildings3D * 100)}%
                    </label>
                    <Slider
                      value={[layers.opacity.buildings3D]}
                      onValueChange={([value]) => setLayerOpacity('buildings3D', value)}
                      max={1}
                      min={0}
                      step={0.1}
                      disabled={!layers.buildings3D}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Opacidade Marcadores: {Math.round(layers.opacity.markers * 100)}%
                    </label>
                    <Slider
                      value={[layers.opacity.markers]}
                      onValueChange={([value]) => setLayerOpacity('markers', value)}
                      max={1}
                      min={0}
                      step={0.1}
                      disabled={!layers.markers}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Works List */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                OBRAS FILTRADAS ({works.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {works.slice(0, 10).map((work) => (
                  <div
                    key={work.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => {
                      // Seleciona a obra para o mapa focar e abrir detalhes
                      useMapStore.getState().selectWork(work.id);
                      if (window.innerWidth < 768) {
                        useMapStore.getState().setPanelOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{work.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{work.address}</p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${statusColors[work.status]} text-white`}
                      >
                        {work.progress}%
                      </Badge>
                    </div>
                  </div>
                ))}
                {works.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    +{works.length - 10} obras adicionais
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sheet */}
      <div className="md:hidden">
        <Sheet open={isPanelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Controles do Mapa</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6 overflow-y-auto">
              {/* Same content as desktop panel, but in mobile layout */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou ID..."
                  defaultValue={search}
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Mobile-optimized content would go here */}
              {/* For brevity, using similar structure as desktop */}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
