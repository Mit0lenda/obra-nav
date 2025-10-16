import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Building, 
  TrendingUp,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useObras, useCreateObra, useUpdateObra, useDeleteObra } from "@/integrations/supabase/hooks/useObras";
import { ObraInsertDTO, ObraUpdateDTO, ObraTransformed, transformObra } from "@/types/dto";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/date";
import { SimpleAddressForm } from "@/components/shared/SimpleAddressForm";
import { geocodeAddress, getApproximateCoordinates } from "@/lib/geocoding";
import { type AddressComponents, formatFullAddress } from "@/lib/address-components";

interface ObraFormData {
  nome: string;
  // Endereço estruturado
  endereco: AddressComponents;
  // Outros campos
  responsavel: string;
  status: string;
  data_inicio: string;
  previsao_conclusao: string;
}

const statusOptions = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

function ObraDialog({ 
  obra, 
  isOpen, 
  onClose, 
  mode 
}: { 
  obra?: ObraTransformed; 
  isOpen: boolean; 
  onClose: () => void; 
  mode: 'create' | 'edit' | 'view';
}) {
  const createObra = useCreateObra();
  const updateObra = useUpdateObra();
  const [formData, setFormData] = useState<ObraFormData>({
    nome: obra?.nome || '',
    // Endereço estruturado - inicializar vazio ou parse do endereço existente
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      uf: '',
      cep: '',
      endereco_completo: obra?.endereco || '',
      latitude: obra?.latitude || undefined,
      longitude: obra?.longitude || undefined,
      fonte: 'manual',
      confiabilidade: 'baixa'
    },
    // Outros campos
    responsavel: obra?.responsavel || '',
    status: obra?.status || 'planejamento',
    data_inicio: obra?.data_inicio?.split('T')[0] || new Date().toISOString().split('T')[0],
    previsao_conclusao: obra?.previsao_conclusao?.split('T')[0] || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome da obra é obrigatório');
      return;
    }

    if (!formData.endereco.endereco_completo?.trim()) {
      toast.error('Endereço é obrigatório');
      return;
    }

    try {
      // Se não tiver coordenadas, tentar geocodificar automaticamente
      let latitude = formData.endereco.latitude || null;
      let longitude = formData.endereco.longitude || null;
      if ((latitude == null || longitude == null) && formData.endereco.endereco_completo) {
        try {
          const geo = await geocodeAddress(formData.endereco.endereco_completo);
          if (geo) {
            latitude = geo.latitude;
            longitude = geo.longitude;
          } else {
            const approx = getApproximateCoordinates(formData.endereco.endereco_completo);
            if (approx) {
              longitude = approx[0];
              latitude = approx[1];
            }
          }
        } catch {
          const approx = getApproximateCoordinates(formData.endereco.endereco_completo);
          if (approx) {
            longitude = approx[0];
            latitude = approx[1];
          }
        }
      }

      const obraData = {
        nome: formData.nome,
        endereco: formData.endereco.endereco_completo,
        responsavel: formData.responsavel || null,
        status: formData.status || null,
        data_inicio: formData.data_inicio || null,
        previsao_conclusao: mode === 'create' ? null : (formData.previsao_conclusao || null),
        latitude,
        longitude,
      };

      if (mode === 'create') {
        await createObra.mutateAsync(obraData);
        toast.success('Obra criada com sucesso!');
      } else if (mode === 'edit' && obra) {
        await updateObra.mutateAsync({
          id: obra.id,
          ...obraData,
        });
        toast.success('Obra atualizada com sucesso!');
      }
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar obra');
      console.error('Erro ao salvar obra:', error);
    }
  };

  const isReadOnly = mode === 'view';
  const isLoading = createObra.isPending || updateObra.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Obra' : 
             mode === 'edit' ? 'Editar Obra' : 
             'Detalhes da Obra'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome da Obra *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da obra"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="col-span-2">
              <SimpleAddressForm
                value={formData.endereco}
                onChange={(endereco) => {
                  setFormData(prev => ({ ...prev, endereco }));
                  
                  // Feedback visual quando endereço é selecionado
                  if (endereco.latitude && endereco.longitude) {
                    toast.success(`📍 Endereço localizado no mapa!`);
                  }
                }}
                disabled={isReadOnly}
                className="w-full"
              />
            </div>

            <div hidden={mode === 'create'}>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Nome do responsável"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="previsao_conclusao">Previsão de Conclusão</Label>
              <Input
                id="previsao_conclusao"
                type="date"
                value={formData.previsao_conclusao}
                onChange={(e) => setFormData({ ...formData, previsao_conclusao: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </div>
                ) : (
                  mode === 'create' ? 'Criar Obra' : 'Salvar Alterações'
                )}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const { data: obras = [], isLoading } = useObras();
  const deleteObra = useDeleteObra();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    obra?: ObraTransformed;
  }>({ isOpen: false, mode: 'create' });

  // Transformar dados
  const transformedObras = useMemo(() => {
    return obras.map(transformObra);
  }, [obras]);

  // Filtrar obras
  const filteredObras = useMemo(() => {
    return transformedObras.filter(obra => {
      const matchesSearch = !search || 
        obra.nome.toLowerCase().includes(search.toLowerCase()) ||
        obra.endereco?.toLowerCase().includes(search.toLowerCase()) ||
        obra.responsavel?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'todas' || obra.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [transformedObras, search, statusFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = transformedObras.length;
    const emAndamento = transformedObras.filter(o => o.status === 'em_andamento').length;
    const concluidas = transformedObras.filter(o => o.status === 'concluida').length;
    const pausadas = transformedObras.filter(o => o.status === 'pausada').length;

    return { total, emAndamento, concluidas, pausadas };
  }, [transformedObras]);

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'em_andamento': return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      case 'concluida': return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'pausada': return <Badge className="bg-yellow-100 text-yellow-800">Pausada</Badge>;
      case 'cancelada': return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default: return <Badge variant="outline">Planejamento</Badge>;
    }
  };

  const handleDelete = async (obra: ObraTransformed) => {
    if (window.confirm(`Tem certeza que deseja excluir a obra "${obra.nome}"?`)) {
      try {
        await deleteObra.mutateAsync(obra.id);
        toast.success('Obra excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir obra');
        console.error('Erro ao excluir obra:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Projetos" subtitle="Gestão de obras e projetos" />
        <LoadingPlaceholder rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projetos" 
        subtitle="Gestão de obras e projetos de construção"
        action={
          <Button onClick={() => setDialogState({ isOpen: true, mode: 'create' })}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Obra
          </Button>
        }
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Total de Obras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluidas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pausadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pausadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar obras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Obras */}
      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {filteredObras.length === 0 ? (
            <EmptyState message="Nenhuma obra encontrada" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObras.map((obra) => (
                <Card key={obra.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{obra.nome}</CardTitle>
                      {getStatusBadge(obra.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {obra.endereco && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{obra.endereco}</span>
                      </div>
                    )}
                    {obra.responsavel && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{obra.responsavel}</span>
                      </div>
                    )}
                    {obra.data_inicio && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Início: {new Date(obra.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDialogState({ isOpen: true, mode: 'view', obra })}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDialogState({ isOpen: true, mode: 'edit', obra })}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(obra)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {obra.data_inicio ? fmtDateTime(obra.data_inicio) : 'Sem data'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObras.map((obra) => (
                    <TableRow key={obra.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{obra.nome}</div>
                          {obra.endereco && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {obra.endereco}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(obra.status)}</TableCell>
                      <TableCell>{obra.responsavel || '-'}</TableCell>
                      <TableCell>
                        {obra.data_inicio ? 
                          new Date(obra.data_inicio).toLocaleDateString('pt-BR') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDialogState({ isOpen: true, mode: 'view', obra })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDialogState({ isOpen: true, mode: 'edit', obra })}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(obra)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <ObraDialog 
        obra={dialogState.obra}
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, mode: 'create' })}
        mode={dialogState.mode}
      />
    </div>
  );
}
