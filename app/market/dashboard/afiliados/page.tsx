'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getAfiliadosDoUtilizador, getProduto } from '@/lib/marketplace';
import { Afiliado, Produto } from '@/lib/types';

function IconeCategoria({ categoria }: { categoria?: string }) {
  if (categoria === 'Ebook') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  );
  if (categoria === 'Curso') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
  if (categoria === 'Template') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  );
}

export default function PainelAfiliados() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [produtos, setProdutos] = useState<Record<string, Produto>>({});
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      const lista = await getAfiliadosDoUtilizador(u.uid);
      setAfiliados(lista);
      const prods = await Promise.all(lista.map(a => getProduto(a.produtoId)));
      const map: Record<string, Produto> = {};
      prods.forEach((p, i) => { if (p) map[lista[i].produtoId] = p; });
      setProdutos(map);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const totalGanhos = afiliados.reduce((s, a) => s + a.totalGanhos, 0);
  const totalVendas = afiliados.reduce((s, a) => s + a.totalVendas, 0);

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-8 h-8 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* HEADER */}
      <div className="bg-[#E24B4A] px-4 pt-5 pb-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/market/dashboard" className="text-white/80 hover:text-white transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </Link>
            <h1 className="text-white text-lg font-semibold">Meus afiliados</h1>
            <Link
              href="/market"
              className="ml-auto bg-white text-[#A32D2D] px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-50 transition"
            >
              Explorar produtos
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: `${totalGanhos.toFixed(0)} MT`, label: 'Ganhos totais' },
              { val: totalVendas.toString(), label: 'Vendas geradas' },
              { val: afiliados.length.toString(), label: 'A promover' },
            ].map(({ val, label }) => (
              <div key={label} className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                <p className="text-white text-xl font-bold">{val}</p>
                <p className="text-white/70 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-2 pb-16">

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>

        ) : afiliados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 px-6">
            <div className="w-14 h-14 bg-[#FCEBEB] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            </div>
            <p className="font-semibold text-[#111827] mb-2">Ainda não estás a promover nada</p>
            <p className="text-gray-400 text-sm mb-6">Vai ao marketplace, escolhe um produto e gera o teu link de afiliado.</p>
            <Link
              href="/market"
              className="inline-block bg-[#E24B4A] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#A32D2D] transition"
            >
              Ir ao marketplace
            </Link>
          </div>

        ) : (
          <div className="space-y-3">
            {afiliados.map(afiliado => {
              const produto = produtos[afiliado.produtoId];
              const linkCompleto = `${typeof window !== 'undefined' ? window.location.origin : ''}/market/p/${afiliado.linkUnico}`;

              return (
                <div key={afiliado.id} className="bg-white rounded-2xl border border-gray-100 p-5">

                  {/* Cabeçalho do card */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#FCEBEB] flex items-center justify-center flex-shrink-0">
                      <IconeCategoria categoria={produto?.categoria} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#111827] text-sm">{produto?.nome ?? 'A carregar...'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {produto?.categoria} · Comissão: <span className="text-[#E24B4A] font-medium">{produto?.percentagemAfiliado}%</span> · {produto?.preco?.toLocaleString('pt-MZ')} MT
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-600">{afiliado.totalGanhos.toFixed(0)} MT</p>
                      <p className="text-xs text-gray-400">{afiliado.totalVendas} vendas</p>
                    </div>
                  </div>

                  {/* Stats rápidas */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-[#111827]">{afiliado.totalVendas}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Vendas</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-green-600">{afiliado.totalGanhos.toFixed(0)} MT</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Ganhos</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-bold text-[#111827]">—</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Cliques</p>
                    </div>
                  </div>

                  {/* Link */}
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 truncate">
                      {linkCompleto}
                    </div>
                    <button
                      onClick={() => copiar(linkCompleto, afiliado.id!)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 flex-shrink-0 ${
                        copiado === afiliado.id
                          ? 'bg-green-500 text-white'
                          : 'bg-[#E24B4A] text-white hover:bg-[#A32D2D]'
                      }`}
                    >
                      {copiado === afiliado.id ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Copiado
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          Copiar
                        </>
                      )}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`🛒 Tens de ver este produto: ${produto?.nome}\n\n${linkCompleto}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <a
                      href={`/market/produto/${afiliado.produtoId}`}
                      target="_blank"
                      className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}