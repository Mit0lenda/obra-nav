import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  FileText, 
  Wifi, 
  HardDrive, 
  Monitor, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Trash2,
  Clock
} from 'lucide-react';

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  memoryUsage: number;
  cacheSize: number;
  networkRequests: number;
  renderTime: number;
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'bundle' | 'cache' | 'network' | 'rendering';
  status: 'pending' | 'applied' | 'ignored';
  action: () => void;
}

export default function PerformanceOptimization() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bundleSize: 1.8, // MB
    loadTime: 2.4, // seconds
    memoryUsage: 45, // MB
    cacheSize: 12.5, // MB
    networkRequests: 32,
    renderTime: 16.7 // ms
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());
  const [appliedOptimizations, setAppliedOptimizations] = useState<string[]>([]);

  const suggestions: OptimizationSuggestion[] = [
    {
      id: 'lazy-loading',
      title: 'Implementar Lazy Loading',
      description: 'Carregar componentes apenas quando necessário para reduzir o bundle inicial',
      impact: 'high',
      category: 'bundle',
      status: appliedOptimizations.includes('lazy-loading') ? 'applied' : 'pending',
      action: () => applyLazyLoading()
    },
    {
      id: 'code-splitting',
      title: 'Code Splitting por Rota',
      description: 'Dividir o código em chunks menores baseados nas rotas',
      impact: 'high',
      category: 'bundle',
      status: appliedOptimizations.includes('code-splitting') ? 'applied' : 'pending',
      action: () => applyCodeSplitting()
    },
    {
      id: 'image-optimization',
      title: 'Otimizar Imagens',
      description: 'Comprimir imagens e usar formatos modernos (WebP/AVIF)',
      impact: 'medium',
      category: 'network',
      status: appliedOptimizations.includes('image-optimization') ? 'applied' : 'pending',
      action: () => applyImageOptimization()
    },
    {
      id: 'service-worker',
      title: 'Service Worker para Cache',
      description: 'Implementar cache inteligente com service worker',
      impact: 'medium',
      category: 'cache',
      status: appliedOptimizations.includes('service-worker') ? 'applied' : 'pending',
      action: () => applyServiceWorker()
    },
    {
      id: 'preload-resources',
      title: 'Preload de Recursos Críticos',
      description: 'Pré-carregar recursos importantes para melhor performance',
      impact: 'medium',
      category: 'network',
      status: appliedOptimizations.includes('preload-resources') ? 'applied' : 'pending',
      action: () => applyResourcePreload()
    },
    {
      id: 'tree-shaking',
      title: 'Tree Shaking Avançado',
      description: 'Remover código morto e dependências não utilizadas',
      impact: 'medium',
      category: 'bundle',
      status: appliedOptimizations.includes('tree-shaking') ? 'applied' : 'pending',
      action: () => applyTreeShaking()
    },
    {
      id: 'react-memo',
      title: 'Otimizar Re-renders',
      description: 'Usar React.memo e useCallback para evitar re-renders desnecessários',
      impact: 'low',
      category: 'rendering',
      status: appliedOptimizations.includes('react-memo') ? 'applied' : 'pending',
      action: () => applyReactMemo()
    }
  ];

  // Simular análise de performance
  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    
    // Simular coleta de métricas reais
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Gerar métricas aleatórias baseadas nas otimizações aplicadas
    const optimizationFactor = appliedOptimizations.length * 0.1;
    
    setMetrics(prev => ({
      bundleSize: Math.max(0.8, prev.bundleSize - optimizationFactor),
      loadTime: Math.max(0.5, prev.loadTime - optimizationFactor * 0.3),
      memoryUsage: Math.max(20, prev.memoryUsage - optimizationFactor * 5),
      cacheSize: prev.cacheSize + optimizationFactor * 2,
      networkRequests: Math.max(10, prev.networkRequests - optimizationFactor * 3),
      renderTime: Math.max(8, prev.renderTime - optimizationFactor * 2)
    }));
    
    setLastAnalysis(new Date());
    setIsAnalyzing(false);
  };

  // Funções para aplicar otimizações
  const applyLazyLoading = () => {
    console.log('Aplicando Lazy Loading...');
    setAppliedOptimizations(prev => [...prev, 'lazy-loading']);
  };

  const applyCodeSplitting = () => {
    console.log('Aplicando Code Splitting...');
    setAppliedOptimizations(prev => [...prev, 'code-splitting']);
  };

  const applyImageOptimization = () => {
    console.log('Aplicando otimização de imagens...');
    setAppliedOptimizations(prev => [...prev, 'image-optimization']);
  };

  const applyServiceWorker = () => {
    console.log('Configurando Service Worker...');
    setAppliedOptimizations(prev => [...prev, 'service-worker']);
  };

  const applyResourcePreload = () => {
    console.log('Configurando preload de recursos...');
    setAppliedOptimizations(prev => [...prev, 'preload-resources']);
  };

  const applyTreeShaking = () => {
    console.log('Aplicando Tree Shaking...');
    setAppliedOptimizations(prev => [...prev, 'tree-shaking']);
  };

  const applyReactMemo = () => {
    console.log('Otimizando re-renders...');
    setAppliedOptimizations(prev => [...prev, 'react-memo']);
  };

  // Limpar cache
  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    localStorage.clear();
    sessionStorage.clear();
    setMetrics(prev => ({ ...prev, cacheSize: 0 }));
  };

  // Calcular score de performance
  const calculatePerformanceScore = () => {
    const bundleScore = Math.max(0, 100 - (metrics.bundleSize - 1) * 30);
    const loadScore = Math.max(0, 100 - (metrics.loadTime - 1) * 25);
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage - 30) * 2);
    const renderScore = Math.max(0, 100 - (metrics.renderTime - 10) * 3);
    
    return Math.round((bundleScore + loadScore + memoryScore + renderScore) / 4);
  };

  const performanceScore = calculatePerformanceScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    return 'Precisa Melhorar';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bundle': return <FileText className="h-4 w-4" />;
      case 'cache': return <HardDrive className="h-4 w-4" />;
      case 'network': return <Wifi className="h-4 w-4" />;
      case 'rendering': return <Monitor className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    // Análise inicial
    analyzePerformance();
  }, [appliedOptimizations.length]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Otimização de Performance</h1>
          <p className="text-gray-600">Monitore e otimize a performance da aplicação</p>
        </div>
        <Button onClick={analyzePerformance} disabled={isAnalyzing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analisando...' : 'Analisar'}
        </Button>
      </div>

      {/* Performance Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-2xl font-bold">Score de Performance</h3>
                <p className="text-sm text-gray-600">
                  Última análise: {lastAnalysis.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </div>
              <div className={`text-lg ${getScoreColor(performanceScore)}`}>
                {getScoreLabel(performanceScore)}
              </div>
            </div>
          </div>
          <Progress value={performanceScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamanho do Bundle</p>
                <p className="text-2xl font-bold">{metrics.bundleSize.toFixed(1)} MB</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Carregamento</p>
                <p className="text-2xl font-bold">{metrics.loadTime.toFixed(1)}s</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uso de Memória</p>
                <p className="text-2xl font-bold">{metrics.memoryUsage} MB</p>
              </div>
              <Monitor className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache</p>
                <p className="text-2xl font-bold">{metrics.cacheSize.toFixed(1)} MB</p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requisições de Rede</p>
                <p className="text-2xl font-bold">{metrics.networkRequests}</p>
              </div>
              <Wifi className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Render</p>
                <p className="text-2xl font-bold">{metrics.renderTime.toFixed(1)}ms</p>
              </div>
              <Zap className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Otimizações */}
      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggestions">Sugestões de Otimização</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="suggestions" className="space-y-4">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className={suggestion.status === 'applied' ? 'border-green-200 bg-green-50/50' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getCategoryIcon(suggestion.category)}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <Badge variant={getImpactColor(suggestion.impact)}>
                            {suggestion.impact === 'high' ? 'Alto Impacto' : 
                             suggestion.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                          </Badge>
                          {suggestion.status === 'applied' && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aplicado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                      </div>
                    </div>
                    {suggestion.status === 'pending' && (
                      <Button onClick={suggestion.action} size="sm">
                        Aplicar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Limpar Cache
                </CardTitle>
                <CardDescription>
                  Remove todos os dados em cache para liberar espaço e forçar atualizações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={clearCache} variant="outline" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Relatório de Performance
                </CardTitle>
                <CardDescription>
                  Baixa um relatório detalhado das métricas de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              As otimizações aplicadas são simuladas para demonstração. Em um ambiente real, 
              estas implementariam mudanças reais no código e configuração da aplicação.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}