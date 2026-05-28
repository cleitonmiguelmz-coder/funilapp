"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import {
  collection, query, where, getDocs, deleteDoc, doc,
  onSnapshot, orderBy, limit, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Funnel {
  id: string;
  nomeProduto: string;
  preco: string;
  videoUrl: string;
  createdAt: unknown;
  leadCount?: number;
}

interface Lead {
  createdAt: { seconds: number } | null;
  funnelId: string;
}

interface Notification {
  id: string;
  nomeProduto: string;
  funnelId: string;
  createdAt: Timestamp;
  lida: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Notificações
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user) return;
    fetchFunnels();
    subscribeToVisits();
  }, [user]);

  // Actualiza título da aba
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) FunilApp`;
    } else {
      document.title = "FunilApp";
    }
  }, [unreadCount]);

  const subscribeToVisits = () => {
    const visitsQuery = query(
      collection(db, "visits"),
      where("userId", "==", user!.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(visitsQuery, (snap) => {
      const data: Notification[] = snap.docs.map((d) => ({
        id: d.id,
        nomeProduto: d.data().nomeProduto ?? "Funil",
        funnelId: d.data().funnelId,
        createdAt: d.data().createdAt,
        lida: false,
      }));

      setNotifications(data);
      setUnreadCount(data.length);

      // Não mostra toast no carregamento inicial
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      // Mostra toast só para a visita mais recente
      const newest = data[0];
      if (newest) {
        showToast(newest);
      }
    });

    return unsub;
  };

  const showToast = (notif: Notification) => {
    const id = notif.id + Date.now();
    const toast = { ...notif, id };
    setToasts((prev) => [toast, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const clearNotifications = () => {
    setUnreadCount(0);
    document.title = "FunilApp";
  };

  const formatTime = (ts: Timestamp) => {
    if (!ts?.seconds) return "";
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" });
  };

  const fetchFunnels = async () => {
    try {
      const funnelsQuery = query(
        collection(db, "funnels"),
        where("userId", "==", user!.uid)
      );
      const funnelsSnap = await getDocs(funnelsQuery);

      const funnelsData: Funnel[] = [];
      let leadsTotal = 0;
      const allLeads: Lead[] = [];

      for (const docSnap of funnelsSnap.docs) {
        const leadsQuery = query(
          collection(db, "leads"),
          where("funnelId", "==", docSnap.id)
        );
        const leadsSnap = await getDocs(leadsQuery);
        const leadCount = leadsSnap.size;
        leadsTotal += leadCount;

        leadsSnap.docs.forEach((l) => {
          allLeads.push(l.data() as Lead);
        });

        funnelsData.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Funnel, "id">),
          leadCount,
        });
      }

      setFunnels(funnelsData);
      setTotalLeads(leadsTotal);
      setLeads(allLeads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const leadsLast7Days = () => {
    const days: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString("pt-BR", { weekday: "short" });
      const total = leads.filter((l) => {
        if (!l.createdAt) return false;
        const d = new Date(l.createdAt.seconds * 1000);
        return (
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      }).length;
      days.push({ label, total });
    }
    return days;
  };

  const leadsByFunnel = funnels
    .filter((f) => (f.leadCount ?? 0) > 0)
    .map((f) => ({
      label: f.nomeProduto.length > 14 ? f.nomeProduto.slice(0, 14) + "…" : f.nomeProduto,
      total: f.leadCount ?? 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/funnel/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "funnels", id));
      setFunnels((prev) => prev.filter((f) => f.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: "Funis ativos",
      value: funnels.length,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      bg: "bg-green-50 border-green-100",
    },
    {
      label: "Total de leads",
      value: totalLeads,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      bg: "bg-blue-50 border-blue-100",
    },
    {
      label: "Leads por funil",
      value: funnels.length > 0 ? (totalLeads / funnels.length).toFixed(1) : "0",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      bg: "bg-amber-50 border-amber-100",
    },
  ];

  const chartData7Days = leadsLast7Days();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* Toasts — notificações no canto */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-gray-100 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[320px] animate-slide-in"
          >
            <div className="w-9 h-9 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-semibold truncate">Nova visita!</p>
              <p className="text-gray-400 text-xs truncate">{toast.nomeProduto}</p>
            </div>
            <span className="text-gray-300 text-xs flex-shrink-0">{formatTime(toast.createdAt)}</span>
          </div>
        ))}
      </div>

      {/* Modal apagar */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                <path d="M10,11v6" /><path d="M14,11v6" />
                <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-center text-base mb-1">Apagar funil?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Esta ação é irreversível. O funil e todos os seus dados serão eliminados permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-sm font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition flex items-center justify-center"
              >
                {deletingId === confirmDeleteId ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie seus funis e acompanhe seus leads</p>
        </div>
        {/* Sino de notificações */}
        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 hover:border-green-200 transition shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-3 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-gray-400 text-sm mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {totalLeads > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="text-gray-700 font-semibold text-sm mb-4">Leads — últimos 7 dias</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData7Days} barSize={24}>
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#111", fontSize: 12 }}
                  formatter={(value) => [value, "Leads"]}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {chartData7Days.map((_, i) => (
                    <Cell key={i} fill={i === chartData7Days.length - 1 ? "#16a34a" : "#bbf7d0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {leadsByFunnel.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="text-gray-700 font-semibold text-sm mb-4">Leads por funil</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={leadsByFunnel} barSize={24} layout="vertical">
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, color: "#111", fontSize: 12 }}
                    formatter={(value) => [value, "Leads"]}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Visitas recentes */}
      {notifications.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-semibold text-sm">Visitas recentes</h3>
            <span className="text-xs text-gray-400">{notifications.length} visitas</span>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-sm font-medium truncate">{n.nomeProduto}</p>
                </div>
                <span className="text-gray-300 text-xs flex-shrink-0">{formatTime(n.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meus funis */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 font-semibold text-base">Meus Funis</h2>
        <Link
          href="/dashboard/create-funnel"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Funil
        </Link>
      </div>

      {funnels.length === 0 ? (
        <div className="bg-white border border-gray-100 border-dashed rounded-xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <p className="text-gray-800 font-semibold mb-1">Nenhum funil ainda</p>
          <p className="text-gray-400 text-sm mb-5">Crie o seu primeiro funil de vendas agora</p>
          <Link
            href="/dashboard/create-funnel"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
          >
            Criar primeiro funil
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:border-green-200 hover:shadow-md transition-all duration-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-gray-900 font-semibold text-base">{funnel.nomeProduto}</h3>
                  <p className="text-green-600 text-sm font-medium mt-0.5">
                    {Number(funnel.preco).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </p>
                </div>
                <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-100">
                  Ativo
                </span>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">{funnel.leadCount}</span>
                <span className="text-gray-400 text-sm">leads capturados</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/funnel/${funnel.id}`}
                  target="_blank"
                  className="flex-1 text-center text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 transition"
                >
                  Ver página
                </Link>
                <button
                  onClick={() => copyLink(funnel.id)}
                  className="flex-1 text-center text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg py-2 transition"
                >
                  {copied === funnel.id ? "✓ Copiado!" : "Copiar link"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/dashboard/edit-funnel/${funnel.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 transition"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => setConfirmDeleteId(funnel.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg py-2 transition"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                    <path d="M10,11v6" /><path d="M14,11v6" />
                    <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6" />
                  </svg>
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}