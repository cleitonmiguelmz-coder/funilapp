"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

interface Depoimento {
  nome: string;
  texto: string;
  foto: string;
}

interface Funnel {
  nomeProduto: string;
  preco: string;
  videoUrl: string;
  descricao: string;
  whatsapp: string;
  userId: string;
  tipoProduto?: string;
  depoimentos?: Depoimento[];
  paraQuem?: string;
  bonusIncluidos?: string;
  linkCompra?: string;
  tempoEntrega?: string;
  oQueInclui?: string;
}

interface LeadForm {
  nome: string;
  whatsapp: string;
  cidade: string;
  pagamento: string;
  intencao: string;
}

function getEmbedUrl(url: string): { type: "youtube" | "facebook" | "unknown"; embedUrl: string } {
  if (!url) return { type: "unknown", embedUrl: url };

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    // Sem autoplay — compatível com Safari/iPhone
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?playsinline=1&rel=0` };
  }

  if (url.includes("youtube.com/embed/")) {
    const baseUrl = url.split("?")[0];
    return { type: "youtube", embedUrl: `${baseUrl}?playsinline=1&rel=0` };
  }

  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    const fbEmbed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=640`;
    return { type: "facebook", embedUrl: fbEmbed };
  }

  return { type: "unknown", embedUrl: url };
}

export default function FunnelPage() {
  const { id } = useParams();
  const funnelId = Array.isArray(id) ? id[0] : id;

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<LeadForm>({
    nome: "",
    whatsapp: "",
    cidade: "",
    pagamento: "",
    intencao: "",
  });

  useEffect(() => {
    document.documentElement.style.colorScheme = "light";
    document.documentElement.setAttribute("data-theme", "light");
    const meta = document.createElement("meta");
    meta.name = "color-scheme";
    meta.content = "light";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
      document.documentElement.style.colorScheme = "";
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  useEffect(() => {
    if (!funnelId) return;
    fetchFunnel();
  }, [funnelId]);

  const fetchFunnel = async () => {
    try {
      const ref = doc(db, "funnels", funnelId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      const data = snap.data() as Funnel;
      setFunnel(data);

      try {
        await addDoc(collection(db, "visits"), {
          funnelId,
          userId: data.userId,
          nomeProduto: data.nomeProduto,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Erro ao registar visita:", e);
      }

      try {
        const userSnap = await getDoc(doc(db, "users", data.userId));
        if (userSnap.exists() && userSnap.data().fcmToken) {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: userSnap.data().fcmToken,
              title: "👁️ Nova visita no teu funil!",
              body: data.nomeProduto,
            }),
          });
        }
      } catch (e) {
        console.error("Erro ao enviar notificação:", e);
      }

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funnel || !form.nome || !form.whatsapp) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "leads"), {
        ...form,
        funnelId,
        userId: funnel.userId,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);

      const msg = encodeURIComponent(
        `Olá! Me chamo *${form.nome}* e tenho interesse em *${funnel.nomeProduto}*.\n\nCidade: ${form.cidade}\nForma de pagamento: ${form.pagamento}\nIntenção: ${form.intencao}`
      );
      const numero = funnel.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/258${numero}?text=${msg}`, "_blank");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !funnel) {
    return (
      <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-gray-900 text-xl font-bold mb-2">Funil não encontrado</h1>
          <p className="text-gray-400 text-sm">Este link pode ter expirado ou sido removido.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h1 className="text-gray-900 text-xl font-bold mb-2">Recebemos o seu interesse!</h1>
          <p className="text-gray-400 text-sm">Será redirecionado para o WhatsApp para continuar.</p>
        </div>
      </div>
    );
  }

  const depoimentos = funnel.depoimentos?.filter((d) => d.nome && d.texto) ?? [];
  const video = funnel.videoUrl ? getEmbedUrl(funnel.videoUrl) : null;

  const temLinkCompra =
    (funnel.tipoProduto === "ebook" || funnel.tipoProduto === "curso") &&
    !!funnel.linkCompra;

  return (
    <div style={{ colorScheme: "light", backgroundColor: "#f9fafb", color: "#111827" }} className="min-h-screen bg-gray-50">

      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f3f4f6" }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span style={{ color: "#111827" }} className="font-bold text-sm">FunilApp</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="text-center mb-8">
          <span style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #dcfce7" }} className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Oferta Especial
          </span>
          <h1 style={{ color: "#111827" }} className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            {funnel.nomeProduto}
          </h1>
          {funnel.descricao && (
            <p style={{ color: "#6b7280" }} className="text-base leading-relaxed mb-4">{funnel.descricao}</p>
          )}
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }} className="inline-flex items-center gap-1 rounded-xl px-5 py-2.5 mt-2">
            <span style={{ color: "#16a34a" }} className="text-sm font-medium">Apenas</span>
            <span style={{ color: "#15803d" }} className="text-2xl font-bold ml-1">
              {Number(funnel.preco).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
            </span>
          </div>
        </div>

        {/* Video — sem autoplay para compatibilidade iPhone */}
        {video && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video shadow-sm" style={{ backgroundColor: "#111827" }}>
            <iframe
              src={video.embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              style={{ border: "none" }}
              loading="lazy"
            />
          </div>
        )}

        {(funnel.tipoProduto === "ebook" || funnel.tipoProduto === "curso") && (
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #dbeafe" }} className="rounded-2xl p-5 mb-6 space-y-3">
            {funnel.paraQuem && (
              <div>
                <p style={{ color: "#1d4ed8" }} className="text-xs font-semibold uppercase tracking-wide mb-1">Para quem é</p>
                <p style={{ color: "#374151" }} className="text-sm">{funnel.paraQuem}</p>
              </div>
            )}
            {funnel.bonusIncluidos && (
              <div>
                <p style={{ color: "#1d4ed8" }} className="text-xs font-semibold uppercase tracking-wide mb-1">Bónus incluídos</p>
                <p style={{ color: "#374151" }} className="text-sm">{funnel.bonusIncluidos}</p>
              </div>
            )}
          </div>
        )}

        {funnel.tipoProduto === "servico" && (
          <div style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff" }} className="rounded-2xl p-5 mb-6 space-y-3">
            {funnel.oQueInclui && (
              <div>
                <p style={{ color: "#7e22ce" }} className="text-xs font-semibold uppercase tracking-wide mb-1">O que está incluído</p>
                <p style={{ color: "#374151" }} className="text-sm">{funnel.oQueInclui}</p>
              </div>
            )}
            {funnel.tempoEntrega && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                </svg>
                <p style={{ color: "#374151" }} className="text-sm">Entrega em <strong>{funnel.tempoEntrega}</strong></p>
              </div>
            )}
          </div>
        )}

        {funnel.tipoProduto === "dropshipping" && (
          <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }} className="rounded-2xl p-5 mb-6 space-y-3">
            {funnel.oQueInclui && (
              <div>
                <p style={{ color: "#c2410c" }} className="text-xs font-semibold uppercase tracking-wide mb-1">O que está incluído</p>
                <p style={{ color: "#374151" }} className="text-sm">{funnel.oQueInclui}</p>
              </div>
            )}
            {funnel.tempoEntrega && (
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" /><polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
                  <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <p style={{ color: "#374151" }} className="text-sm">Entrega em <strong>{funnel.tempoEntrega}</strong></p>
              </div>
            )}
          </div>
        )}

        {depoimentos.length > 0 && (
          <div className="mb-8">
            <h2 style={{ color: "#111827" }} className="font-bold text-xl text-center mb-2">O que dizem os nossos clientes</h2>
            <p style={{ color: "#9ca3af" }} className="text-sm text-center mb-6">Resultados reais de pessoas reais</p>
            <div className="grid grid-cols-1 gap-4">
              {depoimentos.map((dep, index) => (
                <div key={index} style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }} className="rounded-xl p-5 shadow-sm">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#16a34a">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                  </div>
                  <p style={{ color: "#4b5563" }} className="text-sm leading-relaxed mb-4">&ldquo;{dep.texto}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {dep.foto ? (
                      <img src={dep.foto} alt={dep.nome} className="w-9 h-9 rounded-full object-cover" style={{ border: "1px solid #f3f4f6" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold uppercase">{dep.nome[0]}</span>
                      </div>
                    )}
                    <div>
                      <p style={{ color: "#111827" }} className="text-sm font-semibold">{dep.nome}</p>
                      <p style={{ color: "#9ca3af" }} className="text-xs">Cliente verificado</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {temLinkCompra ? (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }} className="rounded-2xl p-6 shadow-sm mb-8 text-center">
            <h2 style={{ color: "#111827" }} className="font-bold text-lg mb-2">Pronto para comprar?</h2>
            <p style={{ color: "#9ca3af" }} className="text-sm mb-6">Clica no botão abaixo para finalizar a tua compra</p>
             <a
              href={funnel.linkCompra}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl transition text-base w-full"
            >
              Comprar agora
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
              </svg>
            </a>
          </div>
        ) : (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }} className="rounded-2xl p-6 shadow-sm mb-8">
            <h2 style={{ color: "#111827" }} className="font-bold text-lg mb-1">Tenho interesse</h2>
            <p style={{ color: "#9ca3af" }} className="text-sm mb-6">Preencha os dados abaixo e entraremos em contacto via WhatsApp</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ color: "#374151" }} className="block text-sm font-medium mb-1.5">Nome completo *</label>
                <input
                  type="text" name="nome" value={form.nome} onChange={handleChange} required
                  placeholder="O seu nome"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }}
                  className="w-full rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                />
              </div>

              <div>
                <label style={{ color: "#374151" }} className="block text-sm font-medium mb-1.5">WhatsApp *</label>
                <input
                  type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} required
                  placeholder="84 000 0000"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }}
                  className="w-full rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                />
              </div>

              <div>
                <label style={{ color: "#374151" }} className="block text-sm font-medium mb-1.5">Cidade</label>
                <input
                  type="text" name="cidade" value={form.cidade} onChange={handleChange}
                  placeholder="Maputo"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }}
                  className="w-full rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                />
              </div>

              <div>
                <label style={{ color: "#374151" }} className="block text-sm font-medium mb-1.5">Forma de pagamento</label>
                <select
                  name="pagamento" value={form.pagamento} onChange={handleChange}
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151" }}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                >
                  <option value="">Selecione</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="E-Mola">E-Mola</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div>
                <label style={{ color: "#374151" }} className="block text-sm font-medium mb-1.5">Intenção de compra</label>
                <select
                  name="intencao" value={form.intencao} onChange={handleChange}
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151" }}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                >
                  <option value="">Selecione</option>
                  <option value="Comprar agora">Comprar agora</option>
                  <option value="Quero para amanhã">Quero para amanhã</option>
                  <option value="Quero Agendar pra semana">Quero Agendar pra semana</option>
                  <option value="Estou a avaliar">Estou a avaliar</option>
                </select>
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg transition flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L.057 23.882l6.187-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.879.936-3.629-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                    </svg>
                    Falar no WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div style={{ borderTop: "1px solid #f3f4f6" }} className="text-center mt-4 pt-6">
          <p style={{ color: "#d1d5db" }} className="text-xs">Powered by FunilApp</p>
        </div>
      </div>
    </div>
  );
}