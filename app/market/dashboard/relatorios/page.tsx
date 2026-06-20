'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getVendasDoCriador, getProdutosDoCriador, calcularSaldoDisponivel } from '@/lib/marketplace';
import { Produto, Venda } from '@/lib/types';
import { ArrowLeft, Download, TrendingUp, ShoppingBag, Wallet, Users } from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────────────────
type Periodo = '7dias' | '30dias' | '3meses' | '1ano';

interface VendaDia {
  dia: number;
  valor: number;
}

interface ProdutoRanking {
  rank: number;
  nome: string;
  preco: number;
  tipo: string;
  receita: number;
  vendas: number;
}

interface MetodoPagamento {
  metodo: string;
  percentagem: number;
  cor: string;
}

interface VendaRecente {
  iniciais: string;
  nome: string;
  produto: string;
  valor: number;
  hora: string;
  cor: string;
}

interface DadosRelatorio {
  receita: number;
  variacao: number;
  vendas: number;
  saldo: number;
  afiliados: number;
  vendasPorDia: VendaDia[];
  produtos: ProdutoRanking[];
  pagamentos: MetodoPagamento[];
  vendasRecentes: VendaRecente[];
}

const CORES_AVATAR = ['#E24B4A', '#2D8CFF', '#9B59B6', '#27AE60', '#E67E22'];

// ── Funções utilitárias ────────────────────────────────────────────────────
function filtrarPorPeriodo(vendas: Venda[], periodo: Periodo): Venda[] {
  const agora = new Date();
  const dias = periodo === '7dias' ? 7 : periodo === '30dias' ? 30 : periodo === '3meses' ? 90 : 365;
  const limite = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  return vendas.filter(v => {
    const data = v.createdAt instanceof Date ? v.createdAt : (v.createdAt as any)?.toDate?.() ?? new Date();
    return data >= limite;
  });
}

function calcularVariacao(vendasActuais: Venda[], vendasTodas: Venda[], periodo: Periodo): number {
  const dias = periodo === '7dias' ? 7 : periodo === '30dias' ? 30 : periodo === '3meses' ? 90 : 365;
  const agora = new Date();
  const inicioActual = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  const inicioAnterior = new Date(agora.getTime() - 2 * dias * 24 * 60 * 60 * 1000);

  const receitaActual = vendasActuais.reduce((s, v) => s + v.valorCriador, 0);
  const vendasAnteriores = vendasTodas.filter(v => {
    const data = v.createdAt instanceof Date ? v.createdAt : (v.createdAt as any)?.toDate?.() ?? new Date();
    return data >= inicioAnterior && data < inicioActual;
  });
  const receitaAnterior = vendasAnteriores.reduce((s, v) => s + v.valorCriador, 0);

  if (receitaAnterior === 0) return receitaActual > 0 ? 100 : 0;
  return Math.round(((receitaActual - receitaAnterior) / receitaAnterior) * 100);
}

function agruparPorDia(vendas: Venda[], periodo: Periodo): VendaDia[] {
  const dias = periodo === '7dias' ? 7 : 30;
  const agora = new Date();
  return Array.from({ length: dias }, (_, i) => {
    const dia = new Date(agora.getTime() - (dias - 1 - i) * 24 * 60 * 60 * 1000);
    const valor = vendas
      .filter(v => {
        const d = v.createdAt instanceof Date ? v.createdAt : (v.createdAt as any)?.toDate?.() ?? new Date();
        return d.toDateString() === dia.toDateString();
      })
      .reduce((s, v) => s + v.valorCriador, 0);
    return { dia: i + 1, valor };
  });
}

function calcularRankingProdutos(vendas: Venda[], produtos: Produto[]): ProdutoRanking[] {
  const mapa: Record<string, { receita: number; vendas: number }> = {};
  vendas.forEach(v => {
    if (!mapa[v.produtoId]) mapa[v.produtoId] = { receita: 0, vendas: 0 };
    mapa[v.produtoId].receita += v.valorCriador;
    mapa[v.produtoId].vendas += 1;
  });

  return Object.entries(mapa)
    .map(([id, stats]) => {
      const prod = produtos.find(p => p.id === id);
      return {
        rank: 0,
        nome: prod?.nome ?? 'Produto',
        preco: prod?.preco ?? 0,
        tipo: prod?.categoria ?? 'Digital',
        receita: stats.receita,
        vendas: stats.vendas,
      };
    })
    .sort((a, b) => b.receita - a.receita)
    .map((p, i) => ({ ...p, rank: i + 1 }))
    .slice(0, 3);
}

function calcularPagamentos(vendas: Venda[]): MetodoPagamento[] {
  const total = vendas.length;
  if (total === 0) return [];
  const mpesa = vendas.filter(v => (v as any).metodoPagamento === 'mpesa').length;
  const emola = total - mpesa;
  return [
    { metodo: 'M-Pesa', percentagem: Math.round((mpesa / total) * 100), cor: '#E24B4A' },
    { metodo: 'E-Mola', percentagem: Math.round((emola / total) * 100), cor: '#4A90D9' },
  ].filter(p => p.percentagem > 0);
}

function formatarHora(data: Date): string {
  const agora = new Date();
  const diffH = Math.abs(agora.getTime() - data.getTime()) / 36e5;
  if (diffH < 24) return `hoje, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
  if (diffH < 48) return `ontem, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
  return data.toLocaleDateString('pt-MZ');
}

// ── Gráfico de barras ──────────────────────────────────────────────────────
function GraficoBarras({ dados }: { dados: VendaDia[] }) {
  const max = Math.max(...dados.map(p => p.valor), 1);
  return (
    <div className="flex items-end gap-[3px] h-16 w-full">
      {dados.map((p) => (
        <div
          key={p.dia}
          className="flex-1 rounded-sm transition-all duration-500"
          style={{
            height: `${Math.max((p.valor / max) * 100, 4)}%`,
            backgroundColor: p.valor === max && max > 0 ? '#E24B4A' : '#E5E7EB',
          }}
        />
      ))}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<Periodo>('30dias');
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [todasVendas, setTodasVendas] = useState<Venda[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      const [vendas, produtos, s] = await Promise.all([
        getVendasDoCriador(u.uid),
        getProdutosDoCriador(u.uid),
        calcularSaldoDisponivel(u.uid),
      ]);
      setTodasVendas(vendas);
      setTodosProdutos(produtos);
      setSaldo(s);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const vendasFiltradas = filtrarPorPeriodo(todasVendas, periodo);
    const receita = vendasFiltradas.reduce((s, v) => s + v.valorCriador, 0);
    const variacao = calcularVariacao(vendasFiltradas, todasVendas, periodo);

    const vendasRecentes: VendaRecente[] = vendasFiltradas
      .slice(0, 5)
      .map((v, i) => {
        const data = v.createdAt instanceof Date ? v.createdAt : (v.createdAt as any)?.toDate?.() ?? new Date();
        const prod = todosProdutos.find(p => p.id === v.produtoId);
        const iniciais = v.compradorNome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
        return {
          iniciais,
          nome: v.compradorNome ?? 'Cliente',
          produto: prod?.nome ?? '—',
          valor: v.valorCriador,
          hora: formatarHora(data),
          cor: CORES_AVATAR[i % CORES_AVATAR.length],
        };
      });

    setDados({
      receita,
      variacao,
      vendas: vendasFiltradas.length,
      saldo,
      afiliados: 0,
      vendasPorDia: agruparPorDia(vendasFiltradas, periodo),
      produtos: calcularRankingProdutos(vendasFiltradas, todosProdutos),
      pagamentos: calcularPagamentos(vendasFiltradas),
      vendasRecentes,
    });
  }, [periodo, loading, todasVendas, todosProdutos, saldo]);

  const periodos: { id: Periodo; label: string }[] = [
    { id: '7dias', label: '7 dias' },
    { id: '30dias', label: '30 dias' },
    { id: '3meses', label: '3 meses' },
    { id: '1ano', label: '1 ano' },
  ];

  if (loading || !dados) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-10">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-12 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#111827] transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>
          <h1 className="text-base font-semibold text-[#111827]">Relatórios</h1>
          <button className="text-gray-400 hover:text-[#111827] transition-colors">
            <Download size={18} />
          </button>
        </div>

        {/* ── Filtro de período ── */}
        <div className="flex gap-2 mb-5">
          {periodos.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className="flex-1 py-[6px] text-xs font-medium rounded-full border transition-all duration-200"
              style={{
                backgroundColor: periodo === p.id ? '#E24B4A' : 'transparent',
                borderColor: periodo === p.id ? '#E24B4A' : '#E5E7EB',
                color: periodo === p.id ? '#fff' : '#6B7280',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Hero: Receita ── */}
        <div className="mb-4 rounded-2xl bg-[#E24B4A] p-5">
          <p className="text-sm text-red-200 mb-1">Receita no período</p>
          <p className="text-4xl font-bold tracking-tight text-white mb-1">
            {dados.receita.toLocaleString('pt-MZ')} MT
          </p>
          <div className="flex items-center gap-1 text-sm text-red-100 mb-5">
            <TrendingUp size={14} />
            <span>{dados.variacao >= 0 ? '+' : ''}{dados.variacao}% vs período anterior</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Vendas', valor: dados.vendas, icon: <ShoppingBag size={13} /> },
              { label: 'Saldo actual', valor: `${dados.saldo.toLocaleString('pt-MZ')} MT`, icon: <Wallet size={13} /> },
              { label: 'Afiliados', valor: dados.afiliados, icon: <Users size={13} /> },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/15 backdrop-blur-sm px-3 py-3 text-center">
                <div className="flex justify-center mb-1 text-red-100">{m.icon}</div>
                <p className="text-base font-bold text-white">{m.valor}</p>
                <p className="text-[10px] text-red-200 mt-[2px]">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gráfico vendas por dia ── */}
        {(periodo === '7dias' || periodo === '30dias') && (
          <div className="mb-4 rounded-2xl bg-white border border-gray-100 p-4">
            <p className="text-sm font-semibold text-[#111827] mb-4">Vendas por dia</p>
            <GraficoBarras dados={dados.vendasPorDia} />
            <div className="flex justify-between mt-2">
              {[1, 5, 9, 13, 17, 21, 25, 29].map((n) => (
                <span key={n} className="text-[10px] text-gray-400">{n}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Produtos mais vendidos ── */}
        {dados.produtos.length > 0 && (
          <div className="mb-4 rounded-2xl bg-white border border-gray-100 p-4">
            <p className="text-sm font-semibold text-[#111827] mb-4">Produtos mais vendidos</p>
            <div className="flex flex-col gap-4">
              {dados.produtos.map((prod) => {
                const maxReceita = dados.produtos[0].receita;
                const pct = maxReceita > 0 ? (prod.receita / maxReceita) * 100 : 0;
                return (
                  <div key={prod.rank}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-400 w-4">#{prod.rank}</span>
                      <div className="w-8 h-8 rounded-lg bg-[#FCEBEB] flex items-center justify-center text-[#E24B4A] text-xs font-bold">
                        {prod.nome[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111827] truncate">{prod.nome}</p>
                        <p className="text-[11px] text-gray-400">{prod.preco} MT · {prod.tipo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#E24B4A]">{prod.receita} MT</p>
                        <p className="text-[11px] text-gray-400">{prod.vendas} vendas</p>
                      </div>
                    </div>
                    <div className="h-[3px] bg-gray-100 rounded-full ml-7">
                      <div
                        className="h-full bg-[#E24B4A] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Pagamentos por método ── */}
        {dados.pagamentos.length > 0 && (
          <div className="mb-4 rounded-2xl bg-white border border-gray-100 p-4">
            <p className="text-sm font-semibold text-[#111827] mb-4">Pagamentos por método</p>
            <div className="flex flex-col gap-3">
              {dados.pagamentos.map((pg) => (
                <div key={pg.metodo}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg" style={{ backgroundColor: pg.cor + '22' }} />
                      <span className="text-sm text-[#111827]">{pg.metodo}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">{pg.percentagem}%</span>
                  </div>
                  <div className="h-[3px] bg-gray-100 rounded-full">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pg.percentagem}%`, backgroundColor: pg.cor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Vendas recentes ── */}
        {dados.vendasRecentes.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <p className="text-sm font-semibold text-[#111827] mb-4">Vendas recentes</p>
            <div className="flex flex-col gap-3">
              {dados.vendasRecentes.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: v.cor }}
                  >
                    {v.iniciais}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{v.nome}</p>
                    <p className="text-[11px] text-gray-400 truncate">{v.produto}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">+{v.valor} MT</p>
                    <p className="text-[11px] text-gray-400">{v.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Estado vazio ── */}
        {dados.vendas === 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">Sem vendas neste período.</p>
            <p className="text-gray-400 text-xs mt-1">Tenta seleccionar um período mais alargado.</p>
          </div>
        )}

      </div>
    </div>
  );
}