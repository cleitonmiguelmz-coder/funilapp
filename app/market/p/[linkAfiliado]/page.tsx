'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAfiliadoPorLink, getProduto } from '@/lib/marketplace';
import { Produto } from '@/lib/types';
import { PaginaVenda } from '@/app/market/produto/[id]/PaginaVenda';
import Link from 'next/link';

export default function LinkAfiliado() {
  const { linkAfiliado } = useParams();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [afiliadoRef, setAfiliadoRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalido, setInvalido] = useState(false);

  useEffect(() => {
    async function init() {
      const afiliado = await getAfiliadoPorLink(linkAfiliado as string);
      if (!afiliado) {
        setInvalido(true);
        setLoading(false);
        return;
      }
      setAfiliadoRef(afiliado.userId);
      const p = await getProduto(afiliado.produtoId);
      if (!p || p.status !== 'activo') {
        setInvalido(true);
        setLoading(false);
        return;
      }
      setProduto(p);
      setLoading(false);
    }
    init();
  }, [linkAfiliado]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
      </div>
    );
  }

  if (invalido || !produto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-[#FCEBEB] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#111827] mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-400 text-sm mb-6">Este link de afiliado não existe ou o produto foi removido.</p>
          <Link href="/market" className="text-[#E24B4A] font-medium text-sm hover:underline">
            ← Ver marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PaginaVenda
      produto={produto}
      afiliadoRef={afiliadoRef}
      currentUser={null}
      directCheckout={false}
    />
  );
}