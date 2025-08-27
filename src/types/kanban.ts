export type BaseTask = {
  id: number;
  status: string;
  priority: string;
  obra: string;
  solicitado: string;
  prazo: string;
  respo: string;
};

export type ServiceTask = BaseTask & {
  tipo: 'servico';
  area: string;
  descricao: string;
};

export type MaterialTask = BaseTask & {
  tipo: 'material';
  recebido: string;
  qtd: string;
  descricao: string;
};

export type Task = ServiceTask | MaterialTask;
