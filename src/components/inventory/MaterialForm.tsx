import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObras } from "@/integrations/supabase/hooks/useObras";
import type { MaterialInsert } from "@/integrations/supabase/hooks/useMateriais";

type MaterialFormData = {
  nome: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  obra_id: string;
};

interface MaterialFormProps {
  initialData?: Partial<MaterialFormData>;
  onSubmit: (data: MaterialInsert) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const unidadeOptions = [
  { value: "un", label: "Unidade" },
  { value: "m", label: "Metro" },
  { value: "m²", label: "Metro Quadrado" },
  { value: "m³", label: "Metro Cúbico" },
  { value: "kg", label: "Quilograma" },
  { value: "l", label: "Litro" },
  { value: "sc", label: "Saco" },
  { value: "cx", label: "Caixa" },
  { value: "pç", label: "Peça" }
];

export function MaterialForm({ initialData, onSubmit, onCancel, isEdit }: MaterialFormProps) {
  const { data: obras = [] } = useObras();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<MaterialFormData>({
    nome: initialData?.nome || "",
    descricao: initialData?.descricao || "",
    unidade: initialData?.unidade || "un",
    quantidade: initialData?.quantidade || "0",
    obra_id: initialData?.obra_id || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        nome: formData.nome,
        descricao: formData.descricao || null,
        unidade: formData.unidade,
        quantidade: parseFloat(formData.quantidade) || 0,
        obra_id: formData.obra_id || null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Material *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Cimento Portland"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Descrição adicional do material"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Select 
            value={formData.unidade} 
            onValueChange={(v) => setFormData({ ...formData, unidade: v })}
            disabled={isSubmitting}
          >
            <SelectTrigger id="unidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unidadeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade Inicial</Label>
          <Input
            id="quantidade"
            type="number"
            step="any"
            min="0"
            value={formData.quantidade}
            onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="obra_id">Obra</Label>
        <Select 
          value={formData.obra_id} 
          onValueChange={(v) => setFormData({ ...formData, obra_id: v })}
          disabled={isSubmitting}
        >
          <SelectTrigger id="obra_id">
            <SelectValue placeholder="Selecione uma obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem obra</SelectItem>
            {obras.map(obra => (
              <SelectItem key={obra.id} value={obra.id}>
                {obra.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Adicionar Material"}
        </Button>
      </div>
    </form>
  );
}
