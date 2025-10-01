import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useObras, useCreateObra, useUpdateObra, useDeleteObra } from "@/integrations/supabase/hooks/useObras";
import { LoadingPlaceholder, EmptyState } from "@/components/shared/States";
import { toast } from "sonner";
import { Edit2, Trash2, MapPin, Calendar, User } from "lucide-react";
import { fmtDate } from "@/lib/date";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ObraInsert } from "@/integrations/supabase/hooks/useObras";

type ObraForm = {
  nome: string;
  endereco: string;
  latitude: string;
  longitude: string;
  status: string;
  data_inicio: string;
  previsao_conclusao: string;
};

const statusOptions = [
  { value: "Planejamento", label: "Planejamento" },
  { value: "Em Andamento", label: "Em Andamento" },
  { value: "Concluída", label: "Concluída" },
  { value: "Pausada", label: "Pausada" }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Em Andamento": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Concluída": return "bg-green-100 text-green-800 border-green-200";
    case "Pausada": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Planejamento": return "bg-gray-100 text-gray-800 border-gray-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function Projects() {
  const { data: obras = [], isLoading } = useObras();
  const createObra = useCreateObra();
  const updateObra = useUpdateObra();
  const deleteObra = useDeleteObra();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<typeof obras[0] | null>(null);
  
  const [formData, setFormData] = useState<ObraForm>({
    nome: "",
    endereco: "",
    latitude: "",
    longitude: "",
    status: "Planejamento",
    data_inicio: new Date().toISOString().split('T')[0],
    previsao_conclusao: ""
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      endereco: "",
      latitude: "",
      longitude: "",
      status: "Planejamento",
      data_inicio: new Date().toISOString().split('T')[0],
      previsao_conclusao: ""
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Nome da obra é obrigatório");
      return;
    }

    try {
      const obraData: ObraInsert = {
        nome: formData.nome,
        endereco: formData.endereco || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        status: formData.status,
        data_inicio: formData.data_inicio ? new Date(formData.data_inicio).toISOString() : new Date().toISOString(),
        previsao_conclusao: formData.previsao_conclusao ? new Date(formData.previsao_conclusao).toISOString() : null
      };

      await createObra.mutateAsync(obraData);
      toast.success("Obra criada com sucesso");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erro ao criar obra");
      console.error(error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedObra || !formData.nome.trim()) {
      toast.error("Dados inválidos");
      return;
    }

    try {
      await updateObra.mutateAsync({
        id: selectedObra.id,
        nome: formData.nome,
        endereco: formData.endereco || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        status: formData.status,
        data_inicio: formData.data_inicio ? new Date(formData.data_inicio).toISOString() : null,
        previsao_conclusao: formData.previsao_conclusao ? new Date(formData.previsao_conclusao).toISOString() : null
      });
      toast.success("Obra atualizada com sucesso");
      setIsEditDialogOpen(false);
      setSelectedObra(null);
      resetForm();
    } catch (error) {
      toast.error("Erro ao atualizar obra");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedObra) return;

    try {
      await deleteObra.mutateAsync(selectedObra.id);
      toast.success("Obra removida com sucesso");
      setIsDeleteDialogOpen(false);
      setSelectedObra(null);
    } catch (error) {
      toast.error("Erro ao remover obra");
      console.error(error);
    }
  };

  const openEditDialog = (obra: typeof obras[0]) => {
    setSelectedObra(obra);
    setFormData({
      nome: obra.nome,
      endereco: obra.endereco || "",
      latitude: obra.latitude?.toString() || "",
      longitude: obra.longitude?.toString() || "",
      status: obra.status || "Planejamento",
      data_inicio: obra.data_inicio ? new Date(obra.data_inicio).toISOString().split('T')[0] : "",
      previsao_conclusao: obra.previsao_conclusao ? new Date(obra.previsao_conclusao).toISOString().split('T')[0] : ""
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (obra: typeof obras[0]) => {
    setSelectedObra(obra);
    setIsDeleteDialogOpen(true);
  };

  const ObraForm = ({ onSubmit, isEdit }: { onSubmit: (e: React.FormEvent) => void, isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Obra *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Edifício Central"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
          placeholder="Ex: Rua das Flores, 123"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="-23.5505"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="-46.6333"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
          <SelectTrigger id="status">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data de Início</Label>
          <Input
            id="data_inicio"
            type="date"
            value={formData.data_inicio}
            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="previsao_conclusao">Previsão de Conclusão</Label>
          <Input
            id="previsao_conclusao"
            type="date"
            value={formData.previsao_conclusao}
            onChange={(e) => setFormData({ ...formData, previsao_conclusao: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {
          isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false);
          resetForm();
        }}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEdit ? "Salvar" : "Criar Obra"}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return <LoadingPlaceholder rows={4} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestão de Obras"
        subtitle="Gerencie todas as obras e seus detalhes"
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>+ Nova Obra</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Obra</DialogTitle>
                <DialogDescription>Preencha os dados da nova obra</DialogDescription>
              </DialogHeader>
              <ObraForm onSubmit={handleAdd} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Previsão Conclusão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <EmptyState 
                    message="Nenhuma obra cadastrada" 
                    actionLabel="Adicionar primeira obra"
                    onAction={() => setIsAddDialogOpen(true)}
                  />
                </TableCell>
              </TableRow>
            ) : (
              obras.map((obra) => (
                <TableRow key={obra.id}>
                  <TableCell className="font-medium">{obra.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(obra.status || "Planejamento")}>
                      {obra.status || "Planejamento"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {obra.endereco ? (
                        <>
                          <MapPin className="h-4 w-4" />
                          {obra.endereco}
                        </>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {obra.latitude && obra.longitude ? (
                      <span className="text-xs text-muted-foreground">
                        {parseFloat(obra.latitude.toString()).toFixed(4)}, {parseFloat(obra.longitude.toString()).toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {obra.data_inicio ? (
                        <>
                          <Calendar className="h-4 w-4" />
                          {fmtDate(new Date(obra.data_inicio))}
                        </>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {obra.previsao_conclusao ? (
                      <span className="text-sm text-muted-foreground">
                        {fmtDate(new Date(obra.previsao_conclusao))}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(obra)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(obra)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
            <DialogDescription>Atualize os dados da obra</DialogDescription>
          </DialogHeader>
          <ObraForm onSubmit={handleEdit} isEdit />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a obra "{selectedObra?.nome}"? Esta ação não pode ser desfeita e todas as tarefas e materiais associados serão afetados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
