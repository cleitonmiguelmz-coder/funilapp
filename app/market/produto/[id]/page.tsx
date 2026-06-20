'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getProduto, processarVenda } from '@/lib/marketplace';
import { Produto } from '@/lib/types';
import { BotaoPromover } from '@/components/produto-actions';

const PLACEHOLDER: Record<string, string> = {
  Ebook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=800&fit=crop&auto=format',
  Curso: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=800&fit=crop&auto=format',
  Template: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=800&fit=crop&auto=format',
  Software: 'https://images.unsplash.com/photo-1607798748738-b15c40d33d57?w=600&h=800&fit=crop&auto=format',
  Outro: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=800&fit=crop&auto=format',
};

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
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
function PaginaVenda({ produto, afiliadoRef, currentUser, directCheckout = false }: {
  produto: Produto;
  afiliadoRef: string | null;
  currentUser: User | null;
  directCheckout?: boolean;
}) {
  const [vista, setVista] = useState<'produto' | 'checkout'>(
    directCheckout ? 'checkout' : 'produto'
  );
  const [sucesso, setSucesso] = useState(false);
  const [dadosSucesso, setDadosSucesso] = useState<{ telefone: string; linkDownload: string } | null>(null);

  const imagem = produto.imagemUrl || PLACEHOLDER[produto.categoria] || PLACEHOLDER['Outro'];
  const isEbook = produto.categoria === 'Ebook';

  if (sucesso && dadosSucesso) return (
    <PaginaSucesso
      produto={produto}
      telefone={dadosSucesso.telefone}
      linkDownload={dadosSucesso.linkDownload}
    />
  );

  if (vista === 'checkout') return (
    <Checkout
      produto={produto}
      afiliadoRef={afiliadoRef}
      imagem={imagem}
      onVoltar={() => setVista('produto')}
      onSucesso={(telefone, linkDownload) => {
        setDadosSucesso({ telefone, linkDownload });
        setSucesso(true);
      }}
    />
  );

  // ── VER PRODUTO ──
  return (
    <div className="min-h-screen bg-white">

      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/market" className="flex items-center gap-2">
            <Image src="/logo.png" alt="FunilMarket" width={24} height={24} className="rounded-lg" />
            <span className="font-semibold text-[#111827] text-sm">FunilMarket</span>
          </Link>
          <Link href="/market" className="text-xs text-gray-400 hover:text-gray-600 transition hidden sm:block">
            ← Ver mais produtos
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pb-32 pt-6">

        {/* Capa */}
        <div className={`mb-6 ${isEbook ? 'flex justify-center' : ''}`}>
          <div
            className={`relative overflow-hidden rounded-2xl bg-[#FCEBEB] ${isEbook ? 'w-48 sm:w-64' : 'w-full'}`}
            style={{ aspectRatio: isEbook ? '3/4' : '16/9' }}
          >
            <Image src={imagem} alt={produto.nome} fill className="object-contain p-2"
              sizes="(max-width: 640px) 192px, 256px" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="bg-[#FCEBEB] text-[#E24B4A] text-xs font-semibold px-3 py-1 rounded-full">
            {produto.categoria}
          </span>
          {produto.garantiaDias && produto.garantiaDias > 0 && (
            <span className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Garantia {produto.garantiaDias} dias
            </span>
          )}
        </div>

        {/* Título */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] leading-tight mb-2">{produto.nome}</h1>
        {produto.subtitulo && (
          <p className="text-gray-500 text-base leading-relaxed mb-4">{produto.subtitulo}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 mb-6 flex-wrap text-xs text-gray-400">
          {produto.nivel && <span>{produto.nivel}</span>}
          {produto.idioma && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{produto.idioma}</span></>}
          {produto.paginas && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{produto.paginas} páginas</span></>}
          {produto.duracao && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{produto.duracao}</span></>}
          {produto.totalVendas > 0 && <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{produto.totalVendas} vendas</span></>}
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Descrição */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-[#111827] mb-3">Sobre este produto</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{produto.descricao}</p>
        </div>

        {/* Bullets */}
        {produto.bullets && produto.bullets.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-8">
            <h2 className="text-base font-bold text-[#111827] mb-4">O que vais receber</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {produto.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  </div>
                  <span className="text-gray-700 text-sm leading-snug">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Para quem */}
        {produto.paraQuem && produto.paraQuem.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-[#111827] mb-4">Para quem é</h2>
            <div className="space-y-2">
              {produto.paraQuem.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-5 h-5 bg-[#E24B4A] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </div>
                  <span className="text-gray-700 text-sm">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partilhar / Promover */}
        <div className="mb-8">
          <BotaoPromover
            produto={produto}
            currentUser={currentUser}
            produtoId={produto.id!}
          />
        </div>

      </div>

      {/* BOTÃO FIXO */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex-shrink-0">
            <p className="text-xl font-bold text-[#E24B4A] leading-none">
              {produto.preco.toLocaleString('pt-MZ')} MT
            </p>
            <p className="text-xs text-gray-400 mt-0.5">pagamento único</p>
          </div>
          <button
            onClick={() => { setVista('checkout'); window.scrollTo(0, 0); }}
            className="flex-1 bg-[#E24B4A] text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#A32D2D] transition flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Comprar agora
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CHECKOUT — usa nova assinatura de processarVenda
// ─────────────────────────────────────────────
function Checkout({ produto, afiliadoRef, imagem, onVoltar, onSucesso }: {
  produto: Produto;
  afiliadoRef: string | null;
  imagem: string;
  onVoltar: () => void;
  onSucesso: (telefone: string, linkDownload: string) => void;
}) {
  const [form, setForm] = useState({ nome: '', telefone: '' });
  const [metodo, setMetodo] = useState<'mpesa' | 'emola'>('mpesa');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [processando, setProcessando] = useState(false);

  function validar() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Nome obrigatório';
    if (!form.telefone.trim() || form.telefone.replace(/\D/g, '').length < 9) e.telefone = 'Número inválido';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handlePagar() {
    if (!validar()) return;
    setProcessando(true);
    try {
      const tel = form.telefone.replace(/\D/g, '');
      // processarVenda agora devolve { vendaId, linkDownload }
      const { linkDownload } = await processarVenda({
        produtoId: produto.id!,
        criadorId: produto.userId,
        afiliadoRef,
        compradorNome: form.nome,
        compradorEmail: '',
        compradorTelefone: tel,
        valor: produto.preco,
        percentagemAfiliado: produto.percentagemAfiliado,
        metodoPagamento: metodo,
      });
      onSucesso(tel, linkDownload);
    } catch {
      alert('Erro ao processar. Tenta novamente.');
    }
    setProcessando(false);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="bg-[#E24B4A] px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={onVoltar} className="text-white/80 hover:text-white transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <h1 className="text-white font-semibold text-base flex-1">Finalizar compra</h1>
            <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="text-white text-xs">Seguro</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 overflow-hidden flex-shrink-0">
              <Image src={imagem} alt={produto.nome} width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{produto.nome}</p>
              <p className="text-white/70 text-xs mt-0.5">{produto.categoria} · acesso imediato</p>
            </div>
            <div className="text-white text-xl font-bold flex-shrink-0">
              {produto.preco.toLocaleString('pt-MZ')} MT
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">O teu nome</label>
            <input type="text" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Maria Cumbe" autoComplete="name"
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E24B4A] transition ${erros.nome ? 'border-red-300' : 'border-gray-200'}`} />
            {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Número de telefone</label>
            <div className="flex gap-2">
              <span className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-400 bg-gray-50 flex-shrink-0 font-medium">+258</span>
              <input type="tel" value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value.replace(/\D/g, '') }))}
                placeholder={metodo === 'mpesa' ? '84 000 0000' : '86 000 0000'}
                maxLength={9} autoComplete="tel"
                className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E24B4A] transition ${erros.telefone ? 'border-red-300' : 'border-gray-200'}`} />
            </div>
            {erros.telefone && <p className="text-red-500 text-xs mt-1">{erros.telefone}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Pagar com</label>
            <div className="grid grid-cols-2 gap-2">
              {(['mpesa', 'emola'] as const).map(m => (
                <button key={m} onClick={() => setMetodo(m)}
                  className={`border-2 rounded-xl p-3 flex items-center gap-3 transition text-left ${metodo === m ? 'border-[#E24B4A] bg-[#FCEBEB]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m === 'mpesa' ? 'bg-[#FCEBEB]' : 'bg-blue-50'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={m === 'mpesa' ? '#E24B4A' : '#185FA5'} strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${metodo === m ? 'text-[#A32D2D]' : 'text-gray-600'}`}>{m === 'mpesa' ? 'M-Pesa' : 'E-Mola'}</p>
                    <p className="text-xs text-gray-400">{m === 'mpesa' ? 'Vodacom' : 'Movitel'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handlePagar} disabled={processando}
          className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#A32D2D] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {processando ? (
            <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />A processar pagamento...</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Pagar {produto.preco.toLocaleString('pt-MZ')} MT agora
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Pagamento seguro
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            Acesso imediato
          </span>
          {produto.garantiaDias && produto.garantiaDias > 0 && (
            <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>Garantia {produto.garantiaDias} dias</span></>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PÁGINA DE SUCESSO — usa linkDownload seguro
// ─────────────────────────────────────────────
function PaginaSucesso({ produto, telefone, linkDownload }: {
  produto: Produto;
  telefone: string;
  linkDownload: string;
}) {
  const telMasked = telefone.slice(0, 3) + '***' + telefone.slice(-3);
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">

        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[#111827] mb-2">Pagamento confirmado!</h2>
        <p className="text-gray-500 text-sm mb-1">O teu produto está pronto.</p>
        <p className="text-gray-400 text-xs mb-8">
          Link enviado via WhatsApp para +258 {telMasked}
        </p>

        {/* LINK SEGURO — não é o arquivoUrl directo */}
        <a
          href={linkDownload}
          className="inline-flex items-center gap-2 bg-[#E24B4A] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#A32D2D] transition mb-5 w-full justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Fazer download agora
        </a>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-start gap-3 text-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" className="flex-shrink-0 mt-0.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <div>
            <p className="text-xs font-semibold text-green-800">Link também enviado no WhatsApp</p>
            <p className="text-xs text-green-600 mt-0.5">Guarda a mensagem. O link expira em 48 horas.</p>
          </div>
        </div>

        <Link href="/market" className="text-gray-400 text-sm hover:text-gray-600 transition">
          ← Explorar mais produtos
        </Link>
      </div>
    </div>
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
