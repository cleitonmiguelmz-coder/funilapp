"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
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

interface DeliveryData {
  uid: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  tipo: string;
  bi: string;
  status: string;
  trialFim?: Timestamp;
  proximoPagamento?: Timestamp;
  createdAt: { seconds: number } | null;
}

interface ProdutoData {
  id: string;
  userId: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl: string;
  categoria: string;
  percentagemAfiliado: number;
  status: "pendente" | "activo" | "pausado";
  totalVendas: number;
  totalReceita: number;
  createdAt: { seconds: number } | null;
}

interface CashoutData {
  id: string;
  userId: string;
  valor: number;
  metodo: 'mpesa' | 'emola';
  numero: string;
  status: 'pendente' | 'pago' | 'rejeitado';
  createdAt: { seconds: number } | null;
}

interface VendaData {
  id: string;
  produtoId: string;
  criadorId: string;
  afiliadoId: string | null;
  compradorNome: string;
  compradorTelefone: string;
  valor: number;
  valorCriador: number;
  valorAfiliado: number;
  valorPlataforma: number;
  metodoPagamento: 'mpesa' | 'emola';
  status: string;
  createdAt: { seconds: number } | null;
}

// ── NOVO TIPO: Pagamentos Pro ──
interface PagamentoData {
  id: string;
  userId: string;
  email: string;
  nome: string;
  plano: string;
  valor: number;
  metodo: 'mpesa' | 'emola';
  numero: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  createdAt: { seconds: number } | null;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [produtos, setProdutos] = useState<ProdutoData[]>([]);
  const [cashouts, setCashouts] = useState<CashoutData[]>([]);
  const [vendas, setVendas] = useState<VendaData[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDelivery, setSearchDelivery] = useState("");
  const [searchProduto, setSearchProduto] = useState("");
  const [tab, setTab] = useState<"usuarios" | "deliveries" | "market" | "cashouts" | "vendas" | "pagamentos">("usuarios");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersSnap, funnelsSnap, leadsSnap, deliveriesSnap, produtosSnap, cashoutsSnap, vendasSnap, pagamentosSnap] =
        await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "funnels")),
          getDocs(collection(db, "leads")),
          getDocs(collection(db, "deliveries")),
          getDocs(collection(db, "produtos")),
          getDocs(collection(db, "cashouts")),
          getDocs(collection(db, "vendas")),
          getDocs(collection(db, "pagamentos")),
        ]);

      const usersData: UserData[] = usersSnap.docs.map((d) => {
        const data = d.data();
        const uid = d.id;
        return {
          uid, email: data.email ?? "—", nome: data.nome ?? "—",
          plano: data.plano ?? "Gratuito", createdAt: data.createdAt ?? null,
          funnelCount: funnelsSnap.docs.filter((f) => f.data().userId === uid).length,
          leadCount: leadsSnap.docs.filter((l) => l.data().userId === uid).length,
        };
      });
      usersData.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : b.createdAt.seconds - a.createdAt.seconds));

      const deliveriesData: DeliveryData[] = deliveriesSnap.docs.map((d) => ({ uid: d.id, ...d.data() as Omit<DeliveryData, "uid"> }));
      deliveriesData.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : b.createdAt.seconds - a.createdAt.seconds));

      const produtosData: ProdutoData[] = produtosSnap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<ProdutoData, "id"> }));
      produtosData.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : b.createdAt.seconds - a.createdAt.seconds));

      const cashoutsData: CashoutData[] = cashoutsSnap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<CashoutData, "id"> }));
      cashoutsData.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : b.createdAt.seconds - a.createdAt.seconds));

      const vendasData: VendaData[] = vendasSnap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<VendaData, "id"> }));
      vendasData.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : b.createdAt.seconds - a.createdAt.seconds));

      const pagamentosData: PagamentoData[] = pagamentosSnap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<PagamentoData, "id"> }));
      pagamentosData.sort((a, b) => (!a.createdAt ? 1 : !b.createdAt ? -1 : b.createdAt.seconds - a.createdAt.seconds));

      setUsers(usersData);
      setDeliveries(deliveriesData);
      setProdutos(produtosData);
      setCashouts(cashoutsData);
      setVendas(vendasData);
      setPagamentos(pagamentosData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("pt-MZ", { day: "2-digit", month: "short", year: "numeric" });
  };

  const diasTrialRestantes = (trialFim?: Timestamp) => {
    if (!trialFim) return 0;
    return Math.max(0, Math.ceil((trialFim.toDate().getTime() - Date.now()) / 86400000));
  };

  const tipoLabel = (t: string) => {
    if (t === "moto") return "🏍️ Moto";
    if (t === "bicicleta") return "🚲 Bicicleta";
    if (t === "peao") return "🚶 Peão";
    return t;
  };

  const statusDeliveryLabel = (d: DeliveryData) => {
    if (d.status === "trial") {
      const dias = diasTrialRestantes(d.trialFim);
      if (dias > 0) return { text: `Trial — ${dias}d`, color: "bg-blue-50 text-blue-700 border-blue-100" };
      return { text: "Trial expirado", color: "bg-red-50 text-red-700 border-red-100" };
    }
    if (d.status === "activo") return { text: "Activo", color: "bg-green-50 text-green-700 border-green-100" };
    if (d.status === "expirado") return { text: "Expirado", color: "bg-red-50 text-red-700 border-red-100" };
    if (d.status === "pendente") return { text: "Pendente", color: "bg-amber-50 text-amber-700 border-amber-100" };
    if (d.status === "inactivo") return { text: "Inactivo", color: "bg-gray-50 text-gray-500 border-gray-200" };
    return { text: d.status, color: "bg-gray-50 text-gray-500 border-gray-200" };
  };

  const activarDelivery = async (uid: string) => {
    const proximoPagamento = new Date();
    proximoPagamento.setMonth(proximoPagamento.getMonth() + 1);
    await updateDoc(doc(db, "deliveries", uid), { status: "activo", ultimoPagamento: new Date(), proximoPagamento: Timestamp.fromDate(proximoPagamento) });
    setDeliveries((prev) => prev.map((d) => d.uid === uid ? { ...d, status: "activo" } : d));
  };

  const desactivarDelivery = async (uid: string) => {
    await updateDoc(doc(db, "deliveries", uid), { status: "inactivo" });
    setDeliveries((prev) => prev.map((d) => d.uid === uid ? { ...d, status: "inactivo" } : d));
  };

  const activarProduto = async (id: string) => {
    await updateDoc(doc(db, "produtos", id), { status: "activo" });
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, status: "activo" } : p));
  };

  const pausarProduto = async (id: string) => {
    await updateDoc(doc(db, "produtos", id), { status: "pausado" });
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, status: "pausado" } : p));
  };

  const aprovarCashout = async (id: string) => {
    await updateDoc(doc(db, "cashouts", id), { status: "pago", paidAt: new Date() });
    setCashouts((prev) => prev.map((c) => c.id === id ? { ...c, status: "pago" } : c));
  };

  const rejeitarCashout = async (id: string) => {
    await updateDoc(doc(db, "cashouts", id), { status: "rejeitado" });
    setCashouts((prev) => prev.map((c) => c.id === id ? { ...c, status: "rejeitado" } : c));
  };

  // ── NOVAS FUNÇÕES: Pagamentos Pro ──
  const aprovarPagamento = async (p: PagamentoData) => {
    await updateDoc(doc(db, "pagamentos", p.id), { status: "aprovado", aprovadoAt: new Date() });
    await updateDoc(doc(db, "users", p.userId), { plano: "Pro" });
    setPagamentos((prev) => prev.map((x) => x.id === p.id ? { ...x, status: "aprovado" } : x));
    setUsers((prev) => prev.map((u) => u.uid === p.userId ? { ...u, plano: "Pro" } : u));
  };

  const rejeitarPagamento = async (id: string) => {
    await updateDoc(doc(db, "pagamentos", id), { status: "rejeitado" });
    setPagamentos((prev) => prev.map((x) => x.id === id ? { ...x, status: "rejeitado" } : x));
  };

  // Filtros
  const filtered = users.filter((u) => search === "" || u.email.toLowerCase().includes(search.toLowerCase()) || u.nome.toLowerCase().includes(search.toLowerCase()));
  const filteredDeliveries = deliveries.filter((d) => searchDelivery === "" || d.nome?.toLowerCase().includes(searchDelivery.toLowerCase()) || d.email?.toLowerCase().includes(searchDelivery.toLowerCase()) || d.cidade?.toLowerCase().includes(searchDelivery.toLowerCase()));
  const filteredProdutos = produtos.filter((p) => searchProduto === "" || p.nome?.toLowerCase().includes(searchProduto.toLowerCase()) || p.categoria?.toLowerCase().includes(searchProduto.toLowerCase()));

  // Stats
  const totalFunnels = users.reduce((acc, u) => acc + u.funnelCount, 0);
  const totalLeads = users.reduce((acc, u) => acc + u.leadCount, 0);
  const totalPro = users.filter((u) => u.plano === "Pro").length;
  const totalDeliveriesActivos = deliveries.filter((d) => d.status === "activo").length;
  const receitaDelivery = totalDeliveriesActivos * 999;
  const produtosPendentes = produtos.filter((p) => p.status === "pendente").length;
  const produtosActivos = produtos.filter((p) => p.status === "activo").length;
  const receitaMarket = produtos.reduce((acc, p) => acc + (p.totalReceita * 0.10), 0);
  const cashoutsPendentes = cashouts.filter((c) => c.status === "pendente").length;
  const totalVendasMarket = vendas.length;
  const receitaVendas = vendas.reduce((acc, v) => acc + v.valorPlataforma, 0);
  const pagamentosPendentes = pagamentos.filter((p) => p.status === "pendente").length;
  const receitaPagamentosPro = pagamentos.filter((p) => p.status === "aprovado").reduce((acc, p) => acc + p.valor, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Utilizadores", value: users.length, bg: "bg-green-50 border-green-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { label: "Plano Pro", value: totalPro, bg: "bg-amber-50 border-amber-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg> },
    { label: "Total Funis", value: totalFunnels, bg: "bg-violet-50 border-violet-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-600"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
    { label: "Total Leads", value: totalLeads, bg: "bg-emerald-50 border-emerald-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg> },
    { label: "Deliveries Activos", value: totalDeliveriesActivos, bg: "bg-blue-50 border-blue-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><rect x="1" y="3" width="15" height="13" /><polygon points="16,8 20,8 23,11 23,16 16,16 16,8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
    { label: "Receita Delivery", value: `${receitaDelivery.toLocaleString("pt-MZ")} MT`, bg: "bg-green-50 border-green-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-700"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
    { label: "Receita Pro", value: `${receitaPagamentosPro.toLocaleString("pt-MZ")} MT`, bg: "bg-orange-50 border-orange-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
    { label: "Produtos Activos", value: produtosActivos, bg: "bg-red-50 border-red-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
    { label: "Receita Market", value: `${receitaMarket.toFixed(2)} MT`, bg: "bg-red-50 border-red-100", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Painel de Administração</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral completa do sistema FunilApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${stat.bg}`}>{stat.icon}</div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: "usuarios", label: `Utilizadores (${users.length})`, badge: 0, activeColor: "bg-green-600 border-green-600", hoverColor: "hover:border-green-300" },
          { id: "pagamentos", label: `Pagamentos Pro (${pagamentos.length})`, badge: pagamentosPendentes, activeColor: "bg-amber-600 border-amber-600", hoverColor: "hover:border-amber-300" },
          { id: "deliveries", label: `Deliveries (${deliveries.length})`, badge: deliveries.filter((d) => d.status === "trial").length, activeColor: "bg-green-600 border-green-600", hoverColor: "hover:border-green-300" },
          { id: "market", label: `FunilMarket (${produtos.length})`, badge: produtosPendentes, activeColor: "bg-red-600 border-red-600", hoverColor: "hover:border-red-300" },
          { id: "cashouts", label: `Cashouts (${cashouts.length})`, badge: cashoutsPendentes, activeColor: "bg-orange-600 border-orange-600", hoverColor: "hover:border-orange-300" },
          { id: "vendas", label: `Vendas (${totalVendasMarket})`, badge: 0, activeColor: "bg-blue-600 border-blue-600", hoverColor: "hover:border-blue-300" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${tab === t.id ? `${t.activeColor} text-white` : `bg-white text-gray-600 border-gray-200 ${t.hoverColor}`}`}>
            {t.label}
            {t.badge > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB UTILIZADORES ── */}
      {tab === "usuarios" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-gray-900 font-semibold text-base">Utilizadores</h2>
            <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition w-64" />
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Utilizador", "Plano", "Funis", "Leads", "Registo", "Ação"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold uppercase">{u.email?.[0] ?? "U"}</span>
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{u.nome !== "—" ? u.nome : u.email}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${u.plano === "Pro" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>{u.plano}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm font-medium">{u.funnelCount}</td>
                    <td className="px-6 py-4 text-gray-700 text-sm font-medium">{u.leadCount}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => {
                        const novoPlano = u.plano === "Pro" ? "Gratuito" : "Pro";
                        if (confirm(`Mudar ${u.email} para plano ${novoPlano}?`)) {
                          updateDoc(doc(db, "users", u.uid), { plano: novoPlano }).then(() => {
                            setUsers((prev) => prev.map((usr) => usr.uid === u.uid ? { ...usr, plano: novoPlano } : usr));
                          });
                        }
                      }} className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${u.plano === "Pro" ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200" : "bg-green-50 text-green-700 hover:bg-green-100 border-green-100"}`}>
                        {u.plano === "Pro" ? "Rebaixar" : "Ativar Pro"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12"><p className="text-gray-400 text-sm">Nenhum utilizador encontrado</p></div>}
          </div>
          <div className="md:hidden divide-y divide-gray-50">
            {filtered.map((u) => (
              <div key={u.uid} className="px-4 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold uppercase">{u.email?.[0] ?? "U"}</span>
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">{u.nome !== "—" ? u.nome : "—"}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${u.plano === "Pro" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>{u.plano}</span>
                </div>
                <button onClick={() => {
                  const novoPlano = u.plano === "Pro" ? "Gratuito" : "Pro";
                  if (confirm(`Mudar ${u.email} para plano ${novoPlano}?`)) {
                    updateDoc(doc(db, "users", u.uid), { plano: novoPlano }).then(() => {
                      setUsers((prev) => prev.map((usr) => usr.uid === u.uid ? { ...usr, plano: novoPlano } : usr));
                    });
                  }
                }} className={`w-full text-xs font-medium px-3 py-2 rounded-lg border transition ${u.plano === "Pro" ? "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200" : "bg-green-50 text-green-700 hover:bg-green-100 border-green-100"}`}>
                  {u.plano === "Pro" ? "Rebaixar para Gratuito" : "Ativar Plano Pro"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB PAGAMENTOS PRO (NOVA) ── */}
      {tab === "pagamentos" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-gray-900 font-semibold text-base">Pagamentos — Plano Pro</h2>
              {pagamentosPendentes > 0 && (
                <p className="text-amber-600 text-xs mt-0.5 font-medium">
                  {pagamentosPendentes} pagamento(s) aguardando confirmação
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total recebido</p>
              <p className="text-sm font-bold text-gray-900">
                {receitaPagamentosPro.toLocaleString("pt-MZ")} MT
              </p>
            </div>
          </div>

          {pagamentos.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400 text-sm">Nenhum pedido de pagamento registado</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pagamentos.map((p) => {
                const statusCor = {
                  pendente: "bg-amber-50 text-amber-700 border-amber-100",
                  aprovado: "bg-green-50 text-green-700 border-green-100",
                  rejeitado: "bg-red-50 text-red-600 border-red-100",
                }[p.status];

                return (
                  <div key={p.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${p.metodo === "mpesa" ? "bg-[#FCEBEB]" : "bg-blue-50"}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.metodo === "mpesa" ? "#E24B4A" : "#185FA5"} strokeWidth="2">
                            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm font-semibold truncate">{p.nome}</p>
                          <p className="text-gray-400 text-xs truncate">{p.email}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {p.metodo === "mpesa" ? "M-Pesa" : "E-Mola"} · +258 {p.numero} · {formatDate(p.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">{p.valor.toLocaleString("pt-MZ")} MT</p>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusCor}`}>{p.status}</span>
                      </div>
                    </div>

                    {p.status === "pendente" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            if (confirm(`Confirmar pagamento de ${p.valor.toLocaleString("pt-MZ")} MT de ${p.nome}? Isto activa o Plano Pro automaticamente.`)) {
                              aprovarPagamento(p);
                            }
                          }}
                          className="flex-1 text-xs font-medium py-2.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition flex items-center justify-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                          Confirmar e ativar Pro
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Rejeitar este pagamento?`)) rejeitarPagamento(p.id);
                          }}
                          className="flex-1 text-xs font-medium py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition"
                        >
                          Rejeitar
                        </button>
                        <a
                          href={`https://wa.me/258${p.numero}?text=${encodeURIComponent(`Olá ${p.nome}! Recebemos o seu pedido de upgrade para o Plano Pro. Vamos confirmar o pagamento em breve.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-4 text-xs font-medium py-2.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition flex items-center justify-center"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      </div>
                    )}

                    {p.status === "aprovado" && (
                      <div className="mt-2">
                        <span className="text-xs text-green-600">✓ Plano Pro activado para este utilizador</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB DELIVERIES ── */}
      {tab === "deliveries" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-gray-900 font-semibold text-base">Deliveries</h2>
            <input type="text" placeholder="Pesquisar..." value={searchDelivery} onChange={(e) => setSearchDelivery(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition w-64" />
          </div>
          {filteredDeliveries.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400 text-sm">Nenhum delivery registado</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredDeliveries.map((d) => {
                const status = statusDeliveryLabel(d);
                return (
                  <div key={d.uid} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold uppercase">{d.nome?.[0] ?? "D"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm font-semibold truncate">{d.nome}</p>
                          <p className="text-gray-400 text-xs truncate">{d.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{d.cidade}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{tipoLabel(d.tipo)}</span>
                            <span className="text-xs text-gray-500">BI: {d.bi}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${status.color}`}>{status.text}</span>
                        <p className="text-gray-400 text-xs">{formatDate(d.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {d.status !== "activo" && (
                        <button onClick={() => { if (confirm(`Activar delivery ${d.nome}?`)) activarDelivery(d.uid); }}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition">
                          ✓ Activar
                        </button>
                      )}
                      {d.status === "activo" && (
                        <button onClick={() => { if (confirm(`Desactivar ${d.nome}?`)) desactivarDelivery(d.uid); }}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition">
                          Desactivar
                        </button>
                      )}
                      <a href={`https://wa.me/258${d.telefone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${d.nome}, o seu registo foi confirmado!`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB MARKET ── */}
      {tab === "market" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-gray-900 font-semibold text-base">FunilMarket — Produtos</h2>
              {produtosPendentes > 0 && <p className="text-amber-600 text-xs mt-0.5 font-medium">{produtosPendentes} produto(s) aguardando aprovação</p>}
            </div>
            <input type="text" placeholder="Pesquisar produto..." value={searchProduto} onChange={(e) => setSearchProduto(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-red-400 transition w-64" />
          </div>
          {filteredProdutos.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400 text-sm">Nenhum produto registado</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredProdutos.map((p) => {
                const statusCor = { activo: "bg-green-50 text-green-700 border-green-100", pendente: "bg-amber-50 text-amber-700 border-amber-100", pausado: "bg-gray-50 text-gray-500 border-gray-200" }[p.status];
                return (
                  <div key={p.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {p.imagemUrl ? <img src={p.imagemUrl} alt={p.nome} className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm font-semibold truncate">{p.nome}</p>
                          <p className="text-gray-400 text-xs truncate">{p.descricao}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.categoria}</span>
                            <span className="text-xs font-semibold text-[#e11d48]">{p.preco.toLocaleString("pt-MZ")} MT</span>
                            <span className="text-xs text-gray-400">{p.percentagemAfiliado}% afiliado</span>
                            <span className="text-xs text-gray-400">{p.totalVendas} vendas</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusCor}`}>{p.status}</span>
                        <p className="text-gray-400 text-xs">{formatDate(p.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {p.status === "pendente" && (
                        <button onClick={() => { if (confirm(`Aprovar "${p.nome}"?`)) activarProduto(p.id); }}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition">
                          ✓ Aprovar produto
                        </button>
                      )}
                      {p.status === "activo" && (
                        <button onClick={() => { if (confirm(`Pausar "${p.nome}"?`)) pausarProduto(p.id); }}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition">
                          Pausar
                        </button>
                      )}
                      {p.status === "pausado" && (
                        <button onClick={() => { if (confirm(`Reactivar "${p.nome}"?`)) activarProduto(p.id); }}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition">
                          ✓ Reactivar
                        </button>
                      )}
                      <a href={`/market/produto/${p.id}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition">
                        Ver produto →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB CASHOUTS ── */}
      {tab === "cashouts" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-gray-900 font-semibold text-base">Cashouts — Saques</h2>
              {cashoutsPendentes > 0 && (
                <p className="text-amber-600 text-xs mt-0.5 font-medium">
                  {cashoutsPendentes} saque(s) pendente(s) para processar
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total pago</p>
              <p className="text-sm font-bold text-gray-900">
                {cashouts.filter(c => c.status === 'pago').reduce((s, c) => s + c.valor, 0).toLocaleString('pt-MZ')} MT
              </p>
            </div>
          </div>

          {cashouts.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400 text-sm">Nenhum cashout registado</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cashouts.map((c) => {
                const statusCor = {
                  pendente: "bg-amber-50 text-amber-700 border-amber-100",
                  pago: "bg-green-50 text-green-700 border-green-100",
                  rejeitado: "bg-red-50 text-red-600 border-red-100",
                }[c.status];

                const criador = users.find(u => u.uid === c.userId);

                return (
                  <div key={c.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${c.metodo === 'mpesa' ? 'bg-[#FCEBEB]' : 'bg-blue-50'}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.metodo === 'mpesa' ? '#E24B4A' : '#185FA5'} strokeWidth="2">
                            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm font-semibold">
                            {criador?.nome || criador?.email || c.userId.slice(0, 8) + '...'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {c.metodo === 'mpesa' ? 'M-Pesa' : 'E-Mola'} · +258 {c.numero}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">{formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">{c.valor.toLocaleString('pt-MZ')} MT</p>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusCor}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    {c.status === 'pendente' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            if (confirm(`Confirmar pagamento de ${c.valor.toLocaleString('pt-MZ')} MT via ${c.metodo === 'mpesa' ? 'M-Pesa' : 'E-Mola'} para ${c.numero}?`)) {
                              aprovarCashout(c.id);
                            }
                          }}
                          className="flex-1 text-xs font-medium py-2.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 transition flex items-center justify-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                          Marcar como pago
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Rejeitar cashout de ${c.valor.toLocaleString('pt-MZ')} MT?`)) {
                              rejeitarCashout(c.id);
                            }
                          }}
                          className="flex-1 text-xs font-medium py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition"
                        >
                          Rejeitar
                        </button>
                        <a
                          href={`https://wa.me/258${c.numero}?text=${encodeURIComponent(`Olá! O teu saque de ${c.valor.toLocaleString('pt-MZ')} MT foi processado via ${c.metodo === 'mpesa' ? 'M-Pesa' : 'E-Mola'}. — FunilMarket`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-4 text-xs font-medium py-2.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition flex items-center justify-center"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB VENDAS ── */}
      {tab === "vendas" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-gray-900 font-semibold text-base">Vendas — FunilMarket</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                {totalVendasMarket} transacções · Receita plataforma: {receitaVendas.toFixed(2)} MT
              </p>
            </div>
          </div>

          {vendas.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400 text-sm">Nenhuma venda registada</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {vendas.slice(0, 50).map((v) => {
                const produto = produtos.find(p => p.id === v.produtoId);
                const criador = users.find(u => u.uid === v.criadorId);
                return (
                  <div key={v.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#FCEBEB] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#A32D2D]">
                        {v.compradorNome?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{v.compradorNome}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {produto?.nome ?? v.produtoId} · via {v.metodoPagamento === 'mpesa' ? 'M-Pesa' : 'E-Mola'}
                      </p>
                      <p className="text-xs text-gray-300">{formatDate(v.createdAt)} · criador: {criador?.nome || criador?.email || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{v.valor.toLocaleString('pt-MZ')} MT</p>
                      <p className="text-xs text-green-600">+{v.valorPlataforma.toFixed(0)} MT plataforma</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}