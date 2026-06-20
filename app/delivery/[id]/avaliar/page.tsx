"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useParams } from "next/navigation";

interface DeliveryData {
  nome: string;
  fotoUrl?: string;
  cidade: string;
  tipo: string;
  avaliacaoMedia?: number;
  totalEntregas?: number;
}

const VERDE = "#1D9E75";
const VERDE_ESCURO = "#0F6E56";
const VERDE_CLARO = "#E1F5EE";
const VERDE_MEDIO = "#9FE1CB";

export default function AvaliarPage() {
  const params = useParams();
  const id = params?.id as string;

  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [jaAvaliou, setJaAvaliou] = useState(false);
  const [error, setError] = useState("");

  const [estrelas, setEstrelas] = useState(0);
  const [hoverEstrela, setHoverEstrela] = useState(0);
  const [comentario, setComentario] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchDelivery();
  }, [id]);

  const fetchDelivery = async () => {
    try {
      const snap = await getDoc(doc(db, "deliveries", id));
      if (!snap.exists()) { setLoading(false); return; }
      setDelivery(snap.data() as DeliveryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verificarTelefone = async (tel: string): Promise<boolean> => {
    const q = query(
      collection(db, "deliveries", id, "avaliacoes"),
      where("telefone", "==", tel.replace(/\D/g, ""))
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (estrelas === 0) { setError("Escolhe uma classificação de 1 a 5 estrelas."); return; }
    if (!nomeCliente.trim()) { setError("Indica o teu nome."); return; }
    if (!telefone.trim() || telefone.replace(/\D/g, "").length < 9) {
      setError("Indica um número de telefone válido."); return;
    }
    if (!comentario.trim() || comentario.length < 10) {
      setError("Escreve um comentário com pelo menos 10 caracteres."); return;
    }

    setSubmitting(true);
    try {
      const telLimpo = telefone.replace(/\D/g, "");
      const jaAvaliouAntes = await verificarTelefone(telLimpo);

      if (jaAvaliouAntes) {
        setJaAvaliou(true);
        setSubmitting(false);
        return;
      }

      // Guardar avaliação
      await addDoc(collection(db, "deliveries", id, "avaliacoes"), {
        nomeCliente: nomeCliente.trim(),
        telefone: telLimpo,
        estrelas,
        comentario: comentario.trim(),
        criadoEm: new Date(),
      });

      // Actualizar média e total no documento principal
      const snap = await getDoc(doc(db, "deliveries", id));
      if (snap.exists()) {
        const data = snap.data();
        const totalAntigo = data.totalAvaliacoes ?? 0;
        const mediaAntiga = data.avaliacaoMedia ?? 0;
        const novoTotal = totalAntigo + 1;
        const novaMedia = ((mediaAntiga * totalAntigo) + estrelas) / novoTotal;

        await updateDoc(doc(db, "deliveries", id), {
          avaliacaoMedia: Math.round(novaMedia * 10) / 10,
          totalAvaliacoes: novoTotal,
        });
      }

      setDone(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar avaliação. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const iniciais = (nome: string) =>
    nome.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("");

  const tipoLabel = (tipo: string) =>
    tipo === "moto" ? "Moto" : tipo === "bicicleta" ? "Bicicleta" : "Peão";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 28, height: 28,
          border: `2.5px solid ${VERDE}`,
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!delivery) {
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
      <div style={{ backgroundColor: VERDE, padding: "16px 20px 32px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Link href={`/delivery/${id}`} style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 12, fontWeight: 500,
              padding: "6px 12px", borderRadius: 20,
              textDecoration: "none",
            }}>
              ← Voltar
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                backgroundColor: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={VERDE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 500, fontSize: 14, lineHeight: 1, margin: 0 }}>FunilApp</p>
                <p style={{ color: VERDE_MEDIO, fontSize: 10, margin: 0, marginTop: 1 }}>Delivery</p>
              </div>
            </div>
          </div>

          {/* Info do entregador */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {delivery.fotoUrl ? (
              <img src={delivery.fotoUrl} alt={delivery.nome} style={{
                width: 50, height: 50, borderRadius: "50%", objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.4)",
              }} />
            ) : (
              <div style={{
                width: 50, height: 50, borderRadius: "50%",
                backgroundColor: "#fff", color: VERDE,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 500,
                border: "2px solid rgba(255,255,255,0.4)",
              }}>
                {iniciais(delivery.nome)}
              </div>
            )}
            <div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 500, margin: 0 }}>{delivery.nome}</p>
              <p style={{ color: VERDE_MEDIO, fontSize: 12, margin: 0, marginTop: 2 }}>
                {delivery.cidade} · {tipoLabel(delivery.tipo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 20px 48px" }}>

        {/* Avaliação enviada com sucesso */}
        {done && (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: `0.5px solid ${VERDE_CLARO}`,
            padding: 32, textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              backgroundColor: VERDE_CLARO,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke={VERDE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: 0, marginBottom: 6 }}>
              Obrigado pela avaliação!
            </p>
            <p style={{ fontSize: 13, color: "#888780", margin: 0, marginBottom: 20 }}>
              A tua opinião ajuda outros clientes a escolher melhor.
            </p>
            <Link href={`/delivery/${id}`} style={{
              backgroundColor: VERDE, color: "#fff",
              padding: "11px 24px", borderRadius: 10,
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              display: "inline-block",
            }}>
              Ver perfil do entregador
            </Link>
          </div>
        )}

        {/* Já avaliou */}
        {jaAvaliou && !done && (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: `0.5px solid ${VERDE_CLARO}`,
            padding: 32, textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              backgroundColor: VERDE_CLARO,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke={VERDE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: 0, marginBottom: 6 }}>
              Já avaliaste este entregador
            </p>
            <p style={{ fontSize: 13, color: "#888780", margin: 0, marginBottom: 20 }}>
              O teu número de telefone já foi usado para avaliar {delivery.nome}.
            </p>
            <Link href={`/delivery/${id}`} style={{
              backgroundColor: VERDE, color: "#fff",
              padding: "11px 24px", borderRadius: 10,
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              display: "inline-block",
            }}>
              Ver perfil
            </Link>
          </div>
        )}

        {/* Formulário */}
        {!done && !jaAvaliou && (
          <form onSubmit={handleSubmit}>

            {/* Estrelas */}
            <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
              Classificação
            </p>
            <div style={{
              backgroundColor: "#fff", borderRadius: 16,
              border: `0.5px solid ${VERDE_CLARO}`,
              padding: 20, marginBottom: 14, textAlign: "center",
            }}>
              <p style={{ fontSize: 13, color: "#888780", margin: 0, marginBottom: 14 }}>
                Como foi a tua experiência com {delivery.nome}?
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverEstrela(i)}
                    onMouseLeave={() => setHoverEstrela(0)}
                    onClick={() => setEstrelas(i)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24"
                      fill={i <= (hoverEstrela || estrelas) ? VERDE : VERDE_CLARO}
                      style={{ transition: "fill 0.1s" }}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  </button>
                ))}
              </div>
              {estrelas > 0 && (
                <p style={{ fontSize: 13, color: VERDE_ESCURO, fontWeight: 500, margin: 0 }}>
                  {estrelas === 1 ? "Muito mau" : estrelas === 2 ? "Mau" : estrelas === 3 ? "Razoável" : estrelas === 4 ? "Bom" : "Excelente"}
                </p>
              )}
            </div>

            {/* Dados do cliente */}
            <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
              Os teus dados
            </p>
            <div style={{
              backgroundColor: "#fff", borderRadius: 16,
              border: `0.5px solid ${VERDE_CLARO}`,
              padding: 16, marginBottom: 14,
            }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{
                  display: "block", fontSize: 10, fontWeight: 500,
                  color: "#888780", letterSpacing: "0.07em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  O teu nome
                </label>
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Como te chamas?"
                  style={{
                    width: "100%", backgroundColor: "#f4f9f7",
                    border: `0.5px solid ${VERDE_CLARO}`,
                    borderRadius: 10, padding: "11px 13px",
                    fontSize: 13, color: "#1a1a1a",
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: "block", fontSize: 10, fontWeight: 500,
                  color: "#888780", letterSpacing: "0.07em",
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="84 000 0000"
                  style={{
                    width: "100%", backgroundColor: "#f4f9f7",
                    border: `0.5px solid ${VERDE_CLARO}`,
                    borderRadius: 10, padding: "11px 13px",
                    fontSize: 13, color: "#1a1a1a",
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <p style={{ fontSize: 11, color: "#B4B2A9", margin: 0, marginTop: 5 }}>
                  O teu número garante que cada pessoa avalia uma vez
                </p>
              </div>
            </div>

            {/* Comentário */}
            <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
              Comentário
            </p>
            <div style={{
              backgroundColor: "#fff", borderRadius: 16,
              border: `0.5px solid ${VERDE_CLARO}`,
              padding: 16, marginBottom: 14,
            }}>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Conta como foi a entrega — pontualidade, cuidado com os produtos, comunicação..."
                rows={4}
                style={{
                  width: "100%", backgroundColor: "#f4f9f7",
                  border: `0.5px solid ${VERDE_CLARO}`,
                  borderRadius: 10, padding: "11px 13px",
                  fontSize: 13, color: "#1a1a1a",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit", resize: "none", lineHeight: 1.6,
                }}
              />
              <p style={{ fontSize: 11, color: "#B4B2A9", margin: 0, marginTop: 5, textAlign: "right" }}>
                {comentario.length} caracteres
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                backgroundColor: "#FCEBEB", border: "0.5px solid #F09595",
                borderRadius: 10, padding: "10px 13px",
                fontSize: 13, color: "#A32D2D", marginBottom: 14,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              width: "100%", backgroundColor: VERDE,
              color: "#fff", border: "none",
              borderRadius: 12, padding: "13px 0",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {submitting ? (
                <div style={{
                  width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : "Enviar avaliação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
