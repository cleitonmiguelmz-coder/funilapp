// ===== lib/debitopay.ts =====

const DEBITOPAY_URL = 'https://gyqoaningqhurhvdugne.supabase.co/functions/v1/payment-orchestrator';
const API_KEY = process.env.DEBITOPAY_API_KEY!;
const MERCHANT_ID = process.env.DEBITOPAY_MERCHANT_ID!;
const WALLET_CODE = process.env.DEBITOPAY_WALLET_CODE!;

export type MetodoPagamento = 'mpesa' | 'emola';

export interface PedidoPagamento {
  metodo: MetodoPagamento;
  valor: number;
  telefone: string;
  referenciaInterna: string;
}

export interface RespostaPagamento {
  sucesso: boolean;
  transacaoId?: string;
  status?: string;
  mensagem?: string;
  erro?: string;
}

export async function iniciarPagamento(pedido: PedidoPagamento): Promise<RespostaPagamento> {
  const telefone = normalizarTelefone(pedido.telefone);

  const body = {
    action: 'process',
    payment_method: pedido.metodo,
    merchant_id: MERCHANT_ID,
    wallet_code: WALLET_CODE,
    amount: pedido.valor,
    currency: 'MZN',
    phone: telefone,
    metadata: {
      venda_id: pedido.referenciaInterna,
    },
  };

  try {
    const res = await fetch(DEBITOPAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return { sucesso: false, erro: data?.message || `Erro HTTP ${res.status}` };
    }

    return {
      sucesso: true,
      transacaoId: data?.transaction_id || data?.id,
      status: data?.status,
      mensagem: data?.message,
    };
  } catch (err: any) {
    return { sucesso: false, erro: err?.message || 'Erro de rede ao contactar DebitoPay' };
  }
}

function normalizarTelefone(tel: string): string {
  const limpo = tel.replace(/[\s\-]/g, '');
  if (limpo.startsWith('+258')) return limpo;
  if (limpo.startsWith('258')) return `+${limpo}`;
  if (limpo.startsWith('8')) return `+258${limpo}`;
  return limpo;
}
