import { useEffect, useState } from 'react';
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

interface Obra {
  id: string;
  nome: string;
  progresso: number;
  status: 'em_andamento' | 'concluida' | 'atrasada';
  previsaoConclusao: string;
  responsavel: string;
  pendencias: number;
}

const mockObras: Obra[] = [
  {
    id: '1',
    nome: 'Residencial Vista Verde',
    progresso: 65,
    status: 'em_andamento',
    previsaoConclusao: '2025-12-20',
    responsavel: 'João Silva',
    pendencias: 3
  },
  {
    id: '2',
    nome: 'Edifício Central',
    progresso: 45,
    status: 'atrasada',
    previsaoConclusao: '2025-10-15',
    responsavel: 'Maria Santos',
    pendencias: 5
  },
  {
    id: '3',
    nome: 'Condomínio Jardim do Sol',
    progresso: 92,
    status: 'em_andamento',
    previsaoConclusao: '2025-09-30',
    responsavel: 'Pedro Costa',
    pendencias: 1
  }
];

export default function ObrasEmAndamento() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'atrasadas' | 'em_dia'>('todas');

  useEffect(() => {
    // Simula chamada à API
    setObras(mockObras);
  }, []);

  const obrasFiltered = obras.filter(obra => {
    if (filtro === 'todas') return true;
    if (filtro === 'atrasadas') return obra.status === 'atrasada';
    return obra.status === 'em_andamento';
  });

  const getStatusBadge = (status: Obra['status']) => {
    switch (status) {
      case 'em_andamento':
        return <Badge variant="default"><Construction className="mr-1 h-3 w-3" /> Em Andamento</Badge>;
      case 'atrasada':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" /> Atrasada</Badge>;
      case 'concluida':
        return <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Concluída</Badge>;
    }
  };

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
            <div className="text-2xl font-bold">{obras.length}</div>
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
              {obras.filter(o => o.status === 'atrasada').length}
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
              {obras.reduce((acc, obra) => acc + obra.pendencias, 0)}
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
                  <TableCell>{new Date(obra.previsaoConclusao).toLocaleDateString()}</TableCell>
                  <TableCell>{obra.responsavel}</TableCell>
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
