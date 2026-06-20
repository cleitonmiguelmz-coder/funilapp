'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  getProdutosDoCriador,
  getVendasDoCriador,
  calcularSaldoDisponivel
} from '@/lib/marketplace';
import { Produto, Venda } from '@/lib/types';
import { BotaoPromover } from '@/components/produto-actions';

export default function DashboardMarketplace() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      const [p, v, s] = await Promise.all([
        getProdutosDoCriador(u.uid),
        getVendasDoCriador(u.uid),
        calcularSaldoDisponivel(u.uid),
      ]);
      setProdutos(p);
      setVendas(v);
      setSaldo(s);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const totalReceita = vendas.reduce((s, v) => s + v.valorCriador, 0);
  const totalVendas = vendas.length;
  const produtosActivos = produtos.filter(p => p.status === 'activo').length;
  const nomeDisplay = user?.displayName?.split(' ')[0] ?? 'Criador';

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-8 h-8 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* HEADER */}
      <div className="bg-[#E24B4A] px-4 pt-5 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/70 text-xs mb-0.5">Bom dia,</p>
              <h1 className="text-white text-xl font-semibold">{nomeDisplay}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/market/dashboard/afiliados"
                className="border border-white/30 text-white/90 px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/15 transition"
              >
                Afiliados
              </Link>

              {/* BOTÃO INTEGRAÇÕES */}
              <Link
                href="/market/dashboard/integracoes"
                className="border border-white/30 text-white/90 px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/15 transition flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15,3 21,3 21,9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Integrações
              </Link>

              <Link
                href="/market/dashboard/criar"
                className="bg-white text-[#A32D2D] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition flex items-center gap-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Novo produto
              </Link>
            </div>
          </div>

          {/* Saldo card */}
          <div className="bg-white/15 border border-white/20 rounded-2xl p-4">
            <p className="text-white/70 text-xs mb-1">Saldo disponível</p>
            <p className="text-white text-3xl font-bold mb-3">
              {loading ? '—' : `${saldo.toLocaleString('pt-MZ')} MT`}
            </p>
            <div className="flex gap-2">
              <Link
                href="/market/dashboard/cashout"
                className="flex-1 bg-white text-[#A32D2D] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-red-50 transition"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 11 12 6 7 11"/>
                  <line x1="12" y1="18" x2="12" y2="6"/>
                </svg>
                Sacar fundos
              </Link>
              <Link
                href="/market/dashboard/relatorios"
                className="flex-1 bg-white/15 text-white text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-white/20 hover:bg-white/25 transition"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Ver relatório
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-2 pb-24">

        {/* MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard
            label="Vendas totais"
            valor={loading ? '—' : totalVendas.toString()}
            delta={totalVendas > 0 ? `${totalVendas} no total` : undefined}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
          />
          <MetricCard
            label="Receita total"
            valor={loading ? '—' : `${totalReceita.toLocaleString('pt-MZ')} MT`}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
          />
          <MetricCard
            label="Afiliados"
            valor={loading ? '—' : '—'}
            sublabel="a promover"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          />
          <MetricCard
            label="Produtos activos"
            valor={loading ? '—' : produtosActivos.toString()}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
          />
        </div>

        {/* PRODUTOS */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-[#111827] text-sm">Os meus produtos</h2>
            <Link href="/market" className="text-xs text-[#E24B4A] hover:underline">
              Ver marketplace →
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">Ainda não tens produtos criados.</p>
              <Link
                href="/market/dashboard/criar"
                className="inline-block bg-[#E24B4A] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#A32D2D] transition"
              >
                Criar primeiro produto
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {produtos.map(produto => (
                  <ProdutoRow key={produto.id} produto={produto} currentUser={user} />
                ))}
              </div>
              <div className="p-4 pt-3">
                <Link
                  href="/market/dashboard/criar"
                  className="w-full border-2 border-dashed border-gray-200 text-gray-400 py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:border-[#E24B4A] hover:text-[#E24B4A] transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Adicionar novo produto
                </Link>
              </div>
            </>
          )}
        </div>

        {/* VENDAS RECENTES */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-[#111827] text-sm">Vendas recentes</h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : vendas.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Ainda não tens vendas.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {vendas.slice(0, 10).map(venda => (
                <VendaRow key={venda.id} venda={venda} produtos={produtos} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAV mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 grid grid-cols-5 md:hidden">
        <Link href="/market" className="flex flex-col items-center gap-1 py-2.5 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-[10px]">Início</span>
        </Link>
        <Link href="/market" className="flex flex-col items-center gap-1 py-2.5 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="text-[10px]">Explorar</span>
        </Link>
        <Link href="/market/dashboard/criar" className="flex flex-col items-center justify-center py-1">
          <div className="bg-[#E24B4A] rounded-xl px-3 py-1.5 flex flex-col items-center gap-0.5 -mt-3 shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="text-[10px] text-white font-semibold">Vender</span>
          </div>
        </Link>
        <Link href="/market/dashboard" className="flex flex-col items-center gap-1 py-2.5 text-[#E24B4A]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span className="text-[10px] font-medium">Painel</span>
        </Link>
        <Link href="/market/dashboard/integracoes" className="flex flex-col items-center gap-1 py-2.5 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <span className="text-[10px]">Integrações</span>
        </Link>
      </nav>
    </div>
  );
}

function MetricCard({ label, valor, delta, sublabel, icon }: {
  label: string; valor: string; delta?: string; sublabel?: string; icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-3">
      <div className="flex items-center gap-1.5 mb-1 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#111827]">{valor}</p>
      {delta && <p className="text-xs text-green-600 mt-0.5">↑ {delta}</p>}
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function ProdutoRow({ produto, currentUser }: { produto: Produto; currentUser: User | null }) {
  const statusCor = {
    activo: 'bg-green-100 text-green-700',
    pendente: 'bg-yellow-100 text-yellow-700',
    pausado: 'bg-gray-100 text-gray-500',
  }[produto.status] ?? 'bg-gray-100 text-gray-500';

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
      <div className="w-10 h-10 rounded-xl bg-[#FCEBEB] overflow-hidden flex-shrink-0 flex items-center justify-center">
        {produto.imagemUrl ? (
          <Image src={produto.imagemUrl} alt={produto.nome} width={40} height={40} className="object-cover" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#111827] text-sm truncate">{produto.nome}</p>
        <p className="text-xs text-gray-400">{produto.categoria} · {produto.percentagemAfiliado}% afiliado</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-[#111827] text-sm">{produto.preco.toLocaleString('pt-MZ')} MT</p>
        <p className="text-xs text-gray-400">{produto.totalVendas} vendas</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusCor}`}>
        {produto.status}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/market/produto/${produto.id}`}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
          target="_blank"
        >
          Ver →
        </Link>
        <BotaoPromover
          produto={produto}
          currentUser={currentUser}
          produtoId={produto.id!}
        />
      </div>
    </div>
  );
}

function VendaRow({ venda, produtos }: { venda: Venda; produtos: Produto[] }) {
  const produto = produtos.find(p => p.id === venda.produtoId);
  const data = venda.createdAt instanceof Date
    ? venda.createdAt
    : (venda.createdAt as any)?.toDate?.() ?? new Date();
  const iniciais = venda.compradorNome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
      <div className="w-9 h-9 rounded-full bg-[#FCEBEB] flex items-center justify-center text-xs font-semibold text-[#A32D2D] flex-shrink-0">
        {iniciais}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#111827] truncate">{venda.compradorNome}</p>
        <p className="text-xs text-gray-400 truncate">{produto?.nome ?? '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-green-600">+{venda.valorCriador.toFixed(0)} MT</p>
        <p className="text-xs text-gray-400">{data.toLocaleDateString('pt-MZ')}</p>
      </div>
    </div>
  );
}