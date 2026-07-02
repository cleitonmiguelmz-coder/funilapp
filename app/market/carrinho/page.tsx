'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getProduto } from '@/lib/marketplace';
import { Produto } from '@/lib/types';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface ItemCarrinho {
  produtoId: string;
  produto: Produto;
  afiliadoRef?: string | null;
}

// Cupões de exemplo — substitui pela tua lógica real
const CUPOES_VALIDOS: Record<string, number> = {
  'BEMVINDO10': 10,
  'FIDELIDADE20': 20,
  'ESPECIAL50': 50,
};

const PLACEHOLDER: Record<string, string> = {
  Ebook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&auto=format',
  Curso: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop&auto=format',
  Template: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=400&fit=crop&auto=format',
  Software: 'https://images.unsplash.com/photo-1607798748738-b15c40d33d57?w=300&h=400&fit=crop&auto=format',
  Outro: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=300&h=400&fit=crop&auto=format',
};

// ─────────────────────────────────────────────
// HOOK — estado do carrinho (localStorage)
// ─────────────────────────────────────────────
function useCarrinho() {
  const [ids, setIds] = useState<string[]>([]);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('carrinho');
      const lista: string[] = raw ? JSON.parse(raw) : [];
      setIds(lista);
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    if (ids.length === 0) { setItens([]); setLoading(false); return; }
    Promise.all(ids.map(id => getProduto(id))).then(prods => {
      const validos = prods
        .filter(Boolean)
        .map(p => ({ produtoId: p!.id!, produto: p! }));
      setItens(validos);
      setLoading(false);
    });
  }, [ids]);

  function remover(produtoId: string) {
    const nova = ids.filter(id => id !== produtoId);
    localStorage.setItem('carrinho', JSON.stringify(nova));
    setIds(nova);
  }

  function limpar() {
    localStorage.removeItem('carrinho');
    setIds([]);
  }

  return { itens, loading, remover, limpar, total: ids.length };
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function CarrinhoPage() {
  const router = useRouter();
  const { itens, loading, remover, limpar } = useCarrinho();
  const [user, setUser] = useState<User | null>(null);

  const [cupao, setCupao] = useState('');
  const [cupaoAplicado, setCupaoAplicado] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [erroCupao, setErroCupao] = useState('');
  const [cupaoOk, setCupaoOk] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const subtotal = itens.reduce((s, i) => s + i.produto.preco, 0);
  const valorDesconto = Math.round(subtotal * desconto / 100);
  const total = subtotal - valorDesconto;

  function aplicarCupao() {
    const codigo = cupao.trim().toUpperCase();
    if (!codigo) { setErroCupao('Introduz um código'); return; }
    const pct = CUPOES_VALIDOS[codigo];
    if (!pct) { setErroCupao('Código inválido ou expirado'); setCupaoOk(false); return; }
    setDesconto(pct);
    setCupaoAplicado(codigo);
    setCupaoOk(true);
    setErroCupao('');
  }

  function removerCupao() {
    setCupao('');
    setCupaoAplicado('');
    setDesconto(0);
    setCupaoOk(false);
    setErroCupao('');
  }

  // ── ESTADO DE LOADING ──
  if (loading) return (
    <div className="min-h-screen bg-[#fafafa]">
      <NavBar />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  );

  // ── CARRINHO VAZIO ──
  if (itens.length === 0) return (
    <div className="min-h-screen bg-[#fafafa]">
      <NavBar />
      <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-[#FCEBEB] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#111827] mb-2">O carrinho está vazio</h2>
        <p className="text-gray-400 text-sm mb-7 max-w-xs">
          Ainda não adicionaste nenhum produto. Explora o marketplace e encontra algo que gostes.
        </p>
        <Link
          href="/market"
          className="bg-[#E24B4A] text-white px-8 py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#A32D2D] transition"
        >
          Explorar produtos
        </Link>
      </div>
      <BottomNav />
    </div>
  );

  // ── CARRINHO COM ITENS ──
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <NavBar onLimpar={limpar} total={itens.length} />

      <div className="max-w-lg mx-auto px-4 py-4 pb-36 space-y-3">

        {/* LISTA DE ITENS */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {itens.map(item => (
              <ItemRow
                key={item.produtoId}
                item={item}
                onRemover={() => remover(item.produtoId)}
              />
            ))}
          </div>
        </div>

        {/* CUPÃO */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            Tens um código de desconto?
          </p>

          {cupaoOk ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              <p className="text-green-700 text-sm font-semibold flex-1">
                {cupaoAplicado} — {desconto}% de desconto aplicado
              </p>
              <button
                onClick={removerCupao}
                className="text-gray-400 hover:text-red-500 transition text-xs"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={cupao}
                onChange={e => { setCupao(e.target.value.toUpperCase()); setErroCupao(''); }}
                onKeyDown={e => e.key === 'Enter' && aplicarCupao()}
                placeholder="Ex: BEMVINDO10"
                className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E24B4A] transition uppercase ${
                  erroCupao ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <button
                onClick={aplicarCupao}
                className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition flex-shrink-0"
              >
                Aplicar
              </button>
            </div>
          )}
          {erroCupao && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {erroCupao}
            </p>
          )}
        </div>

        {/* RESUMO */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Resumo</p>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({itens.length} produto{itens.length !== 1 ? 's' : ''})</span>
            <span className="font-medium text-[#111827]">{subtotal.toLocaleString('pt-MZ')} MT</span>
          </div>

          {desconto > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                Desconto ({desconto}%)
              </span>
              <span className="font-medium text-green-600">-{valorDesconto.toLocaleString('pt-MZ')} MT</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-bold text-[#111827]">Total</span>
            <span className="font-bold text-[#E24B4A] text-lg">{total.toLocaleString('pt-MZ')} MT</span>
          </div>
        </div>

        {/* NOTA DE PAGAMENTO */}
        <div className="flex items-center justify-center gap-3 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Pagamento seguro
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
            Acesso imediato
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>M-Pesa · E-Mola</span>
        </div>

      </div>

      {/* BOTÃO FIXO — FINALIZAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto space-y-2">
          {itens.length === 1 ? (
            // 1 produto — vai directo ao checkout
            <Link
             href={`/market/produto/${itens[0].produtoId}?checkout=1`}
              className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#A32D2D] transition flex items-center justify-center gap-2"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Finalizar compra · {total.toLocaleString('pt-MZ')} MT
            </Link>
          ) : (
            // Vários produtos — checkout sequencial (vai produto a produto)
            <button
              onClick={() => router.push(`/market/produto/${itens[0].produtoId}?checkout=1`)}
              className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#A32D2D] transition flex items-center justify-center gap-2"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Finalizar compra · {total.toLocaleString('pt-MZ')} MT
            </button>
          )}
          <Link
            href="/market"
            className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Continuar a comprar
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ─────────────────────────────────────────────
// ITEM DO CARRINHO
// ─────────────────────────────────────────────
function ItemRow({ item, onRemover }: { item: ItemCarrinho; onRemover: () => void }) {
  const { produto } = item;
  const imagem = produto.imagemUrl || PLACEHOLDER[produto.categoria] || PLACEHOLDER['Outro'];

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      {/* Thumb */}
      <div
        className="relative flex-shrink-0 rounded-xl overflow-hidden bg-[#FCEBEB]"
        style={{ width: 56, height: produto.categoria === 'Ebook' ? 74 : 56 }}
      >
        <Image
          src={imagem}
          alt={produto.nome}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{produto.categoria}</p>
        <p className="text-sm font-semibold text-[#111827] leading-snug line-clamp-2">{produto.nome}</p>
        <p className="text-[#E24B4A] font-bold text-base mt-1">
          {produto.preco.toLocaleString('pt-MZ')} MT
        </p>
      </div>

      {/* Remover */}
      <button
        onClick={onRemover}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0"
        aria-label="Remover produto"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
function NavBar({ onLimpar, total }: { onLimpar?: () => void; total?: number }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/market" className="text-gray-400 hover:text-gray-600 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </Link>
          <h1 className="font-semibold text-[#111827] text-sm">
            Carrinho{total ? ` (${total})` : ''}
          </h1>
        </div>
        {onLimpar && total && total > 0 && (
          <button
            onClick={onLimpar}
            className="text-xs text-gray-400 hover:text-red-500 transition"
          >
            Limpar tudo
          </button>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────
function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 grid grid-cols-5 md:hidden">
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
      <Link href="/market/dashboard" className="flex flex-col items-center gap-1 py-2.5 text-gray-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span className="text-[10px]">Painel</span>
      </Link>
      <Link href="/market/carrinho" className="flex flex-col items-center gap-1 py-2.5 text-[#E24B4A]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span className="text-[10px] font-medium">Carrinho</span>
      </Link>
    </nav>
  );
}
