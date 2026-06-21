// ===== app/api/pagamento/status/route.ts =====

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const vendaId = req.nextUrl.searchParams.get('vendaId');

  if (!vendaId) {
    return NextResponse.json({ erro: 'vendaId em falta.' }, { status: 400 });
  }

  try {
    const snap = await getDoc(doc(db, 'vendas', vendaId));

    if (!snap.exists()) {
      return NextResponse.json({ erro: 'Venda não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ status: snap.data().status });
  } catch (err) {
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 });
  }
}
