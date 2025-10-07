import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { useObras } from '@/integrations/supabase/hooks/useObras';
import { useTasks } from '@/integrations/supabase/hooks/useTasks';
import { useMateriais } from '@/integrations/supabase/hooks/useMateriais';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Package, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportObrasToCSV, exportTasksToCSV, exportMateriaisToCSV } from '@/lib/data-export';
import { Download } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

export default function AdvancedReports() {
  const { data: obras = [] } = useObras();
  const { data: tasks = [] } = useTasks();
  const { data: materiais = [] } = useMateriais();

  // Dados para gráfico de status de obras
  const obrasStatusData = [
    { name: 'Planejamento', value: obras.filter(o => o.status === 'planejamento').length },
    { name: 'Em Andamento', value: obras.filter(o => o.status === 'em_andamento').length },
    { name: 'Concluída', value: obras.filter(o => o.status === 'concluida').length },
    { name: 'Pausada', value: obras.filter(o => o.status === 'pausada').length },
  ].filter(item => item.value > 0);

  // Dados para gráfico de tarefas por status
  const tasksStatusData = [
    { name: 'Pendente', value: tasks.filter(t => t.status === 'pendente').length },
    { name: 'Em Progresso', value: tasks.filter(t => t.status === 'em_progresso').length },
    { name: 'Concluída', value: tasks.filter(t => t.status === 'concluida').length },
    { name: 'Cancelada', value: tasks.filter(t => t.status === 'cancelada').length },
  ].filter(item => item.value > 0);

  // Dados para gráfico de progresso de obras
  const progressData = obras
    .filter(o => o.progresso !== null)
    .map(o => ({
      nome: o.nome.length > 15 ? o.nome.substring(0, 15) + '...' : o.nome,
      progresso: o.progresso || 0,
    }))
    .sort((a, b) => (b.progresso || 0) - (a.progresso || 0))
    .slice(0, 10);

  // Dados para gráfico de materiais com estoque baixo
  const estoqueBaixoData = materiais
    .filter(m => (m.quantidade || 0) < 10)
    .map(m => ({
      nome: m.nome.length > 20 ? m.nome.substring(0, 20) + '...' : m.nome,
      quantidade: m.quantidade || 0,
    }))
    .sort((a, b) => a.quantidade - b.quantidade)
    .slice(0, 10);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground">Análise detalhada e visualização de dados do sistema</p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div />
        <div className="flex gap-2">
          <Button onClick={() => exportObrasToCSV(obras)} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Obras
          </Button>
          <Button onClick={() => exportTasksToCSV(tasks)} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Tarefas
          </Button>
          <Button onClick={() => exportMateriaisToCSV(materiais)} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Materiais
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status de Obras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status das Obras
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={obrasStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {obrasStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status de Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Status das Tarefas
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tasksStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#82ca9d"
                  dataKey="value"
                >
                  {tasksStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progresso das Obras */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progresso das Obras (Top 10)
            </CardTitle>
            <CardDescription>Obras com maior progresso</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="progresso" fill="hsl(var(--primary))" name="Progresso (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Materiais com Estoque Baixo */}
        {estoqueBaixoData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-destructive" />
                Materiais com Estoque Baixo
              </CardTitle>
              <CardDescription>Materiais que precisam de reposição (quantidade {'<'} 10)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estoqueBaixoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" fill="hsl(var(--destructive))" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
