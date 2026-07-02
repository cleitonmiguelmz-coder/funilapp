// ===== lib/mpesa.ts =====
// Integração com M-Pesa OpenAPI (openapiportal.m-pesa.com)
// Fluxo de 2 passos:
//   1. Cifrar API Key com RSA/PublicKey → GET /getSession/ → Session Key
//   2. Cifrar Session Key com RSA/PublicKey → Bearer token → POST C2B

import crypto from 'crypto';

// ─── Variáveis de ambiente ────────────────────────────────────────────────────
//  MPESA_ENV                   → "sandbox" | "production"
//  MPESA_API_KEY               → API Key da tua aplicação no portal
//  MPESA_SERVICE_PROVIDER_CODE → Sandbox: 171717 | Produção: código Vodacom
//  MPESA_ORIGIN                → Sandbox: * | Produção: teu domínio
// (A Public Key está hardcoded abaixo — é pública e igual para todos)
// ─────────────────────────────────────────────────────────────────────────────

const MPESA_ENV = (process.env.MPESA_ENV || 'sandbox') as 'sandbox' | 'production';
const MPESA_API_KEY = process.env.MPESA_API_KEY!;
const MPESA_SPC     = process.env.MPESA_SERVICE_PROVIDER_CODE!;
const MPESA_ORIGIN  = process.env.MPESA_ORIGIN || '*';

// Public Key oficial do portal M-Pesa OpenAPI (igual para sandbox e produção)
const MPESA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArv9yxA69XQKBo24BaF/D
+fvlqmGdYjqLQ5WtNBb5tquqGvAvG3WMFETVUSow/LizQalxj2ElMVrUmzu5mGGk
xK08bWEXF7a1DEvtVJs6nppIlFJc2SnrU14AOrIrB28ogm58JjAl5BOQawOXD5df
Sk7MaAA82pVHoIqEu0FxA8BOKU+RGTihRU+ptw1j4bsAJYiPbSX6i71gfPvwHPYa
mM0bfI4CmlsUUR3KvCG24rB6FNPcRBhM3jDuv8ae2kC33w9hEq8qNB55uw51vK7h
yXoAa+U7IqP1y6nBdlN25gkxEA8yrsl1678cspeXr+3ciRyqoRgj9RD/ONbJhhxF
vt1cLBh+qwK2eqISfBb06eRnNeC71oBokDm3zyCnkOtMDGl7IvnMfZfEPFCfg5Qg
JVk1msPpRvQxmEsrX9MQRyFVzgy2CWNIb7c+jPapyrNwoUbANlN8adU1m6yOuoX7
F49x+OjiG2se0EJ6nafeKUXw/+hiJZvELUYgzKUtMAZVTNZfT8jjb58j8GVtuS+6
TM2AutbejaCV84ZK58E2CRJqhmjQibEUO6KPdD7oTlEkFy52Y1uOOBXgYpqMzufNP
mfdqqqSM4dU70PO8ogyKGiLAIxCetMjjm6FCMEA3Kc8K0Ig7/XtFm9By6VxTJK1M
g36TlHaZKP6VzVLXMtesJECAwEAAQ==
-----END PUBLIC KEY-----`;

// Endpoints Vodacom Mozambique
const BASE_URL = MPESA_ENV === 'production'
  ? 'https://openapi.m-pesa.com/openapi/ipg/v2/vodacomMOZ'
  : 'https://openapi.m-pesa.com/sandbox/ipg/v2/vodacomMOZ';

const SESSION_ENDPOINT = `${BASE_URL}/getSession/`;
const C2B_ENDPOINT     = `${BASE_URL}/c2bPayment/singleStage/`;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PedidoMpesa {
  telefone: string;           // ex: "258840000000"
  valor: number;              // em MZN
  referenciaInterna: string;  // ID da venda no Firestore
}

export interface RespostaMpesa {
  sucesso: boolean;
  transacaoId?: string;
  conversacaoId?: string;
  codigoResposta?: string;
  descricaoResposta?: string;
  erro?: string;
}

// ─── RSA: cifrar valor com Public Key (PKCS1) → Base64 ───────────────────────

function cifrarRSA(valor: string): string {
  const encrypted = crypto.publicEncrypt(
    { key: MPESA_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(valor, 'utf8')
  );
  return encrypted.toString('base64');
}

// ─── Passo 1: Gerar Session Key ───────────────────────────────────────────────
// API Key cifrada → Bearer → GET /getSession/ → Session Key

async function gerarSessionKey(): Promise<string> {
  const encryptedApiKey = cifrarRSA(MPESA_API_KEY);

  const res = await fetch(SESSION_ENDPOINT, {
    method: 'GET',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${encryptedApiKey}`,
      'Origin':        MPESA_ORIGIN,
    },
  });

  const data = await res.json();

  if (data?.output_ResponseCode !== 'INS-0') {
    throw new Error(
      `Falha ao gerar Session Key: ${data?.output_ResponseCode} — ${data?.output_ResponseDesc || ''}`
    );
  }

  return data.output_SessionID as string;
}

// ─── Normalizar telefone ──────────────────────────────────────────────────────
// Formato: 258XXXXXXXXX (12 dígitos)

function normalizarTelefone(tel: string): string {
  const limpo = tel.replace(/[\s\-\+]/g, '');
  if (limpo.startsWith('258') && limpo.length === 12) return limpo;
  if (limpo.startsWith('8') && limpo.length === 9) return `258${limpo}`;
  return limpo;
}

// ─── Gerar referência de transacção (máx 20 chars alfanuméricos) ──────────────

function gerarRefTransaccao(vendaId: string): string {
  const sufixo = vendaId.replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  return `FL${ts}${sufixo}`.slice(0, 20);
}

// ─── Iniciar pagamento C2B ────────────────────────────────────────────────────
// Passo 2: Session Key cifrada → Bearer → POST C2B → USSD Push no cliente

export async function iniciarPagamentoMpesa(
  pedido: PedidoMpesa
): Promise<RespostaMpesa> {
  try {
    // Passo 1: obter Session Key
    const sessionKey = await gerarSessionKey();

    // Passo 2: cifrar Session Key → Bearer token
    const encryptedSessionKey = cifrarRSA(sessionKey);

    const telefone   = normalizarTelefone(pedido.telefone);
    const refTransac = gerarRefTransaccao(pedido.referenciaInterna);

    const body = {
      input_Amount:               String(pedido.valor),
      input_Country:              'MOZ',
      input_Currency:             'MZN',
      input_CustomerMSISDN:       telefone,
      input_ServiceProviderCode:  MPESA_SPC,
      input_ThirdPartyReference:  pedido.referenciaInterna.slice(0, 20),
      input_TransactionReference: refTransac,
    };

    const res = await fetch(C2B_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${encryptedSessionKey}`,
        'Origin':        MPESA_ORIGIN,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    const codigoResposta = data?.output_ResponseCode   as string | undefined;
    const descricao      = data?.output_ResponseDesc   as string | undefined;
    const transacaoId    = data?.output_TransactionID  as string | undefined;
    const conversacaoId  = data?.output_ConversationID as string | undefined;

    if (codigoResposta === 'INS-0') {
      return { sucesso: true, transacaoId, conversacaoId, codigoResposta, descricaoResposta: descricao };
    }

    return {
      sucesso: false,
      codigoResposta,
      descricaoResposta: descricao,
      erro: traduzirErroMpesa(codigoResposta, descricao),
    };

  } catch (err: any) {
    return {
      sucesso: false,
      erro: err?.message || 'Erro de rede ao contactar M-Pesa.',
    };
  }
}

// ─── Tradução de códigos de erro ──────────────────────────────────────────────

function traduzirErroMpesa(codigo?: string, descricao?: string): string {
  const erros: Record<string, string> = {
    'INS-1':   'Erro interno M-Pesa. Tenta novamente.',
    'INS-5':   'Transacção cancelada pelo cliente.',
    'INS-6':   'Falha na transacção. Verifica o saldo.',
    'INS-9':   'Pedido duplicado. Aguarda e tenta de novo.',
    'INS-10':  'Erro no sistema M-Pesa. Tenta mais tarde.',
    'INS-13':  'Serviço indisponível. Tenta mais tarde.',
    'INS-14':  'Limite de transacções atingido.',
    'INS-15':  'Não autorizado. Verifica o PIN.',
    'INS-16':  'PIN errado.',
    'INS-17':  'PIN temporariamente bloqueado.',
    'INS-18':  'Saldo insuficiente na conta M-Pesa.',
    'INS-19':  'Montante inválido.',
    'INS-20':  'Número de telefone inválido.',
    'INS-21':  'Número não registado no M-Pesa.',
    'INS-22':  'Cliente não encontrado.',
    'INS-26':  'Não autorizado a realizar esta operação.',
    'INS-989': 'Falha na criação da sessão. Verifica a API Key.',
    'INS-993': 'Credenciais inválidas.',
    'INS-994': 'Código de comerciante inválido.',
    'INS-995': 'Permissão negada.',
    'INS-996': 'Conta suspensa. Contacta a Vodacom.',
    'INS-997': 'Session Key inválida.',
    'INS-998': 'API Key inválida.',
    'INS-2006':'Session Key expirada. Tenta novamente.',
  };
  return erros[codigo ?? ''] || descricao || 'Erro desconhecido no M-Pesa.';
}
