"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";

interface DeliveryData {
  nome: string;
  telefone: string;
  cidade: string;
  tipo: string;
  fotoUrl?: string;
  status: string;
  online?: boolean;
  precoBase?: number;
  avaliacaoMedia?: number;
  totalAvaliacoes?: number;
  totalEntregas?: number;
  zonas?: string;
}

interface Avaliacao {
  id: string;
  nomeCliente: string;
  estrelas: number;
  comentario: string;
  criadoEm: Timestamp;
}

const VERDE = "#1D9E75";
const VERDE_ESCURO = "#0F6E56";
const VERDE_CLARO = "#E1F5EE";
const VERDE_MEDIO = "#9FE1CB";

export default function PerfilPublicoPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<DeliveryData | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPerfil();
  }, [id]);

  const fetchPerfil = async () => {
    try {
      const snap = await getDoc(doc(db, "deliveries", id));
      if (!snap.exists()) { setLoading(false); return; }
      setData(snap.data() as DeliveryData);

      try {
        const avalSnap = await getDocs(
          query(collection(db, "deliveries", id, "avaliacoes"), orderBy("criadoEm", "desc"))
        );
        const avals: Avaliacao[] = avalSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Avaliacao));
        setAvaliacoes(avals);
      } catch {
        // sem avaliacoes ainda
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const iniciais = (nome: string) =>
    nome.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("");

  const tipoLabel = (tipo: string) =>
    tipo === "moto" ? "Moto" : tipo === "bicicleta" ? "Bicicleta" : "Peão";

  const tempoDesde = (ts?: Timestamp) => {
    if (!ts) return "";
    const diff = new Date().getTime() - ts.toDate().getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (dias === 0) return "hoje";
    if (dias === 1) return "ontem";
    if (dias < 7) return `há ${dias} dias`;
    if (dias < 30) return `há ${Math.floor(dias / 7)} semana${Math.floor(dias / 7) !== 1 ? "s" : ""}`;
    return `há ${Math.floor(dias / 30)} mês${Math.floor(dias / 30) !== 1 ? "es" : ""}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: `2.5px solid ${VERDE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <p style={{ fontWeight: 500, color: "#1a1a1a" }}>Entregador não encontrado</p>
        <Link href="/delivery" style={{ color: VERDE, fontSize: 13 }}>← Voltar à lista</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ backgroundColor: VERDE, padding: "16px 20px 40px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Link href="/delivery" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 20, textDecoration: "none" }}>
              ← Voltar
            </Link>
            <button
              onClick={() => { if (navigator.share) { navigator.share({ title: data.nome, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }}
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer" }}
            >
              Partilhar
            </button>
          </div>

          <div style={{ textAlign: "center" }}>
            {data.fotoUrl ? (
              <img src={data.fotoUrl} alt={data.nome} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.4)", margin: "0 auto 10px", display: "block" }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: "50%", backgroundColor: "#fff", color: VERDE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 500, border: "3px solid rgba(255,255,255,0.4)", margin: "0 auto 10px" }}>
                {iniciais(data.nome)}
              </div>
            )}
            <p style={{ color: "#fff", fontSize: 19, fontWeight: 500, letterSpacing: -0.4, margin: 0 }}>{data.nome}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6 }}>
              <span style={{ color: VERDE_MEDIO, fontSize: 12 }}>{data.cidade}</span>
              <span style={{ color: VERDE_MEDIO, fontSize: 12 }}>·</span>
              <span style={{ color: VERDE_MEDIO, fontSize: 12 }}>{tipoLabel(data.tipo)}</span>
              {!data.avaliacaoMedia && (
                <span style={{ backgroundColor: "#fff", color: VERDE, fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20 }}>Novo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 48px" }}>

        {/* Card métricas */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: `0.5px solid ${VERDE_CLARO}`, padding: 16, marginTop: -20, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { val: data.totalEntregas ?? 0, label: "Entregas" },
              { val: data.avaliacaoMedia ? data.avaliacaoMedia.toFixed(1) : "—", label: "Avaliação" },
              { val: data.precoBase ? `${data.precoBase} MT` : "—", label: "Preço base" },
            ].map((m, i) => (
              <div key={m.label} style={{ textAlign: "center", padding: "8px 4px", borderRight: i < 2 ? `0.5px solid ${VERDE_CLARO}` : "none" }}>
                <p style={{ fontSize: 18, fontWeight: 500, color: VERDE, margin: 0 }}>{m.val}</p>
                <p style={{ fontSize: 10, color: "#888780", margin: 0, marginTop: 2 }}>{m.label}</p>
              </div>
            ))}
          </div>
          {data.avaliacaoMedia && data.avaliacaoMedia > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${VERDE_CLARO}` }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i <= Math.round(data.avaliacaoMedia ?? 0) ? VERDE : VERDE_CLARO}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
              <span style={{ fontSize: 12, color: "#888780", marginLeft: 4 }}>
                {data.avaliacaoMedia.toFixed(1)} de 5 · {data.totalAvaliacoes ?? 0} avaliações
              </span>
            </div>
          )}
        </div>

        {/* Informações */}
        <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Informações</p>
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: `0.5px solid ${VERDE_CLARO}`, padding: "0 16px", marginBottom: 14 }}>
          {[
            { label: "Disponibilidade", val: data.online ? "Disponível agora" : "Offline", dot: true, online: data.online },
            { label: "Zona de actuação", val: data.zonas ?? data.cidade },
            { label: "Tipo de entrega", val: tipoLabel(data.tipo) },
            { label: "Preço base", val: data.precoBase ? `${data.precoBase} MT / entrega` : "A combinar", green: true },
          ].map((row, i) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 3 ? `0.5px solid ${VERDE_CLARO}` : "none" }}>
              <span style={{ fontSize: 12, color: "#888780" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: row.green ? VERDE : "#1a1a1a", display: "flex", alignItems: "center", gap: 5 }}>
                {row.dot && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: row.online ? VERDE : "#D3D1C7" }} />}
                {row.val}
              </span>
            </div>
          ))}
        </div>

        {/* Avaliações */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>
            Avaliações {avaliacoes.length > 0 && `(${avaliacoes.length})`}
          </p>
          <Link href={`/delivery/${id}/avaliar`} style={{ backgroundColor: VERDE_CLARO, color: VERDE_ESCURO, fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 20, textDecoration: "none" }}>
            + Avaliar
          </Link>
        </div>

        {avaliacoes.length === 0 ? (
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: `0.5px solid ${VERDE_CLARO}`, padding: "24px 16px", textAlign: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: "#888780", margin: 0, marginBottom: 10 }}>Ainda não há avaliações. Sê o primeiro!</p>
            <Link href={`/delivery/${id}/avaliar`} style={{ backgroundColor: VERDE, color: "#fff", fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}>
              Avaliar {data.nome.split(" ")[0]}
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: `0.5px solid ${VERDE_CLARO}`, padding: "0 16px", marginBottom: 14 }}>
            {avaliacoes.slice(0, 5).map((a, i) => (
              <div key={a.id} style={{ padding: "12px 0", borderBottom: i < Math.min(avaliacoes.length, 5) - 1 ? `0.5px solid ${VERDE_CLARO}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{a.nomeCliente}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= a.estrelas ? VERDE : VERDE_CLARO}>
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#5F5E5A", margin: 0, lineHeight: 1.6 }}>{a.comentario}</p>
                <p style={{ fontSize: 10, color: "#B4B2A9", margin: 0, marginTop: 4 }}>{tempoDesde(a.criadoEm)}</p>
              </div>
            ))}
            {avaliacoes.length > 5 && (
              <div style={{ padding: "12px 0", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "#888780", margin: 0 }}>+ {avaliacoes.length - 5} avaliações anteriores</p>
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <a
          href={`https://wa.me/258${data.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá *${data.nome}*! Vi o teu perfil no FunilApp Delivery e preciso de uma entrega.`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ width: "100%", backgroundColor: VERDE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px 0", borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 8, boxSizing: "border-box" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L.057 23.882l6.187-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.879.936-3.629-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
          </svg>
          Contactar via WhatsApp
        </a>

        <button
          onClick={() => setGuardado(!guardado)}
          style={{ width: "100%", backgroundColor: guardado ? VERDE_CLARO : "#fff", color: guardado ? VERDE_ESCURO : "#5F5E5A", border: `0.5px solid ${guardado ? VERDE_MEDIO : "#D3D1C7"}`, borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {guardado ? "✓ Guardado" : "Guardar entregador"}
        </button>
      </div>
    </div>
  );
}
