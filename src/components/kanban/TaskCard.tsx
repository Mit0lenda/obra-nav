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
  Building2
} from "lucide-react";
import { MaterialTask, ServiceTask } from "@/types/kanban";

interface TaskCardProps {
  task: ServiceTask | MaterialTask;
  status: string;
  onMove: (taskId: number, newStatus: string) => void;
}

export function TaskCard({ task, status, onMove }: TaskCardProps) {
  // Função para determinar a cor do badge de prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'crítico': return 'bg-red-100 text-red-800 border-red-200';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="overflow-hidden bg-white hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="p-4">
            {/* Cabeçalho do Card - Versão Compacta */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${getPriorityColor(task.priority)} px-2 py-0.5`}>
                  {task.priority}
                </Badge>
                {task.tipo === 'material' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {task.qtd}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4" />
                {new Date(task.prazo).toLocaleDateString()}
              </div>
            </div>

            {/* Descrição Resumida */}
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <div className="text-sm text-gray-900 line-clamp-2">{task.descricao}</div>
            </div>

            {/* Rodapé Compacto */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Building2 className="w-4 h-4" />
                {task.obra}
              </div>
              {task.tipo === 'material' && !task.recebido && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pendente
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task.tipo === 'servico' ? 'Detalhes do Serviço' : 'Detalhes da Requisição'}</DialogTitle>
        </DialogHeader>

        {/* Conteúdo Detalhado */}
        <div className="space-y-6">
          {/* Status e Prioridade */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${getPriorityColor(task.priority)} px-2 py-0.5`}>
                Prioridade: {task.priority}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Status: {status}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <CalendarIcon className="w-4 h-4" />
              Prazo: {new Date(task.prazo).toLocaleDateString()}
            </div>
          </div>

          {/* Descrição Completa */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição Detalhada</h4>
            <p className="text-sm text-gray-900">{task.descricao}</p>
          </div>

          {/* Informações em Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Solicitado por</h4>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-900">{task.solicitado}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Responsável</h4>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-900">{task.respo}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {task.tipo === 'material' ? (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Quantidade</h4>
                    <span className="text-sm text-gray-900">{task.qtd}</span>
                  </div>
                  {task.recebido && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recebido em</h4>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">{new Date(task.recebido).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Área</h4>
                  <div className="flex items-center gap-2">
                    <WrenchIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{(task as ServiceTask).area}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {status !== 'A FAZER' && (
              <Button 
                size="sm" 
                variant="outline"
                className="bg-gray-50 hover:bg-gray-100"
                onClick={() => onMove(task.id, status === 'EM ANDAMENTO' ? 'A FAZER' : 'EM ANDAMENTO')}
              >
                Voltar
              </Button>
            )}
            {status === 'A FAZER' && (
              <Button 
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => onMove(task.id, 'EM ANDAMENTO')}
              >
                Iniciar
              </Button>
            )}
            {status === 'EM ANDAMENTO' && (
              <Button 
                size="sm"
                variant="outline"
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                onClick={() => onMove(task.id, 'EM ANÁLISE')}
              >
                Enviar
              </Button>
            )}
            {status === 'EM ANÁLISE' && (
              <Button 
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => onMove(task.id, 'CONCLUÍDO')}
              >
                Aprovar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
