import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Construction, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useObras } from '@/integrations/supabase/hooks/useObras';
import { useTasks } from '@/integrations/supabase/hooks/useTasks';
import { LoadingPlaceholder } from '@/components/shared/States';

export default function ObrasEmAndamento() {
  const { data: obras = [], isLoading } = useObras();
  const { data: tasks = [] } = useTasks();
  const [filtro, setFiltro] = useState<'todas' | 'atrasadas' | 'em_dia'>('todas');

  // Calculate progress based on tasks
  const obrasWithProgress = useMemo(() => {
    return obras.map(obra => {
      const obraTasks = tasks.filter(task => task.obra_id === obra.id);
      const completedTasks = obraTasks.filter(task => task.status === 'CONCLUÍDA').length;
      const progresso = obraTasks.length > 0 ? Math.round((completedTasks / obraTasks.length) * 100) : 0;
      
      // Calculate pending tasks
      const pendencias = obraTasks.filter(task => 
        task.status === 'A FAZER' && 
        task.prazo && 
        new Date(task.prazo) < new Date()
      ).length;
      
      // Determine status
      let status: 'em_andamento' | 'concluida' | 'atrasada' = 'em_andamento';
      if (progresso === 100) {
        status = 'concluida';
      } else if (pendencias > 0 || (obra.previsao_conclusao && new Date(obra.previsao_conclusao) < new Date())) {
        status = 'atrasada';
      }
      
      return {
        ...obra,
        progresso,
        status,
        pendencias
      };
    });
  }, [obras, tasks]);

  const obrasFiltered = obrasWithProgress.filter(obra => {
    if (filtro === 'todas') return true;
    if (filtro === 'atrasadas') return obra.status === 'atrasada';
    return obra.status === 'em_andamento';
  });

  const getStatusBadge = (status: 'em_andamento' | 'concluida' | 'atrasada') => {
    switch (status) {
      case 'em_andamento':
        return <Badge variant="default"><Construction className="mr-1 h-3 w-3" /> Em Andamento</Badge>;
      case 'atrasada':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Atrasada</Badge>;
      case 'concluida':
        return <Badge variant="default"><CheckCircle2 className="mr-1 h-3 w-3" /> Concluída</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Obras em Andamento"
          subtitle="Listagem de obras com status e progresso"
        />
        <LoadingPlaceholder rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obras em Andamento"
        subtitle="Listagem de obras com status e progresso"
      />

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total de Obras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obrasWithProgress.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Obras Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {obrasWithProgress.filter(o => o.status === 'atrasada').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pendências Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {obrasWithProgress.reduce((acc, obra) => acc + obra.pendencias, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button 
          variant={filtro === 'todas' ? 'default' : 'outline'}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </Button>
        <Button
          variant={filtro === 'atrasadas' ? 'default' : 'outline'}
          onClick={() => setFiltro('atrasadas')}
        >
          Atrasadas
        </Button>
        <Button
          variant={filtro === 'em_dia' ? 'default' : 'outline'}
          onClick={() => setFiltro('em_dia')}
        >
          Em Dia
        </Button>
      </div>

      {/* Tabela de Obras */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Previsão</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Pendências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obrasFiltered.map((obra) => (
                <TableRow key={obra.id}>
                  <TableCell className="font-medium">{obra.nome}</TableCell>
                  <TableCell>{getStatusBadge(obra.status)}</TableCell>
                  <TableCell>
                    <div className="w-[100px]">
                      <Progress value={obra.progresso} className="h-2" />
                      <span className="text-xs text-muted-foreground mt-1">
                        {obra.progresso}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{obra.previsao_conclusao ? new Date(obra.previsao_conclusao).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{obra.responsavel || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={obra.pendencias > 0 ? "warning" : "success"}>
                      {obra.pendencias}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
