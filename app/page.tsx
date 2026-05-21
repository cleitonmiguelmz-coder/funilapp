"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-gray-900 font-bold text-lg tracking-tight">FunilApp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">
              Entrar
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-20 text-center">
        <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-100 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Plataforma de funis de vendas para Moçambique
        </span>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Vende mais com funis{" "}
          <span className="text-green-600">profissionais</span>
        </h1>

        <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Cria páginas de vendas em minutos, captura leads automaticamente e recebe os contactos direto no teu WhatsApp. Simples, rápido e eficaz.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm shadow-sm shadow-green-200"
          >
            Começar gratuitamente
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12,5 19,12 12,19" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center text-sm font-medium text-gray-400 hover:text-gray-700 transition"
          >
            Já tenho conta →
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-gray-50 border-y border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 font-bold text-3xl mb-2">Como funciona</h2>
            <p className="text-gray-400 text-sm">3 passos simples para começar a capturar leads</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                ),
                title: "Crie o seu funil",
                desc: "Adicione o nome do produto, preço, vídeo e depoimentos de clientes em poucos minutos.",
              },
              {
                step: "02",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                ),
                title: "Partilhe o link",
                desc: "Copie o link gerado e partilhe nas redes sociais, WhatsApp ou Facebook Ads.",
              },
              {
                step: "03",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor" stroke="none" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L.057 23.882l6.187-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.879.936-3.629-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z" fill="currentColor" stroke="none" />
                  </svg>
                ),
                title: "Receba no WhatsApp",
                desc: "Os clientes preenchem o formulário e são redirecionados para o seu WhatsApp automaticamente.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                    {item.icon}
                  </div>
                  <span className="text-green-600 text-xs font-bold tracking-widest">{item.step}</span>
                </div>
                <h3 className="text-gray-900 font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 font-bold text-3xl mb-2">Tudo o que precisas</h2>
          <p className="text-gray-400 text-sm">Ferramentas pensadas para o mercado moçambicano</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "📄", title: "Página de vendas", desc: "Página profissional com vídeo, preço e depoimentos" },
            { icon: "📲", title: "Captura de leads", desc: "Formulário optimizado para conversão máxima" },
            { icon: "💬", title: "Redirect WhatsApp", desc: "Lead redirecionado automaticamente para o teu número" },
            { icon: "📊", title: "Dashboard", desc: "Acompanha os teus funis e leads em tempo real" },
            { icon: "📥", title: "Exportar CSV", desc: "Exporta os teus leads para Excel ou Google Sheets" },
            { icon: "🔗", title: "Link partilhável", desc: "Link único para cada funil, pronto para partilhar" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-gray-900 font-semibold text-sm mb-1">{f.title}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-white font-bold text-3xl mb-3">Pronto para começar?</h2>
          <p className="text-green-100 text-base mb-8">
            Cria a tua conta gratuitamente e lança o primeiro funil hoje.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-green-700 font-semibold px-8 py-3.5 rounded-xl transition text-sm shadow-sm"
          >
            Criar conta grátis
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12,5 19,12 12,19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-default select-none"
            onClick={handleLogoClick}
          >
            <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-gray-700 font-bold text-sm">FunilApp</span>
          </div>
          <p className="text-gray-400 text-xs">© 2026 FunilApp. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}