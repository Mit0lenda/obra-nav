import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  BarChart3, 
  FileSpreadsheet,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useObras } from '@/integrations/supabase/hooks/useObras';
import { useTasks } from '@/integrations/supabase/hooks/useTasks';
import { generateProjectReport, generateTaskReport, downloadPDF } from '@/lib/pdf-generator';
import { transformObra, transformTask, type TaskTransformed, type ObraTransformed } from '@/types/dto';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  sections: string[];
  type: 'project' | 'task' | 'performance' | 'inventory';
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'project-summary',
    name: 'Relatório de Projeto',
    description: 'Visão geral completa do projeto incluindo tarefas, progresso e estatísticas',
    icon: <FileText className="h-6 w-6" />,
    sections: ['Informações do Projeto', 'Estatísticas', 'Tarefas', 'Timeline'],
    type: 'project'
  },
  {
    id: 'task-report',
    name: 'Relatório de Tarefas',
    description: 'Lista detalhada de todas as tarefas filtradas por status, prioridade ou responsável',
    icon: <CheckCircle className="h-6 w-6" />,
    sections: ['Lista de Tarefas', 'Distribuição por Status', 'Responsáveis'],
    type: 'task'
  },
  {
    id: 'performance-report',
    name: 'Relatório de Performance',
    description: 'Análise de produtividade, prazos e eficiência da equipe',
    icon: <BarChart3 className="h-6 w-6" />,
    sections: ['Métricas de Performance', 'Tendências', 'Comparativos'],
    type: 'performance'
  },
  {
    id: 'inventory-report',
    name: 'Relatório de Estoque',
    description: 'Status do inventário, movimentações e necessidades de reposição',
    icon: <FileSpreadsheet className="h-6 w-6" />,
    sections: ['Status do Estoque', 'Movimentações', 'Alertas'],
    type: 'inventory'
  }
];

export default function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [selectedObraId, setSelectedObraId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string;
    name: string;
    template: string;
    date: Date;
    size: string;
  }>>([]);

  // Filter states
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [responsavelFilter, setResponsavelFilter] = useState('');
  const [includeSections, setIncludeSections] = useState<string[]>([]);

  const { data: obras = [] } = useObras();
  const { data: tasks = [] } = useTasks();

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIncludeSections(template.sections);
  };

  const handleSectionToggle = (section: string, checked: boolean) => {
    if (checked) {
      setIncludeSections(prev => [...prev, section]);
    } else {
      setIncludeSections(prev => prev.filter(s => s !== section));
    }
  };

  const generateReport = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    try {
      let blob: Blob;
      let filename: string;

      if (selectedTemplate.type === 'project' && selectedObraId) {
        const obra = obras.find(o => o.id === selectedObraId);
        if (obra) {
          const obraTransformed = transformObra(obra);
          const obraTasks = tasks
            .filter(t => t.obra_id === selectedObraId)
            .map(transformTask);
          
          blob = await generateProjectReport(obraTransformed, obraTasks);
          filename = `relatorio-projeto-${obra.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
        } else {
          throw new Error('Projeto não encontrado');
        }
      } else if (selectedTemplate.type === 'task') {
        let filteredTasks = tasks.map(transformTask);
        
        // Aplicar filtros
        if (selectedObraId) {
          filteredTasks = filteredTasks.filter(t => t.obra_id === selectedObraId);
        }
        if (statusFilter.length > 0) {
          filteredTasks = filteredTasks.filter(t => statusFilter.includes(t.status));
        }
        if (responsavelFilter) {
          filteredTasks = filteredTasks.filter(t => 
            t.responsavel?.toLowerCase().includes(responsavelFilter.toLowerCase())
          );
        }
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          filteredTasks = filteredTasks.filter(t => {
            const taskDate = new Date(t.data_criacao);
            return taskDate >= startDate && taskDate <= endDate;
          });
        }

        blob = await generateTaskReport(filteredTasks, selectedTemplate.name);
        filename = `relatorio-tarefas-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        // Para outros tipos de relatório, gerar um básico
        blob = await generateTaskReport(tasks.map(transformTask), selectedTemplate.name);
        filename = `relatorio-${selectedTemplate.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      // Simular salvamento do relatório gerado
      const newReport = {
        id: `report-${Date.now()}`,
        name: selectedTemplate.name,
        template: selectedTemplate.id,
        date: new Date(),
        size: `${(blob.size / 1024).toFixed(0)} KB`
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);

      // Download do PDF
      downloadPDF(blob, filename);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-gray-600">Gere relatórios personalizados em PDF</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates de Relatório */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Templates Disponíveis</CardTitle>
              <CardDescription>
                Selecione um template para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-1">
                        {template.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.sections.map((section) => (
                            <Badge key={section} variant="secondary" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Configuração do Relatório */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurar Relatório
              </CardTitle>
              <CardDescription>
                {selectedTemplate 
                  ? `Configure as opções para: ${selectedTemplate.name}`
                  : 'Selecione um template para configurar'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-6">
                  {/* Filtros Gerais */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Filtros</h4>
                    
                    {/* Seleção de Obra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Projeto</Label>
                        <Select value={selectedObraId} onValueChange={setSelectedObraId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um projeto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os projetos</SelectItem>
                            {obras.map((obra) => (
                              <SelectItem key={obra.id} value={obra.id}>
                                {obra.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Input
                          placeholder="Filtrar por responsável"
                          value={responsavelFilter}
                          onChange={(e) => setResponsavelFilter(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Período */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Inicial</Label>
                        <Input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Final</Label>
                        <Input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Status (para relatórios de tarefas) */}
                    {selectedTemplate.type === 'task' && (
                      <div className="space-y-2">
                        <Label>Status das Tarefas</Label>
                        <div className="flex flex-wrap gap-3">
                          {['pendente', 'em_andamento', 'concluida', 'cancelada'].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={status}
                                checked={statusFilter.includes(status)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setStatusFilter(prev => [...prev, status]);
                                  } else {
                                    setStatusFilter(prev => prev.filter(s => s !== status));
                                  }
                                }}
                              />
                              <Label htmlFor={status} className="text-sm capitalize">
                                {status.replace('_', ' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seções a Incluir */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Seções a Incluir</h4>
                    <div className="space-y-2">
                      {selectedTemplate.sections.map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <Checkbox
                            id={section}
                            checked={includeSections.includes(section)}
                            onCheckedChange={(checked) => handleSectionToggle(section, checked as boolean)}
                          />
                          <Label htmlFor={section} className="text-sm">
                            {section}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botão de Geração */}
                  <div className="pt-4">
                    <Button 
                      onClick={generateReport}
                      disabled={isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Gerando Relatório...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Gerar e Baixar PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Selecione um template à esquerda para começar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Relatórios Gerados Recentemente */}
          {generatedReports.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Relatórios Gerados Recentemente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedReports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-gray-600">
                            {report.date.toLocaleDateString('pt-BR')} • {report.size}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{report.template}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}