// ===== app/api/pagamento/route.ts =====

import { NextRequest, NextResponse } from 'next/server';
import { iniciarPagamento, MetodoPagamento } from '@/lib/debitopay';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { calcularDivisao } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { produtoId, afiliadoId, compradorNome, compradorEmail, compradorTelefone, metodo } = body;

    if (!produtoId || !compradorNome || !compradorEmail || !compradorTelefone || !metodo) {
      return NextResponse.json({ erro: 'Campos obrigatórios em falta.' }, { status: 400 });
    }

    if (!['mpesa', 'emola'].includes(metodo)) {
      return NextResponse.json({ erro: 'Método de pagamento inválido.' }, { status: 400 });
    }

    // Buscar produto
    const produtoSnap = await getDoc(doc(db, 'produtos', produtoId));
    if (!produtoSnap.exists()) {
      return NextResponse.json({ erro: 'Produto não encontrado.' }, { status: 404 });
    }

    const produto = produtoSnap.data();

    if (produto.status !== 'activo') {
      return NextResponse.json({ erro: 'Produto não está disponível.' }, { status: 400 });
    }

    // Calcular divisão
    const temAfiliado = !!afiliadoId;
    const { criador, afiliado, plataforma } = calcularDivisao(
      produto.preco,
      produto.percentagemAfiliado,
      temAfiliado
    );

    // Criar venda com status 'pendente'
    const vendaRef = await addDoc(collection(db, 'vendas'), {
      produtoId,
      criadorId: produto.userId,
      afiliadoId: afiliadoId || null,
      compradorNome,
      compradorEmail,
      compradorTelefone,
      valor: produto.preco,
      valorCriador: criador,
      valorAfiliado: afiliado,
      valorPlataforma: plataforma,
      status: 'pendente',
      metodoPagamento: metodo,
      createdAt: serverTimestamp(),
    });

    // Chamar DebitoPay
    const resultado = await iniciarPagamento({
      metodo: metodo as MetodoPagamento,
      valor: produto.preco,
      telefone: compradorTelefone,
      referenciaInterna: vendaRef.id,
    });

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.erro || 'Erro ao processar pagamento.' },
        { status: 502 }
      );
    }

    // M-Pesa: síncrono — confirmar já
    if (metodo === 'mpesa') {
      await updateDoc(vendaRef, {
        status: 'pago',
        transacaoId: resultado.transacaoId,
        pagoEm: serverTimestamp(),
      });

      await updateDoc(doc(db, 'produtos', produtoId), {
        totalVendas: increment(1),
        totalReceita: increment(produto.preco),
      });

      return NextResponse.json({
        sucesso: true,
        vendaId: vendaRef.id,
        metodo: 'mpesa',
        mensagem: 'Pagamento confirmado via M-Pesa.',
      });
    }

    // e-Mola: assíncrono — aguardar webhook
    return NextResponse.json({
      sucesso: true,
      vendaId: vendaRef.id,
      metodo: 'emola',
      mensagem: 'Pedido enviado. Confirma no teu telemóvel.',
      aguardaWebhook: true,
    });
  } catch (err: any) {
    console.error('[api/pagamento] Erro:', err);
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 });
  }
}
