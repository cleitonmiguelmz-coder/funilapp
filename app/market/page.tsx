'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProdutosActivos } from '@/lib/marketplace';
import { Produto } from '@/lib/types';

const CATEGORIAS = ['Todos', 'Ebook', 'Curso', 'Template', 'Software', 'Outro'];

const PLACEHOLDER_IMAGES: Record<string, string> = {
  Ebook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=800&fit=crop&auto=format',
  Curso: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=800&fit=crop&auto=format',
  Template: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=800&fit=crop&auto=format',
  Software: 'https://images.unsplash.com/photo-1607798748738-b15c40d33d57?w=600&h=800&fit=crop&auto=format',
  Outro: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=800&fit=crop&auto=format',
};

function getBadge(produto: Produto) {
  if (produto.totalVendas >= 20) return { texto: 'Mais vendido', cor: 'bg-amber-500' };
  if (produto.totalVendas >= 5) return { texto: 'Em alta', cor: 'bg-orange-500' };
  return null;
}

// ─────────────────────────────────────────────
// HOOK CARRINHO — lê e escreve no localStorage
// ─────────────────────────────────────────────
function useCarrinho() {
  const [ids, setIds] = useState<string[]>([]);

  // Lê ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('carrinho');
      setIds(raw ? JSON.parse(raw) : []);
    } catch { setIds([]); }
  }, []);

  const adicionar = useCallback((produtoId: string) => {
    setIds(prev => {
      if (prev.includes(produtoId)) return prev;
      const nova = [...prev, produtoId];
      localStorage.setItem('carrinho', JSON.stringify(nova));
      return nova;
    });
  }, []);

  const temProduto = useCallback((produtoId: string) => ids.includes(produtoId), [ids]);

  return { total: ids.length, adicionar, temProduto };
}

// ─────────────────────────────────────────────
// ÍCONE DO CARRINHO COM BADGE
// ─────────────────────────────────────────────
function CarrinhoIcone({ total, className = '' }: { total: number; className?: string }) {
  return (
    <Link href="/market/carrinho" className={`relative flex items-center justify-center ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      {total > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-white text-[#E24B4A] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#E24B4A]/20 shadow-sm">
          {total > 9 ? '9+' : total}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function MarketplacePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [pesquisa, setPesquisa] = useState('');
  const [loading, setLoading] = useState(true);
  const { total: totalCarrinho, adicionar, temProduto } = useCarrinho();

  useEffect(() => {
    getProdutosActivos().then(lista => {
      setProdutos(lista);
      setLoading(false);
    });
  }, []);

  const filtrados = produtos
    .filter(p => categoriaActiva === 'Todos' || p.categoria === categoriaActiva)
    .filter(p =>
      pesquisa === '' ||
      p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      p.descricao.toLowerCase().includes(pesquisa.toLowerCase())
    );

  const semFiltro = categoriaActiva === 'Todos' && pesquisa === '';
  const maisVendidos = produtos.filter(p => p.totalVendas >= 20).slice(0, 4);
  const emAlta = produtos.filter(p => p.totalVendas >= 5 && p.totalVendas < 20).slice(0, 4);
  const recentes = produtos.slice(0, 8);

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#E24B4A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/market" className="flex items-center gap-2 flex-shrink-0">
           <Image src="/logo2.png" alt="FunilMarket" width={28} height={28} className="rounded-xl" />
            <span className="font-semibold text-white text-base tracking-tight">FunilMarket</span>
          </Link>

          {/* Pesquisa desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
                placeholder="Pesquisar produtos..."
                className="w-full pl-9 pr-4 py-2 bg-white/15 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/25 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/market/dashboard" className="hidden sm:block text-white/80 text-sm font-medium hover:text-white px-3 py-2 transition">
              Meu painel
            </Link>

            {/* CARRINHO — desktop */}
            <CarrinhoIcone total={totalCarrinho} className="text-white hidden sm:flex" />

            <Link
              href="/market/dashboard/criar"
              className="bg-white text-[#A32D2D] px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center gap-1"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Vender
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#E24B4A] pt-8 pb-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4 border border-white/20">
            se é quente dá dinheiro
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
            O teu conhecimento<br />já tem preço.
          </h1>
          <p className="text-white/75 text-base mb-7 max-w-md mx-auto">
            Vende ebooks, cursos e templates — recebe pelo M-Pesa ou E-Mola.
          </p>

          {/* Pesquisa mobile */}
          <div className="md:hidden relative max-w-sm mx-auto mb-6">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={pesquisa}
              onChange={e => setPesquisa(e.target.value)}
              placeholder="Pesquisar produtos..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/15 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/25 transition"
            />
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/market/dashboard/criar"
              className="bg-white text-[#A32D2D] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
            >
              Começar a vender
            </Link>
            <button
              onClick={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/15 text-white px-5 py-2.5 rounded-xl text-sm font-medium border border-white/20 hover:bg-white/25 transition"
            >
              Explorar produtos
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <div id="produtos" className="max-w-7xl mx-auto px-4 py-4 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoriaActiva(cat); setPesquisa(''); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                categoriaActiva === cat
                  ? 'bg-[#E24B4A] text-white border-[#E24B4A]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#E24B4A] hover:text-[#E24B4A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 pb-24">

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>

        ) : semFiltro ? (
          <div className="space-y-12">
            {maisVendidos.length > 0 && (
              <Seccao titulo="Mais vendidos" descricao="Os produtos com mais compras na plataforma">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {maisVendidos.map(p => <ProdutoCard key={p.id} produto={p} onAdicionar={adicionar} noCarrinho={temProduto(p.id!)} />)}
                </div>
              </Seccao>
            )}
            {emAlta.length > 0 && (
              <Seccao titulo="Em alta" descricao="Produtos com muitas vendas recentes">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {emAlta.map(p => <ProdutoCard key={p.id} produto={p} onAdicionar={adicionar} noCarrinho={temProduto(p.id!)} />)}
                </div>
              </Seccao>
            )}
            <Seccao titulo="Todos os produtos" descricao={`${produtos.length} produto${produtos.length !== 1 ? 's' : ''} disponíve${produtos.length !== 1 ? 'is' : 'l'}`}>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {recentes.map(p => <ProdutoCard key={p.id} produto={p} onAdicionar={adicionar} noCarrinho={temProduto(p.id!)} />)}
              </div>
            </Seccao>
          </div>

        ) : (
          <>
            {pesquisa && (
              <p className="text-xs text-gray-400 mb-4">
                {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} para{' '}
                <span className="text-gray-700 font-medium">"{pesquisa}"</span>
              </p>
            )}
            {filtrados.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-14 h-14 bg-[#FCEBEB] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <p className="text-gray-800 font-semibold mb-1">Nenhum produto encontrado</p>
                <p className="text-gray-400 text-sm">Tenta outra categoria ou palavra-chave</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filtrados.map(p => <ProdutoCard key={p.id} produto={p} onAdicionar={adicionar} noCarrinho={temProduto(p.id!)} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM NAV — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 grid grid-cols-5 md:hidden">
        <Link href="/market" className="flex flex-col items-center gap-1 py-2.5 text-[#E24B4A]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[10px] font-medium">Início</span>
        </Link>
        <button
          onClick={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 py-2.5 text-gray-400"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span className="text-[10px]">Explorar</span>
        </button>
        <Link href="/market/dashboard/criar" className="flex flex-col items-center justify-center py-1">
          <div className="bg-[#E24B4A] rounded-xl px-3 py-1.5 flex flex-col items-center gap-0.5 -mt-3 shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="text-[10px] text-white font-semibold">Vender</span>
          </div>
        </Link>
        <Link href="/market/dashboard" className="flex flex-col items-center gap-1 py-2.5 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span className="text-[10px]">Painel</span>
        </Link>

        {/* CARRINHO — bottom nav mobile */}
        <Link href="/market/carrinho" className="flex flex-col items-center gap-1 py-2.5 text-gray-400 relative">
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalCarrinho > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E24B4A] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalCarrinho > 9 ? '9+' : totalCarrinho}
              </span>
            )}
          </div>
          <span className="text-[10px]">Carrinho</span>
        </Link>
      </nav>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-6 px-4 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logo2.png" alt="FunilMarket" width={18} height={18} className="rounded-lg opacity-50" />
            <span className="text-gray-400 text-xs">FunilMarket · Parte do FunilApp</span>
          </div>
          <p className="text-gray-300 text-xs">Pagamentos via M-Pesa e E-Mola · Moçambique</p>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTES
// ─────────────────────────────────────────────
function Seccao({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#111827]">{titulo}</h2>
        <p className="text-gray-400 text-sm mt-0.5">{descricao}</p>
      </div>
      {children}
    </div>
  );
}

function ProdutoCard({ produto, onAdicionar, noCarrinho }: {
  produto: Produto;
  onAdicionar: (id: string) => void;
  noCarrinho: boolean;
}) {
  const imagem = produto.imagemUrl || PLACEHOLDER_IMAGES[produto.categoria] || PLACEHOLDER_IMAGES['Outro'];
  const badge = getBadge(produto);
  const [adicionado, setAdicionado] = useState(noCarrinho);

  // Sincroniza se já estava no carrinho ao montar
  useEffect(() => { setAdicionado(noCarrinho); }, [noCarrinho]);

  function handleAdicionar(e: React.MouseEvent) {
    e.preventDefault(); // evita navegar para o produto
    e.stopPropagation();
    onAdicionar(produto.id!);
    setAdicionado(true);
  }

  return (
    <Link
      href={`/market/produto/${produto.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#E24B4A]/30 hover:shadow-md transition-all duration-200"
    >
      {/* Imagem */}
      <div className="relative w-full bg-[#FCEBEB]" style={{ paddingBottom: produto.categoria === 'Ebook' ? '133%' : '75%' }}>
        <Image
          src={imagem}
          alt={produto.nome}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
        {badge && (
          <span className={`absolute top-2 left-2 ${badge.cor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
            {badge.texto}
          </span>
        )}
        {produto.percentagemAfiliado > 0 && (
          <span className="absolute top-2 right-2 bg-[#E24B4A] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {produto.percentagemAfiliado}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-gray-50">
        <span className="text-[10px] text-gray-400 font-medium">{produto.categoria}</span>
        <h3 className="font-semibold text-[#111827] text-xs sm:text-sm leading-snug mt-0.5 mb-2 line-clamp-2 group-hover:text-[#E24B4A] transition-colors">
          {produto.nome}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#E24B4A] font-bold text-sm sm:text-base flex-shrink-0">
            {produto.preco.toLocaleString('pt-MZ')}
            <span className="text-xs font-medium ml-0.5">MT</span>
          </span>

          {/* BOTÃO ADICIONAR AO CARRINHO */}
          <button
            onClick={handleAdicionar}
            className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition ${
              adicionado
                ? 'bg-green-500 text-white'
                : 'bg-[#FCEBEB] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white'
            }`}
            aria-label={adicionado ? 'No carrinho' : 'Adicionar ao carrinho'}
          >
            {adicionado ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            )}
          </button>
        </div>

        {produto.totalVendas > 0 && (
          <p className="text-[10px] text-gray-400 mt-1">{produto.totalVendas} vendas</p>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="bg-[#FCEBEB]" style={{ paddingBottom: '133%', position: 'relative' }} />
      <div className="p-3 space-y-2 border-t border-gray-50">
        <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
        <div className="h-3.5 bg-gray-100 rounded-full w-5/6" />
        <div className="h-3.5 bg-gray-100 rounded-full w-3/5" />
        <div className="h-4 bg-gray-100 rounded-full w-2/5 mt-1" />
      </div>
    </div>
  );
}