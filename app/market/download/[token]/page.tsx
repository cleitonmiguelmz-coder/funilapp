// ===== PÁGINA DE DOWNLOAD — market/download/[token]/page.tsx =====
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { validarEObterDownload } from '@/lib/download';

type Estado = 'carregando' | 'valido' | 'expirado' | 'invalido' | 'limite';

export default function DownloadPage() {
  const { token } = useParams();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [url, setUrl] = useState('');
  const [descarregando, setDescarregando] = useState(false);

  useEffect(() => {
    if (!token) return;
    validarEObterDownload(token as string).then(resultado => {
      if (resultado.ok && resultado.url) {
        setUrl(resultado.url);
        setEstado('valido');
      } else {
        setEstado(resultado.erro === 'expirado' ? 'expirado'
          : resultado.erro === 'limite' ? 'limite'
          : 'invalido');
      }
    });
  }, [token]);

  function handleDownload() {
    if (!url) return;
    setDescarregando(true);
    // Abre o download numa nova tab
    window.open(url, '_blank');
    setTimeout(() => setDescarregando(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center shadow-sm">

        {/* CARREGANDO */}
        {estado === 'carregando' && (
          <>
            <div className="w-14 h-14 bg-[#FCEBEB] rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 text-sm">A verificar o teu link...</p>
          </>
        )}

        {/* VÁLIDO — pronto para download */}
        {estado === 'valido' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-2">O teu produto está pronto</h2>
            <p className="text-gray-400 text-sm mb-6">Clica no botão abaixo para fazer o download.</p>

            <button
              onClick={handleDownload}
              disabled={descarregando}
              className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-bold hover:bg-[#A32D2D] transition disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
            >
              {descarregando ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />A iniciar download...</>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Fazer download agora
                </>
              )}
            </button>

            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-2 text-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-gray-400">
                Este link é pessoal e expira em breve. Guarda o ficheiro após o download.
              </p>
            </div>
          </>
        )}

        {/* EXPIRADO */}
        {estado === 'expirado' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-2">Link expirado</h2>
            <p className="text-gray-400 text-sm mb-6">
              Este link de download já expirou (válido por 48 horas após a compra).
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-yellow-700 font-medium mb-1">O que podes fazer:</p>
              <p className="text-xs text-yellow-600">
                Entra em contacto com o vendedor ou verifica a mensagem original no WhatsApp — o link foi enviado para o teu número após a compra.
              </p>
            </div>
            <Link href="/market" className="text-[#E24B4A] text-sm font-medium hover:underline">
              ← Voltar ao marketplace
            </Link>
          </>
        )}

        {/* LIMITE DE USOS */}
        {estado === 'limite' && (
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-2">Limite de downloads atingido</h2>
            <p className="text-gray-400 text-sm mb-5">
              Este link já foi usado o número máximo de vezes permitido.
            </p>
            <Link href="/market" className="text-[#E24B4A] text-sm font-medium hover:underline">
              ← Voltar ao marketplace
            </Link>
          </>
        )}

        {/* INVÁLIDO */}
        {estado === 'invalido' && (
          <>
            <div className="w-16 h-16 bg-[#FCEBEB] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-2">Link inválido</h2>
            <p className="text-gray-400 text-sm mb-5">
              Este link não existe ou foi revogado.
            </p>
            <Link href="/market" className="text-[#E24B4A] text-sm font-medium hover:underline">
              ← Voltar ao marketplace
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
