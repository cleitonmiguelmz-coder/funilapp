'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getProduto } from '@/lib/marketplace';
import { Produto } from '@/lib/types';
import { PaginaVenda } from './PaginaVenda';

// ─────────────────────────────────────────────
// ROTA PRINCIPAL — /market/produto/[id]
// ─────────────────────────────────────────────
export default function PaginaProduto() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);

  const afiliadoRef = searchParams.get('ref');
  const directCheckout = searchParams.get('checkout') === '1';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (id) getProduto(id as string).then(p => { setProduto(p); setLoading(false); });
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (!produto) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4">
        <div className="w-14 h-14 bg-[#FCEBEB] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-gray-500 mb-4 text-sm">Produto não encontrado.</p>
        <Link href="/market" className="text-[#E24B4A] font-medium text-sm hover:underline">
          ← Voltar ao marketplace
        </Link>
      </div>
    </div>
  );

  return (
    <PaginaVenda
      produto={produto}
      afiliadoRef={afiliadoRef}
      currentUser={user}
      directCheckout={directCheckout}
    />
  );
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="bg-[#FCEBEB] rounded-2xl mb-6 mx-auto" style={{ width: 192, aspectRatio: '3/4' }} />
      <div className="h-7 bg-gray-100 rounded-xl w-3/4 mb-3" />
      <div className="h-4 bg-gray-100 rounded-full w-1/2 mb-8" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded-full" style={{ width: `${90 - i * 10}%` }} />
        ))}
      </div>
    </div>
  );
}
