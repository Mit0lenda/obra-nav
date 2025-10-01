import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import NFUploader from '@/components/inventory/NFUploader';
import { MaterialForm } from '@/components/inventory/MaterialForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockInventory, type InventoryItem } from '@/data/mockInventory';
import { NFData } from '@/lib/nfe-parser';

// Interface já importada do mockInventory

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Processar NFe importada
  const handleNFProcessed = (nfData: NFData) => {
    const newItems: InventoryItem[] = nfData.itens.map(item => {
      // Verificar se item já existe
      const existingItem = inventory.find(inv => 
        inv.codigo.toLowerCase() === item.codigo.toLowerCase() ||
        inv.descricao.toLowerCase().includes(item.descricao.toLowerCase().substring(0, 20))
      );

      if (existingItem) {
        // Atualizar quantidade do item existente
        return {
          ...existingItem,
          quantidade: existingItem.quantidade + item.quantidade,
          valorUnit: item.valorUnit, // Atualizar preço
          ultimaEntrada: nfData.emissao,
          fornecedor: nfData.fornecedor,
          status: calculateItemStatus(existingItem.quantidade + item.quantidade, existingItem.estoqueMin, existingItem.estoqueMax)
        };
      } else {
        // Criar novo item
        return {
          id: `nf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          codigo: item.codigo,
          descricao: item.descricao,
          categoria: inferCategory(item.descricao),
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnit: item.valorUnit,
          estoqueMin: Math.ceil(item.quantidade * 0.2), // 20% como mínimo
          estoqueMax: Math.ceil(item.quantidade * 2), // 200% como máximo
          fornecedor: nfData.fornecedor,
          ultimaEntrada: nfData.emissao,
          status: 'normal' as const
        };
      }
    });

    // Atualizar inventário
    setInventory(prev => {
      const updated = [...prev];
      
      newItems.forEach(newItem => {
        const existingIndex = updated.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
          updated[existingIndex] = newItem;
        } else {
          updated.push(newItem);
        }
      });
      
      return updated;
    });
  };

  // Calcular status do item baseado no estoque
  const calculateItemStatus = (quantidade: number, min: number, max: number): InventoryItem['status'] => {
    if (quantidade === 0) return 'critico';
    if (quantidade < min) return 'baixo';
    if (quantidade > max) return 'excesso';
    return 'normal';
  };

  // Inferir categoria baseada na descrição
  const inferCategory = (descricao: string): string => {
    const desc = descricao.toLowerCase();
    
    if (desc.includes('cimento') || desc.includes('concreto') || desc.includes('argamassa')) {
      return 'Cimento e Concreto';
    }
    if (desc.includes('ferro') || desc.includes('vergalhão') || desc.includes('aço')) {
      return 'Estrutura Metálica';
    }
    if (desc.includes('tijolo') || desc.includes('bloco') || desc.includes('ceramico')) {
      return 'Alvenaria';
    }
    if (desc.includes('tinta') || desc.includes('verniz') || desc.includes('primer')) {
      return 'Tintas e Vernizes';
    }
    if (desc.includes('tubo') || desc.includes('cano') || desc.includes('conexão')) {
      return 'Hidráulica';
    }
    if (desc.includes('fio') || desc.includes('cabo') || desc.includes('elétrico')) {
      return 'Elétrica';
    }
    
    return 'Diversos';
  };

  // Filtrar inventário
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || item.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calcular estatísticas
  const stats = {
    totalItens: inventory.length,
    valorTotal: inventory.reduce((acc, item) => acc + (item.quantidade * item.valorUnit), 0),
    itensAbaixoEstoque: inventory.filter(item => item.status === 'baixo' || item.status === 'critico').length,
    categorias: [...new Set(inventory.map(item => item.categoria))].length,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'critico': return 'destructive';
      case 'baixo': return 'secondary';
      case 'excesso': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: InventoryItem['status']) => {
    switch (status) {
      case 'critico':
      case 'baixo': 
        return <TrendingDown className="h-4 w-4" />;
      case 'excesso': 
        return <TrendingUp className="h-4 w-4" />;
      default: 
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventário de Materiais</h1>
          <p className="text-gray-600">Controle de estoque e materiais da obra</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Material</DialogTitle>
            </DialogHeader>
            <MaterialForm 
              onSubmit={async (data) => {
                const newItem: InventoryItem = {
                  id: `manual-${Date.now()}`,
                  codigo: data.nome.replace(/\s+/g, '').toUpperCase().substring(0, 8),
                  descricao: data.nome,
                  categoria: inferCategory(data.nome),
                  quantidade: data.quantidade,
                  unidade: data.unidade,
                  valorUnit: 0, // Será definido depois
                  estoqueMin: Math.ceil(data.quantidade * 0.2),
                  estoqueMax: Math.ceil(data.quantidade * 2),
                  status: calculateItemStatus(data.quantidade, Math.ceil(data.quantidade * 0.2), Math.ceil(data.quantidade * 2)),
                };
                setInventory(prev => [...prev, newItem]);
                setIsAddDialogOpen(false);
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold">{stats.totalItens}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas de Estoque</p>
                <p className="text-2xl font-bold text-orange-600">{stats.itensAbaixoEstoque}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorias</p>
                <p className="text-2xl font-bold">{stats.categorias}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Estoque Atual</TabsTrigger>
          <TabsTrigger value="import">Importar NFe</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por descrição ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="todos">Todas as categorias</option>
                  {[...new Set(inventory.map(item => item.categoria))].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fornecedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.codigo}</TableCell>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantidade.toLocaleString('pt-BR')} {item.unidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.valorUnit)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantidade * item.valorUnit)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusColor(item.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(item.status)}
                          {item.status === 'normal' ? 'OK' : 
                           item.status === 'baixo' ? 'Baixo' :
                           item.status === 'critico' ? 'Crítico' : 'Excesso'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.fornecedor || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredInventory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <NFUploader onNFProcessed={handleNFProcessed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}