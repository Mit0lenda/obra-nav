import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { mockInventory, type InventoryItem } from '@/data/mockInventory';
import { toast } from 'sonner';

export default function EstoquePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    categoria: '',
    quantidade: 0,
    unidade: 'un',
    valorUnit: 0,
    estoqueMin: 0,
    estoqueMax: 100,
    fornecedor: ''
  });

  // Filtrar inventário
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || item.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const categories = [...new Set(inventory.map(item => item.categoria))];

  // Calcular status do item
  const calculateStatus = (quantidade: number, estoqueMin: number, estoqueMax: number): InventoryItem['status'] => {
    if (quantidade === 0) return 'critico';
    if (quantidade < estoqueMin) return 'baixo';
    if (quantidade > estoqueMax) return 'excesso';
    return 'normal';
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      codigo: '',
      descricao: '',
      categoria: '',
      quantidade: 0,
      unidade: 'un',
      valorUnit: 0,
      estoqueMin: 0,
      estoqueMax: 100,
      fornecedor: ''
    });
    setEditingItem(null);
  };

  // Adicionar/Editar item
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    const newItem: InventoryItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      codigo: formData.codigo || `COD${Date.now().toString().slice(-6)}`,
      descricao: formData.descricao,
      categoria: formData.categoria || 'Diversos',
      quantidade: formData.quantidade,
      unidade: formData.unidade,
      valorUnit: formData.valorUnit,
      estoqueMin: formData.estoqueMin,
      estoqueMax: formData.estoqueMax,
      fornecedor: formData.fornecedor,
      ultimaEntrada: new Date().toISOString(),
      status: calculateStatus(formData.quantidade, formData.estoqueMin, formData.estoqueMax)
    };

    if (editingItem) {
      // Editar
      setInventory(prev => prev.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
      toast.success('Item atualizado com sucesso!');
    } else {
      // Adicionar
      setInventory(prev => [...prev, newItem]);
      toast.success('Item adicionado com sucesso!');
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  // Editar item
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      descricao: item.descricao,
      categoria: item.categoria,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnit: item.valorUnit,
      estoqueMin: item.estoqueMin,
      estoqueMax: item.estoqueMax,
      fornecedor: item.fornecedor || ''
    });
    setIsAddDialogOpen(true);
  };

  // Remover item
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      setInventory(prev => prev.filter(item => item.id !== id));
      toast.success('Item removido com sucesso!');
    }
  };

  // Cores dos status
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
      case 'normal': 
        return <CheckCircle className="h-4 w-4" />;
      default: 
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Estatísticas
  const stats = {
    total: inventory.length,
    criticos: inventory.filter(i => i.status === 'critico').length,
    baixos: inventory.filter(i => i.status === 'baixo').length,
    valorTotal: inventory.reduce((acc, item) => acc + (item.quantidade * item.valorUnit), 0)
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-gray-600">Gerencie o inventário de materiais</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Adicionar Novo Item'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    placeholder="Código do item"
                    value={formData.codigo}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cimento e Concreto">Cimento e Concreto</SelectItem>
                      <SelectItem value="Agregados">Agregados</SelectItem>
                      <SelectItem value="Estrutura Metálica">Estrutura Metálica</SelectItem>
                      <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                      <SelectItem value="Tintas e Vernizes">Tintas e Vernizes</SelectItem>
                      <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                      <SelectItem value="Elétrica">Elétrica</SelectItem>
                      <SelectItem value="Diversos">Diversos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  placeholder="Descrição do material"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade">Unidade</Label>
                  <Select 
                    value={formData.unidade} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unidade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade</SelectItem>
                      <SelectItem value="kg">Quilograma</SelectItem>
                      <SelectItem value="sc">Saco</SelectItem>
                      <SelectItem value="m³">Metro Cúbico</SelectItem>
                      <SelectItem value="m²">Metro Quadrado</SelectItem>
                      <SelectItem value="m">Metro</SelectItem>
                      <SelectItem value="l">Litro</SelectItem>
                      <SelectItem value="gl">Galão</SelectItem>
                      <SelectItem value="rl">Rolo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorUnit">Valor Unitário</Label>
                  <Input
                    id="valorUnit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valorUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, valorUnit: Number(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoqueMin">Estoque Mínimo</Label>
                  <Input
                    id="estoqueMin"
                    type="number"
                    min="0"
                    value={formData.estoqueMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, estoqueMin: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoqueMax">Estoque Máximo</Label>
                  <Input
                    id="estoqueMax"
                    type="number"
                    min="0"
                    value={formData.estoqueMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, estoqueMax: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    placeholder="Nome do fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingItem ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Itens Críticos</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticos}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-orange-600">{stats.baixos}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
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
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Inventário */}
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
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum item encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}