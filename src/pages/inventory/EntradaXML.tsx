import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { useMateriais } from "@/integrations/supabase/hooks/useMateriais";
import { useCreateMovimentacao } from "@/integrations/supabase/hooks/useMovimentacoes";
import { useAddAuditEntry } from "@/integrations/supabase/hooks/useAuditoria";
import { toast } from "@/components/ui/use-toast";

const LS_XML_KEYS = 'nexium_xml_keys_v1';

function validCNPJ(v: string) {
  const digits = v.replace(/\D/g, '');
  return digits.length === 14;
}

function currencyBR(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

type XmlItem = { codigo: string; descricao: string; quantidade: number; unidade: string; valorUnit: number };

type XmlPreview = {
  fornecedor: string;
  cnpj: string;
  chave: string;
  emissao: string; // ISO
  itens: XmlItem[];
};

export default function EntradaXML() {
  const { data: materiais = [] } = useMateriais();
  const { mutateAsync: createMovement } = useCreateMovimentacao();
  const addAuditEntry = useAddAuditEntry();
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<XmlPreview | null>(null);

  const totalGeral = useMemo(() => {
    if (!preview) return 0;
    return preview.itens.reduce((acc, it) => acc + it.quantidade * it.valorUnit, 0);
  }, [preview]);

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    // parsing simulado com dados coerentes com estoque
    const mock: XmlPreview = {
      fornecedor: 'Cimento & Cia LTDA',
      cnpj: '12.345.678/0001-90',
      chave: 'NFe-' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0'),
      emissao: new Date().toISOString(),
      itens: [
        { codigo: 'm1', descricao: 'Cimento Portland CP II', quantidade: 20, unidade: 'sc', valorUnit: 32.5 },
        { codigo: 'm2', descricao: 'Brita 1', quantidade: 5, unidade: 'm³', valorUnit: 110 },
        { codigo: 'm3', descricao: 'Areia Fina', quantidade: 8, unidade: 'm³', valorUnit: 95 },
      ],
    };
    setPreview(mock);
  };

  const confirm = async () => {
    if (!preview) return;
    if (!validCNPJ(preview.cnpj)) {
      toast({ title: 'CNPJ inválido', description: 'Verifique o número informado.', className: 'bg-[hsl(var(--problem-light))]' });
      return;
    }
    const kraw = localStorage.getItem(LS_XML_KEYS);
    const keys = kraw ? (JSON.parse(kraw) as string[]) : [];
    if (keys.includes(preview.chave)) {
      toast({ title: 'Duplicidade detectada', description: 'Esta chave já foi utilizada.', className: 'bg-[hsl(var(--problem-light))]' });
      return;
    }
    if (preview.itens.length === 0 || preview.itens.some((i) => i.quantidade <= 0)) {
      toast({ title: 'Itens inválidos', description: 'Todas as quantidades devem ser maiores que zero.', className: 'bg-[hsl(var(--problem-light))]' });
      return;
    }

    // gerar movimentações de Entrada para itens que existem no estoque
    const ops = preview.itens.map(async (it) => {
      const match = materiais.find((m) => m.nome === it.descricao);
      if (!match) return;
      
      // Create movement record (this will automatically update the material quantity)
      await createMovement({
        material_id: match.id,
        tipo: 'Entrada',
        quantidade: it.quantidade,
        motivo: `XML ${preview.chave}`,
        usuario: 'Operador'
      });
    });
    await Promise.all(ops);
    
    await addAuditEntry({
      user: "Usuário Atual",
      action: "entrada_xml",
      details: `Entrada XML: ${preview.chave} - ${preview.fornecedor} - Total ${currencyBR(totalGeral)}`,
    });
    
    localStorage.setItem(LS_XML_KEYS, JSON.stringify([...keys, preview.chave]));
    toast({ title: 'Entrada confirmada', description: `Total ${currencyBR(totalGeral)} registrado. Estoque atualizado.` });
    setPreview(null);
    setFileName(null);
  };

  const cancel = () => {
    setPreview(null);
    setFileName(null);
    toast({ title: 'Upload cancelado', description: 'A pré-visualização foi limpa.', className: 'bg-[hsl(var(--report-light))]' });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Entrada XML" subtitle="Upload de XML da SEFAZ e preview (simulado)" />

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Input type="file" accept=".xml" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
          {fileName && <div className="text-sm text-muted-foreground">Arquivo: {fileName}</div>}
        </div>

        {!preview ? (
          <div className="text-sm text-muted-foreground">Selecione um arquivo .xml para gerar a pré-visualização.</div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Fornecedor</span><div className="font-medium">{preview.fornecedor}</div></div>
              <div><span className="text-muted-foreground">CNPJ</span><div className="font-medium">{preview.cnpj}</div></div>
              <div><span className="text-muted-foreground">Chave</span><div className="font-medium">{preview.chave}</div></div>
              <div><span className="text-muted-foreground">Emissão</span><div className="font-medium">{new Date(preview.emissao).toLocaleString('pt-BR')}</div></div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Unid</TableHead>
                    <TableHead>Vlr Unit</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.itens.map((it) => (
                    <TableRow key={it.codigo}>
                      <TableCell>{it.codigo}</TableCell>
                      <TableCell>{it.descricao}</TableCell>
                      <TableCell>{it.quantidade}</TableCell>
                      <TableCell>{it.unidade}</TableCell>
                      <TableCell>{currencyBR(it.valorUnit)}</TableCell>
                      <TableCell>{currencyBR(it.quantidade * it.valorUnit)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Total Geral</TableCell>
                    <TableCell className="font-medium">{currencyBR(totalGeral)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button onClick={confirm}>Confirmar Entrada</Button>
              <Button variant="outline" onClick={cancel}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
