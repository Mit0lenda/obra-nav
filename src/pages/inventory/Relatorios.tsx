import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, FileText, PackageSearch, TrendingDown, TrendingUp } from "lucide-react";
import { useMateriais } from "@/integrations/supabase/hooks/useMateriais";
import { useMovimentacoes } from "@/integrations/supabase/hooks/useMovimentacoes";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { LoadingPlaceholder } from "@/components/shared/States";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type PeriodoType = '7dias' | '30dias' | '90dias' | 'personalizado';

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<PeriodoType>('30dias');
  const [obraFiltro, setObraFiltro] = useState<string>('todas');
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  const { data: materiais, isLoading: loadingMateriais } = useMateriais();
  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoes();
  const { data: obras } = useObras();

  if (loadingMateriais || loadingMovimentacoes) {
    return <LoadingPlaceholder />;
  }

  // Filtros por período
  const getDataInicioPeriodo = () => {
    const hoje = new Date();
    if (periodo === 'personalizado' && dataInicio) return dataInicio;
    
    const diasAtras = periodo === '7dias' ? 7 : periodo === '30dias' ? 30 : 90;
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - diasAtras);
    return inicio;
  };

  const movimentacoesFiltradas = movimentacoes?.filter((mov) => {
    const dataMovimentacao = new Date(mov.created_at);
    const inicio = getDataInicioPeriodo();
    const fim = periodo === 'personalizado' && dataFim ? dataFim : new Date();
    
    const dentroDataRange = dataMovimentacao >= inicio && dataMovimentacao <= fim;
    
    if (obraFiltro === 'todas') return dentroDataRange;
    
    const material = materiais?.find(m => m.id === mov.material_id);
    return dentroDataRange && material?.obra_id === obraFiltro;
  });

  // Cálculos de estatísticas
  const totalEntradas = movimentacoesFiltradas
    ?.filter(m => m.tipo === 'entrada')
    .reduce((acc, m) => acc + Number(m.quantidade), 0) || 0;

  const totalSaidas = movimentacoesFiltradas
    ?.filter(m => m.tipo === 'saida')
    .reduce((acc, m) => acc + Number(m.quantidade), 0) || 0;

  const valorEstoque = materiais?.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0) || 0;

  const materiaisEstoqueBaixo = materiais?.filter(m => {
    const qtd = Number(m.quantidade) || 0;
    return qtd > 0 && qtd < 10;
  }).length || 0;

  const materiaisZerados = materiais?.filter(m => Number(m.quantidade) === 0).length || 0;

  const handleExportarRelatorio = () => {
    // Implementar exportação em PDF/Excel usando jspdf ou outra lib
    const content = `
      RELATÓRIO DE ESTOQUE - ${format(new Date(), 'dd/MM/yyyy')}
      Período: ${periodo === 'personalizado' ? 
        `${dataInicio ? format(dataInicio, 'dd/MM/yyyy') : ''} a ${dataFim ? format(dataFim, 'dd/MM/yyyy') : ''}` :
        periodo
      }
      
      RESUMO:
      - Total de Entradas: ${totalEntradas}
      - Total de Saídas: ${totalSaidas}
      - Valor Total em Estoque: ${valorEstoque}
      - Materiais com Estoque Baixo: ${materiaisEstoqueBaixo}
      - Materiais Zerados: ${materiaisZerados}
      
      MOVIMENTAÇÕES:
      ${movimentacoesFiltradas?.map(m => 
        `- ${m.tipo.toUpperCase()}: ${m.quantidade} (${format(new Date(m.created_at), 'dd/MM/yyyy')})`
      ).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-estoque-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Relatórios do Estoque" 
        subtitle="Indicadores e análises de movimentação"
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === 'personalizado' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataInicio}
                        onSelect={setDataInicio}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataFim}
                        onSelect={setDataFim}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Obra</label>
              <Select value={obraFiltro} onValueChange={setObraFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Obras</SelectItem>
                  {obras?.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleExportarRelatorio} className="w-full md:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntradas}</div>
            <p className="text-xs text-muted-foreground">unidades no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSaidas}</div>
            <p className="text-xs text-muted-foreground">unidades no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
            <PackageSearch className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valorEstoque}</div>
            <p className="text-xs text-muted-foreground">unidades disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materiaisEstoqueBaixo}</div>
            <p className="text-xs text-muted-foreground">materiais &lt; 10 un.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zerados</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materiaisZerados}</div>
            <p className="text-xs text-muted-foreground">materiais sem estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
          <CardDescription>Histórico de entradas e saídas no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {movimentacoesFiltradas?.slice(0, 10).map((mov) => {
              const material = materiais?.find(m => m.id === mov.material_id);
              return (
                <div key={mov.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">{material?.nome || 'Material removido'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(mov.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {mov.motivo && (
                      <p className="text-xs text-muted-foreground">{mov.motivo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}>
                      {mov.tipo === 'entrada' ? '+' : '-'} {mov.quantidade}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
