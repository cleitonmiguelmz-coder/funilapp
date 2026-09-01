"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { addCliente, watchClientes, type Cliente } from "@/lib/negocio";

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

export default function ClientesPage() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = watchClientes(user.uid, setClientes);
    return () => unsub();
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nome.trim()) return;
    setSalvando(true);
    await addCliente(user.uid, { nome: nome.trim(), telefone: telefone.trim() });
    setNome("");
    setTelefone("");
    setShowForm(false);
    setSalvando(false);
  }

  const filtrados = clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>
    );
  }

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registado{clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"
        >
          {showForm ? "Cancelar" : "+ Novo Cliente"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-4 flex flex-col gap-3"
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do cliente"
            required
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone (WhatsApp)"
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={salvando}
            className="self-start bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {salvando ? "A guardar..." : "Guardar cliente"}
          </button>
        </form>
      )}

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Procurar cliente..."
        className="w-full bg-white border border-gray-100 rounded-lg px-4 py-2.5 mb-4 text-sm outline-none focus:border-green-500"
      />

      {filtrados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          {clientes.length === 0 ? "Ainda não tens clientes. Adiciona o primeiro." : "Nenhum cliente encontrado."}
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {filtrados.map((c) => {
            const cor = avatarColor(c.nome);
            return (
              <Link
                key={c.id}
                href={`/negocio/clientes/${c.id}`}
                className="flex items-center gap-3 p-3.5 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${cor.bg} ${cor.text} flex items-center justify-center text-xs sm:text-sm font-bold shrink-0`}>
                  {iniciais(c.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{c.nome}</div>
                  {c.telefone && <div className="text-xs text-gray-400 truncate">{c.telefone}</div>}
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                    c.ativo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
