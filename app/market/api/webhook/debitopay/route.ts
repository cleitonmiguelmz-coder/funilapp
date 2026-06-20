// ===== app/api/webhook/debitopay/route.ts =====

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.DEBITOPAY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verificar assinatura HMAC-SHA256
    const assinaturaRecebida = req.headers.get('x-webhook-signature') || '';
    const assinaturaEsperada = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (assinaturaRecebida !== assinaturaEsperada) {
      console.warn('[webhook/debitopay] Assinatura inválida');
      return NextResponse.json({ erro: 'Assinatura inválida.' }, { status: 401 });
    }

    const { event, data } = JSON.parse(rawBody);

    if (event === 'payment.completed') {
      const vendaId = data?.metadata?.venda_id;
      if (!vendaId) return NextResponse.json({ recebido: true });

      const vendaRef = doc(db, 'vendas', vendaId);

      await updateDoc(vendaRef, {
        status: 'pago',
        transacaoId: data?.transaction_id || data?.id,
        pagoEm: new Date(),
      });

      const vendaSnap = await getDoc(vendaRef);
      if (vendaSnap.exists()) {
        const venda = vendaSnap.data();
        await updateDoc(doc(db, 'produtos', venda.produtoId), {
          totalVendas: increment(1),
          totalReceita: increment(venda.valor),
        });
      }

      return NextResponse.json({ recebido: true, processado: 'payment.completed' });
    }

    if (event === 'payment.failed') {
      const vendaId = data?.metadata?.venda_id;
      if (vendaId) {
        await updateDoc(doc(db, 'vendas', vendaId), {
          status: 'falhou',
          erroWebhook: data?.message || 'Pagamento falhou.',
        });
      }
      return NextResponse.json({ recebido: true, processado: 'payment.failed' });
    }

    return NextResponse.json({ recebido: true });
  } catch (err: any) {
    console.error('[webhook/debitopay] Erro:', err);
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }
}
