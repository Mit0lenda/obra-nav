import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  CheckSquare, 
  Package, 
  MapPin,
  Plus,
  Eye,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useObras } from '@/integrations/supabase/hooks/useObras';
import { useTasks } from '@/integrations/supabase/hooks/useTasks';
import { transformObra, transformTask } from '@/types/dto';

export default function DashboardHome() {
  const { data: obras = [], isLoading: loadingObras } = useObras();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();

  // Transformar dados
  const transformedObras = obras.map(transformObra);
  const transformedTasks = tasks.map(transformTask);

  // Calcular estatísticas
  const stats = {
    totalProjetos: transformedObras.length,
    projetosAtivos: transformedObras.filter(o => 
      o.status === 'Em andamento' || o.status === 'em_andamento'
    ).length,
    totalTarefas: transformedTasks.length,
    tarefasConcluidas: transformedTasks.filter(t => t.status === 'concluida').length,
    tarefasPendentes: transformedTasks.filter(t => 
      t.status === 'pendente' || t.status === 'em_andamento'
    ).length,
    progressoMedio: transformedObras.length > 0 
      ? transformedObras.reduce((acc, obra) => acc + (obra.progresso || 0), 0) / transformedObras.length
      : 0
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
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
          <h1 className="text-3xl font-bold">Painel de Controle</h1>
          <p className="text-gray-600">
            Bem-vindo ao ObraNav - Sistema de Gestão de Obras
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projetos</p>
                <p className="text-3xl font-bold">{formatNumber(stats.totalProjetos)}</p>
                <p className="text-sm text-green-600">
                  {formatNumber(stats.projetosAtivos)} ativos
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tarefas</p>
                <p className="text-3xl font-bold">{formatNumber(stats.totalTarefas)}</p>
                <p className="text-sm text-green-600">
                  {formatNumber(stats.tarefasConcluidas)} concluídas
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
                <p className="text-3xl font-bold">{stats.progressoMedio.toFixed(0)}%</p>
                <p className="text-sm text-blue-600">média dos projetos</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-3xl font-bold">{formatNumber(stats.tarefasPendentes)}</p>
                <p className="text-sm text-orange-600">tarefas em aberto</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projetos Ativos</CardTitle>
              <CardDescription>
                Seus projetos em andamento
              </CardDescription>
            </div>
            <Link to="/projects">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {transformedObras.slice(0, 4).map((obra) => {
              const projectTasks = transformedTasks.filter(t => t.obra_id === obra.id);
              const completedTasks = projectTasks.filter(t => t.status === 'concluida').length;
              const totalProjectTasks = projectTasks.length;
              const taskProgress = totalProjectTasks > 0 ? (completedTasks / totalProjectTasks) * 100 : 0;

              return (
                <div key={obra.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{obra.nome}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {obra.endereco || 'Endereço não informado'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={taskProgress} className="w-32 h-2" />
                      <span className="text-sm text-gray-600">
                        {taskProgress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {completedTasks}/{totalProjectTasks} tarefas
                    </Badge>
                    <Link to={`/projects`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
            
            {transformedObras.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum projeto encontrado</p>
                <Link to="/projects">
                  <Button className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Projeto
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link to="/projects">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Building className="h-6 w-6" />
                <span>Novo Projeto</span>
              </Button>
            </Link>
            
            <Link to="/kanban">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <CheckSquare className="h-6 w-6" />
                <span>Kanban</span>
              </Button>
            </Link>
            
            <Link to="/estoque">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Estoque</span>
              </Button>
            </Link>
            
            <Link to="/map">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <MapPin className="h-6 w-6" />
                <span>Mapa</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Tarefas Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tarefas Recentes</CardTitle>
            <CardDescription>
              Últimas atividades do sistema
            </CardDescription>
          </div>
          <Link to="/kanban">
            <Button size="sm">Ver Todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transformedTasks.length > 0 ? (
            <div className="space-y-3">
              {transformedTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{task.titulo}</h4>
                    <p className="text-sm text-gray-600">{task.descricao || 'Sem descrição'}</p>
                    <div className="flex items-center gap-2">
                      {task.responsavel && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          {task.responsavel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        task.status === 'concluida' ? 'default' :
                        task.status === 'em_andamento' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {task.status === 'concluida' ? 'Concluída' :
                       task.status === 'em_andamento' ? 'Em Andamento' :
                       task.status === 'pendente' ? 'Pendente' : 'Cancelada'}
                    </Badge>
                    <Badge variant="outline">
                      {task.prioridade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma tarefa encontrada</p>
              <Link to="/kanban">
                <Button className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primera Tarefa
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}