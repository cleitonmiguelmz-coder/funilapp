import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // ajusta ao teu path real do firebase.ts

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  notas?: string;
  ativo: boolean;
  createdAt: Timestamp;
}

export interface Venda {
  id: string;
  descricao: string;
  valor: number;
  data: Timestamp;
  createdAt: Timestamp;
}

export type EstagioLead = "Novo Lead" | "Proposta" | "Negociação" | "Fechado Ganhou" | "Fechado Perdeu";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  origem: string;
  estagio: EstagioLead;
  valor: number;
  createdAt: Timestamp;
}

// ---------- Clientes ----------

export function clientesCol(uid: string) {
  return collection(db, "users", uid, "clientes");
}

export function addCliente(
  uid: string,
  data: { nome: string; telefone: string; notas?: string }
) {
  return addDoc(clientesCol(uid), {
    ...data,
    ativo: true,
    createdAt: Timestamp.now(),
  });
}

export function updateCliente(
  uid: string,
  clienteId: string,
  data: Partial<{ nome: string; telefone: string; notas: string; ativo: boolean }>
) {
  return updateDoc(doc(db, "users", uid, "clientes", clienteId), data);
}

export function deleteCliente(uid: string, clienteId: string) {
  return deleteDoc(doc(db, "users", uid, "clientes", clienteId));
}

export function watchClientes(
  uid: string,
  callback: (clientes: Cliente[]) => void
) {
  const q = query(clientesCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ativo: true, ...d.data() } as Cliente))
    );
  });
}

// ---------- Vendas (subcoleção por cliente) ----------

export function vendasCol(uid: string, clienteId: string) {
  return collection(db, "users", uid, "clientes", clienteId, "vendas");
}

export function addVenda(
  uid: string,
  clienteId: string,
  data: { descricao: string; valor: number; data: Date }
) {
  return addDoc(vendasCol(uid, clienteId), {
    descricao: data.descricao,
    valor: data.valor,
    data: Timestamp.fromDate(data.data),
    createdAt: Timestamp.now(),
  });
}

export function deleteVenda(uid: string, clienteId: string, vendaId: string) {
  return deleteDoc(doc(db, "users", uid, "clientes", clienteId, "vendas", vendaId));
}

export function watchVendas(
  uid: string,
  clienteId: string,
  callback: (vendas: Venda[]) => void
) {
  const q = query(vendasCol(uid, clienteId), orderBy("data", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venda)));
  });
}

// Junta as vendas de TODOS os clientes — usado no Financeiro e nos Relatórios.
// Busca única (não é tempo real), porque cruza várias subcoleções.
export interface VendaComCliente extends Venda {
  clienteId: string;
  clienteNome: string;
}

export async function getTodasVendas(uid: string): Promise<VendaComCliente[]> {
  const clientesSnap = await getDocs(clientesCol(uid));
  const listas = await Promise.all(
    clientesSnap.docs.map(async (clienteDoc) => {
      const vendasSnap = await getDocs(query(vendasCol(uid, clienteDoc.id), orderBy("data", "desc")));
      const nomeCliente = (clienteDoc.data() as { nome?: string }).nome ?? "Cliente";
      return vendasSnap.docs.map(
        (v) =>
          ({
            id: v.id,
            ...(v.data() as Omit<Venda, "id">),
            clienteId: clienteDoc.id,
            clienteNome: nomeCliente,
          } as VendaComCliente)
      );
    })
  );
  return listas.flat();
}

// ---------- Despesas ----------

export type CategoriaDespesa = "Marketing" | "Pessoal" | "Operacional" | "Tecnologia" | "Outros";

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: CategoriaDespesa;
  data: Timestamp;
  createdAt: Timestamp;
}

export function despesasCol(uid: string) {
  return collection(db, "users", uid, "despesas");
}

export function addDespesa(
  uid: string,
  data: { descricao: string; valor: number; categoria: CategoriaDespesa; data: Date }
) {
  return addDoc(despesasCol(uid), {
    descricao: data.descricao,
    valor: data.valor,
    categoria: data.categoria,
    data: Timestamp.fromDate(data.data),
    createdAt: Timestamp.now(),
  });
}

export function deleteDespesa(uid: string, despesaId: string) {
  return deleteDoc(doc(db, "users", uid, "despesas", despesaId));
}

export function watchDespesas(uid: string, callback: (despesas: Despesa[]) => void) {
  const q = query(despesasCol(uid), orderBy("data", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Despesa)));
  });
}

// ---------- Atividades ----------

export interface Atividade {
  id: string;
  titulo: string;
  nota?: string;
  data: Timestamp;
  concluida: boolean;
  createdAt: Timestamp;
}

export function atividadesCol(uid: string) {
  return collection(db, "users", uid, "atividades");
}

export function addAtividade(
  uid: string,
  data: { titulo: string; nota?: string; data: Date }
) {
  return addDoc(atividadesCol(uid), {
    titulo: data.titulo,
    nota: data.nota ?? "",
    data: Timestamp.fromDate(data.data),
    concluida: false,
    createdAt: Timestamp.now(),
  });
}

export function concluirAtividade(uid: string, atividadeId: string, concluida: boolean) {
  return updateDoc(doc(db, "users", uid, "atividades", atividadeId), { concluida });
}

export function deleteAtividade(uid: string, atividadeId: string) {
  return deleteDoc(doc(db, "users", uid, "atividades", atividadeId));
}

export function watchAtividades(uid: string, callback: (atividades: Atividade[]) => void) {
  const q = query(atividadesCol(uid), orderBy("data", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Atividade)));
  });
}

// ---------- Leads ----------

export function leadsCol(uid: string) {
  return collection(db, "users", uid, "leads");
}

export function addLead(
  uid: string,
  data: { nome: string; telefone: string; origem: string; valor?: number }
) {
  return addDoc(leadsCol(uid), {
    nome: data.nome,
    telefone: data.telefone,
    origem: data.origem,
    valor: data.valor ?? 0,
    estagio: "Novo Lead" as EstagioLead,
    createdAt: Timestamp.now(),
  });
}

export function updateLead(
  uid: string,
  leadId: string,
  data: Partial<{ nome: string; telefone: string; origem: string; estagio: EstagioLead; valor: number }>
) {
  return updateDoc(doc(db, "users", uid, "leads", leadId), data);
}

export function deleteLead(uid: string, leadId: string) {
  return deleteDoc(doc(db, "users", uid, "leads", leadId));
}

export function watchLeads(uid: string, callback: (leads: Lead[]) => void) {
  const q = query(leadsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, valor: 0, ...d.data() } as Lead)));
  });
}