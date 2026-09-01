"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getTodasVendas,
  addDespesa,
  deleteDespesa,
  watchDespesas,
  type VendaComCliente,
  type Despesa,
  type CategoriaDespesa,
} from "@/lib/negocio";

const categorias: CategoriaDespesa[] = ["Marketing", "Pessoal", "Operacional", "Tecnologia", "Outros"];
const categoriaCor: Record<CategoriaDespesa, string> = {
  Marketing: "#3B82F6",
  Pessoal: "#16A34A",
  Operacional: "#FBBF24",
  Tecnologia: "#8B5CF6",
  Outros: "#9CA3AF",
};

function StatCard({ label, value, caption, tone = "neutral" }: { label: string; value: string; caption?: string; tone?: "positive" | "negative" | "neutral" }) {
  const cor = tone === "positive" ? "text-green-600" : tone === "negative" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-5">
      <div className="text-[11px] sm:text-xs text-gray-400 font-medium">{label}</div>
      <div className={`text-lg sm:text-2xl font-bold mt-1 leading-tight ${cor}`}>{value}</div>
      {caption && <div className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">{caption}</div>}
    </div>
  );
}

function FluxoMensalChart({ vendas, despesas }: { vendas: VendaComCliente[]; despesas: Despesa[] }) {
  const agora = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), label: d.toLocaleDateString("pt-MZ", { month: "short" }) };
  });

  const receitas = meses.map(({ ano, mes }) =>
    vendas.filter((v) => v.data.toDate().getFullYear() === ano && v.data.toDate().getMonth() === mes).reduce((a, v) => a + v.valor, 0)
  );
  const gastos = meses.map(({ ano, mes }) =>
    despesas.filter((d) => d.data.toDate().getFullYear() === ano && d.data.toDate().getMonth() === mes).reduce((a, d) => a + d.valor, 0)
  );

  const max = Math.max(...receitas, ...gastos, 1);

  if (receitas.every((v) => v === 0) && gastos.every((v) => v === 0)) {
    return <p className="text-sm text-gray-400 text-center py-8">Ainda sem movimentos nos últimos 6 meses.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-600" /> Receitas
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Despesas
        </span>
      </div>
      <div className="flex items-end justify-between gap-2 sm:gap-3 h-40">
        {meses.map((m, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex items-end gap-1 h-32 w-full justify-center">
              <div className="w-2.5 sm:w-3 bg-green-600 rounded-t-sm" style={{ height: `${(receitas[i] / max) * 100}%` }} />
              <div className="w-2.5 sm:w-3 bg-red-400 rounded-t-sm" style={{ height: `${(gastos[i] / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-gray-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DespesasPorCategoriaDonut({ despesas }: { despesas: Despesa[] }) {
  const total = despesas.reduce((a, d) => a + d.valor, 0);
  const R = 55;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

  if (total === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Ainda sem despesas registadas.</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
      <div className="relative w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] shrink-0">
        <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90">
          {categorias.map((cat) => {
            const valor = despesas.filter((d) => d.categoria === cat).reduce((a, d) => a + d.valor, 0);
            if (valor === 0) return null;
            const frac = valor / total;
            const dash = frac * C;
            const offset = acumulado * C;
            acumulado += frac;
            return (
              <circle key={cat} cx="75" cy="75" r={R} fill="none" stroke={categoriaCor[cat]} strokeWidth="17" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base sm:text-lg font-bold text-gray-900">{total.toLocaleString("pt-MZ")}</span>
          <span className="text-[10px] text-gray-400">MTn total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full min-w-0">
        {categorias.map((cat) => {
          const valor = despesas.filter((d) => d.categoria === cat).reduce((a, d) => a + d.valor, 0);
          if (valor === 0) return null;
          return (
            <div key={cat} className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="flex items-center gap-2 text-gray-600 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: categoriaCor[cat] }} />
                <span className="truncate">{cat}</span>
              </span>
              <span className="text-gray-900 font-semibold shrink-0">{valor.toLocaleString("pt-MZ")} MTn</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<VendaComCliente[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDespesa>("Operacional");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user) return;
    getTodasVendas(user.uid).then((v) => {
      setVendas(v);
      setCarregandoVendas(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchDespesas(user.uid, setDespesas);
    return () => unsub();
  }, [user]);

  async function handleAddDespesa(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !descricao.trim() || !valor) return;
    setSalvando(true);
    await addDespesa(user.uid, { descricao: descricao.trim(), valor: Number(valor), categoria, data: new Date() });
    setDescricao("");
    setValor("");
    setCategoria("Operacional");
    setShowForm(false);
    setSalvando(false);
  }

  async function handleDeleteDespesa(id: string) {
    if (!user) return;
    await deleteDespesa(user.uid, id);
  }

  if (!user || carregandoVendas) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>;
  }

  const receitaTotal = vendas.reduce((acc, v) => acc + v.valor, 0);
  const despesasTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
  const lucroLiquido = receitaTotal - despesasTotal;
  const margem = receitaTotal > 0 ? ((lucroLiquido / receitaTotal) * 100).toFixed(1) : "0.0";

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Receita das vendas menos as despesas registadas.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"
        >
          {showForm ? "Cancelar" : "+ Nova Despesa"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddDespesa} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-4 flex flex-col gap-3">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição da despesa (ex: renda da loja)"
            required
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor (MTn)"
            required
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)}
            className="border-b border-gray-200 pb-2 text-sm outline-none focus:border-green-500 bg-transparent"
          >
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={salvando}
            className="self-start bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {salvando ? "A guardar..." : "Guardar despesa"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <StatCard label="Receita Bruta" value={`${receitaTotal.toLocaleString("pt-MZ")} MTn`} tone="positive" />
        <StatCard label="Despesas" value={`${despesasTotal.toLocaleString("pt-MZ")} MTn`} tone="negative" />
        <StatCard label="Lucro Líquido" value={`${lucroLiquido.toLocaleString("pt-MZ")} MTn`} tone={lucroLiquido >= 0 ? "positive" : "negative"} />
        <StatCard label="Margem" value={`${margem}%`} tone={lucroLiquido >= 0 ? "positive" : "negative"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Fluxo (últimos 6 meses)</h2>
          <FluxoMensalChart vendas={vendas} despesas={despesas} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 sm:mb-5">Despesas por categoria</h2>
          <DespesasPorCategoriaDonut despesas={despesas} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-10">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Últimas despesas</h2>
        {despesas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nenhuma despesa registada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {despesas.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-100 px-3.5 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: categoriaCor[d.categoria] }} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{d.descricao}</div>
                    <div className="text-[11px] text-gray-400">
                      {d.categoria} · {d.data.toDate().toLocaleDateString("pt-MZ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">{d.valor.toLocaleString("pt-MZ")} MTn</span>
                  <button onClick={() => handleDeleteDespesa(d.id)} className="text-red-500 text-xs font-semibold">
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}