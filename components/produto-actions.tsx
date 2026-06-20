'use client';

// ─────────────────────────────────────────────
// COMPONENTE: BotaoPromover
// Usa em qualquer página onde precisas do botão
// Detects se o utilizador é o dono do produto
// ─────────────────────────────────────────────

import { useState } from 'react';
import { User } from 'firebase/auth';
import { tornarAfiliado } from '@/lib/marketplace';
import { Produto } from '@/lib/types';

interface Props {
  produto: Produto;
  currentUser: User | null;
  produtoId: string;
}

export function BotaoPromover({ produto, currentUser, produtoId }: Props) {
  const [link, setLink] = useState('');
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [aberto, setAberto] = useState(false);

  // ── É O DONO? ──
  const isDono = currentUser?.uid === produto.userId;

  // Link directo ao checkout — sem comissão (para o dono)
  const linkDono = `${typeof window !== 'undefined' ? window.location.origin : ''}/market/produto/${produtoId}?checkout=1`;

  async function gerarLinkAfiliado() {
    if (!currentUser) {
      alert('Faz login para promover este produto.');
      return;
    }
    setGerando(true);
    const ref = await tornarAfiliado(currentUser.uid, produtoId);
    setLink(`${window.location.origin}/market/produto/${produtoId}?checkout=1&ref=${ref}`);
    setGerando(false);
    setAberto(true);
  }

  function handleDono() {
    setLink(linkDono);
    setAberto(true);
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const linkFinal = isDono ? linkDono : link;
  const mensagemWhatsApp = isDono
    ? `🛒 Compra o meu produto: ${produto.nome}\n\n${linkFinal}`
    : `🛒 Tens de ver este produto: ${produto.nome}\n\nCompra aqui: ${linkFinal}`;

  // ── SEM LOGIN ──
  if (!currentUser) return (
    <a href="/login"
      className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-green-600 transition">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
      </svg>
      Login para promover
    </a>
  );

  return (
    <div className="space-y-2">

      {/* Botão principal */}
      {!aberto && (
        isDono ? (
          <button
            onClick={handleDono}
            className="w-full flex items-center justify-center gap-2 bg-[#E24B4A] text-white py-3 rounded-2xl text-sm font-semibold hover:bg-[#A32D2D] transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Partilhar o meu produto
          </button>
        ) : (
          <button
            onClick={gerarLinkAfiliado}
            disabled={gerando}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {gerando ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />A gerar link...</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                Promover e ganhar {produto.percentagemAfiliado}%
              </>
            )}
          </button>
        )
      )}

      {/* Painel com o link */}
      {aberto && (
        <div className={`rounded-2xl border p-4 space-y-3 ${isDono ? 'bg-[#FCEBEB] border-[#F7C1C1]' : 'bg-green-50 border-green-200'}`}>

          {/* Label */}
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold ${isDono ? 'text-[#A32D2D]' : 'text-green-800'}`}>
              {isDono ? '📢 Teu link de partilha' : `🔗 Teu link de afiliado · ${produto.percentagemAfiliado}% por venda`}
            </p>
            <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Ganho estimado — só para afiliados */}
          {!isDono && (
            <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Ganhas por venda</span>
              <span className="text-sm font-bold text-green-600">
                {(produto.preco * produto.percentagemAfiliado / 100).toFixed(2)} MT
              </span>
            </div>
          )}

          {/* Link */}
          <div className="flex gap-2">
            <input
              readOnly
              value={linkFinal}
              className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-600 min-w-0"
            />
            <button
              onClick={() => copiar(linkFinal)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition flex-shrink-0 flex items-center gap-1.5 ${
                copiado
                  ? 'bg-green-500 text-white'
                  : isDono ? 'bg-[#E24B4A] text-white hover:bg-[#A32D2D]' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {copiado ? (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>Copiado</>
              ) : (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar</>
              )}
            </button>
          </div>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-500 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Partilhar no WhatsApp
          </a>

        </div>
      )}

    </div>
  );
}