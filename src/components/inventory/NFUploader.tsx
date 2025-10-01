import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Eye, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { parseNFeXML, generateMockNFData, isValidXMLFile, NFData, NFItem, calculateNFTotals } from '@/lib/nfe-parser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface NFUploaderProps {
  onNFProcessed?: (nfData: NFData) => void;
}

export default function NFUploader({ onNFProcessed }: NFUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedNFs, setProcessedNFs] = useState<NFData[]>([]);
  const [selectedNF, setSelectedNF] = useState<NFData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setProcessing(true);
    setError(null);
    
    const newNFs: NFData[] = [];
    
    for (const file of Array.from(files)) {
      if (!isValidXMLFile(file)) {
        setError(`Arquivo ${file.name} não é um XML válido`);
        continue;
      }
      
      try {
        const nfData = await parseNFeXML(file);
        if (nfData) {
          newNFs.push(nfData);
        } else {
          setError(`Não foi possível processar ${file.name}`);
        }
      } catch (err) {
        setError(`Erro ao processar ${file.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }
    
    if (newNFs.length > 0) {
      setProcessedNFs(prev => [...prev, ...newNFs]);
      newNFs.forEach(nf => onNFProcessed?.(nf));
    }
    
    setProcessing(false);
  }, [onNFProcessed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const generateDemoNF = useCallback(() => {
    const mockNF = generateMockNFData('demo.xml');
    setProcessedNFs(prev => [...prev, mockNF]);
    onNFProcessed?.(mockNF);
  }, [onNFProcessed]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Nota Fiscal Eletrônica
          </CardTitle>
          <CardDescription>
            Faça upload de arquivos XML de NFe para importar materiais automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragOver ? 'border-primary bg-primary/10' : 'border-gray-300'}
              ${processing ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {processing ? (
              <div className="space-y-2">
                <div className="animate-spin mx-auto h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-sm text-gray-600">Processando arquivos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Arraste arquivos XML aqui</p>
                  <p className="text-sm text-gray-600">ou clique para selecionar</p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.xml,.XML';
                      input.multiple = true;
                      input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
                      input.click();
                    }}
                  >
                    Selecionar Arquivos
                  </Button>
                  <Button variant="secondary" onClick={generateDemoNF}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Demo
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Processed NFs List */}
      {processedNFs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Notas Fiscais Processadas ({processedNFs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedNFs.map((nf, index) => {
                const totals = calculateNFTotals(nf);
                return (
                  <Card key={index} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{nf.fornecedor}</h4>
                          <p className="text-sm text-gray-600">CNPJ: {nf.cnpj}</p>
                          <p className="text-sm text-gray-600">Emissão: {formatDate(nf.emissao)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="secondary">
                            {totals.totalItens} itens
                          </Badge>
                          <p className="text-lg font-semibold">
                            {formatCurrency(totals.totalValor)}
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedNF(nf)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
                              </DialogHeader>
                              {selectedNF && (
                                <div className="space-y-4">
                                  {/* NF Header */}
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                      <h3 className="font-semibold">{selectedNF.fornecedor}</h3>
                                      <p className="text-sm">CNPJ: {selectedNF.cnpj}</p>
                                      <p className="text-sm">Chave: {selectedNF.chave}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm">Emissão: {formatDate(selectedNF.emissao)}</p>
                                      <p className="text-lg font-semibold">
                                        {formatCurrency(calculateNFTotals(selectedNF).totalValor)}
                                      </p>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Items Table */}
                                  <ScrollArea className="h-[400px]">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Código</TableHead>
                                          <TableHead>Descrição</TableHead>
                                          <TableHead className="text-right">Quantidade</TableHead>
                                          <TableHead>Unidade</TableHead>
                                          <TableHead className="text-right">Valor Unit.</TableHead>
                                          <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {selectedNF.itens.map((item, itemIndex) => (
                                          <TableRow key={itemIndex}>
                                            <TableCell className="font-mono text-sm">
                                              {item.codigo}
                                            </TableCell>
                                            <TableCell>{item.descricao}</TableCell>
                                            <TableCell className="text-right">
                                              {item.quantidade.toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>{item.unidade}</TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(item.valorUnit)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              {formatCurrency(item.quantidade * item.valorUnit)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </ScrollArea>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}