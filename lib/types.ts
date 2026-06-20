// ===== lib/types.ts — VERSÃO ACTUALIZADA =====

export interface Produto {
  id?: string;
  userId: string;
  nome: string;
  descricao: string;
  // Novos campos de detalhe
  subtitulo?: string;           // Ex: "O guia definitivo para emagrecer em 30 dias"
  bullets?: string[];           // Ex: ["Como perder 5kg em 30 dias", "Receitas práticas"]
  paraQuem?: string[];          // Ex: ["Quem quer emagrecer", "Iniciantes"]
  garantiaDias?: number;        // 0 = sem garantia, 7, 14, 30
  idioma?: string;              // Ex: "Português"
  paginas?: number;             // Para ebooks
  duracao?: string;             // Para cursos ex: "4 horas"
  nivel?: 'Iniciante' | 'Intermédio' | 'Avançado';
  // Campos existentes
  preco: number;
  imagemUrl: string;
  arquivoUrl: string;
  categoria: string;
  percentagemAfiliado: number;
  status: 'pendente' | 'activo' | 'pausado';
  totalVendas: number;
  totalReceita: number;
  createdAt: any;
}

export interface Venda {
  id?: string;
  produtoId: string;
  criadorId: string;
  afiliadoId: string | null;
  compradorNome: string;
  compradorEmail: string;
  compradorTelefone: string;
  valor: number;
  valorCriador: number;
  valorAfiliado: number;
  valorPlataforma: number;
  status: 'pendente' | 'pago' | 'reembolsado';
  createdAt: any;
}

export interface Afiliado {
  id?: string;
  userId: string;
  produtoId: string;
  linkUnico: string;
  totalVendas: number;
  totalGanhos: number;
  createdAt: any;
}

export interface Cashout {
  id?: string;
  userId: string;
  valor: number;
  metodo: 'mpesa' | 'emola';
  numero: string;
  status: 'pendente' | 'pago' | 'rejeitado';
  createdAt: any;
}

export function calcularDivisao(valor: number, percentagemAfiliado: number, temAfiliado: boolean) {
  const plataforma = valor * 0.15; // FunilMarket → 15%
  const afiliado = temAfiliado ? valor * (percentagemAfiliado / 100) : 0;
  const criador = valor - plataforma - afiliado;
  return { plataforma, afiliado, criador };
}
