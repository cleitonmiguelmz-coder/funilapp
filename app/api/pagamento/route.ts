// ===== app/api/pagamento/route.ts =====
// Substituição completa: remove DebitoPay, usa M-Pesa oficial directamente

import { NextRequest, NextResponse } from 'next/server';
import { iniciarPagamentoMpesa } from '@/lib/mpesa';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, serverTimestamp,
  doc, getDoc, updateDoc, increment
} from 'firebase/firestore';
import { calcularDivisao } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      produtoId,
      afiliadoId,
      compradorNome,
      compradorEmail,
      compradorTelefone,
      metodo,
    } = body;

    // ── Validação de campos obrigatórios ────────────────────────────────────
    if (!produtoId || !compradorNome || !compradorTelefone || !metodo) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios em falta.' },
        { status: 400 }
      );
    }

    // Por agora só M-Pesa está activo; E-Mola será adicionado depois
    if (!['mpesa', 'emola'].includes(metodo)) {
      return NextResponse.json(
        { erro: 'Método de pagamento inválido.' },
        { status: 400 }
      );
    }

    if (metodo === 'emola') {
      return NextResponse.json(
        { erro: 'E-Mola ainda não está disponível. Usa o M-Pesa.' },
        { status: 400 }
      );
    }

    // ── Buscar produto ──────────────────────────────────────────────────────
    const produtoSnap = await getDoc(doc(db, 'produtos', produtoId));
    if (!produtoSnap.exists()) {
      return NextResponse.json(
        { erro: 'Produto não encontrado.' },
        { status: 404 }
      );
    }

    const produto = produtoSnap.data();

    if (produto.status !== 'activo') {
      return NextResponse.json(
        { erro: 'Produto não está disponível.' },
        { status: 400 }
      );
    }

    // ── Calcular divisão de receitas ────────────────────────────────────────
    const temAfiliado = !!afiliadoId;
    const { criador, afiliado, plataforma } = calcularDivisao(
      produto.preco,
      produto.percentagemAfiliado,
      temAfiliado
    );

    // ── Criar registo de venda com status 'pendente' ─────────────────────────
    const vendaRef = await addDoc(collection(db, 'vendas'), {
      produtoId,
      criadorId: produto.userId,
      afiliadoId: afiliadoId || null,
      compradorNome,
      compradorEmail: compradorEmail || '',
      compradorTelefone,
      valor: produto.preco,
      valorCriador: criador,
      valorAfiliado: afiliado,
      valorPlataforma: plataforma,
      status: 'pendente',
      metodoPagamento: metodo,
      createdAt: serverTimestamp(),
    });

    // ── Chamar API oficial M-Pesa (C2B USSD Push) ──────────────────────────
    const resultado = await iniciarPagamentoMpesa({
      telefone: compradorTelefone,
      valor: produto.preco,
      referenciaInterna: vendaRef.id,
    });

    if (!resultado.sucesso) {
      // Marcar a venda como falhada para rastreio
      await updateDoc(vendaRef, {
        status: 'falhado',
        erroMpesa: resultado.codigoResposta || 'desconhecido',
        erroDescricao: resultado.erro || '',
        falhadoEm: serverTimestamp(),
      });

      return NextResponse.json(
        { erro: resultado.erro || 'Erro ao processar pagamento M-Pesa.' },
        { status: 502 }
      );
    }

    // ── Pagamento M-Pesa confirmado (INS-0 = síncrono) ─────────────────────
    await updateDoc(vendaRef, {
      status: 'pago',
      transacaoId: resultado.transacaoId || '',
      conversacaoId: resultado.conversacaoId || '',
      mpesaResponseCode: resultado.codigoResposta,
      pagoEm: serverTimestamp(),
    });

    // Actualizar métricas do produto
    await updateDoc(doc(db, 'produtos', produtoId), {
      totalVendas: increment(1),
      totalReceita: increment(produto.preco),
    });

    return NextResponse.json({
      sucesso: true,
      vendaId: vendaRef.id,
      metodo: 'mpesa',
      transacaoId: resultado.transacaoId,
      mensagem: 'Pagamento confirmado via M-Pesa.',
    });

  } catch (err: any) {
    console.error('[api/pagamento] Erro inesperado:', err);
    return NextResponse.json(
      { erro: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
