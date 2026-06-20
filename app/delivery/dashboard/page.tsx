"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

interface DeliveryData {
  nome: string;
  telefone: string;
  cidade: string;
  tipo: string;
  bi: string;
  fotoUrl?: string;
  status: string;
  trialFim?: Timestamp;
  online?: boolean;
  precoBase?: number;
  avaliacaoMedia?: number;
  totalEntregas?: number;
  zonas?: string;
  email?: string;
}

const VERDE = "#1D9E75";
const VERDE_ESCURO = "#0F6E56";
const VERDE_CLARO = "#E1F5EE";
const VERDE_MEDIO = "#9FE1CB";

export default function DeliveryDashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [data, setData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUid(user.uid);
      const snap = await getDoc(doc(db, "deliveries", user.uid));
      if (!snap.exists()) {
        window.location.href = "/delivery/registar";
        return;
      }
      setData(snap.data() as DeliveryData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleOnline = async () => {
    if (!uid || !data) return;
    setTogglingOnline(true);
    try {
      const novoEstado = !data.online;
      await updateDoc(doc(db, "deliveries", uid), { online: novoEstado });
      setData((prev) => prev ? { ...prev, online: novoEstado } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingOnline(false);
    }
  };

  const diasRestantes = (): number | null => {
    if (!data?.trialFim) return null;
    const diff = data.trialFim.toDate().getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const iniciais = (nome: string) =>
    nome.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("");

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

  if (!data) return null;

  const dias = diasRestantes();
  const isTrial = data.status === "trial";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ backgroundColor: VERDE, padding: "16px 20px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                backgroundColor: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={VERDE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 500, fontSize: 15, lineHeight: 1, margin: 0 }}>FunilApp</p>
                <p style={{ color: VERDE_MEDIO, fontSize: 11, margin: 0, marginTop: 2 }}>Delivery</p>
              </div>
            </div>
            <Link href="/delivery" style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 12, fontWeight: 500,
              padding: "6px 12px", borderRadius: 20,
              textDecoration: "none",
            }}>
              Ver lista pública
            </Link>
          </div>

          {/* Toggle online/offline */}
          <button
            onClick={toggleOnline}
            disabled={togglingOnline}
            style={{
              width: "100%",
              backgroundColor: "#fff",
              border: "none", borderRadius: 12,
              padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", opacity: togglingOnline ? 0.7 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                backgroundColor: data.online ? VERDE : "#D3D1C7",
              }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
                  {data.online ? "Estou disponível" : "Estou offline"}
                </p>
                <p style={{ fontSize: 11, color: "#888780", margin: 0, marginTop: 2 }}>
                  {data.online ? "Visível para os clientes" : "Toca para ficar disponível"}
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <div style={{
              width: 42, height: 24, borderRadius: 12,
              backgroundColor: data.online ? VERDE : "#D3D1C7",
              display: "flex", alignItems: "center",
              padding: "0 3px",
              justifyContent: data.online ? "flex-end" : "flex-start",
              transition: "all 0.2s",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                backgroundColor: "#fff",
              }} />
            </div>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 48px" }}>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { val: data.totalEntregas ?? 0, label: "Entregas" },
            { val: data.avaliacaoMedia ? data.avaliacaoMedia.toFixed(1) : "—", label: "Avaliação" },
            { val: data.precoBase ? `${data.precoBase} MT` : "—", label: "Preço base" },
          ].map((m) => (
            <div key={m.label} style={{
              backgroundColor: "#fff", borderRadius: 12,
              padding: "12px 10px", textAlign: "center",
              border: `0.5px solid ${VERDE_CLARO}`,
            }}>
              <p style={{ fontSize: 20, fontWeight: 500, color: VERDE, margin: 0 }}>{m.val}</p>
              <p style={{ fontSize: 10, color: "#888780", margin: 0, marginTop: 3 }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Perfil */}
        <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
          O teu perfil
        </p>
        <div style={{
          backgroundColor: "#fff", borderRadius: 16,
          border: `0.5px solid ${VERDE_CLARO}`,
          padding: 16, marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {data.fotoUrl ? (
              <img src={data.fotoUrl} alt={data.nome}
                style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 50, height: 50, borderRadius: "50%",
                backgroundColor: VERDE_CLARO, color: VERDE_ESCURO,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 500, flexShrink: 0,
              }}>
                {iniciais(data.nome)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a", margin: 0 }}>{data.nome}</p>
              <p style={{ fontSize: 12, color: "#888780", margin: 0, marginTop: 2 }}>
                {data.tipo === "moto" ? "Moto" : data.tipo === "bicicleta" ? "Bicicleta" : "Peão"} · {data.cidade}
              </p>
              {data.avaliacaoMedia && data.avaliacaoMedia > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 3 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} width="11" height="11" viewBox="0 0 24 24"
                      fill={i <= Math.round(data.avaliacaoMedia ?? 0) ? VERDE : VERDE_CLARO}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                  <span style={{ fontSize: 11, color: "#888780", marginLeft: 3 }}>
                    {data.avaliacaoMedia.toFixed(1)} · {data.totalEntregas} entregas
                  </span>
                </div>
              )}
            </div>
            <Link href="/delivery/dashboard/editar" style={{
              backgroundColor: VERDE_CLARO, color: VERDE_ESCURO,
              fontSize: 12, fontWeight: 500,
              padding: "6px 12px", borderRadius: 8,
              textDecoration: "none",
            }}>
              Editar
            </Link>
          </div>

          {/* Info rows */}
          {[
            { label: "Telefone", val: data.telefone },
            { label: "BI", val: data.bi },
            { label: "Zona", val: data.cidade },
            { label: "Email", val: data.email ?? "—" },
          ].map((row, i) => (
            <div key={row.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 0",
              borderTop: i === 0 ? `0.5px solid ${VERDE_CLARO}` : `0.5px solid ${VERDE_CLARO}`,
            }}>
              <span style={{ fontSize: 12, color: "#888780" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Trial card */}
        {isTrial && dias !== null && (
          <>
            <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
              Estado da conta
            </p>
            <div style={{
              backgroundColor: VERDE_CLARO,
              border: `0.5px solid ${VERDE_MEDIO}`,
              borderRadius: 14, padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: VERDE_ESCURO, margin: 0 }}>Período de teste</p>
                  <p style={{ fontSize: 12, color: "#0F6E56", margin: 0, marginTop: 2 }}>
                    {dias > 0 ? `${dias} dia${dias !== 1 ? "s" : ""} restante${dias !== 1 ? "s" : ""}` : "Expira hoje"}
                  </p>
                </div>
                <p style={{ fontSize: 28, fontWeight: 500, color: VERDE, margin: 0 }}>{dias}</p>
              </div>
              <button style={{
                width: "100%", backgroundColor: VERDE,
                color: "#fff", border: "none", borderRadius: 10,
                padding: "12px 0", fontSize: 13, fontWeight: 500,
                cursor: "pointer",
              }}>
                Activar conta completa
              </button>
            </div>
          </>
        )}

        {/* Conta activa */}
        {data.status === "activo" && (
          <>
            <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
              Estado da conta
            </p>
            <div style={{
              backgroundColor: VERDE_CLARO,
              border: `0.5px solid ${VERDE_MEDIO}`,
              borderRadius: 14, padding: 16,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                backgroundColor: VERDE, flexShrink: 0,
              }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: VERDE_ESCURO, margin: 0 }}>
                Conta activa
              </p>
            </div>
          </>
        )}

        {/* Logout */}
        <button
          onClick={() => { auth.signOut(); window.location.href = "/delivery"; }}
          style={{
            width: "100%", backgroundColor: "transparent",
            color: "#888780", border: `0.5px solid #D3D1C7`,
            borderRadius: 10, padding: "11px 0",
            fontSize: 13, cursor: "pointer", marginTop: 14,
          }}
        >
          Terminar sessão
        </button>
      </div>
    </div>
  );
}
