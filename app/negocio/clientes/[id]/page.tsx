"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  addVenda,
  deleteCliente,
  updateCliente,
  watchVendas,
  watchClientes,
  type Cliente,
  type Venda,
} from "@/lib/negocio";

const fmtMT = (n: number) =>
  n.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }) + " MTn";

const avatarPalette = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
];

function avatarColor(nome: string) {
  const idx = (nome.charCodeAt(0) || 0) % avatarPalette.length;
  return avatarPalette[idx];
}

function iniciais(nome: string) {
  const partes = nome.trim().split(" ");
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = watchClientes(user.uid, (lista) => {
      setCliente(lista.find((c) => c.id === id) ?? null);
    });
    return () => unsub();
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) return;
    const unsub = watchVendas(user.uid, id, setVendas);
    return () => unsub();
  }, [user, id]);

  async function handleAddVenda(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id || !descricao.trim() || !valor) return;
    setSalvando(true);
    await addVenda(user.uid, id, {
      descricao: descricao.trim(),
      valor: Number(valor),
      data: new Date(),
    });
    setDescricao("");
    setValor("");
    setShowForm(false);
    setSalvando(false);
  }

  async function toggleAtivo() {
    if (!user || !id || !cliente) return;
    await updateCliente(user.uid, id, { ativo: !cliente.ativo });
  }

  async function handleDeleteCliente() {
    if (!user || !id) return;
    if (!confirm("Apagar este cliente e todo o histórico? Esta ação não pode ser desfeita.")) return;
    await deleteCliente(user.uid, id);
    router.push("/negocio/clientes");
  }

  const totalGasto = vendas.reduce((acc, v) => acc + v.valor, 0);

  if (!user || cliente === null) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>;
  }

  const cor = avatarColor(cliente.nome);

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/negocio/clientes")}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Clientes
      </button>

      {/* cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${cor.bg} ${cor.text} flex items-center justify-center text-sm font-bold shrink-0`}>
              {iniciais(cliente.nome)}
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-gray-900 truncate">{cliente.nome}</div>
              {cliente.telefone && <div className="text-xs sm:text-sm text-gray-400 truncate">{cliente.telefone}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleAtivo}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                cliente.ativo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {cliente.ativo ? "Ativo" : "Inativo"}
            </button>
            <button onClick={handleDeleteCliente} className="text-[11px] font-semibold text-red-500">
              Apagar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-3.5">
            <div className="text-[11px] text-gray-400 font-medium">Total gasto</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">{fmtMT(totalGasto)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-3.5">
            <div className="text-[11px] text-gray-400 font-medium">Vendas registadas</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">{vendas.length}</div>
          </div>
        </div>
      </div>

      {/* histórico */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">Histórico de vendas</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-green-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {showForm ? "Cancelar" : "+ Registar venda"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddVenda} className="bg-gray-50 rounded-lg border border-gray-100 p-4 mb-4 flex flex-col gap-3">
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="O que vendeu (ex: Air Jordan 1 Cool Grey)"
              required
              className="border-b border-gray-200 pb-2 text-sm bg-transparent outline-none focus:border-green-500"
            />
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Valor (MTn)"
              required
              className="border-b border-gray-200 pb-2 text-sm bg-transparent outline-none focus:border-green-500"
            />
            <button
              type="submit"
              disabled={salvando}
              className="self-start bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {salvando ? "A guardar..." : "Guardar venda"}
            </button>
          </form>
        )}

        {vendas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhuma venda registada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {vendas.map((v) => (
              <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3.5 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{v.descricao}</div>
                  <div className="text-[11px] text-gray-400">{v.data.toDate().toLocaleDateString("pt-MZ")}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900 shrink-0">{fmtMT(v.valor)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}