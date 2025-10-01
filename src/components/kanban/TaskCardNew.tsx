import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CalendarIcon, 
  UserCircle, 
  CheckCircle, 
  WrenchIcon,
  Building2,
  AlertTriangle,
  Package
} from "lucide-react";
import { TaskTransformed } from "@/types/dto";

interface TaskCardProps {
  task: TaskTransformed;
}

export function TaskCard({ task }: TaskCardProps) {
  // Função para determinar a cor do badge de prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'concluida': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = () => {
    switch (task.tipo) {
      case 'problema': return <AlertTriangle className="w-4 h-4" />;
      case 'solicitacao_material': return <Package className="w-4 h-4" />;
      case 'manutencao': return <WrenchIcon className="w-4 h-4" />;
      default: return <WrenchIcon className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (task.tipo) {
      case 'problema': return 'Problema';
      case 'solicitacao_material': return 'Material';
      case 'manutencao': return 'Manutenção';
      default: return 'Outros';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="overflow-hidden bg-white hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="p-4">
            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon()}
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel()}
                </Badge>
                <Badge variant="outline" className={`${getPriorityColor(task.prioridade)} px-2 py-0.5 text-xs`}>
                  {task.prioridade}
                </Badge>
              </div>
              {task.prazo && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(task.prazo).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>

            {/* Título */}
            <h3 className="font-medium text-sm mb-2 line-clamp-2">{task.titulo}</h3>

            {/* Descrição Resumida */}
            {task.descricao && (
              <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 line-clamp-2">
                {task.descricao}
              </div>
            )}

            {/* Informações adicionais */}
            <div className="space-y-2">
              {task.responsavel && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <UserCircle className="w-3 h-3" />
                  <span className="truncate">{task.responsavel}</span>
                </div>
              )}
              
              {task.area && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <WrenchIcon className="w-3 h-3" />
                  <span>{task.area}</span>
                </div>
              )}

              {task.quantidade && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Package className="w-3 h-3" />
                  <span>{task.quantidade} unidades</span>
                </div>
              )}
            </div>

            {/* Status badge no rodapé */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
              <Badge variant="outline" className={`${getStatusColor(task.status)} text-xs`}>
                {task.status === 'pendente' ? 'A Fazer' : 
                 task.status === 'em_andamento' ? 'Em Andamento' :
                 task.status === 'concluida' ? 'Concluído' : 'Cancelado'}
              </Badge>
              {task.data_criacao && (
                <span className="text-xs text-gray-400">
                  {new Date(task.data_criacao).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {task.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Prioridade */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${getPriorityColor(task.prioridade)}`}>
                {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(task.status)}`}>
                {task.status === 'pendente' ? 'A Fazer' : 
                 task.status === 'em_andamento' ? 'Em Andamento' :
                 task.status === 'concluida' ? 'Concluído' : 'Cancelado'}
              </Badge>
              <Badge variant="outline">
                {getTypeLabel()}
              </Badge>
            </div>
            {task.prazo && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4" />
                <span>Prazo: {new Date(task.prazo).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {/* Descrição */}
          {task.descricao && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.descricao}</p>
            </div>
          )}

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {task.solicitante && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Solicitante</h4>
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{task.solicitante}</span>
                  </div>
                </div>
              )}

              {task.responsavel && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Responsável</h4>
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{task.responsavel}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {task.area && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Área</h4>
                  <div className="flex items-center gap-2">
                    <WrenchIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{task.area}</span>
                  </div>
                </div>
              )}

              {task.quantidade && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quantidade</h4>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{task.quantidade} unidades</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-gray-500">
            <div>
              <span className="font-medium">Criado em:</span>
              <br />
              {new Date(task.created_at).toLocaleString('pt-BR')}
            </div>
            {task.updated_at && (
              <div>
                <span className="font-medium">Atualizado em:</span>
                <br />
                {new Date(task.updated_at).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}