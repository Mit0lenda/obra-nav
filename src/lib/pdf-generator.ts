import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ObraTransformed, TaskTransformed } from '@/types/dto';

interface ReportData {
  title: string;
  subtitle?: string;
  date: Date;
  obra?: ObraTransformed;
  tasks?: TaskTransformed[];
  sections?: ReportSection[];
}

interface ReportSection {
  title: string;
  content: string | number | JSX.Element;
  type: 'text' | 'number' | 'chart' | 'table' | 'component';
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

// Configurações padrão do PDF
const PDF_CONFIG = {
  format: 'a4' as const,
  unit: 'mm' as const,
  orientation: 'portrait' as const,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#16a34a',
    warning: '#ea580c',
    error: '#dc2626',
    text: '#1f2937',
    lightGray: '#f3f4f6'
  },
  fonts: {
    primary: 'helvetica',
    size: {
      title: 18,
      subtitle: 14,
      heading: 12,
      body: 10,
      caption: 8
    }
  }
};

export class PDFReportGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private pageWidth: number;

  constructor() {
    this.pdf = new jsPDF({
      orientation: PDF_CONFIG.orientation,
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format
    });
    
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = PDF_CONFIG.margins.top;
  }

  // Adicionar nova página se necessário
  private checkPageBreak(requiredHeight: number = 20) {
    if (this.currentY + requiredHeight > this.pageHeight - PDF_CONFIG.margins.bottom) {
      this.pdf.addPage();
      this.currentY = PDF_CONFIG.margins.top;
      return true;
    }
    return false;
  }

  // Adicionar cabeçalho da empresa
  private addHeader(title: string, subtitle?: string, date: Date = new Date()) {
    // Logo e nome da empresa
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.title);
    this.pdf.setTextColor(PDF_CONFIG.colors.primary);
    this.pdf.text('ObraNav', PDF_CONFIG.margins.left, this.currentY);
    
    // Data no canto direito
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'normal');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.body);
    this.pdf.setTextColor(PDF_CONFIG.colors.secondary);
    const dateStr = date.toLocaleDateString('pt-BR');
    const dateWidth = this.pdf.getTextWidth(dateStr);
    this.pdf.text(dateStr, this.pageWidth - PDF_CONFIG.margins.right - dateWidth, this.currentY);
    
    this.currentY += 15;
    
    // Título do relatório
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.title);
    this.pdf.setTextColor(PDF_CONFIG.colors.text);
    this.pdf.text(title, PDF_CONFIG.margins.left, this.currentY);
    this.currentY += 10;
    
    // Subtítulo se fornecido
    if (subtitle) {
      this.pdf.setFont(PDF_CONFIG.fonts.primary, 'normal');
      this.pdf.setFontSize(PDF_CONFIG.fonts.size.subtitle);
      this.pdf.setTextColor(PDF_CONFIG.colors.secondary);
      this.pdf.text(subtitle, PDF_CONFIG.margins.left, this.currentY);
      this.currentY += 8;
    }
    
    // Linha separadora
    this.pdf.setDrawColor(PDF_CONFIG.colors.lightGray);
    this.pdf.line(
      PDF_CONFIG.margins.left, 
      this.currentY, 
      this.pageWidth - PDF_CONFIG.margins.right, 
      this.currentY
    );
    this.currentY += 10;
  }

  // Adicionar rodapé
  private addFooter() {
    const footerY = this.pageHeight - PDF_CONFIG.margins.bottom + 5;
    
    // Número da página
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'normal');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.caption);
    this.pdf.setTextColor(PDF_CONFIG.colors.secondary);
    
    const pageNum = `Página ${this.pdf.getCurrentPageInfo().pageNumber}`;
    const pageNumWidth = this.pdf.getTextWidth(pageNum);
    this.pdf.text(pageNum, this.pageWidth - PDF_CONFIG.margins.right - pageNumWidth, footerY);
    
    // Linha separadora
    this.pdf.setDrawColor(PDF_CONFIG.colors.lightGray);
    this.pdf.line(
      PDF_CONFIG.margins.left, 
      footerY - 5, 
      this.pageWidth - PDF_CONFIG.margins.right, 
      footerY - 5
    );
  }

  // Adicionar seção de texto
  private addTextSection(title: string, content: string) {
    this.checkPageBreak(30);
    
    // Título da seção
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.heading);
    this.pdf.setTextColor(PDF_CONFIG.colors.text);
    this.pdf.text(title, PDF_CONFIG.margins.left, this.currentY);
    this.currentY += 8;
    
    // Conteúdo
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'normal');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.body);
    
    const lines = this.pdf.splitTextToSize(
      content, 
      this.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right
    );
    
    lines.forEach((line: string) => {
      this.checkPageBreak(5);
      this.pdf.text(line, PDF_CONFIG.margins.left, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 5; // Espaço extra após seção
  }

  // Adicionar tabela de tarefas
  private addTasksTable(tasks: TaskTransformed[]) {
    this.checkPageBreak(40);
    
    // Título da tabela
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.heading);
    this.pdf.setTextColor(PDF_CONFIG.colors.text);
    this.pdf.text('Tarefas do Projeto', PDF_CONFIG.margins.left, this.currentY);
    this.currentY += 10;
    
    // Cabeçalho da tabela
    const colWidths = [60, 40, 30, 40]; // Larguras das colunas
    const headers = ['Descrição', 'Status', 'Prioridade', 'Responsável'];
    
    // Background do cabeçalho
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(
      PDF_CONFIG.margins.left, 
      this.currentY - 5, 
      colWidths.reduce((a, b) => a + b, 0), 
      8, 
      'F'
    );
    
    // Texto do cabeçalho
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.body);
    this.pdf.setTextColor(PDF_CONFIG.colors.text);
    
    let currentX = PDF_CONFIG.margins.left;
    headers.forEach((header, index) => {
      this.pdf.text(header, currentX + 2, this.currentY);
      currentX += colWidths[index];
    });
    
    this.currentY += 10;
    
    // Linhas da tabela
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'normal');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.body);
    
    tasks.forEach((task, index) => {
      this.checkPageBreak(8);
      
      // Alternar cor de fundo das linhas
      if (index % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250);
        this.pdf.rect(
          PDF_CONFIG.margins.left, 
          this.currentY - 5, 
          colWidths.reduce((a, b) => a + b, 0), 
          8, 
          'F'
        );
      }
      
      currentX = PDF_CONFIG.margins.left;
      const rowData = [
        task.descricao?.substring(0, 40) || 'Sem descrição',
        task.status || 'Indefinido',
        task.prioridade || 'Normal',
        task.responsavel || 'Não atribuído'
      ];
      
      rowData.forEach((data, colIndex) => {
        this.pdf.text(data, currentX + 2, this.currentY);
        currentX += colWidths[colIndex];
      });
      
      this.currentY += 8;
    });
    
    // Bordas da tabela
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(
      PDF_CONFIG.margins.left, 
      this.currentY - (tasks.length + 1) * 8 - 5, 
      colWidths.reduce((a, b) => a + b, 0), 
      (tasks.length + 1) * 8
    );
    
    this.currentY += 5;
  }

  // Adicionar estatísticas do projeto
  private addProjectStats(obra: ObraTransformed, tasks: TaskTransformed[]) {
    this.checkPageBreak(60);
    
    // Título
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.heading);
    this.pdf.setTextColor(PDF_CONFIG.colors.text);
    this.pdf.text('Estatísticas do Projeto', PDF_CONFIG.margins.left, this.currentY);
    this.currentY += 15;
    
    // Calcular estatísticas
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'concluida').length;
    const inProgressTasks = tasks.filter(t => t.status === 'em_andamento').length;
    const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Cards de estatísticas
    const stats = [
      { label: 'Total de Tarefas', value: totalTasks.toString(), color: PDF_CONFIG.colors.primary },
      { label: 'Concluídas', value: completedTasks.toString(), color: PDF_CONFIG.colors.success },
      { label: 'Em Andamento', value: inProgressTasks.toString(), color: PDF_CONFIG.colors.warning },
      { label: 'Pendentes', value: pendingTasks.toString(), color: PDF_CONFIG.colors.secondary }
    ];
    
    const cardWidth = 40;
    const cardHeight = 25;
    const spacing = 5;
    
    stats.forEach((stat, index) => {
      const x = PDF_CONFIG.margins.left + index * (cardWidth + spacing);
      
      // Background do card
      this.pdf.setFillColor(stat.color);
      this.pdf.rect(x, this.currentY, cardWidth, cardHeight, 'F');
      
      // Valor
      this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
      this.pdf.setFontSize(PDF_CONFIG.fonts.size.title);
      this.pdf.setTextColor(255, 255, 255);
      const valueWidth = this.pdf.getTextWidth(stat.value);
      this.pdf.text(stat.value, x + (cardWidth - valueWidth) / 2, this.currentY + 12);
      
      // Label
      this.pdf.setFont(PDF_CONFIG.fonts.primary, 'normal');
      this.pdf.setFontSize(PDF_CONFIG.fonts.size.caption);
      const labelWidth = this.pdf.getTextWidth(stat.label);
      this.pdf.text(stat.label, x + (cardWidth - labelWidth) / 2, this.currentY + 20);
    });
    
    this.currentY += cardHeight + 15;
    
    // Progress bar para taxa de conclusão
    this.pdf.setFont(PDF_CONFIG.fonts.primary, 'bold');
    this.pdf.setFontSize(PDF_CONFIG.fonts.size.body);
    this.pdf.setTextColor(PDF_CONFIG.colors.text);
    this.pdf.text(`Progresso Geral: ${completionRate.toFixed(1)}%`, PDF_CONFIG.margins.left, this.currentY);
    this.currentY += 8;
    
    // Barra de progresso
    const progressBarWidth = 150;
    const progressBarHeight = 8;
    
    // Background da barra
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(PDF_CONFIG.margins.left, this.currentY, progressBarWidth, progressBarHeight, 'F');
    
    // Progresso preenchido
    const filledWidth = (completionRate / 100) * progressBarWidth;
    this.pdf.setFillColor(PDF_CONFIG.colors.success);
    this.pdf.rect(PDF_CONFIG.margins.left, this.currentY, filledWidth, progressBarHeight, 'F');
    
    // Borda da barra
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(PDF_CONFIG.margins.left, this.currentY, progressBarWidth, progressBarHeight);
    
    this.currentY += 20;
  }

  // Gerar relatório completo
  public async generateReport(data: ReportData): Promise<Blob> {
    // Cabeçalho
    this.addHeader(data.title, data.subtitle, data.date);
    
    // Informações da obra se disponível
    if (data.obra) {
      this.addTextSection('Informações do Projeto', 
        `Nome: ${data.obra.nome}\n` +
        `Endereço: ${data.obra.endereco || 'Não informado'}\n` +
        `Data de Início: ${data.obra.data_inicio ? new Date(data.obra.data_inicio).toLocaleDateString('pt-BR') : 'Não definida'}\n` +
        `Data Prevista: ${data.obra.previsao_conclusao ? new Date(data.obra.previsao_conclusao).toLocaleDateString('pt-BR') : 'Não definida'}\n` +
        `Status: ${data.obra.status || 'Indefinido'}`
      );
    }
    
    // Estatísticas se há tarefas e obra
    if (data.obra && data.tasks && data.tasks.length > 0) {
      this.addProjectStats(data.obra, data.tasks);
    }
    
    // Tabela de tarefas se disponível
    if (data.tasks && data.tasks.length > 0) {
      this.addTasksTable(data.tasks);
    }
    
    // Seções personalizadas
    if (data.sections) {
      data.sections.forEach(section => {
        if (section.type === 'text') {
          this.addTextSection(section.title, section.content as string);
        }
      });
    }
    
    // Adicionar rodapé em todas as páginas
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.addFooter();
    }
    
    // Retornar como Blob
    const pdfOutput = this.pdf.output('blob');
    return pdfOutput;
  }
}

// Funções auxiliares para diferentes tipos de relatório
export async function generateProjectReport(obra: ObraTransformed, tasks: TaskTransformed[] = []): Promise<Blob> {
  const generator = new PDFReportGenerator();
  
  return generator.generateReport({
    title: 'Relatório do Projeto',
    subtitle: obra.nome,
    date: new Date(),
    obra,
    tasks
  });
}

export async function generateTaskReport(tasks: TaskTransformed[], title: string = 'Relatório de Tarefas'): Promise<Blob> {
  const generator = new PDFReportGenerator();
  
  return generator.generateReport({
    title,
    date: new Date(),
    tasks
  });
}

export async function generateCustomReport(data: ReportData): Promise<Blob> {
  const generator = new PDFReportGenerator();
  return generator.generateReport(data);
}

// Função para baixar PDF
export function downloadPDF(blob: Blob, filename: string = 'relatorio.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}