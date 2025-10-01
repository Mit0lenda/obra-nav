import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, User, MapPin, AlertCircle, Clock } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { TaskCard } from "@/components/kanban/TaskCardNew";
import { useObraScope } from "@/app/obraScope";
import { useTasks, useCreateTask, useUpdateTask } from "@/integrations/supabase/hooks/useTasks";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { TaskTransformed, transformTask, TaskStatus, TaskPriority, TaskType } from "@/types/dto";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";
import { toast } from "sonner";

// Constantes para status das colunas
const KANBAN_COLUMNS = {
  'pendente': { title: 'A Fazer', variant: 'secondary' as const },
  'em_andamento': { title: 'Em Andamento', variant: 'default' as const },
  'concluida': { title: 'Concluído', variant: 'success' as const },
  'cancelada': { title: 'Cancelado', variant: 'destructive' as const },
};

// Interface para nova tarefa
interface NewTaskFormData {
  titulo: string;
  descricao: string;
  tipo: TaskType;
  prioridade: TaskPriority;
  obra_id: string;
  responsavel: string;
  prazo: string;
  area?: string;
  quantidade?: number;
}

// Componente de diálogo para nova tarefa
function NewTaskDialog({ taskType, onClose }: { taskType: TaskType; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: obras = [] } = useObras();
  const createTask = useCreateTask();
  const [formData, setFormData] = useState<NewTaskFormData>({
    titulo: '',
    descricao: '',
    tipo: taskType,
    prioridade: 'media',
    obra_id: '',
    responsavel: '',
    prazo: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.obra_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      await createTask.mutateAsync({
        titulo: formData.titulo,
        descricao: formData.descricao,
        tipo: formData.tipo,
        prioridade: formData.prioridade,
        status: 'pendente',
        obra_id: formData.obra_id,
        responsavel: formData.responsavel,
        prazo: formData.prazo,
        area: formData.area,
        quantidade: formData.quantidade,
      });
      
      toast.success('Tarefa criada com sucesso!');
      setOpen(false);
      onClose();
      
      // Reset form
      setFormData({
        titulo: '',
        descricao: '',
        tipo: taskType,
        prioridade: 'media',
        obra_id: '',
        responsavel: '',
        prazo: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast.error('Erro ao criar tarefa');
      console.error('Erro ao criar tarefa:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova {taskType === 'problema' ? 'Solicitação' : taskType === 'solicitacao_material' ? 'Material' : 'Tarefa'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Nova {taskType === 'problema' ? 'Solicitação de Serviço' : taskType === 'solicitacao_material' ? 'Solicitação de Material' : 'Tarefa'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título da tarefa"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva a tarefa..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="obra">Obra *</Label>
              <Select value={formData.obra_id} onValueChange={(value) => setFormData({ ...formData, obra_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(value: TaskPriority) => setFormData({ ...formData, prioridade: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
              />
            </div>

            {taskType === 'problema' && (
              <div className="col-span-2">
                <Label htmlFor="area">Área</Label>
                <Select value={formData.area} onValueChange={(value) => setFormData({ ...formData, area: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estrutural">Estrutural</SelectItem>
                    <SelectItem value="eletrica">Elétrica</SelectItem>
                    <SelectItem value="hidraulica">Hidráulica</SelectItem>
                    <SelectItem value="acabamento">Acabamento</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {taskType === 'solicitacao_material' && (
              <div className="col-span-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={formData.quantidade || ''}
                  onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                  placeholder="Quantidade necessária"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente principal do Kanban
export default function Kanban() {
  const { obra: obraScope } = useObraScope();
  const { data: tasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [activeTab, setActiveTab] = useState<TaskType>('problema');

  // Transformar dados das tasks do Supabase
  const transformedTasks = useMemo(() => {
    return tasks.map(transformTask);
  }, [tasks]);

  // Filtrar tasks por tipo e escopo
  const filteredTasks = useMemo(() => {
    return transformedTasks.filter(task => {
      const matchesType = task.tipo === activeTab;
      const matchesScope = obraScope === 'todas' || task.obra_id === obraScope;
      return matchesType && matchesScope;
    });
  }, [transformedTasks, activeTab, obraScope]);

  // Agrupar tasks por status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskTransformed[]> = {
      pendente: [],
      em_andamento: [],
      concluida: [],
      cancelada: [],
    };

    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'concluida').length;
    const inProgress = filteredTasks.filter(t => t.status === 'em_andamento').length;
    const pending = filteredTasks.filter(t => t.status === 'pendente').length;
    const highPriority = filteredTasks.filter(t => t.prioridade === 'alta').length;

    return { total, completed, inProgress, pending, highPriority };
  }, [filteredTasks]);

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const taskId = draggableId;
    const newStatus = destination.droppableId as TaskStatus;

    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
      });
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error('Erro ao atualizar task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kanban" subtitle="Gestão de tarefas e solicitações" />
        <LoadingPlaceholder rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kanban" 
        subtitle={`Gestão de tarefas e solicitações ${obraScope !== 'todas' ? `(${obraScope})` : ''}`}
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por tipo de tarefa */}
      <Tabs value={activeTab} onValueChange={(value: TaskType) => setActiveTab(value)}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="problema">Problemas/Serviços</TabsTrigger>
            <TabsTrigger value="solicitacao_material">Materiais</TabsTrigger>
            <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
          </TabsList>
          <NewTaskDialog taskType={activeTab} onClose={() => {}} />
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(KANBAN_COLUMNS).map(([status, config]) => (
                <div key={status} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{config.title}</h3>
                      <Badge variant={config.variant}>
                        {tasksByStatus[status as TaskStatus].length}
                      </Badge>
                    </div>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                          snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        {tasksByStatus[status as TaskStatus].map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${snapshot.isDragging ? 'rotate-3 shadow-lg' : ''}`}
                              >
                                <TaskCard task={task} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {tasksByStatus[status as TaskStatus].length === 0 && (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            Nenhuma tarefa
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </TabsContent>
      </Tabs>
    </div>
  );
}