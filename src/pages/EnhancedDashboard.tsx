import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  FileText,
  Zap
} from 'lucide-react';
import { useObras } from '@/integrations/supabase/hooks/useObras';
import { useTasks } from '@/integrations/supabase/hooks/useTasks';
import { transformObra, transformTask } from '@/types/dto';

interface DashboardStats {
  totalObras: number;
  obrasAtivas: number;
  totalTarefas: number;
  tarefasConcluidas: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  progressoMedio: number;
  tendenciaProgresso: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: 'task_completed' | 'project_created' | 'task_assigned' | 'milestone_reached';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

interface ProjectAlert {
  id: string;
  type: 'deadline' | 'budget' | 'resource' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  projectName: string;
  daysLeft?: number;
}

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalObras: 0,
    obrasAtivas: 0,
    totalTarefas: 0,
    tarefasConcluidas: 0,
    tarefasPendentes: 0,
    tarefasAtrasadas: 0,
    progressoMedio: 0,
    tendenciaProgresso: 'stable'
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [projectAlerts, setProjectAlerts] = useState<ProjectAlert[]>([]);

  const { data: obras = [], isLoading: loadingObras } = useObras();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();

  // Calcular estatísticas
  useEffect(() => {
    if (obras.length > 0 || tasks.length > 0) {
      const transformedObras = obras.map(transformObra);
      const transformedTasks = tasks.map(transformTask);

      const obrasAtivas = transformedObras.filter(obra => 
        obra.status === 'Em andamento' || obra.status === 'em_andamento'
      ).length;

      const tarefasConcluidas = transformedTasks.filter(task => task.status === 'concluida').length;
      const tarefasPendentes = transformedTasks.filter(task => task.status === 'pendente').length;
      const tarefasEmAndamento = transformedTasks.filter(task => task.status === 'em_andamento').length;

      // Simular tarefas atrasadas baseado no prazo
      const hoje = new Date();
      const tarefasAtrasadas = transformedTasks.filter(task => {
        if (task.prazo && task.status !== 'concluida') {
          return new Date(task.prazo) < hoje;
        }
        return false;
      }).length;

      // Calcular progresso médio dos projetos
      const progressoMedio = transformedObras.length > 0 
        ? transformedObras.reduce((acc, obra) => acc + (obra.progresso || 0), 0) / transformedObras.length
        : 0;

      // Simular tendência (seria calculada com dados históricos)
      const tendenciaProgresso: 'up' | 'down' | 'stable' = 
        progressoMedio > 70 ? 'up' : progressoMedio < 30 ? 'down' : 'stable';

      setStats({
        totalObras: transformedObras.length,
        obrasAtivas,
        totalTarefas: transformedTasks.length,
        tarefasConcluidas,
        tarefasPendentes: tarefasPendentes + tarefasEmAndamento,
        tarefasAtrasadas,
        progressoMedio,
        tendenciaProgresso
      });

      // Gerar atividades recentes simuladas
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'task_completed',
          title: 'Tarefa Concluída',
          description: 'Instalação elétrica finalizada',
          time: '2 horas atrás',
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600'
        },
        {
          id: '2',
          type: 'project_created',
          title: 'Novo Projeto',
          description: transformedObras[0]?.nome || 'Projeto criado',
          time: '1 dia atrás',
          icon: <Briefcase className="h-4 w-4" />,
          color: 'text-blue-600'
        },
        {
          id: '3',
          type: 'task_assigned',
          title: 'Tarefa Atribuída',
          description: 'Revisão de estrutura atribuída',
          time: '2 dias atrás',
          icon: <Users className="h-4 w-4" />,
          color: 'text-purple-600'
        },
        {
          id: '4',
          type: 'milestone_reached',
          title: 'Marco Atingido',
          description: 'Fundação 100% concluída',
          time: '3 dias atrás',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-orange-600'
        }
      ];
      setRecentActivities(activities);

      // Gerar alertas simulados
      const alerts: ProjectAlert[] = [
        {
          id: '1',
          type: 'deadline',
          severity: 'high',
          title: 'Prazo Próximo',
          description: 'Entrega prevista para próxima semana',
          projectName: transformedObras[0]?.nome || 'Projeto A',
          daysLeft: 5
        },
        {
          id: '2',
          type: 'resource',
          severity: 'medium',
          title: 'Material em Falta',
          description: 'Estoque de cimento baixo',
          projectName: transformedObras[1]?.nome || 'Projeto B'
        }
      ];
      setProjectAlerts(alerts);
    }
  }, [obras, tasks]);

  const getSeverityColor = (severity: ProjectAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: ProjectAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high': 
        return <AlertTriangle className="h-4 w-4" />;
      default: 
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loadingObras || loadingTasks) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-gray-600">Visão geral completa dos projetos e atividades</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
                <p className="text-3xl font-bold">{formatNumber(stats.totalObras)}</p>
                <p className="text-sm text-gray-600">
                  {formatNumber(stats.obrasAtivas)} ativos
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                <p className="text-3xl font-bold">{formatNumber(stats.totalTarefas)}</p>
                <p className="text-sm text-green-600">
                  {formatNumber(stats.tarefasConcluidas)} concluídas
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progresso Médio</p>
                <p className="text-3xl font-bold">{formatPercentage(stats.progressoMedio)}</p>
                <div className="flex items-center gap-1">
                  {stats.tendenciaProgresso === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : stats.tendenciaProgresso === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <span className="h-4 w-4" />
                  )}
                  <span className="text-sm text-gray-600">dos projetos</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tarefas Pendentes</p>
                <p className="text-3xl font-bold">{formatNumber(stats.tarefasPendentes)}</p>
                <p className="text-sm text-red-600">
                  {formatNumber(stats.tarefasAtrasadas)} atrasadas
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progresso dos Projetos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Projetos em Andamento</CardTitle>
              <CardDescription>
                Status e progresso dos principais projetos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {obras.slice(0, 5).map((obra) => {
                const transformed = transformObra(obra);
                const projectTasks = tasks.filter(t => t.obra_id === obra.id);
                const completedTasks = projectTasks.filter(t => t.status === 'concluida').length;
                const totalProjectTasks = projectTasks.length;
                const taskProgress = totalProjectTasks > 0 ? (completedTasks / totalProjectTasks) * 100 : 0;

                return (
                  <div key={obra.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{transformed.nome}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {transformed.endereco || 'Endereço não informado'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {transformed.responsavel || 'Sem responsável'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatPercentage(taskProgress)}</div>
                        <div className="text-sm text-gray-600">
                          {completedTasks}/{totalProjectTasks} tarefas
                        </div>
                      </div>
                    </div>
                    <Progress value={taskProgress} className="h-2" />
                  </div>
                );
              })}
              
              {obras.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum projeto encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas atualizações dos projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertas e Notificações */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="text-orange-600 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                      <p className="text-xs text-gray-500">
                        Projeto: {alert.projectName}
                        {alert.daysLeft && ` • ${alert.daysLeft} dias restantes`}
                      </p>
                    </div>
                  </div>
                ))}
                
                {projectAlerts.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">Nenhum alerta no momento</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Briefcase className="h-6 w-6" />
              <span className="text-sm">Novo Projeto</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <CheckCircle className="h-6 w-6" />
              <span className="text-sm">Nova Tarefa</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Relatório</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <MapPin className="h-6 w-6" />
              <span className="text-sm">Ver Mapa</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}