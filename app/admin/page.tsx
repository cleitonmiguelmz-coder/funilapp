"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserData {
  uid: string;
  email: string;
  nome: string;
  plano: string;
  createdAt: { seconds: number } | null;
  funnelCount: number;
  leadCount: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar utilizadores
      const usersSnap = await getDocs(collection(db, "users"));

      // Buscar todos os funis
      const funnelsSnap = await getDocs(collection(db, "funnels"));

      // Buscar todos os leads
      const leadsSnap = await getDocs(collection(db, "leads"));

      const usersData: UserData[] = usersSnap.docs.map((d) => {
        const data = d.data();
        const uid = d.id;

        const funnelCount = funnelsSnap.docs.filter(
          (f) => f.data().userId === uid
        ).length;

        const leadCount = leadsSnap.docs.filter(
          (l) => l.data().userId === uid
        ).length;

        return {
          uid,
          email: data.email ?? "—",
          nome: data.nome ?? "—",
          plano: data.plano ?? "Gratuito",
          createdAt: data.createdAt ?? null,
          funnelCount,
          leadCount,
        };
      });

      // Ordenar por data de registo (mais recente primeiro)
      usersData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filtered = users.filter((u) =>
    search === "" ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.nome.toLowerCase().includes(search.toLowerCase())
  );

  const totalFunnels = users.reduce((acc, u) => acc + u.funnelCount, 0);
  const totalLeads = users.reduce((acc, u) => acc + u.leadCount, 0);
  const totalPro = users.filter((u) => u.plano === "Pro").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: "Utilizadores",
      value: users.length,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      bg: "bg-green-50 border-green-100",
    },
    {
      label: "Plano Pro",
      value: totalPro,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
      bg: "bg-amber-50 border-amber-100",
    },
    {
      label: "Plano Gratuito",
      value: users.length - totalPro,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
      bg: "bg-blue-50 border-blue-100",
    },
    {
      label: "Total de Funis",
      value: totalFunnels,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      bg: "bg-violet-50 border-violet-100",
    },
    {
      label: "Total de Leads",
      value: totalLeads,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
      ),
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Receita Pro",
      value: `${(totalPro * 999).toLocaleString("pt-MZ")} MT`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      bg: "bg-green-50 border-green-100",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Painel de Administração</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral completa do sistema FunilApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela de utilizadores */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-gray-900 font-semibold text-base">Utilizadores</h2>
          <input
            type="text"
            placeholder="Pesquisar por email ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition w-64"
          />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Utilizador", "Plano", "Funis", "Leads", "Registo", "Ação"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold uppercase">
                          {u.email?.[0] ?? "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-medium">{u.nome !== "—" ? u.nome : u.email}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      u.plano === "Pro"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}>
                      {u.plano}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm font-medium">{u.funnelCount}</td>
                  <td className="px-6 py-4 text-gray-700 text-sm font-medium">{u.leadCount}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        const novoPlano = u.plano === "Pro" ? "Gratuito" : "Pro";
                        if (confirm(`Mudar ${u.email} para plano ${novoPlano}?`)) {
                          import("firebase/firestore").then(({ doc, updateDoc }) => {
                            updateDoc(doc(db, "users", u.uid), { plano: novoPlano }).then(() => {
                              setUsers((prev) =>
                                prev.map((usr) =>
                                  usr.uid === u.uid ? { ...usr, plano: novoPlano } : usr
                                )
                              );
                            });
                          });
                        }
                      }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                        u.plano === "Pro"
                          ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                          : "bg-green-50 text-green-700 hover:bg-green-100 border-green-100"
                      }`}
                    >
                      {u.plano === "Pro" ? "Rebaixar" : "Ativar Pro"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Nenhum utilizador encontrado</p>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {filtered.map((u) => (
            <div key={u.uid} className="px-4 py-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold uppercase">
                      {u.email?.[0] ?? "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm font-semibold">{u.nome !== "—" ? u.nome : "—"}</p>
                    <p className="text-gray-400 text-xs">{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  u.plano === "Pro"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : "bg-gray-50 text-gray-500 border-gray-100"
                }`}>
                  {u.plano}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="text-center">
                  <p className="text-gray-900 font-bold text-base">{u.funnelCount}</p>
                  <p className="text-gray-400 text-xs">Funis</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-bold text-base">{u.leadCount}</p>
                  <p className="text-gray-400 text-xs">Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 text-xs">{formatDate(u.createdAt)}</p>
                  <p className="text-gray-400 text-xs">Registo</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const novoPlano = u.plano === "Pro" ? "Gratuito" : "Pro";
                  if (confirm(`Mudar ${u.email} para plano ${novoPlano}?`)) {
                    import("firebase/firestore").then(({ doc, updateDoc }) => {
                      updateDoc(doc(db, "users", u.uid), { plano: novoPlano }).then(() => {
                        setUsers((prev) =>
                          prev.map((usr) =>
                            usr.uid === u.uid ? { ...usr, plano: novoPlano } : usr
                          )
                        );
                      });
                    });
                  }
                }}
                className={`w-full text-xs font-medium px-3 py-2 rounded-lg border transition ${
                  u.plano === "Pro"
                    ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border-green-100"
                }`}
              >
                {u.plano === "Pro" ? "Rebaixar para Gratuito" : "Ativar Plano Pro"}
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Nenhum utilizador encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}