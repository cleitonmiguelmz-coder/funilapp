"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getTodasVendas, type VendaComCliente } from "@/lib/negocio";

const tabs = ["Vendas", "Clientes", "Produtos"] as const;
type Tab = (typeof tabs)[number];

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-3.5 sm:p-4">
      <div className="text-[11px] text-gray-400 font-medium">{label}</div>
      <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function BarrasHorizontais({ dados }: { dados: Array<{ nome: string; valor: number }> }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  if (dados.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Ainda sem dados para mostrar aqui.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {dados.map((d) => (
        <div key={d.nome}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600 font-medium truncate">{d.nome}</span>
            <span className="text-gray-900 font-semibold shrink-0">{d.valor.toLocaleString("pt-MZ")} MTn</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full" style={{ width: `${(d.valor / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<VendaComCliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tab, setTab] = useState<Tab>("Vendas");

  useEffect(() => {
    if (!user) return;
    getTodasVendas(user.uid).then((v) => {
      setVendas(v);
      setCarregando(false);
    });
  }, [user]);

  if (!user || carregando) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>;
  }

  const receitaTotal = vendas.reduce((acc, v) => acc + v.valor, 0);
  const numVendas = vendas.length;
  const ticketMedio = numVendas > 0 ? receitaTotal / numVendas : 0;
  const clientesUnicos = new Set(vendas.map((v) => v.clienteId)).size;

  const porCliente = new Map<string, number>();
  vendas.forEach((v) => porCliente.set(v.clienteNome, (porCliente.get(v.clienteNome) ?? 0) + v.valor));
  const clientesOrdenados = Array.from(porCliente.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  const porDescricao = new Map<string, number>();
  vendas.forEach((v) => porDescricao.set(v.descricao, (porDescricao.get(v.descricao) ?? 0) + v.valor));
  const produtosOrdenados = Array.from(porDescricao.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-5xl mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Baseado nas vendas registadas.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Vendas" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <KpiCard label="Total de Vendas" value={`${receitaTotal.toLocaleString("pt-MZ")} MTn`} />
            <KpiCard label="Número de Vendas" value={String(numVendas)} />
            <KpiCard label="Ticket Médio" value={`${ticketMedio.toLocaleString("pt-MZ", { maximumFractionDigits: 0 })} MTn`} />
            <KpiCard label="Clientes com compras" value={String(clientesUnicos)} />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Vendas por cliente</h2>
            <BarrasHorizontais dados={clientesOrdenados.slice(0, 6)} />
          </div>
        </>
      )}

      {tab === "Clientes" && (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {clientesOrdenados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Ainda sem vendas registadas.</p>
          ) : (
            clientesOrdenados.map((c) => {
              const numComprasCliente = vendas.filter((v) => v.clienteNome === c.nome).length;
              return (
                <div key={c.nome} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{c.nome}</div>
                    <div className="text-xs text-gray-400">{numComprasCliente} venda{numComprasCliente !== 1 ? "s" : ""}</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{c.valor.toLocaleString("pt-MZ")} MTn</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "Produtos" && (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {produtosOrdenados.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Ainda sem vendas registadas.</p>
          ) : (
            produtosOrdenados.map((p) => {
              const numVendasProduto = vendas.filter((v) => v.descricao === p.nome).length;
              return (
                <div key={p.nome} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{p.nome}</div>
                    <div className="text-xs text-gray-400">{numVendasProduto} venda{numVendasProduto !== 1 ? "s" : ""}</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{p.valor.toLocaleString("pt-MZ")} MTn</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}