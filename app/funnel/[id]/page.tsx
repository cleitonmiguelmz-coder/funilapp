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
  corLayout?: string;
  imagemUrl?: string;
  garantia?: string;
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

const cores: Record<string, { primary: string; light: string; border: string; text: string }> = {
  green:  { primary: "#16a34a", light: "#f0fdf4", border: "#dcfce7", text: "#15803d" },
  blue:   { primary: "#2563eb", light: "#eff6ff", border: "#dbeafe", text: "#1d4ed8" },
  red:    { primary: "#dc2626", light: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  purple: { primary: "#9333ea", light: "#faf5ff", border: "#e9d5ff", text: "#7e22ce" },
  orange: { primary: "#ea580c", light: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  pink:   { primary: "#db2777", light: "#fdf2f8", border: "#fbcfe8", text: "#be185d" },
  black:  { primary: "#111827", light: "#f9fafb", border: "#e5e7eb", text: "#111827" },
};

const nomesFemininos = [
  "ana","maria","fatima","rosa","lucia","joana","isabel","paula","sofia","rita",
  "carla","sandra","patricia","claudia","fernanda","beatriz","alice","laura",
  "helena","vera","ines","marta","sara","diana","catarina","filipa","margarida",
  "celeste","graca","amelia","victoria","vanessa","tatiana","simone","renata",
  "lurdes","conceicao","esperanca","dulce","felicia","edna","flavia","irene",
  "aisha","amina","zara","layla","nadia","yasmin","grace","mercy","blessing",
  "chiamaka","ngozi","adaeze","chisom","precious","joy","faith","hope","esther",
  "naomi","ruth","deborah","miriam","sarah","leila","farida","zanele","nomsa",
  "thandiwe","lindiwe","nomvula","zodwa","nompumelelo","buhle","nandi",
];

const avataresFemininos = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1625450331598-f7e5a8c5afe5?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1542596594-649edbc13630?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1614644147724-2d4785d69962?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&crop=face&auto=format",
];

const avataresMasculinos = [
  "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1583195764036-46f3c7f15b13?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1570158268183-d296b2892211?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1558203728-00f45181dd84?w=120&h=120&fit=crop&crop=face&auto=format",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop&crop=face&auto=format",
];

function isFemininoNome(nome: string): boolean {
  const primeiro = nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return nomesFemininos.includes(primeiro);
}

function getAvatarUrl(nome: string, feminino: boolean, depIndex: number): string {
  const lista = feminino ? avataresFemininos : avataresMasculinos;
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  const base = Math.abs(hash) % lista.length;
  const final = (base + depIndex) % lista.length;
  return lista[final];
}

function getEmbedUrl(url: string): string {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?playsinline=1&rel=0`;
  if (url.includes("youtube.com/embed/")) return `${url.split("?")[0]}?playsinline=1&rel=0`;
  if (url.includes("facebook.com") || url.includes("fb.watch"))
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=640`;
  return url;
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
    nome: "", whatsapp: "", cidade: "", pagamento: "", intencao: "",
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
      const snap = await getDoc(doc(db, "funnels", funnelId));
      if (!snap.exists()) { setNotFound(true); return; }
      const data = snap.data() as Funnel;
      setFunnel(data);
      try {
        await addDoc(collection(db, "visits"), {
          funnelId, userId: data.userId, nomeProduto: data.nomeProduto, createdAt: serverTimestamp(),
        });
      } catch (e) { console.error(e); }
      try {
        const userSnap = await getDoc(doc(db, "users", data.userId));
        if (userSnap.exists() && userSnap.data().fcmToken) {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: userSnap.data().fcmToken, title: "👁️ Nova visita!", body: data.nomeProduto }),
          });
        }
      } catch (e) { console.error(e); }
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
        ...form, funnelId, userId: funnel.userId, createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      const msg = encodeURIComponent(
        `Olá! Me chamo *${form.nome}* e tenho interesse em *${funnel.nomeProduto}*.\n\nCidade: ${form.cidade}\nPagamento: ${form.pagamento}\nIntenção: ${form.intencao}`
      );
      window.open(`https://wa.me/258${funnel.whatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !funnel) return (
    <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-gray-900 text-xl font-bold mb-2">Funil não encontrado</h1>
        <p className="text-gray-400 text-sm">Este link pode ter expirado ou sido removido.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ colorScheme: "light" }} className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h1 className="text-gray-900 text-xl font-bold mb-2">Mensagem enviada!</h1>
        <p className="text-gray-400 text-sm">Será redirecionado para o WhatsApp para continuar.</p>
      </div>
    </div>
  );

  const cor = cores[funnel.corLayout ?? "green"] ?? cores.green;
  const depoimentos = funnel.depoimentos?.filter((d) => d.nome && d.texto) ?? [];
  const embedUrl = funnel.videoUrl ? getEmbedUrl(funnel.videoUrl) : null;
  const temLinkCompra = (funnel.tipoProduto === "ebook" || funnel.tipoProduto === "curso") && !!funnel.linkCompra;
  const isFisico = funnel.tipoProduto === "produto_fisico" || funnel.tipoProduto === "dropshipping";

  return (
    <div style={{ colorScheme: "light", backgroundColor: "#f9fafb", color: "#111827" }} className="min-h-screen">

      <div style={{ backgroundColor: cor.primary }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="font-bold text-sm text-white">FunilApp</span>
        </div>
      </div>

      <div style={{ backgroundColor: cor.primary }} className="pb-10">
        <div className="max-w-2xl mx-auto px-4 pt-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3 text-white">{funnel.nomeProduto}</h1>
          {funnel.descricao && (
            <p className="text-base leading-relaxed mb-6 text-white/80">{funnel.descricao}</p>
          )}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-2xl px-6 py-3">
            <span className="text-white/80 text-sm">Preço:</span>
            <span className="text-white text-2xl font-bold">
              {Number(funnel.preco).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12">

        {funnel.imagemUrl && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-lg bg-white">
            <img src={funnel.imagemUrl} alt={funnel.nomeProduto} className="w-full object-cover" style={{ maxHeight: "360px" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}

        {embedUrl && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-lg aspect-video" style={{ backgroundColor: "#111827" }}>
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              style={{ border: "none" }} loading="lazy" />
          </div>
        )}

        {isFisico && (funnel.oQueInclui || funnel.tempoEntrega) && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
            <h3 style={{ color: cor.primary }} className="font-bold text-base mb-4">📦 Detalhes do produto</h3>
            {funnel.oQueInclui && (
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">O que está incluído</p>
                  <p className="text-gray-800 text-sm">{funnel.oQueInclui}</p>
                </div>
              </div>
            )}
            {funnel.tempoEntrega && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Tempo de entrega</p>
                  <p className="text-gray-800 text-sm font-medium">{funnel.tempoEntrega}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(funnel.tipoProduto === "ebook" || funnel.tipoProduto === "curso") && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
            <h3 style={{ color: cor.primary }} className="font-bold text-base mb-4">
              {funnel.tipoProduto === "ebook" ? "📖 Sobre o Ebook" : "🎓 Sobre o Curso"}
            </h3>
            {funnel.paraQuem && (
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Para quem é</p>
                  <p className="text-gray-800 text-sm">{funnel.paraQuem}</p>
                </div>
              </div>
            )}
            {funnel.bonusIncluidos && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Bónus incluídos</p>
                  <p className="text-gray-800 text-sm">{funnel.bonusIncluidos}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {funnel.tipoProduto === "servico" && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
            <h3 style={{ color: cor.primary }} className="font-bold text-base mb-4">🛠️ Detalhes do Serviço</h3>
            {funnel.oQueInclui && (
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">O que está incluído</p>
                  <p className="text-gray-800 text-sm">{funnel.oQueInclui}</p>
                </div>
              </div>
            )}
            {funnel.tempoEntrega && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Prazo</p>
                  <p className="text-gray-800 text-sm font-medium">{funnel.tempoEntrega}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {funnel.garantia && (
          <div className="flex items-center gap-3 bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cor.light }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Garantia</p>
              <p className="text-gray-800 text-sm font-medium">{funnel.garantia}</p>
            </div>
          </div>
        )}

        {/* Depoimentos */}
        {depoimentos.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">O que dizem os clientes</h2>
            <div className="space-y-4">
              {depoimentos.map((dep, index) => {
                const feminino = isFemininoNome(dep.nome);
                const avatarUrl = dep.foto ? dep.foto : getAvatarUrl(dep.nome, feminino, index);
                return (
                  <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={avatarUrl}
                        alt={dep.nome}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2"
                        style={{ borderColor: cor.primary + "33", backgroundColor: cor.light }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const lista = feminino ? avataresFemininos : avataresMasculinos;
                          const fallbackIndex = (index + 2) % lista.length;
                          if (target.src !== lista[fallbackIndex]) {
                            target.src = lista[fallbackIndex];
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-semibold truncate">{dep.nome}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={cor.primary}>
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: cor.light, color: cor.text }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cor.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                        Verificado
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed pl-15">&ldquo;{dep.texto}&rdquo;</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {temLinkCompra ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
            <h2 className="font-bold text-lg text-gray-900 mb-2">Adquirir agora</h2>
            <p className="text-gray-400 text-sm mb-5">Clica no botão para finalizar a compra</p>
            <a href={funnel.linkCompra} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-xl transition text-base w-full"
              style={{ backgroundColor: cor.primary }}>
              Comprar agora
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
              </svg>
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Tenho interesse</h2>
            <p className="text-gray-400 text-sm mb-5">Preencha e entraremos em contacto via WhatsApp</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} required placeholder="O seu nome"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }}
                  className="w-full rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none transition"
                  onFocus={(e) => e.target.style.borderColor = cor.primary}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp *</label>
                <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} required placeholder="84 000 0000"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }}
                  className="w-full rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none transition"
                  onFocus={(e) => e.target.style.borderColor = cor.primary}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                <input type="text" name="cidade" value={form.cidade} onChange={handleChange} placeholder="Maputo"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" }}
                  className="w-full rounded-lg px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none transition"
                  onFocus={(e) => e.target.style.borderColor = cor.primary}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de pagamento</label>
                <select name="pagamento" value={form.pagamento} onChange={handleChange}
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151" }}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition">
                  <option value="">Selecione</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="E-Mola">E-Mola</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intenção de compra</label>
                <select name="intencao" value={form.intencao} onChange={handleChange}
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151" }}
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition">
                  <option value="">Selecione</option>
                  <option value="Comprar agora">Comprar agora</option>
                  <option value="Quero para amanhã">Quero para amanhã</option>
                  <option value="Quero agendar para a semana">Quero agendar para a semana</option>
                  <option value="Estou a avaliar">Estou a avaliar</option>
                </select>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full text-white font-semibold py-3.5 rounded-lg transition flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: cor.primary, opacity: submitting ? 0.6 : 1 }}>
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

        <div className="text-center pt-2">
          <p className="text-gray-300 text-xs">Powered by FunilApp</p>
        </div>
      </div>
    </div>
  );
}