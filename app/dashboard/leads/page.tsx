"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  cidade: string;
  pagamento: string;
  intencao: string;
  funnelId: string;
  createdAt: { seconds: number } | null;
}

interface Funnel {
  id: string;
  nomeProduto: string;
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFunnel, setFilterFunnel] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const funnelsQuery = query(
        collection(db, "funnels"),
        where("userId", "==", user!.uid)
      );
      const funnelsSnap = await getDocs(funnelsQuery);
      const funnelsData: Funnel[] = funnelsSnap.docs.map((d) => ({
        id: d.id,
        nomeProduto: d.data().nomeProduto,
      }));
      setFunnels(funnelsData);

      const leadsQuery = query(
        collection(db, "leads"),
        where("userId", "==", user!.uid),
        orderBy("createdAt", "desc")
      );
      const leadsSnap = await getDocs(leadsQuery);
      const leadsData: Lead[] = leadsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Lead, "id">),
      }));
      setLeads(leadsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter((lead) => {
    const matchFunnel = filterFunnel === "all" || lead.funnelId === filterFunnel;
    const matchSearch =
      search === "" ||
      lead.nome.toLowerCase().includes(search.toLowerCase()) ||
      lead.whatsapp.includes(search) ||
      lead.cidade?.toLowerCase().includes(search.toLowerCase());
    return matchFunnel && matchSearch;
  });

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFunnelName = (funnelId: string) => {
    return funnels.find((f) => f.id === funnelId)?.nomeProduto ?? "—";
  };

  const openWhatsApp = (number: string) => {
    const clean = number.replace(/\D/g, "");
    window.open(`https://wa.me/258${clean}`, "_blank");
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Nome", "WhatsApp", "Cidade", "Pagamento", "Intenção", "Funil", "Data"];
    const rows = filtered.map((lead) => [
      lead.nome,
      lead.whatsapp,
      lead.cidade || "",
      lead.pagamento || "",
      lead.intencao || "",
      getFunnelName(lead.funnelId),
      formatDate(lead.createdAt),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
          <p className="text-gray-400 text-sm mt-1">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} capturado{leads.length !== 1 ? "s" : ""}
          </p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-lg border border-green-100 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar por nome, whatsapp ou cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
        />
        <select
          value={filterFunnel}
          onChange={(e) => setFilterFunnel(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
        >
          <option value="all">Todos os funis</option>
          {funnels.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nomeProduto}
            </option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 border-dashed rounded-xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-gray-800 font-semibold mb-1">Nenhum lead encontrado</p>
          <p className="text-gray-400 text-sm">
            {leads.length === 0
              ? "Partilhe o link do seu funil para começar a capturar leads"
              : "Tente ajustar os filtros de pesquisa"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Nome", "WhatsApp", "Cidade", "Pagamento", "Intenção", "Funil", "Data", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 text-gray-900 text-sm font-medium">{lead.nome}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{lead.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{lead.cidade || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{lead.pagamento || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-100">
                        {lead.intencao || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{getFunnelName(lead.funnelId)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openWhatsApp(lead.whatsapp)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-100 transition"
                      >
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{lead.nome}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{lead.whatsapp}</p>
                  </div>
                  <button
                    onClick={() => openWhatsApp(lead.whatsapp)}
                    className="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-100 transition"
                  >
                    WhatsApp
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.cidade && (
                    <span className="text-gray-500 text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                      📍 {lead.cidade}
                    </span>
                  )}
                  {lead.pagamento && (
                    <span className="text-gray-500 text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                      💳 {lead.pagamento}
                    </span>
                  )}
                  {lead.intencao && (
                    <span className="text-green-700 text-xs bg-green-50 border border-green-100 px-2 py-1 rounded-lg">
                      {lead.intencao}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-gray-400 text-xs">{getFunnelName(lead.funnelId)}</span>
                  <span className="text-gray-400 text-xs">{formatDate(lead.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}