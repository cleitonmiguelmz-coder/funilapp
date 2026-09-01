"use client";

import { useEffect, useMemo, useState } from "react";

const fmtMT = (n: number) =>
  (Math.round(n * 100) / 100).toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " MTn";

const fmtNum = (n: number) => Math.round(n).toLocaleString("pt-MZ");

const STORAGE_KEY = "funilapp_simulador_cenarios";

interface Cenario {
  id: string;
  nome: string;
  preco: number;
  custo: number;
  despesasFixas: number;
  vendasDia: number;
}

function StatCard({
  label,
  value,
  caption,
  tone = "neutral",
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const cor = tone === "positive" ? "text-green-600" : tone === "negative" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-3.5 sm:p-4">
      <div className="text-[11px] text-gray-400 font-medium">{label}</div>
      <div className={`text-lg font-bold mt-1 ${cor}`}>{value}</div>
      {caption && <div className="text-[10px] text-gray-400 mt-0.5">{caption}</div>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] text-gray-400 font-medium">{label}</label>
      <div className="flex items-baseline gap-1.5">
        {prefix && <span className="text-sm text-gray-400 font-medium">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-lg font-bold text-gray-900 outline-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-green-600 cursor-pointer"
      />
    </div>
  );
}

function ProjecaoChart({
  vendasDiaEfetivo,
  preco,
  margemUnit,
  despesasFixas,
  horizonte,
}: {
  vendasDiaEfetivo: number;
  preco: number;
  margemUnit: number;
  despesasFixas: number;
  horizonte: number;
}) {
  const pontos = 6;
  const step = horizonte / (pontos - 1);
  const dias = Array.from({ length: pontos }, (_, i) => Math.round(i * step));
  const receita = dias.map((d) => preco * vendasDiaEfetivo * d);
  const lucro = dias.map((d) => margemUnit * vendasDiaEfetivo * d - despesasFixas * (d / 30));

  const max = Math.max(...receita, ...lucro, 1);
  const min = Math.min(0, ...lucro);
  const range = max - min || 1;
  const W = 640;
  const H = 190;
  const pad = 16;
  const padEsquerda = 56;

  const x = (i: number) => padEsquerda + (i / (pontos - 1)) * (W - padEsquerda - pad);
  const y = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);

  const pathFor = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const areaLucro = `${pathFor(lucro)} L ${x(pontos - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  const gridValores = [max, min + range * 0.5, min].filter((v, i, arr) => arr.indexOf(v) === i);

  const fmtCurto = (v: number) => {
    const sinal = v < 0 ? "-" : "";
    const abs = Math.abs(v);
    if (abs >= 1000) return `${sinal}${(abs / 1000).toFixed(0)}k MTn`;
    return `${sinal}${Math.round(abs)} MTn`;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Receita
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Lucro
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16A34A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={padEsquerda} x2={W - pad} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} stroke="#F3F4F6" strokeWidth="1" />
        ))}
        {[max, min + range * 0.5, min].map((v, i) => (
          <text key={i} x={padEsquerda - 8} y={pad + i * ((H - pad * 2) / 2) + 3} fontSize="9" fill="#9CA3AF" textAnchor="end">
            {fmtCurto(v)}
          </text>
        ))}
        <line x1={padEsquerda} x2={W - pad} y1={y(0)} y2={y(0)} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
        <path d={areaLucro} fill="url(#lucroGrad)" stroke="none" />
        <path d={pathFor(receita)} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
        <path d={pathFor(lucro)} fill="none" stroke="#16A34A" strokeWidth="2.5" />
        {receita.map((v, i) => (
          <circle key={`r${i}`} cx={x(i)} cy={y(v)} r="3" fill="#3B82F6" />
        ))}
        {lucro.map((v, i) => (
          <circle key={`l${i}`} cx={x(i)} cy={y(v)} r="3" fill="#16A34A" />
        ))}
        <text x={x(pontos - 1)} y={y(receita[pontos - 1]) - 8} fontSize="10" fill="#3B82F6" textAnchor="end" fontWeight="600">
          {fmtCurto(receita[pontos - 1])}
        </text>
        <text x={x(pontos - 1)} y={y(lucro[pontos - 1]) + 14} fontSize="10" fill="#16A34A" textAnchor="end" fontWeight="600">
          {fmtCurto(lucro[pontos - 1])}
        </text>
        {dias.map((d, i) => (
          <text key={d} x={x(i)} y={H - 2} fontSize="10" fill="#9CA3AF" textAnchor="middle">
            dia {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface Recomendacao {
  tipo: "alerta" | "aviso" | "positivo";
  texto: string;
}

function gerarRecomendacoes(calc: {
  margemUnit: number;
  lucroMes: number;
  receitaMes: number;
  peUnidadesDia: number;
}, preco: number, custo: number, despesasFixas: number, vendasDia: number): Recomendacao[] {
  const recs: Recomendacao[] = [];

  if (calc.margemUnit <= 0) {
    recs.push({
      tipo: "alerta",
      texto: `Estás a vender abaixo do custo — o preço (${fmtMT(preco)}) não cobre sequer o custo por unidade (${fmtMT(custo)}). Sobe o preço acima de ${fmtMT(custo)} antes de mais nada.`,
    });
    return recs;
  }

  if (calc.lucroMes < 0) {
    const vendasParaEquilibrio = Math.ceil(calc.peUnidadesDia - vendasDia);
    const precoParaEquilibrio = Math.ceil(custo + despesasFixas / (30 * Math.max(vendasDia, 1)));
    recs.push({
      tipo: "alerta",
      texto: `Estás a perder ${fmtMT(Math.abs(calc.lucroMes))}/mês. Para chegar ao ponto de equilíbrio com as vendas atuais, precisas de mais ${vendasParaEquilibrio > 0 ? vendasParaEquilibrio : 0} vendas/dia, ou subir o preço para pelo menos ${fmtMT(precoParaEquilibrio)}.`,
    });
  } else {
    const margemPercent = (calc.margemUnit / preco) * 100;
    if (margemPercent < 15) {
      recs.push({
        tipo: "aviso",
        texto: `A tua margem é de ${margemPercent.toFixed(0)}% do preço — bastante apertada. Qualquer aumento no custo (ex: fornecedor, transporte) pode fazer-te entrar em prejuízo facilmente.`,
      });
    }

    if (vendasDia >= calc.peUnidadesDia * 1.5) {
      const folga = Math.round(((vendasDia - calc.peUnidadesDia) / calc.peUnidadesDia) * 100);
      recs.push({
        tipo: "positivo",
        texto: `Estás ${folga}% acima do ponto de equilíbrio — boa folga. Se o mercado aguentar, subir o preço em 10% aumentaria o lucro em cerca de ${fmtMT(calc.receitaMes * 0.1)}/mês, mantendo as mesmas vendas.`,
      });
    }

    if (despesasFixas > calc.receitaMes * 0.4) {
      recs.push({
        tipo: "aviso",
        texto: `As despesas fixas (${fmtMT(despesasFixas)}) representam mais de 40% da tua receita mensal — vale a pena rever se há alguma para cortar ou negociar.`,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({ tipo: "positivo", texto: "Os números estão equilibrados — sem alertas para já." });
  }

  return recs;
}

function RecomendacoesPanel({ recomendacoes }: { recomendacoes: Recomendacao[] }) {
  const estilos: Record<Recomendacao["tipo"], { bg: string; border: string; text: string; icone: string }> = {
    alerta: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", icone: "#DC2626" },
    aviso: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-800", icone: "#D97706" },
    positivo: { bg: "bg-green-50", border: "border-green-100", text: "text-green-700", icone: "#16A34A" },
  };

  return (
    <div className="flex flex-col gap-2.5">
      {recomendacoes.map((r, i) => {
        const s = estilos[r.tipo];
        return (
          <div key={i} className={`flex items-start gap-2.5 rounded-lg border p-3 ${s.bg} ${s.border}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.icone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              {r.tipo === "positivo" ? (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
              {r.tipo === "positivo" && <polyline points="22 4 12 14.01 9 11.01" />}
            </svg>
            <p className={`text-xs sm:text-sm ${s.text}`}>{r.texto}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function SimuladorPage() {
  const [modo, setModo] = useState<"simular" | "meta">("simular");
  const [preco, setPreco] = useState(500);
  const [custo, setCusto] = useState(250);
  const [despesasFixas, setDespesasFixas] = useState(15000);
  const [vendasDia, setVendasDia] = useState(10);
  const [metaLucro, setMetaLucro] = useState(50000);
  const [horizonte, setHorizonte] = useState(30);

  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [nomeCenario, setNomeCenario] = useState("");
  const [cenarioAtivoId, setCenarioAtivoId] = useState<string | null>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) setCenarios(JSON.parse(raw));
  }, []);

  function guardarCenario() {
    if (!nomeCenario.trim()) return;
    const novo: Cenario = {
      id: crypto.randomUUID(),
      nome: nomeCenario.trim(),
      preco,
      custo,
      despesasFixas,
      vendasDia,
    };
    const atualizados = [novo, ...cenarios].slice(0, 8);
    setCenarios(atualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    setNomeCenario("");
  }

  function carregarCenario(c: Cenario) {
    setPreco(c.preco);
    setCusto(c.custo);
    setDespesasFixas(c.despesasFixas);
    setVendasDia(c.vendasDia);
    setModo("simular");
    setCenarioAtivoId(c.id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function apagarCenario(id: string) {
    const atualizados = cenarios.filter((c) => c.id !== id);
    setCenarios(atualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
  }

  const calc = useMemo(() => {
    const margemUnit = preco - custo;
    const receitaDia = preco * vendasDia;
    const custoVarDia = custo * vendasDia;
    const margemDia = margemUnit * vendasDia;
    const receitaMes = receitaDia * 30;
    const custoVarMes = custoVarDia * 30;
    const lucroMes = receitaMes - custoVarMes - despesasFixas;
    const peUnidadesMes = margemUnit > 0 ? despesasFixas / margemUnit : Infinity;
    return { margemUnit, margemDia, receitaDia, receitaMes, custoVarMes, lucroMes, peUnidadesDia: peUnidadesMes / 30 };
  }, [preco, custo, despesasFixas, vendasDia]);

  const metaCalc = useMemo(() => {
    const margemUnit = preco - custo;
    if (margemUnit <= 0) return { vendasNecessariasDia: Infinity };
    const vendasNecessariasMes = (metaLucro + despesasFixas) / margemUnit;
    return { vendasNecessariasDia: vendasNecessariasMes / 30 };
  }, [preco, custo, despesasFixas, metaLucro]);

  const vendasDiaEfetivo = modo === "meta" ? metaCalc.vendasNecessariasDia : vendasDia;
  const vendasDiaParaGrafico = isFinite(vendasDiaEfetivo) ? vendasDiaEfetivo : 0;

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Simulador</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Simula cenários e projeta resultados.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["simular", "meta"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                modo === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "simular" ? "Simular" : "Definir meta"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        {/* parâmetros */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Parâmetros</h2>
          <div className="flex flex-col gap-5">
            <Field
              label="Preço de venda"
              value={preco}
              onChange={(v) => {
                setPreco(v);
                setCenarioAtivoId(null);
              }}
              min={0}
              max={5000}
              step={10}
              prefix="MT"
            />
            <Field
              label="Custo por unidade"
              value={custo}
              onChange={(v) => {
                setCusto(v);
                setCenarioAtivoId(null);
              }}
              min={0}
              max={5000}
              step={10}
              prefix="MT"
            />
            <Field
              label="Despesas fixas / mês"
              value={despesasFixas}
              onChange={(v) => {
                setDespesasFixas(v);
                setCenarioAtivoId(null);
              }}
              min={0}
              max={200000}
              step={500}
              prefix="MT"
            />
            {modo === "simular" ? (
              <Field
                label="Vendas esperadas / dia"
                value={vendasDia}
                onChange={(v) => {
                  setVendasDia(v);
                  setCenarioAtivoId(null);
                }}
                min={0}
                max={100}
                step={1}
              />
            ) : (
              <Field label="Lucro que queres / mês" value={metaLucro} onChange={setMetaLucro} min={0} max={500000} step={1000} prefix="MT" />
            )}
          </div>
        </div>

        {/* resultados */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Resultados</h2>

          {modo === "meta" ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <span className="text-[11px] text-gray-400 font-medium">Precisas vender</span>
              <span className="text-3xl font-bold text-green-600 mt-2">
                {isFinite(metaCalc.vendasNecessariasDia) ? `${fmtNum(metaCalc.vendasNecessariasDia)} un.` : "— margem 0 —"}
              </span>
              <span className="text-xs text-gray-400 mt-1">por dia, todos os dias do mês</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    calc.lucroMes >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {calc.lucroMes >= 0 ? "Lucro" : "Prejuízo"}
                </span>
                <span className="text-2xl font-bold text-gray-900">{fmtMT(Math.abs(calc.lucroMes))}</span>
                <span className="text-xs text-gray-400">/ mês</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Margem / unidade" value={fmtMT(calc.margemUnit)} />
                <StatCard label="Receita / mês" value={fmtMT(calc.receitaMes)} />
                <StatCard
                  label="Ponto de equilíbrio"
                  value={isFinite(calc.peUnidadesDia) ? `${fmtNum(calc.peUnidadesDia)} un/dia` : "—"}
                  caption={vendasDia >= calc.peUnidadesDia ? "Estás acima" : "Ainda não chega"}
                  tone={vendasDia >= calc.peUnidadesDia ? "positive" : "negative"}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {modo === "simular" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mt-3 sm:mt-4">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Recomendações</h2>
          <RecomendacoesPanel recomendacoes={gerarRecomendacoes(calc, preco, custo, despesasFixas, vendasDia)} />
        </div>
      )}

      {/* projeção */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mt-3 sm:mt-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h2 className="text-sm font-bold text-gray-900">Projeção — Receita e Lucro</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[30, 90, 180].map((h) => (
              <button
                key={h}
                onClick={() => setHorizonte(h)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  horizonte === h ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {h}d
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {modo === "meta" ? "Vendas/dia necessárias para atingir a meta." : "Com base nas vendas esperadas por dia."}
        </p>
        {vendasDiaParaGrafico === 0 && modo === "meta" ? (
          <p className="text-sm text-gray-400 text-center py-10">Margem por unidade é zero ou negativa — ajusta o preço ou o custo para ver a projeção.</p>
        ) : (
          <ProjecaoChart
            vendasDiaEfetivo={vendasDiaParaGrafico}
            preco={preco}
            margemUnit={calc.margemUnit}
            despesasFixas={despesasFixas}
            horizonte={horizonte}
          />
        )}
      </div>

      {/* cenários */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mt-3 sm:mt-4 mb-10">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Cenários guardados</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={nomeCenario}
            onChange={(e) => setNomeCenario(e.target.value)}
            placeholder="Nome do cenário (ex: se baixar o preço)"
            className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500"
          />
          <button
            onClick={guardarCenario}
            className="bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"
          >
            Guardar cenário atual
          </button>
        </div>

        {cenarios.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhum cenário guardado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cenarios.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-lg px-3.5 py-3 border transition-colors ${
                  cenarioAtivoId === c.id ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"
                }`}
              >
                <button onClick={() => carregarCenario(c)} className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900 truncate">{c.nome}</div>
                    {cenarioAtivoId === c.id && (
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full shrink-0">
                        A ver este
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {fmtMT(c.preco)} · custo {fmtMT(c.custo)} · {c.vendasDia} un/dia
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`Eliminar o cenário "${c.nome}"? Não dá para desfazer.`)) return;
                    apagarCenario(c.id);
                    if (cenarioAtivoId === c.id) setCenarioAtivoId(null);
                  }}
                  className="flex items-center gap-1 text-gray-400 hover:text-red-500 shrink-0 ml-3 text-xs font-semibold transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}