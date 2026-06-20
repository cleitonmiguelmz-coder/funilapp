// ===== DOWNLOAD SEGURO — lib/download.ts =====
// Gera links temporários assinados via Firebase Storage
// e guarda tokens no Firestore para validação

import {
  doc, addDoc, getDoc, getDocs,
  collection, query, where, updateDoc,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const HORAS_VALIDADE = 48;

// ─────────────────────────────────────────────
// GERAR LINK SEGURO
// Chamado após pagamento confirmado
// ─────────────────────────────────────────────
export async function gerarLinkDownload(
  vendaId: string,
  produtoId: string,
  compradorTelefone: string,
  arquivoPath: string // ex: marketplace/produtos/userId/ficheiro.pdf
): Promise<string> {

  // 1. Gerar token único
  const token = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

  // 2. Calcular expiração (48 horas)
  const expiraEm = new Date();
  expiraEm.setHours(expiraEm.getHours() + HORAS_VALIDADE);

  // 3. Guardar token no Firestore
  await addDoc(collection(db, 'download_tokens'), {
    token,
    vendaId,
    produtoId,
    compradorTelefone,
    arquivoPath,
    expiraEm: Timestamp.fromDate(expiraEm),
    usado: false,
    usos: 0,
    maxUsos: 3, // permite até 3 downloads com o mesmo link
    createdAt: serverTimestamp(),
  });

  // 4. Retornar URL da página de download (não o link directo do Storage)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://funilmarket.co.mz';
  return `${baseUrl}/market/download/${token}`;
}

// ─────────────────────────────────────────────
// VALIDAR E SERVIR DOWNLOAD
// Chamado quando o comprador clica no link
// ─────────────────────────────────────────────
export async function validarEObterDownload(token: string): Promise<{
  ok: boolean;
  url?: string;
  erro?: 'expirado' | 'invalido' | 'limite';
}> {

  // 1. Buscar token no Firestore
  const q = query(
    collection(db, 'download_tokens'),
    where('token', '==', token)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { ok: false, erro: 'invalido' };
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();

  // 2. Verificar expiração
  const expiraEm: Date = data.expiraEm?.toDate?.() ?? new Date(0);
  if (new Date() > expiraEm) {
    return { ok: false, erro: 'expirado' };
  }

  // 3. Verificar limite de usos
  if (data.usos >= data.maxUsos) {
    return { ok: false, erro: 'limite' };
  }

  // 4. Incrementar contagem de usos
  await updateDoc(doc(db, 'download_tokens', docSnap.id), {
    usos: (data.usos || 0) + 1,
    ultimoUso: serverTimestamp(),
  });

  // 5. Gerar URL assinado temporário do Firebase Storage (1 hora)
  // Nota: getDownloadURL do Firebase SDK já gera URLs com token de acesso
  // Para URLs que expirem, usa Firebase Admin SDK no servidor (ver nota abaixo)
  try {
    const fileRef = ref(storage, data.arquivoPath);
    const url = await getDownloadURL(fileRef);
    return { ok: true, url };
  } catch {
    return { ok: false, erro: 'invalido' };
  }
}

// ─────────────────────────────────────────────
// REVOGAR TOKEN (ex: após reembolso)
// ─────────────────────────────────────────────
export async function revogarToken(token: string): Promise<void> {
  const q = query(
    collection(db, 'download_tokens'),
    where('token', '==', token)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(doc(db, 'download_tokens', snap.docs[0].id), {
      expiraEm: Timestamp.fromDate(new Date(0)), // expira imediatamente
    });
  }
}

// ─────────────────────────────────────────────
// LIMPAR TOKENS EXPIRADOS (cron job diário)
// Chama esta função numa Cloud Function agendada
// ─────────────────────────────────────────────
export async function limparTokensExpirados(): Promise<number> {
  const agora = Timestamp.now();
  const q = query(
    collection(db, 'download_tokens'),
    where('expiraEm', '<', agora)
  );
  const snap = await getDocs(q);
  // Em produção usarias batch delete via Admin SDK
  console.log(`${snap.size} tokens expirados para limpar`);
  return snap.size;
}
