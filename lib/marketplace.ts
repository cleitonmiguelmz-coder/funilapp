// ===== FIRESTORE HELPERS — FUNIL MARKET =====
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, setDoc, query, where, orderBy, serverTimestamp, increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Produto, Venda, Afiliado, Cashout, calcularDivisao } from './types';
import { gerarLinkDownload } from './download';
import { enviarEmailVenda } from './email';

// ---------- PRODUTOS ----------

export async function criarProduto(data: Omit<Produto, 'id' | 'totalVendas' | 'totalReceita' | 'createdAt'>) {
  const limpo: Record<string, any> = {};
  Object.entries(data).forEach(([k, v]) => {
    limpo[k] = v === undefined ? null : v;
  });
  const ref = await addDoc(collection(db, 'produtos'), {
    ...limpo,
    status: 'pendente',
    totalVendas: 0,
    totalReceita: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProduto(id: string): Promise<Produto | null> {
  const snap = await getDoc(doc(db, 'produtos', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Produto;
}

export async function getProdutosActivos(): Promise<Produto[]> {
  const q = query(
    collection(db, 'produtos'),
    where('status', '==', 'activo'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Produto));
}

export async function getProdutosDoCriador(userId: string): Promise<Produto[]> {
  const q = query(
    collection(db, 'produtos'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Produto));
}

export async function activarProduto(produtoId: string) {
  await updateDoc(doc(db, 'produtos', produtoId), { status: 'activo' });
}

// ---------- AFILIADOS ----------

export async function tornarAfiliado(userId: string, produtoId: string): Promise<string> {
  const q = query(
    collection(db, 'afiliados'),
    where('userId', '==', userId),
    where('produtoId', '==', produtoId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].data().linkUnico;
  const linkUnico = Math.random().toString(36).substring(2, 9);
  await addDoc(collection(db, 'afiliados'), {
    userId,
    produtoId,
    linkUnico,
    totalVendas: 0,
    totalGanhos: 0,
    createdAt: serverTimestamp(),
  });
  return linkUnico;
}

export async function getAfiliadoPorLink(linkUnico: string): Promise<Afiliado | null> {
  const q = query(collection(db, 'afiliados'), where('linkUnico', '==', linkUnico));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Afiliado;
}

export async function getAfiliadosDoUtilizador(userId: string): Promise<Afiliado[]> {
  const q = query(
    collection(db, 'afiliados'),
    where('userId', '==', userId),
    orderBy('totalGanhos', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Afiliado));
}

// ---------- VENDAS ----------

export async function processarVenda(data: {
  produtoId: string;
  criadorId: string;
  afiliadoId?: string | null;
  afiliadoRef?: string | null;
  compradorNome: string;
  compradorEmail: string;
  compradorTelefone: string;
  valor: number;
  percentagemAfiliado: number;
  metodoPagamento?: 'mpesa' | 'emola';
}): Promise<{ vendaId: string; linkDownload: string }> {

  const temAfiliado = !!(data.afiliadoId || data.afiliadoRef);
  const { plataforma, afiliado, criador } = calcularDivisao(
    data.valor,
    data.percentagemAfiliado,
    temAfiliado
  );

  // 1. Registar venda
  const vendaRef = await addDoc(collection(db, 'vendas'), {
    produtoId: data.produtoId,
    criadorId: data.criadorId,
    afiliadoId: data.afiliadoId ?? null,
    afiliadoRef: data.afiliadoRef ?? null,
    compradorNome: data.compradorNome,
    compradorEmail: data.compradorEmail,
    compradorTelefone: data.compradorTelefone,
    valor: data.valor,
    valorCriador: criador,
    valorAfiliado: afiliado,
    valorPlataforma: plataforma,
    metodoPagamento: data.metodoPagamento ?? 'mpesa',
    status: 'pago',
    createdAt: serverTimestamp(),
  });

  // 2. Buscar produto para obter o caminho do ficheiro
  const produtoSnap = await getDoc(doc(db, 'produtos', data.produtoId));
  const produto = produtoSnap.data();

  if (!produto?.arquivoUrl) {
    throw new Error('Produto sem ficheiro associado');
  }

  // 3. Extrair path do Storage a partir da URL
  const arquivoPath = decodeURIComponent(
    produto.arquivoUrl.split('/o/')[1]?.split('?')[0] ?? ''
  );

  // 4. Gerar link seguro de download (48h, máx 3 usos)
  const linkDownload = await gerarLinkDownload(
    vendaRef.id,
    data.produtoId,
    data.compradorTelefone,
    arquivoPath
  );

  // 5. Actualizar métricas do produto
  await updateDoc(doc(db, 'produtos', data.produtoId), {
    totalVendas: increment(1),
    totalReceita: increment(data.valor),
  });

  // 6. Actualizar métricas do afiliado
  if (data.afiliadoId) {
    const q = query(
      collection(db, 'afiliados'),
      where('userId', '==', data.afiliadoId),
      where('produtoId', '==', data.produtoId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'afiliados', snap.docs[0].id), {
        totalVendas: increment(1),
        totalGanhos: increment(afiliado),
      });
    }
  }

  // 7. Guardar link na venda para referência
  await updateDoc(vendaRef, { linkDownload });

  // 8. ── NOVO: Buscar dados do criador e enviar email de notificação ──
  // Feito em background — não bloqueia a resposta ao comprador
  getDoc(doc(db, 'users', data.criadorId)).then(criadorSnap => {
    if (!criadorSnap.exists()) return;
    const criadorData = criadorSnap.data();
    if (!criadorData?.email) return;

    enviarEmailVenda({
      criadorEmail: criadorData.email,
      criadorNome: criadorData.nome || criadorData.email,
      produtoNome: produto.nome,
      compradorNome: data.compradorNome,
      compradorTelefone: data.compradorTelefone,
      valor: data.valor,
      valorCriador: criador,
      metodoPagamento: data.metodoPagamento ?? 'mpesa',
      vendaId: vendaRef.id,
    }).catch(err => console.error('Email de venda falhou:', err));
  }).catch(err => console.error('Erro ao buscar criador:', err));

  return { vendaId: vendaRef.id, linkDownload };
}

export async function getVendasDoCriador(criadorId: string): Promise<Venda[]> {
  const q = query(
    collection(db, 'vendas'),
    where('criadorId', '==', criadorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Venda));
}

// ---------- CASHOUTS ----------

export async function pedirCashout(data: Omit<Cashout, 'id' | 'status' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'cashouts'), {
    ...data,
    status: 'pendente',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getCashoutsDoUtilizador(userId: string): Promise<Cashout[]> {
  const q = query(
    collection(db, 'cashouts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashout));
}

// ---------- SALDO DISPONÍVEL ----------

export async function calcularSaldoDisponivel(userId: string): Promise<number> {
  let total = 0;
  const qCriador = query(collection(db, 'vendas'), where('criadorId', '==', userId), where('status', '==', 'pago'));
  const snapCriador = await getDocs(qCriador);
  snapCriador.forEach(d => { total += d.data().valorCriador; });
  const qAfiliado = query(collection(db, 'vendas'), where('afiliadoId', '==', userId), where('status', '==', 'pago'));
  const snapAfiliado = await getDocs(qAfiliado);
  snapAfiliado.forEach(d => { total += d.data().valorAfiliado; });
  const qCash = query(collection(db, 'cashouts'), where('userId', '==', userId), where('status', '==', 'pago'));
  const snapCash = await getDocs(qCash);
  snapCash.forEach(d => { total -= d.data().valor; });
  return Math.max(0, total);
}

// ---------- RELATÓRIOS ----------

export async function getRelatorio(userId: string, diasAtras: number = 30) {
  const desde = new Date();
  desde.setDate(desde.getDate() - diasAtras);
  const q = query(collection(db, 'vendas'), where('criadorId', '==', userId), where('status', '==', 'pago'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const vendas = snap.docs.map(d => ({ id: d.id, ...d.data() } as Venda));
  const vendasPeriodo = vendas.filter(v => {
    const data = (v.createdAt as any)?.toDate?.() ?? new Date();
    return data >= desde;
  });
  const receita = vendasPeriodo.reduce((s, v) => s + v.valorCriador, 0);
  const totalVendas = vendasPeriodo.length;
  const porDia: Record<string, number> = {};
  vendasPeriodo.forEach(v => {
    const data = (v.createdAt as any)?.toDate?.() ?? new Date();
    const chave = data.toLocaleDateString('pt-MZ');
    porDia[chave] = (porDia[chave] || 0) + 1;
  });
  const porMetodo: Record<string, number> = { mpesa: 0, emola: 0 };
  vendasPeriodo.forEach(v => {
    const m = (v as any).metodoPagamento || 'mpesa';
    porMetodo[m] = (porMetodo[m] || 0) + 1;
  });
  return { receita, totalVendas, porDia, porMetodo, vendasRecentes: vendasPeriodo.slice(0, 10) };
}

// ---------- INTEGRAÇÕES ----------

export async function getIntegracoes(userId: string): Promise<{
  configs: Record<string, Record<string, string>>;
  statuses: Record<string, 'activo' | 'inactivo'>;
} | null> {
  const snap = await getDoc(doc(db, 'integracoes', userId));
  if (!snap.exists()) return null;
  return snap.data() as {
    configs: Record<string, Record<string, string>>;
    statuses: Record<string, 'activo' | 'inactivo'>;
  };
}

export async function salvarIntegracao(userId: string, integracaoId: string, config: Record<string, string>): Promise<void> {
  const ref = doc(db, 'integracoes', userId);
  await setDoc(ref, {
    [`configs.${integracaoId}`]: config,
    [`statuses.${integracaoId}`]: 'activo',
  }, { merge: true });
}

export async function desactivarIntegracao(userId: string, integracaoId: string): Promise<void> {
  const ref = doc(db, 'integracoes', userId);
  await setDoc(ref, {
    [`configs.${integracaoId}`]: null,
    [`statuses.${integracaoId}`]: 'inactivo',
  }, { merge: true });
}