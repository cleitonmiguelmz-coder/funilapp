"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addLead, watchLeads, updateLead, deleteLead, type Lead, type EstagioLead } from "@/lib/negocio";

const estagioStyle: Record<EstagioLead, { bg: string; text: string; dot: string }> = {
  "Novo Lead": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Proposta: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Negociação: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  "Fechado Ganhou": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Fechado Perdeu": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const estagios: EstagioLead[] = ["Novo Lead", "Proposta", "Negociação", "Fechado Ganhou", "Fechado Perdeu"];
const filtros: Array<"Todos" | EstagioLead> = ["Todos", ...estagios];

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

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"Todos" | EstagioLead>("Todos");
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [origem, setOrigem] = useState("WhatsApp");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = watchLeads(user.uid, setLeads);
    return () => unsub();
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !nome.trim()) return;
    setSalvando(true);
    await addLead(user.uid, {
      nome: nome.trim(),
      telefone: telefone.trim(),
      origem,
      valor: valor ? Number(valor) : 0,
    });
    setNome("");
    setTelefone("");
    setOrigem("WhatsApp");
    setValor("");
    setShowForm(false);
    setSalvando(false);
  }

  async function mudarEstagio(leadId: string, estagio: EstagioLead) {
    if (!user) return;
    await updateLead(user.uid, leadId, { estagio });
    setEditandoId(null);
  }

  async function apagarLead(leadId: string) {
    if (!user) return;
    if (!confirm("Apagar este lead?")) return;
    await deleteLead(user.uid, leadId);
  }

  const filtrados = leads.filter((l) => {
    const matchBusca = l.nome.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtro === "Todos" || l.estagio === filtro;
    return matchBusca && matchFiltro;
  });

  if (!user) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>;
  }

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{leads.length} leads no total</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"
        >
          {showForm ? "Cancelar" : "+ Novo Lead"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-4 flex flex-col gap-3">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do lead"
            required
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone (WhatsApp)"
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500 bg-transparent"
          >
            <option>WhatsApp</option>
            <option>Indicação</option>
            <option>Site</option>
            <option>Facebook</option>
            <option>Instagram</option>
            <option>Outro</option>
          </select>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor estimado do negócio (MTn) — opcional"
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={salvando}
            className="self-start bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {salvando ? "A guardar..." : "Guardar lead"}
          </button>
        </form>
      )}

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Procurar lead..."
        className="w-full bg-white border border-gray-100 rounded-lg px-4 py-2.5 mb-3 text-sm outline-none focus:border-green-500"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filtro === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          {leads.length === 0 ? "Ainda não tens leads. Adiciona o primeiro." : "Nenhum lead encontrado."}
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {filtrados.map((l) => {
            const cor = avatarColor(l.nome);
            const estilo = estagioStyle[l.estagio];
            return (
              <div key={l.id} className="flex items-center gap-3 p-3.5 sm:p-4">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${cor.bg} ${cor.text} flex items-center justify-center text-xs sm:text-sm font-bold shrink-0`}>
                  {iniciais(l.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{l.nome}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {l.telefone} · {l.origem}
                  </div>
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => setEditandoId(editandoId === l.id ? null : l.id)}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${estilo.bg} ${estilo.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
                    {l.estagio}
                  </button>
                  {editandoId === l.id && (
                    <div className="absolute right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1 w-40">
                      {estagios.map((e) => (
                        <button
                          key={e}
                          onClick={() => mudarEstagio(l.id, e)}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {e}
                        </button>
                      ))}
                      <button
                        onClick={() => apagarLead(l.id)}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100 mt-1"
                      >
                        Apagar lead
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}