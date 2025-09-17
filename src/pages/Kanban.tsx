import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/integrations/supabase/hooks/useTasks";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import { useObraScope } from "@/app/obraScope";
import { LoadingPlaceholder } from "@/components/shared/States";
import { toast } from "sonner";

// Tipos
type BaseTask = {
  id: number;
  status: string;
  priority: string;
  obra: string;
  solicitado: string;
  prazo: string;
  respo: string;
  descricao: string;
};

type ServiceTask = BaseTask & {
  tipo: 'servico';
  area: string;
};

type MaterialTask = BaseTask & {
  tipo: 'material';
  recebido: string;
  qtd: string;
};

type Task = ServiceTask | MaterialTask;
type KanbanTab = 'general' | 'materials';

interface NewTaskData {
  descricao: string;
  priority: string;
  obra: string;
  solicitado: string;
  prazo: string;
  respo: string;
  tipo: 'servico' | 'material';
  area?: string;
  qtd?: string;
}

// Mock Data
const mockGeneralTasks: Task[] = [
  { 
    id: 1,
    tipo: 'servico',
    status: "A FAZER",
    priority: "crítico",
    obra: "Edifício Central",
    solicitado: "Eng. João Silva",
    prazo: "2025-08-28",
    respo: "Mestre Carlos",
    area: "Hidráulica",
    descricao: "Vazamento identificado na tubulação principal do 5º andar."
  },
  { 
    id: 2,
    tipo: 'servico',
    status: "EM ANDAMENTO",
    priority: "alta",
    obra: "Residencial Vista Verde",
    solicitado: "Arq. Marina Costa",
    prazo: "2025-08-29",
    respo: "Eng. Pedro Santos",
    area: "Estrutural",
    descricao: "Reforço estrutural nas vigas do térreo após identificação de fissuras."
  }
];

const mockMaterialTasks: Task[] = [
  { 
    id: 1,
    tipo: 'material',
    status: "A FAZER",
    priority: "crítico",
    obra: "Edifício Central",
    solicitado: "Eng. João Silva",
    prazo: "2025-08-27",
    respo: "Ana Suprimentos",
    recebido: "",
    qtd: "50 metros",
    descricao: "Tubo PVC 100mm Classe A"
  }
];

// Componente de Diálogo para Nova Tarefa
function NewTaskDialog({ onSubmit, taskType }: { onSubmit: (data: NewTaskData) => void, taskType: 'servico' | 'material' }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<NewTaskData>({
    descricao: '',
    priority: 'média',
    obra: '',
    solicitado: '',
    prazo: new Date().toISOString().split('T')[0],
    respo: '',
    tipo: taskType,
    ...(taskType === 'servico' ? { area: '' } : { qtd: '' })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
          + Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova tarefa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... resto do formulário ... */}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente Principal
export default function Kanban() {
  const [activeTab, setActiveTab] = useState<KanbanTab>('general');
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks();
  const { data: obras = [], isLoading: loadingObras } = useObras();
  const { obra: obraScope } = useObraScope();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Convert Supabase tasks to component format
  const supabaseTasks = allTasks.map(task => ({
    id: parseInt(task.id?.replace(/-/g, '').substring(0, 8), 16) || Math.random(),
    tipo: task.tipo as 'servico' | 'material',
    status: task.status || 'A FAZER',
    priority: task.prioridade || 'média',
    obra: task.obras?.nome || '',
    solicitado: task.solicitante || '',
    prazo: task.prazo ? new Date(task.prazo).toISOString().split('T')[0] : '',
    respo: task.responsavel || '',
    area: task.area || '',
    descricao: task.descricao || '',
    qtd: task.quantidade?.toString() || '',
    recebido: ''
  }));

  const generalTasks = supabaseTasks.filter(t => t.tipo === 'servico');
  const materialTasks = supabaseTasks.filter(t => t.tipo === 'material');
  
  const [activeObra, setActiveObra] = useState(obraScope !== "todas" ? obraScope : "Todas as obras");

  useEffect(() => {
    if (obraScope !== "todas") {
      setActiveObra(obraScope);
    }
  }, [obraScope]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const tasks = activeTab === 'general' ? generalTasks : materialTasks;
    const sourceColumn = tasks.filter(t => t.status === source.droppableId);
    const draggedTask = sourceColumn[source.index];
    
    if (draggedTask) {
      const originalTask = allTasks.find(t => 
        parseInt(t.id?.replace(/-/g, '').substring(0, 8), 16) === draggedTask.id
      );
      
      if (originalTask) {
        try {
          await updateTask.mutateAsync({
            id: originalTask.id,
            status: destination.droppableId
          });
          toast.success("Status da tarefa atualizado");
        } catch (error) {
          toast.error("Erro ao atualizar tarefa");
        }
      }
    }
  };

  const moveTask = async (taskId: number, newStatus: string) => {
    const originalTask = allTasks.find(t => 
      parseInt(t.id?.replace(/-/g, '').substring(0, 8), 16) === taskId
    );
    
    if (originalTask) {
      try {
        await updateTask.mutateAsync({ id: originalTask.id, status: newStatus });
        toast.success("Status atualizado");
      } catch (error) {
        toast.error("Erro ao atualizar status");
      }
    }
  };

  const editTask = async (taskId: number, updatedData: Partial<Task>) => {
    const originalTask = allTasks.find(t => 
      parseInt(t.id?.replace(/-/g, '').substring(0, 8), 16) === taskId
    );
    
    if (originalTask) {
      try {
        await updateTask.mutateAsync({
          id: originalTask.id,
          titulo: updatedData.descricao,
          descricao: updatedData.descricao,
          prioridade: updatedData.priority,
          area: updatedData.area
        });
        toast.success("Tarefa atualizada");
      } catch (error) {
        toast.error("Erro ao atualizar tarefa");
      }
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const originalTask = allTasks.find(t => 
      parseInt(t.id?.replace(/-/g, '').substring(0, 8), 16) === taskId
    );
    
    if (originalTask) {
      try {
        await deleteTask.mutateAsync(originalTask.id);
        toast.success("Tarefa removida");
      } catch (error) {
        toast.error("Erro ao remover tarefa");
      }
    }
  };

  const filteredTasks = (activeTab === 'general' ? generalTasks : materialTasks)
    .filter(task => {
      if (activeObra === 'Todas as obras') return true;
      return task.obra === activeObra;
    });

  const columns: Record<string, Task[]> = {
    'A FAZER': filteredTasks.filter(t => t.status === 'A FAZER'),
    'EM ANDAMENTO': filteredTasks.filter(t => t.status === 'EM ANDAMENTO'),
    'EM ANÁLISE': filteredTasks.filter(t => t.status === 'EM ANÁLISE'),
    'CONCLUÍDO': filteredTasks.filter(t => t.status === 'CONCLUÍDO')
  };

  const getColumnHeaderColor = (status: string) => {
    switch (status) {
      case 'A FAZER': return 'border-l-4 border-l-orange-500';
      case 'EM ANDAMENTO': return 'border-l-4 border-l-blue-500';
      case 'EM ANÁLISE': return 'border-l-4 border-l-purple-500';
      case 'CONCLUÍDO': return 'border-l-4 border-l-green-500';
      default: return '';
    }
  };

  if (loadingTasks || loadingObras) {
    return <LoadingPlaceholder rows={4} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button 
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'general' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              KANBAN GERAL
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'materials' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('materials')}
            >
              REQUISIÇÃO DE MATERIAIS
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {activeTab === 'general' ? 'Kanban Geral' : 'Requisição de Materiais'}
              </h1>
              <NewTaskDialog 
                taskType={activeTab === 'general' ? 'servico' : 'material'}
                onSubmit={async (data) => {
                  const obra = obras.find(o => o.nome === data.obra);
                  if (!obra) {
                    toast.error("Obra não encontrada");
                    return;
                  }
                  
                  try {
                    await createTask.mutateAsync({
                      titulo: data.descricao,
                      descricao: data.descricao,
                      tipo: data.tipo,
                      status: 'A FAZER',
                      prioridade: data.priority,
                      area: data.area,
                      obra_id: obra.id,
                      prazo: data.prazo ? new Date(data.prazo).toISOString() : null,
                      quantidade: data.qtd ? parseFloat(data.qtd) : null
                    });
                    toast.success("Tarefa criada com sucesso");
                  } catch (error) {
                    toast.error("Erro ao criar tarefa");
                  }
                }}
              />
            </div>
            {/* Filters */}
            <div className="mt-4 flex gap-4 flex-wrap">
              <Select value={activeObra} onValueChange={setActiveObra}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas as obras">Todas as obras</SelectItem>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.nome}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-full overflow-x-auto">
            {(['A FAZER', 'EM ANDAMENTO', 'EM ANÁLISE', 'CONCLUÍDO'] as const).map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-white rounded-lg shadow-sm ${getColumnHeaderColor(status)} ${
                      snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                    } min-h-[200px] flex flex-col transition-colors duration-200 ease-in-out`}
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900">{status}</h2>
                        <Badge variant="outline" className="text-xs">
                          {columns[status].length}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                      {columns[status].length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 h-full min-h-[200px] flex items-center justify-center">
                          <p className="text-sm text-center text-gray-500">
                            Sem itens
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 min-w-[250px]">
                          {columns[status].map((task, index) => (
                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.95 : 1,
                                    transform: `${provided.draggableProps.style?.transform || ''} ${snapshot.isDragging ? 'rotate(2deg)' : ''}`,
                                    zIndex: snapshot.isDragging ? 100 : 1,
                                    transformOrigin: 'center',
                                    boxShadow: snapshot.isDragging ? '0 10px 20px rgba(0, 0, 0, 0.1)' : 'none',
                                    transition: snapshot.isDragging ? 'none' : 'all 0.2s ease'
                                  }}
                                  className={`${
                                    snapshot.isDragging 
                                      ? 'shadow-lg ring-2 ring-blue-200 bg-white' 
                                      : 'transition-all duration-200'
                                  } rounded-lg`}
                                >
                                  <KanbanCard
                                    task={task}
                                    status={status}
                                    onMove={moveTask}
                                    onEdit={editTask}
                                    onDelete={handleDeleteTask}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
