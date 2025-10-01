// Utilities para parsing de XML/NFe
export interface NFItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnit: number;
}

export interface NFData {
  fornecedor: string;
  cnpj: string;
  chave: string;
  emissao: string;
  itens: NFItem[];
}

// Função para validar CNPJ
export function validCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  
  if (digits.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Validação dos dígitos verificadores
  const calcDigit = (digits: string, pos: number) => {
    let sum = 0;
    let weight = pos - 7;
    
    for (let i = 0; i < pos; i++) {
      sum += parseInt(digits.charAt(i)) * weight--;
      if (weight < 2) weight = 9;
    }
    
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  
  const digit1 = calcDigit(digits, 12);
  const digit2 = calcDigit(digits, 13);
  
  return digit1 === parseInt(digits.charAt(12)) && 
         digit2 === parseInt(digits.charAt(13));
}

// Função para formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Parser básico de XML para NFe
export async function parseNFeXML(file: File): Promise<NFData | null> {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    // Verificar se houve erro no parsing
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Erro ao fazer parsing do XML');
    }
    
    // Buscar dados do emitente (fornecedor)
    const emit = xmlDoc.querySelector('emit');
    const fornecedor = emit?.querySelector('xNome')?.textContent || 'Fornecedor não identificado';
    const cnpj = emit?.querySelector('CNPJ')?.textContent || '';
    
    // Buscar chave da NFe
    const infNFe = xmlDoc.querySelector('infNFe');
    const chave = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';
    
    // Buscar data de emissão
    const dhEmi = xmlDoc.querySelector('dhEmi')?.textContent || new Date().toISOString();
    
    // Buscar itens
    const detElements = xmlDoc.querySelectorAll('det');
    const itens: NFItem[] = [];
    
    detElements.forEach((det, index) => {
      const prod = det.querySelector('prod');
      if (prod) {
        const codigo = prod.querySelector('cProd')?.textContent || `item-${index + 1}`;
        const descricao = prod.querySelector('xProd')?.textContent || 'Produto não identificado';
        const quantidade = parseFloat(prod.querySelector('qCom')?.textContent || '0');
        const unidade = prod.querySelector('uCom')?.textContent || 'un';
        const valorUnit = parseFloat(prod.querySelector('vUnCom')?.textContent || '0');
        
        itens.push({
          codigo,
          descricao,
          quantidade,
          unidade,
          valorUnit,
        });
      }
    });
    
    return {
      fornecedor,
      cnpj,
      chave,
      emissao: dhEmi,
      itens,
    };
  } catch (error) {
    console.error('Erro ao processar XML:', error);
    return null;
  }
}

// Função para gerar dados mock para desenvolvimento/demonstração
export function generateMockNFData(fileName: string): NFData {
  const mockItems: NFItem[] = [
    { codigo: 'CIMENTO001', descricao: 'Cimento Portland CP II-E-32', quantidade: 50, unidade: 'sc', valorUnit: 32.50 },
    { codigo: 'BRITA001', descricao: 'Brita 1 - Graduada', quantidade: 10, unidade: 'm³', valorUnit: 110.00 },
    { codigo: 'AREIA001', descricao: 'Areia Média Lavada', quantidade: 15, unidade: 'm³', valorUnit: 95.00 },
    { codigo: 'FERRO001', descricao: 'Vergalhão CA-50 12mm', quantidade: 200, unidade: 'un', valorUnit: 38.75 },
    { codigo: 'BLOCO001', descricao: 'Bloco Cerâmico 9x19x39', quantidade: 1000, unidade: 'un', valorUnit: 1.85 },
  ];
  
  return {
    fornecedor: 'Construmat Materiais Ltda',
    cnpj: '12.345.678/0001-90',
    chave: 'NFe' + Math.floor(Math.random() * 1000000000000000).toString().padStart(44, '0'),
    emissao: new Date().toISOString(),
    itens: mockItems,
  };
}

// Validar se arquivo é XML válido
export function isValidXMLFile(file: File): boolean {
  const validExtensions = ['.xml', '.XML'];
  const fileName = file.name;
  return validExtensions.some(ext => fileName.endsWith(ext));
}

// Calcular totais da NFe
export function calculateNFTotals(nfData: NFData) {
  const totalQuantidade = nfData.itens.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = nfData.itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnit), 0);
  const totalItens = nfData.itens.length;
  
  return {
    totalQuantidade,
    totalValor,
    totalItens,
  };
}