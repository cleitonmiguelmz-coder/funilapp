"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { watchLeads, watchAtividades, addAtividade, concluirAtividade, deleteAtividade, type Lead, type EstagioLead, type Atividade } from "@/lib/negocio";

function StatCard({
  label,
  value,
  delta,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-5">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <span className="text-[11px] sm:text-xs text-gray-400 font-medium leading-tight">{label}</span>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{value}</div>
      <div className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">{delta}</div>
    </div>
  );
}

const estagioCor: Record<EstagioLead, string> = {
  "Novo Lead": "#3B82F6",
  Proposta: "#FBBF24",
  Negociação: "#8B5CF6",
  "Fechado Ganhou": "#16A34A",
  "Fechado Perdeu": "#EF4444",
};

const estagioOrdem: EstagioLead[] = ["Novo Lead", "Proposta", "Negociação", "Fechado Ganhou", "Fechado Perdeu"];

function DonutEstagios({ leads }: { leads: Lead[] }) {
  const total = leads.length;
  const R = 60;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

  if (total === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Ainda sem negócios para mostrar aqui.</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
      <div className="relative w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {estagioOrdem.map((estagio) => {
            const valor = leads.filter((l) => l.estagio === estagio).length;
            if (valor === 0) return null;
            const frac = valor / total;
            const dash = frac * C;
            const offset = acumulado * C;
            acumulado += frac;
            return (
              <circle
                key={estagio}
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={estagioCor[estagio]}
                strokeWidth="18"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] sm:text-[11px] text-gray-400">Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full min-w-0">
        {estagioOrdem.map((estagio) => {
          const valor = leads.filter((l) => l.estagio === estagio).length;
          return (
            <div key={estagio} className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="flex items-center gap-2 text-gray-600 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: estagioCor[estagio] }} />
                <span className="truncate">{estagio}</span>
              </span>
              <span className="text-gray-900 font-semibold shrink-0">
                {valor} <span className="text-gray-400 font-normal">({total > 0 ? Math.round((valor / total) * 100) : 0}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FaturamentoChart({ leads }: { leads: Lead[] }) {
  const agora = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), label: d.toLocaleDateString("pt-MZ", { month: "short" }) };
  });

  const valores = meses.map(({ ano, mes }) =>
    leads
      .filter((l) => {
        const d = l.createdAt.toDate();
        return l.estagio === "Fechado Ganhou" && d.getFullYear() === ano && d.getMonth() === mes;
      })
      .reduce((acc, l) => acc + (l.valor || 0), 0)
  );

  const max = Math.max(...valores, 1);
  const W = 480;
  const H = 180;
  const pad = 14;
  const x = (i: number) => pad + (i / (meses.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = valores.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L ${x(valores.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;

  if (valores.every((v) => v === 0)) {
    return <p className="text-sm text-gray-400 text-center py-8">Ainda sem negócios fechados para mostrar aqui.</p>;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={W - pad} y1={H * f} y2={H * f} stroke="#F3F4F6" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#fatGrad)" stroke="none" />
      <path d={path} fill="none" stroke="#16A34A" strokeWidth="2.5" />
      {valores.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#16A34A" />
      ))}
      {meses.map((m, i) => (
        <text key={i} x={x(i)} y={H - 1} fontSize="11" fill="#9CA3AF" textAnchor="middle">
          {m.label}
        </text>
      ))}
    </svg>
  );
}

const progressoEstagio: Record<EstagioLead, number> = {
  "Novo Lead": 15,
  Proposta: 45,
  Negociação: 75,
  "Fechado Ganhou": 100,
  "Fechado Perdeu": 100,
};

export default function NegocioDashboardPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [dataAtividade, setDataAtividade] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = watchLeads(user.uid, setLeads);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchAtividades(user.uid, setAtividades);
    return () => unsub();
  }, [user]);

  async function handleAddAtividade(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !titulo.trim() || !dataAtividade) return;
    setSalvando(true);
    await addAtividade(user.uid, { titulo: titulo.trim(), data: new Date(dataAtividade) });
    setTitulo("");
    setDataAtividade("");
    setShowForm(false);
    setSalvando(false);
  }

  async function toggleConcluida(a: Atividade) {
    if (!user) return;
    await concluirAtividade(user.uid, a.id, !a.concluida);
  }

  async function removerAtividade(id: string) {
    if (!user) return;
    await deleteAtividade(user.uid, id);
  }

  if (!user) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>;
  }

  const totalLeads = leads.length;
  const emAndamento = leads.filter((l) => ["Novo Lead", "Proposta", "Negociação"].includes(l.estagio)).length;
  const agora = new Date();
  const faturamentoMensal = leads
    .filter((l) => {
      const d = l.createdAt.toDate();
      return l.estagio === "Fechado Ganhou" && d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth();
    })
    .reduce((acc, l) => acc + (l.valor || 0), 0);
  const fechadosGanhou = leads.filter((l) => l.estagio === "Fechado Ganhou").length;
  const conversao = totalLeads > 0 ? ((fechadosGanhou / totalLeads) * 100).toFixed(1) : "0.0";

  const negociosAndamento = leads
    .filter((l) => ["Proposta", "Negociação"].includes(l.estagio))
    .slice(0, 5);

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Resumo do teu negócio.</p>
        </div>
        <span className="bg-green-50 text-green-700 border border-green-100 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
          Módulo gratuito
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <StatCard
          label="Leads Totais"
          value={String(totalLeads)}
          delta="Total registado"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <StatCard
          label="Negócios em Andamento"
          value={String(emAndamento)}
          delta="Ainda não fechados"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            </svg>
          }
        />
        <StatCard
          label="Faturamento Mensal"
          value={`${faturamentoMensal.toLocaleString("pt-MZ")} MTn`}
          delta="Negócios fechados este mês"
          iconBg="bg-green-50"
          iconColor="text-green-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Conversão"
          value={`${conversao}%`}
          delta="Leads → Fechado Ganhou"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          }
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Negócios por estágio</h2>
          <DonutEstagios leads={leads} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Faturamento (últimos 6 meses)</h2>
          <FaturamentoChart leads={leads} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Atividades próximas</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-xs font-semibold text-green-600 hover:text-green-700"
            >
              {showForm ? "Cancelar" : "+ Adicionar"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddAtividade} className="flex flex-col gap-2.5 mb-4 bg-gray-50 rounded-lg border border-gray-100 p-3.5">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="O que precisas de fazer?"
                required
                className="border-b border-gray-200 pb-1.5 text-sm bg-transparent outline-none focus:border-green-500"
              />
              <input
                type="datetime-local"
                value={dataAtividade}
                onChange={(e) => setDataAtividade(e.target.value)}
                required
                className="border-b border-gray-200 pb-1.5 text-sm bg-transparent outline-none focus:border-green-500"
              />
              <button
                type="submit"
                disabled={salvando}
                className="self-start bg-gray-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg disabled:opacity-50"
              >
                {salvando ? "A guardar..." : "Guardar"}
              </button>
            </form>
          )}

          {atividades.filter((a) => !a.concluida).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma atividade pendente.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {atividades
                .filter((a) => !a.concluida)
                .slice(0, 5)
                .map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleConcluida(a)}
                      className="w-5 h-5 rounded-md border-2 border-gray-300 hover:border-green-500 shrink-0 mt-0.5 transition-colors"
                      aria-label="Marcar como concluída"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 truncate">{a.titulo}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {a.data.toDate().toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" })} ·{" "}
                        {a.data.toDate().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <button onClick={() => removerAtividade(a.id)} className="text-gray-300 hover:text-red-500 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Negócios em andamento</h2>
          {negociosAndamento.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum negócio em Proposta ou Negociação.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {negociosAndamento.map((n) => (
                <div key={n.id}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{n.nome}</div>
                      <div className="text-xs text-gray-400">{n.estagio}</div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {n.valor > 0 ? `${n.valor.toLocaleString("pt-MZ")} MTn` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${progressoEstagio[n.estagio]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}