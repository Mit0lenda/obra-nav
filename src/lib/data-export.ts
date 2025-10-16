import { transformObra, transformTask } from '@/types/dto';
import type { Database } from '@/integrations/supabase/types';

type Obra = Database['public']['Tables']['obras']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Material = Database['public']['Tables']['materiais']['Row'];
type Movimentacao = Database['public']['Tables']['movimentacoes']['Row'];

export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Use specified columns or all keys from first object
  const headers = columns || (Object.keys(data[0]) as (keyof T)[]);
  
  // Create CSV header
  const csvHeader = headers.join(',');
  
  // Create CSV rows
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportObrasToCSV(obras: Obra[]) {
  const transformed = obras.map(transformObra);
  const columns: (keyof ReturnType<typeof transformObra>)[] = [
    'nome',
    'status',
    'progresso',
    'endereco',
    'data_inicio',
    'previsao_conclusao',
    'latitude',
    'longitude',
  ];
  exportToCSV(transformed, 'obras', columns);
}

export function exportTasksToCSV(tasks: Task[]) {
  const transformed = tasks.map(transformTask);
  const columns: (keyof ReturnType<typeof transformTask>)[] = [
    'titulo',
    'descricao',
    'status',
    'prioridade',
    'tipo',
    'area',
    'prazo',
    'data_criacao',
  ];
  exportToCSV(transformed, 'tarefas', columns);
}

export function exportMateriaisToCSV(materiais: Material[]) {
  const columns: (keyof Material)[] = [
    'nome',
    'descricao',
    'quantidade',
    'unidade',
    'created_at',
    'updated_at',
  ];
  exportToCSV(materiais, 'materiais', columns);
}

export function exportMovimentacoesToCSV(movimentacoes: Movimentacao[]) {
  const columns: (keyof Movimentacao)[] = [
    'tipo',
    'quantidade',
    'usuario',
    'motivo',
    'created_at',
  ];
  exportToCSV(movimentacoes, 'movimentacoes', columns);
}

export function exportToJSON<T>(data: T[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
