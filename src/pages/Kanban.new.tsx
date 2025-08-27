import { useState } from "react";
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
  // ... outros mockGeneralTasks
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
  },
  // ... outros mockMaterialTasks
];

// Componentes
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova tarefa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente Principal
export default function Kanban() {
  const [activeTab, setActiveTab] = useState<KanbanTab>('general');
  const [generalTasks, setGeneralTasks] = useState<Task[]>(mockGeneralTasks);
  const [materialTasks, setMaterialTasks] = useState<Task[]>(mockMaterialTasks);
  const [activeObra, setActiveObra] = useState("Edifício Central");

  const moveTask = (taskId: number, newStatus: string) => {
    const setTasks = activeTab === 'general' ? setGeneralTasks : setMaterialTasks;
    setTasks(tasks => tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const filteredTasks = (activeTab === 'general' ? generalTasks : materialTasks)
    .filter(task => activeObra === 'Todas as obras' || task.obra === activeObra);

  const columns: Record<string, Task[]> = {
    'A FAZER': filteredTasks.filter(t => t.status === 'A FAZER'),
    'EM ANDAMENTO': filteredTasks.filter(t => t.status === 'EM ANDAMENTO'),
    'EM ANÁLISE': filteredTasks.filter(t => t.status === 'EM ANÁLISE'),
    'CONCLUÍDO': filteredTasks.filter(t => t.status === 'CONCLUÍDO')
  };

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
                onSubmit={(data) => {
                  const tasks = activeTab === 'general' ? generalTasks : materialTasks;
                  const nextId = Math.max(...tasks.map(t => t.id)) + 1;
                  const newTask = {
                    id: nextId,
                    status: 'A FAZER',
                    ...data
                  };
                  
                  if (activeTab === 'general') {
                    setGeneralTasks(prev => [...prev, newTask as ServiceTask]);
                  } else {
                    setMaterialTasks(prev => [...prev, { ...newTask, recebido: '' } as MaterialTask]);
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
                  <SelectItem value="Edifício Central">Edifício Central</SelectItem>
                  <SelectItem value="Residencial Vista Verde">Residencial Vista Verde</SelectItem>
                  <SelectItem value="Condomínio Parque">Condomínio Parque</SelectItem>
                  <SelectItem value="Residencial Sol Nascente">Residencial Sol Nascente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {(['A FAZER', 'EM ANDAMENTO', 'EM ANÁLISE', 'CONCLUÍDO'] as const).map((status) => (
            <div key={status} className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">{status}</h2>
                  <Badge variant="outline" className="text-xs">
                    {columns[status].length}
                  </Badge>
                </div>
              </div>

              <div className="p-4">
                {columns[status].length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-4">
                    <p className="text-sm text-center text-gray-500">
                      Sem itens
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columns[status].map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        status={status}
                        onMove={moveTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
