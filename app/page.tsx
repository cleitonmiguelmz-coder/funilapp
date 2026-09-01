"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────
   IDENTIDADE — FunilApp
   Verde:      #0C6B3A
   Vermelho:   #C21A2C
   Tinta:      #101010
   Branco:     #FFFFFF
   Cinza fundo:#F4F3EF
   Cinza texto:#5C5B57
───────────────────────────────────────────── */

const COR = {
  verde: "#0C6B3A",
  vermelho: "#C21A2C",
  tinta: "#101010",
  branco: "#FFFFFF",
  fundo: "#F4F3EF",
  texto: "#5C5B57",
};

const FONT_TITULO =
  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const PRODUTOS_DESTAQUE = [
  { nome: "Domina o Tráfego Pago", categoria: "Curso", preco: 1200, vendas: 87, imagem: "/produtos/trafego-pago.jpg" },
  { nome: "Pack 50 Templates Canva", categoria: "Template", preco: 450, vendas: 213, imagem: "/produtos/templates-canva.jpg" },
  { nome: "Guia Completo M-Pesa Business", categoria: "Ebook", preco: 350, vendas: 156, imagem: "/produtos/mpesa-business.jpg" },
  { nome: "Planilha de Gestão Financeira", categoria: "Software", preco: 600, vendas: 64, imagem: "/produtos/gestao-financeira.png" },
  { nome: "Copywriting Para WhatsApp", categoria: "Curso", preco: 800, vendas: 102, imagem: "/produtos/copywriting-whatsapp.jpg" },
];

const PRODUTO_MAIS_VENDIDO = Math.max(...PRODUTOS_DESTAQUE.map((p) => p.vendas));

const CATEGORIAS_MARKET = [
  { nome: "Ebooks", desc: "Conhecimento em PDF", cor: COR.vermelho },
  { nome: "Cursos", desc: "Vídeo aulas completas", cor: COR.verde },
  { nome: "Templates", desc: "Prontos para usar", cor: COR.vermelho },
  { nome: "Software", desc: "Ferramentas digitais", cor: COR.verde },
  { nome: "Outros", desc: "Mais categorias", cor: COR.vermelho },
];

const SELOS_METAS = [
  { meta: "5K", src: "/selos/5k.png" },
  { meta: "10K", src: "/selos/10k.png" },
  { meta: "50K", src: "/selos/50k.png" },
  { meta: "100K", src: "/selos/100k.png" },
];

const PASSOS_COMO_FUNCIONA = [
  {
    step: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    title: "Monta o funil",
    desc: "Nome do produto, preço, vídeo de venda e depoimentos. Cinco minutos, sem precisar de programador.",
  },
  {
    step: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: "Solta o link",
    desc: "Status do WhatsApp, grupo, Facebook Ads — o link funciona em qualquer lugar onde o teu cliente esteja.",
  },
  {
    step: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L.057 23.882l6.187-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.879.936-3.629-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z" />
      </svg>
    ),
    title: "Fecha pelo WhatsApp",
    desc: "O lead preenche o formulário e cai direto na tua conversa, já a perguntar sobre o produto.",
  },
];

function FaixaIdentidade() {
  return (
    <div className="flex h-1 w-full">
      <div className="flex-1" style={{ background: COR.vermelho }} />
      <div className="flex-1" style={{ background: COR.tinta }} />
      <div className="flex-1" style={{ background: COR.verde }} />
    </div>
  );
}

// Moldura de produto — etiqueta de módulo + imagem, sem barra de "browser" genérica.
function ScreenshotFrame({
  src,
  alt,
  label,
  accentColor,
}: {
  src: string;
  alt: string;
  label: string;
  accentColor: string;
}) {
  return (
    <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ border: `1px solid ${COR.tinta}14` }}>
      <div className="relative w-full" style={{ aspectRatio: "4 / 3", background: COR.fundo }}>
        <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <span
        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white px-2.5 py-1"
        style={{ background: accentColor }}
      >
        {label}
      </span>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const scrollProdutosRef = useRef<HTMLDivElement>(null);
  const scrollCategoriasRef = useRef<HTMLDivElement>(null);
  const scrollPassosRef = useRef<HTMLDivElement>(null);
  const scrollSelosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleLogoClick = () => {
    const now = Date.now();
    const key = "__adminClicks";
    const stored = JSON.parse(sessionStorage.getItem(key) || '{"count":0,"last":0}');
    const diff = now - stored.last;
    const count = diff < 800 ? stored.count + 1 : 1;
    sessionStorage.setItem(key, JSON.stringify({ count, last: now }));
    if (count >= 3) {
      sessionStorage.removeItem(key);
      sessionStorage.setItem("redirectAfterLogin", "/admin");
      router.push("/login");
    }
  };

  function scroll(ref: React.RefObject<HTMLDivElement>, dir: "left" | "right") {
    if (!ref.current) return;
    const amount = ref.current.clientWidth * 0.8;
    ref.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COR.branco }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: COR.verde, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: COR.branco, color: COR.tinta, fontFamily: FONT_TITULO }}>
      <FaixaIdentidade />

      {/* Navbar */}
      <header className="sticky top-0 z-10 backdrop-blur-sm" style={{ background: `${COR.branco}F2`, borderBottom: `1px solid ${COR.tinta}12` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FunilApp" width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-black text-base sm:text-lg tracking-tight uppercase">FunilApp</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="https://chat.whatsapp.com/CuEv920VDerLNH4uMBSUz7?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-xs sm:text-sm font-semibold"
              style={{ color: COR.texto }}
            >
              Comunidade
            </a>
            <Link href="/login" className="text-xs sm:text-sm font-semibold" style={{ color: COR.texto }}>
              Entrar
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-white px-4 sm:px-5 py-2.5 transition whitespace-nowrap"
              style={{ background: COR.verde }}
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-14 sm:pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase px-3 py-1.5 mb-8"
          style={{ border: `1px solid ${COR.vermelho}`, color: COR.vermelho }}
        >
          <span className="w-1.5 h-1.5" style={{ background: COR.vermelho }} />
          Feito para vender em Moçambique
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6 uppercase">
          O teu funil de vendas,{" "}
          <span style={{ color: COR.verde }}>do zero ao M-Pesa</span>
        </h1>

        <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: COR.texto }}>
          Página de vendas, captura de leads e redireccionamento directo pro teu WhatsApp.
          Sem complicação técnica, sem mensalidade escondida — só o que precisas pra fechar vendas hoje.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 sm:mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-bold px-8 py-4 transition text-sm uppercase tracking-wide"
            style={{ background: COR.verde }}
          >
            Criar o meu primeiro funil
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12,5 19,12 12,19" />
            </svg>
          </Link>
          <Link href="/login" className="w-full sm:w-auto text-center text-sm font-semibold" style={{ color: COR.texto }}>
            Já tenho conta →
          </Link>
        </div>

        <ScreenshotFrame src="/screenshots/dashboard.png" alt="Visão geral do FunilApp, com os teus funis e leads" label="Painel" accentColor={COR.verde} />
      </section>

      {/* Como funciona */}
      <section className="py-14 sm:py-20 overflow-hidden" style={{ background: COR.tinta }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="mb-10 sm:mb-12">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: COR.verde }}>
              Como funciona
            </span>
            <h2 className="font-black text-2xl sm:text-3xl mt-2 text-white uppercase tracking-tight">
              Três passos e está no ar
            </h2>
          </div>
        </div>

        <div
          ref={scrollPassosRef}
          className="flex sm:grid sm:grid-cols-3 gap-px overflow-x-auto sm:overflow-visible pb-2 scroll-smooth max-w-5xl mx-auto snap-x snap-mandatory sm:snap-none"
          style={{ scrollbarWidth: "none" }}
        >
          {PASSOS_COMO_FUNCIONA.map((item, i) => (
            <div
              key={item.step}
              className="flex-shrink-0 w-[78vw] sm:w-auto min-w-[240px] snap-start p-6 sm:px-8 sm:py-8"
              style={{ background: COR.tinta, borderTop: `2px solid ${i % 2 === 0 ? COR.verde : COR.vermelho}` }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-white">{item.icon}</span>
                <span className="text-xs font-bold tracking-widest" style={{ color: i % 2 === 0 ? COR.verde : COR.vermelho }}>
                  {item.step}
                </span>
              </div>
              <h3 className="font-bold text-base mb-2 text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#B8B7B2" }}>{item.desc}</p>
            </div>
          ))}
          <div className="flex-shrink-0 w-2 sm:hidden" aria-hidden="true" />
        </div>
      </section>

      {/* FUNILMARKET */}
      <section className="py-14 sm:py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: COR.vermelho }}>
              FunilMarket
            </span>
            <Link href="/market" className="text-xs font-bold uppercase tracking-wide" style={{ color: COR.vermelho }}>
              Ver tudo →
            </Link>
          </div>

          <h2 className="font-black text-2xl sm:text-3xl mb-2 uppercase tracking-tight">
            Já tens um produto pronto?
          </h2>
          <p className="text-sm mb-7 sm:mb-8 max-w-xl" style={{ color: COR.texto }}>
            O FunilMarket vive dentro do FunilApp: é onde outros criadores já estão a vender ebooks, cursos
            e templates — com pagamento por M-Pesa e E-Mola direto na conta.
          </p>
        </div>

        <div className="relative mb-10 sm:mb-12">
          <div
            ref={scrollProdutosRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth px-5 sm:px-6 max-w-6xl mx-auto snap-x snap-mandatory sm:snap-none"
            style={{ scrollbarWidth: "none" }}
          >
            {PRODUTOS_DESTAQUE.map((p) => (
              <div
                key={p.nome}
                className="flex-shrink-0 w-[38vw] sm:w-48 min-w-[150px] max-w-[200px] snap-start overflow-hidden transition hover:shadow-lg"
                style={{ background: COR.branco, border: `1px solid ${COR.tinta}14` }}
              >
                <div className="relative w-full" style={{ paddingBottom: "125%", background: COR.fundo }}>
                  <img src={p.imagem} alt={p.nome} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  {p.vendas === PRODUTO_MAIS_VENDIDO && (
                    <span
                      className="absolute top-2 left-2 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2 py-1 whitespace-nowrap"
                      style={{ background: COR.vermelho }}
                    >
                      Mais vendido
                    </span>
                  )}
                </div>
                <div className="p-2.5 sm:p-3">
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: COR.texto }}>{p.categoria}</span>
                  <p className="font-bold text-xs leading-snug mt-0.5 mb-1.5 sm:mb-2 line-clamp-2 min-h-[2.2em]">
                    {p.nome}
                  </p>
                  <span className="font-black text-sm" style={{ color: COR.verde }}>
                    {p.preco.toLocaleString("pt-MZ")} <span className="text-xs font-bold">MT</span>
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/login"
              className="flex-shrink-0 w-[38vw] sm:w-44 min-w-[150px] max-w-[190px] snap-start flex flex-col items-center justify-center text-center p-4 transition"
              style={{ background: COR.vermelho }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="mb-2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-white text-xs font-bold uppercase tracking-wide leading-snug">Vender o teu produto</span>
            </Link>
            <div className="flex-shrink-0 w-4 sm:w-3" aria-hidden="true" />
          </div>

          <button
            onClick={() => scroll(scrollProdutosRef, "left")}
            className="hidden sm:flex absolute left-1 top-[35%] -translate-y-1/2 w-9 h-9 items-center justify-center shadow-md hover:brightness-95 transition z-10"
            style={{ background: COR.branco, border: `1px solid ${COR.tinta}1F` }}
            aria-label="Anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            onClick={() => scroll(scrollProdutosRef, "right")}
            className="hidden sm:flex absolute right-1 top-[35%] -translate-y-1/2 w-9 h-9 items-center justify-center shadow-md hover:brightness-95 transition z-10"
            style={{ background: COR.branco, border: `1px solid ${COR.tinta}1F` }}
            aria-label="Seguinte"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="relative">
          <div
            ref={scrollCategoriasRef}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scroll-smooth px-5 sm:px-6 max-w-6xl mx-auto snap-x snap-mandatory sm:snap-none"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIAS_MARKET.map((c) => (
              <Link
                href="/market"
                key={c.nome}
                className="flex-shrink-0 w-[34vw] min-w-[128px] max-w-[150px] sm:w-36 snap-start p-3.5 sm:p-4 transition hover:shadow-sm"
                style={{ background: COR.branco, borderLeft: `3px solid ${c.cor}`, borderTop: `1px solid ${COR.tinta}12`, borderRight: `1px solid ${COR.tinta}12`, borderBottom: `1px solid ${COR.tinta}12` }}
              >
                <p className="font-bold text-xs sm:text-sm mb-0.5 truncate uppercase tracking-wide" style={{ color: c.cor }}>{c.nome}</p>
                <p className="text-[11px] sm:text-xs" style={{ color: COR.texto }}>{c.desc}</p>
              </Link>
            ))}
            <div className="flex-shrink-0 w-2 sm:hidden" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* METAS DE VENDEDOR */}
      <section className="py-14 sm:py-20" style={{ background: COR.fundo }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: COR.verde }}>
              Reconhecimento
            </span>
            <h2 className="font-black text-2xl sm:text-3xl mt-2 uppercase tracking-tight">
              Cada meta tem o seu selo
            </h2>
            <p className="text-sm max-w-md mx-auto mt-2" style={{ color: COR.texto }}>
              No FunilMarket, vendedor que bate uma meta de faturação ganha o selo — e fica visível pra quem visita o produto.
            </p>
          </div>

          <div className="relative">
            <div
              ref={scrollSelosRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory sm:snap-none sm:justify-center"
              style={{ scrollbarWidth: "none" }}
            >
              {SELOS_METAS.map((s) => (
                <div key={s.meta} className="flex-shrink-0 w-[46vw] sm:w-40 md:w-44 snap-start overflow-hidden shadow-md">
                  <div className="relative w-full" style={{ aspectRatio: "0.7" }}>
                    <Image src={s.src} alt={`Selo de meta ${s.meta}`} fill className="object-cover" sizes="(max-width: 768px) 46vw, 176px" />
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 w-2 sm:hidden" aria-hidden="true" />
            </div>

            <button
              onClick={() => scroll(scrollSelosRef, "left")}
              className="hidden sm:flex absolute left-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center shadow-md hover:brightness-95 transition z-10"
              style={{ background: COR.branco, border: `1px solid ${COR.tinta}1F` }}
              aria-label="Anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => scroll(scrollSelosRef, "right")}
              className="hidden sm:flex absolute right-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center shadow-md hover:brightness-95 transition z-10"
              style={{ background: COR.branco, border: `1px solid ${COR.tinta}1F` }}
              aria-label="Seguinte"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <p className="text-center text-xs mt-6 sm:hidden" style={{ color: COR.texto }}>
            Desliza para o lado para ver as 4 placas — 100K é a mais disputada da plataforma.
          </p>
        </div>
      </section>

      {/* DELIVERY */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: COR.verde }}>
              Em expansão
            </span>
            <h2 className="font-black text-2xl sm:text-3xl mt-2 mb-4 uppercase tracking-tight">
              Vendes algo físico? O Delivery resolve a entrega
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: COR.texto }}>
              Quem vende produto físico pelo funil — roupa, comida, encomendas — não precisa de sair à procura
              de motoboy. O módulo Delivery, dentro do FunilApp, liga o teu pedido a um entregador e tu acompanhas
              tudo, do "saiu para entrega" até "confirmado pelo cliente".
            </p>
            <ul className="space-y-3">
              {[
                "Pedido sai automaticamente do teu funil para o entregador",
                "Cliente recebe o número de quem está a levar a encomenda",
                "Acompanhas o estado da entrega direto no teu painel",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: COR.texto }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COR.verde} strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <ScreenshotFrame src="/screenshots/delivery.png" alt="Ecrã de encontrar um delivery em Maputo" label="Delivery" accentColor={COR.verde} />
        </div>
      </section>

      {/* GESTOR DO MEU NEGÓCIO */}
      <section className="py-14 sm:py-20" style={{ background: COR.fundo }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
            <div className="order-1 md:order-2">
              <ScreenshotFrame src="/screenshots/financeiro.png" alt="Ecrã financeiro do Gestor do meu negócio" label="Financeiro" accentColor={COR.vermelho} />
            </div>

            <div className="order-2 md:order-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: COR.vermelho }}>
                  Gestor do meu negócio
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5" style={{ background: COR.verde, color: COR.branco }}>
                  Grátis
                </span>
              </div>
              <h2 className="font-black text-2xl sm:text-3xl mb-4 uppercase tracking-tight">
                Sabe se o negócio dá lucro antes de arriscares
              </h2>
              <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: COR.texto }}>
                Dentro do FunilApp tens um simulador que te diz quanto precisas vender para não perder dinheiro,
                clientes com histórico de compras, e uma visão financeira completa — sem precisares de outra
                ferramenta nem de saber nada de contabilidade.
              </p>
              <ul className="space-y-3 mb-7">
                {[
                  "Mete preço, custo e despesas — vê o lucro em tempo real",
                  "Descobre quantas vendas precisas por dia para não perder",
                  "Receita, despesas e lucro líquido, tudo num só sítio",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: COR.texto }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COR.vermelho} strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 transition text-sm uppercase tracking-wide"
                style={{ background: COR.vermelho }}
              >
                Ver o Gestor do meu negócio
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12,5 19,12 12,19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24" style={{ background: COR.tinta }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="pl-5 sm:pl-8" style={{ borderLeft: `4px solid ${COR.verde}` }}>
            <h2 className="font-black text-2xl sm:text-4xl leading-tight mb-4 max-w-lg text-white uppercase tracking-tight">
              O funil leva cinco minutos. A primeira venda é contigo.
            </h2>
            <p className="text-sm sm:text-base mb-7 max-w-md" style={{ color: "#B8B7B2" }}>
              Sem cartão, sem mensalidade pra testar. Cria a conta e o link já sai pronto pra colar no status.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 transition text-sm uppercase tracking-wide"
              style={{ background: COR.verde }}
            >
              Criar conta grátis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6" style={{ borderTop: `1px solid ${COR.tinta}12` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 cursor-default select-none" onClick={handleLogoClick}>
            <Image src="/logo.png" alt="FunilApp" width={24} height={24} />
            <span className="font-black text-sm uppercase tracking-tight">FunilApp</span>
          </div>
          <p className="text-xs" style={{ color: COR.texto }}>FunilMarket, Delivery e Gestor do meu negócio fazem parte do FunilApp · © 2026</p>
        </div>
      </footer>
      <FaixaIdentidade />
    </div>
  );
}