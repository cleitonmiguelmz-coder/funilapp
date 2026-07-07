"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────
   TOKENS DE IDENTIDADE
   Verde:    #0F6B3C
   Vermelho: #B4222F
   Dourado:  #C99A2E
   Tinta:    #141414
   Off-white:#FCFBF7
───────────────────────────────────────────── */

const PRODUTOS_DESTAQUE = [
  { nome: "Domina o Tráfego Pago", categoria: "Curso", preco: 1200, vendas: 87, imagem: "/produtos/trafego-pago.jpg" },
  { nome: "Pack 50 Templates Canva", categoria: "Template", preco: 450, vendas: 213, imagem: "/produtos/templates-canva.jpg" },
  { nome: "Guia Completo M-Pesa Business", categoria: "Ebook", preco: 350, vendas: 156, imagem: "/produtos/mpesa-business.jpg" },
  { nome: "Planilha de Gestão Financeira", categoria: "Software", preco: 600, vendas: 64, imagem: "/produtos/gestao-financeira.png" },
  { nome: "Copywriting Para WhatsApp", categoria: "Curso", preco: 800, vendas: 102, imagem: "/produtos/copywriting-whatsapp.jpg" },
];

const PRODUTO_MAIS_VENDIDO = Math.max(...PRODUTOS_DESTAQUE.map((p) => p.vendas));

// Categorias agora partilham o mesmo cartão neutro — só o rótulo muda de cor,
// alternando entre as 3 cores da marca. Sem paleta pastel por categoria.
const CATEGORIAS_MARKET = [
  { nome: "Ebooks", desc: "Conhecimento em PDF", cor: "#B4222F" },
  { nome: "Cursos", desc: "Vídeo aulas completas", cor: "#0F6B3C" },
  { nome: "Templates", desc: "Prontos para usar", cor: "#C99A2E" },
  { nome: "Software", desc: "Ferramentas digitais", cor: "#B4222F" },
  { nome: "Outros", desc: "Mais categorias", cor: "#0F6B3C" },
];

const METAS_VENDEDOR = [
  { meta: "5K", label: "Primeira meta", desc: "Quando fechas as primeiras vendas a sério", cor: "#0F6B3C" },
  { meta: "10K", label: "Vendedor consistente", desc: "Já não é sorte, é ritmo", cor: "#0F6B3C" },
  { meta: "50K", label: "Referência no nicho", desc: "Outros vendedores começam a perguntar como fizeste", cor: "#B4222F" },
  { meta: "100K", label: "Topo da plataforma", desc: "Lugar reservado para quem manda no jogo", cor: "#C99A2E" },
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

// Faixa fina vermelho / branco / verde — o único elemento repetido no fim e no início da página
function FaixaIdentidade() {
  return (
    <div className="flex h-[3px] w-full">
      <div className="flex-1" style={{ background: "#B4222F" }} />
      <div className="flex-1 border-y border-black/5" style={{ background: "#FCFBF7" }} />
      <div className="flex-1" style={{ background: "#0F6B3C" }} />
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const scrollProdutosRef = useRef<HTMLDivElement>(null);
  const scrollCategoriasRef = useRef<HTMLDivElement>(null);
  const scrollPassosRef = useRef<HTMLDivElement>(null);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FCFBF7" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "#0F6B3C", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#FCFBF7", color: "#141414" }}>
      <FaixaIdentidade />

      {/* Navbar */}
      <header className="border-b border-black/[0.06] sticky top-0 backdrop-blur-sm z-10" style={{ background: "#FCFBF7EE" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FunilApp" width={32} height={32} className="rounded-lg w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-bold text-base sm:text-lg tracking-tight">FunilApp</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="text-xs sm:text-sm font-medium opacity-60 hover:opacity-100 transition">
              Entrar
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-white px-3.5 sm:px-4 py-2 rounded-lg transition whitespace-nowrap hover:brightness-110"
              style={{ background: "#0F6B3C" }}
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-14 sm:pb-20 text-center">
        {/* "Selo" no lugar do badge com bolinha pulsante */}
        <div
          className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 mb-7 rounded-full border-[3px] font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase leading-tight text-center px-2"
          style={{ borderColor: "#B4222F", color: "#B4222F", transform: "rotate(-6deg)" }}
        >
          Feito p/ vender em Moçambique
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-6xl font-bold leading-[1.1] mb-6"
          style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}
        >
          O teu funil de vendas,{" "}
          <span style={{ color: "#0F6B3C" }}>do zero ao M-Pesa</span>
        </h1>

        <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto opacity-60">
          Página de vendas, captura de leads e redireccionamento directo pro teu WhatsApp.
          Sem complicação técnica, sem mensalidade escondida — só o que precisas pra fechar vendas hoje.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm hover:brightness-110"
            style={{ background: "#0F6B3C" }}
          >
            Criar o meu primeiro funil
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12,5 19,12 12,19" />
            </svg>
          </Link>
          <Link href="/login" className="w-full sm:w-auto text-center text-sm font-medium opacity-50 hover:opacity-90 transition">
            Já tenho conta →
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-y border-black/[0.06] py-14 sm:py-20 overflow-hidden" style={{ background: "#F5F2EA" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-bold text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}>
              Como funciona
            </h2>
            <p className="text-sm opacity-50">Três passos e o teu funil está no ar</p>
          </div>
        </div>

        <div
          ref={scrollPassosRef}
          className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-2 scroll-smooth px-5 sm:px-6 max-w-5xl mx-auto snap-x snap-mandatory sm:snap-none"
          style={{ scrollbarWidth: "none" }}
        >
          {PASSOS_COMO_FUNCIONA.map((item) => (
            <div
              key={item.step}
              className="flex-shrink-0 w-[78vw] sm:w-auto min-w-[240px] snap-start rounded-2xl p-6"
              style={{ background: "#FCFBF7", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-end justify-between mb-4">
                <div style={{ color: "#0F6B3C" }}>{item.icon}</div>
                <span
                  className="text-3xl font-bold leading-none opacity-20"
                  style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}
                >
                  {item.step}
                </span>
              </div>
              <h3 className="font-semibold text-base mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed opacity-55">{item.desc}</p>
            </div>
          ))}
          <div className="flex-shrink-0 w-2 sm:hidden" aria-hidden="true" />
        </div>

        <div className="flex sm:hidden justify-center gap-1.5 mt-5">
          {PASSOS_COMO_FUNCIONA.map((item) => (
            <span key={item.step} className="w-1.5 h-1.5 rounded-full" style={{ background: "#0F6B3C55" }} />
          ))}
        </div>
      </section>

      {/* FUNILMARKET */}
      <section className="py-14 sm:py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "#B4222F" }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#B4222F" }}>
                FunilMarket
              </span>
            </div>
            <Link href="/market" className="text-xs font-semibold hover:underline" style={{ color: "#B4222F" }}>
              Ver tudo →
            </Link>
          </div>

          <h2 className="font-bold text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}>
            Já tens um produto pronto?
          </h2>
          <p className="text-sm mb-7 sm:mb-8 max-w-xl opacity-55">
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
                className="flex-shrink-0 w-[38vw] sm:w-48 min-w-[150px] max-w-[200px] snap-start rounded-2xl overflow-hidden transition hover:shadow-md"
                style={{ background: "#FCFBF7", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="relative w-full" style={{ paddingBottom: "125%", background: "#F5F2EA" }}>
                  <img src={p.imagem} alt={p.nome} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  {p.vendas === PRODUTO_MAIS_VENDIDO && (
                    <span
                      className="absolute top-2 left-2 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: "#C99A2E" }}
                    >
                      Mais vendido
                    </span>
                  )}
                </div>
                <div className="p-2.5 sm:p-3">
                  <span className="text-[10px] opacity-45 font-medium">{p.categoria}</span>
                  <p className="font-semibold text-xs leading-snug mt-0.5 mb-1.5 sm:mb-2 line-clamp-2 min-h-[2.2em]">
                    {p.nome}
                  </p>
                  <span className="font-bold text-sm" style={{ color: "#B4222F", fontFamily: "var(--font-mono, monospace)" }}>
                    {p.preco.toLocaleString("pt-MZ")} <span className="text-xs font-medium">MT</span>
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/login"
              className="flex-shrink-0 w-[38vw] sm:w-44 min-w-[150px] max-w-[190px] snap-start rounded-2xl flex flex-col items-center justify-center text-center p-4 transition hover:brightness-110"
              style={{ background: "#B4222F" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="mb-2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-white text-xs font-semibold leading-snug">Vender o teu produto</span>
            </Link>
            <div className="flex-shrink-0 w-4 sm:w-3" aria-hidden="true" />
          </div>

          <button
            onClick={() => scroll(scrollProdutosRef, "left")}
            className="hidden sm:flex absolute left-1 top-[35%] -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center shadow-md hover:brightness-95 transition z-10"
            style={{ background: "#FCFBF7", border: "1px solid rgba(0,0,0,0.08)" }}
            aria-label="Anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            onClick={() => scroll(scrollProdutosRef, "right")}
            className="hidden sm:flex absolute right-1 top-[35%] -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center shadow-md hover:brightness-95 transition z-10"
            style={{ background: "#FCFBF7", border: "1px solid rgba(0,0,0,0.08)" }}
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
                className="flex-shrink-0 w-[34vw] min-w-[128px] max-w-[150px] sm:w-36 snap-start rounded-2xl p-3.5 sm:p-4 transition hover:shadow-sm"
                style={{ background: "#FCFBF7", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <p className="font-semibold text-xs sm:text-sm mb-0.5 truncate" style={{ color: c.cor }}>{c.nome}</p>
                <p className="text-[11px] sm:text-xs opacity-50 leading-snug">{c.desc}</p>
              </Link>
            ))}
            <div className="flex-shrink-0 w-2 sm:hidden" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* METAS DE VENDEDOR */}
      <section className="border-y border-black/[0.06] py-14 sm:py-20" style={{ background: "#F5F2EA" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-bold text-2xl sm:text-3xl mb-2" style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}>
              Cada meta tem o seu selo
            </h2>
            <p className="text-sm max-w-md mx-auto opacity-50">
              No FunilMarket, vendedor que bate uma meta de faturação ganha o selo — e fica visível pra quem visita o produto.
            </p>
          </div>

          <div className="flex items-end justify-center gap-2.5 sm:gap-4">
            {METAS_VENDEDOR.map((m, i) => {
              const escala = ["py-5", "py-6", "py-7", "py-8"][i];
              return (
                <div
                  key={m.meta}
                  className={`flex-1 max-w-[150px] rounded-2xl px-3 ${escala} text-center relative`}
                  style={{ background: "#FCFBF7", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {i === 3 && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-white"
                      style={{ background: "#C99A2E" }}
                    >
                      mais difícil
                    </span>
                  )}
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs text-white font-mono"
                    style={{ background: m.cor }}
                  >
                    {m.meta}
                  </div>
                  <p className="font-semibold text-[11px] sm:text-sm mb-1 leading-snug">{m.label}</p>
                  <p className="text-[10px] sm:text-xs leading-relaxed opacity-50 hidden sm:block">{m.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs mt-6 sm:hidden opacity-50">
            As placas sobem de tamanho com a meta — 100K é a mais disputada da plataforma.
          </p>
        </div>
      </section>

      {/* DELIVERY */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-5"
              style={{ background: "#0F6B3C11", color: "#0F6B3C", borderColor: "#0F6B3C33" }}
            >
              Em expansão
            </span>
            <h2 className="font-bold text-2xl sm:text-3xl mb-4" style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}>
              Vendes algo físico? O Delivery resolve a entrega
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-6 opacity-60">
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
                <li key={t} className="flex items-start gap-2.5 text-sm opacity-70">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6B3C" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "#0F6B3C11", border: "1px solid #0F6B3C22" }}>
            <div className="rounded-xl p-4 mb-3 shadow-sm" style={{ background: "#FCFBF7" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#0F6B3C22" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6B3C" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">Encomenda #2841</p>
                  <p className="text-xs opacity-45">A caminho · Maputo</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 rounded-full text-white" style={{ background: "#0F6B3C" }}>Em rota</span>
              </div>
            </div>
            <div className="rounded-xl p-4 shadow-sm" style={{ background: "#FCFBF7" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C99A2E22" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C99A2E" strokeWidth="2"><polyline points="20,6 9,17 4,12" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">Encomenda #2839</p>
                  <p className="text-xs opacity-45">Entregue · Matola</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 rounded-full text-white" style={{ background: "#C99A2E" }}>Concluída</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-6">
          <div className="pl-5 sm:pl-8" style={{ borderLeft: "4px solid #B4222F" }}>
            <h2
              className="font-bold text-2xl sm:text-4xl leading-tight mb-4 max-w-lg"
              style={{ fontFamily: "var(--font-display, 'Georgia', serif)" }}
            >
              O funil leva cinco minutos. A primeira venda é contigo.
            </h2>
            <p className="text-sm sm:text-base mb-7 max-w-md opacity-60">
              Sem cartão, sem mensalidade pra testar. Cria a conta e o link já sai pronto pra colar no status.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-lg transition text-sm hover:brightness-110"
              style={{ background: "#0F6B3C" }}
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
      <footer className="py-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 cursor-default select-none" onClick={handleLogoClick}>
            <Image src="/logo.png" alt="FunilApp" width={24} height={24} className="rounded-md" />
            <span className="font-bold text-sm">FunilApp</span>
          </div>
          <p className="text-xs opacity-40">FunilMarket e Delivery fazem parte do FunilApp · © 2026</p>
        </div>
      </footer>
      <FaixaIdentidade />
    </div>
  );
}