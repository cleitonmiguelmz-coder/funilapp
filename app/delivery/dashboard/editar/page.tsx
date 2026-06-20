"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

interface PerfilData {
  nome: string;
  telefone: string;
  cidade: string;
  tipo: string;
  bi: string;
  fotoUrl: string;
  precoBase: string;
  zonas: string;
}

const VERDE = "#1D9E75";
const VERDE_ESCURO = "#0F6E56";
const VERDE_CLARO = "#E1F5EE";
const VERDE_MEDIO = "#9FE1CB";

const zonasOpcoes = [
  "Matola", "KaMpfumo", "Polana", "Sommerschield", "Museu", "Alto-Maé", "Maxaquene",
];

const tiposEntrega = [
  { value: "moto", label: "Moto" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "peao", label: "Peão" },
];

export default function EditarPerfilPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilData>({
    nome: "", telefone: "", cidade: "", tipo: "", bi: "", fotoUrl: "", precoBase: "", zonas: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
      const d = snap.data();
      setPerfil({
        nome: d.nome ?? "",
        telefone: d.telefone ?? "",
        cidade: d.cidade ?? "",
        tipo: d.tipo ?? "",
        bi: d.bi ?? "",
        fotoUrl: d.fotoUrl ?? "",
        precoBase: d.precoBase ? String(d.precoBase) : "",
        zonas: d.zonas ?? "",
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPerfil((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setError("");

    if (!perfil.nome || !perfil.telefone || !perfil.cidade || !perfil.tipo || !perfil.bi) {
      setError("Preenche todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "deliveries", uid), {
        nome: perfil.nome,
        telefone: perfil.telefone,
        cidade: perfil.cidade,
        tipo: perfil.tipo,
        bi: perfil.bi,
        fotoUrl: perfil.fotoUrl,
        precoBase: perfil.precoBase ? Number(perfil.precoBase) : null,
        zonas: perfil.zonas,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#f4f9f7",
    border: `0.5px solid ${VERDE_CLARO}`,
    borderRadius: 10,
    padding: "11px 13px",
    fontSize: 13,
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 500,
    color: "#888780",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginBottom: 6,
  };

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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ backgroundColor: VERDE, padding: "16px 20px 28px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Link href="/delivery/dashboard" style={{
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
          <h1 style={{ color: "#fff", fontSize: 19, fontWeight: 500, letterSpacing: -0.4, margin: 0 }}>
            Editar perfil
          </h1>
          <p style={{ color: VERDE_MEDIO, fontSize: 13, margin: 0, marginTop: 3 }}>
            As alterações ficam visíveis imediatamente
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "16px 20px 48px" }}>
        <form onSubmit={handleSubmit}>

          {/* Dados pessoais */}
          <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Dados pessoais
          </p>
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: `0.5px solid ${VERDE_CLARO}`,
            padding: 16, marginBottom: 14,
          }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nome completo</label>
              <input type="text" name="nome" value={perfil.nome}
                onChange={handleChange} placeholder="O teu nome completo"
                style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Telefone / WhatsApp</label>
                <input type="text" name="telefone" value={perfil.telefone}
                  onChange={handleChange} placeholder="84 000 0000"
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Número do BI</label>
                <input type="text" name="bi" value={perfil.bi}
                  onChange={handleChange} placeholder="000000000"
                  style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Foto de perfil <span style={{ color: "#B4B2A9", fontWeight: 400 }}>(opcional)</span></label>
              <input type="url" name="fotoUrl" value={perfil.fotoUrl}
                onChange={handleChange} placeholder="https://..."
                style={inputStyle} />
            </div>
          </div>

          {/* Zona e transporte */}
          <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Zona e transporte
          </p>
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: `0.5px solid ${VERDE_CLARO}`,
            padding: 16, marginBottom: 14,
          }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Zona principal</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {zonasOpcoes.map((z) => (
                  <button key={z} type="button"
                    onClick={() => { setPerfil((prev) => ({ ...prev, cidade: z })); setSaved(false); }}
                    style={{
                      padding: "6px 13px", borderRadius: 20,
                      fontSize: 12, fontWeight: 500,
                      border: "none", cursor: "pointer",
                      backgroundColor: perfil.cidade === z ? VERDE : "#f4f9f7",
                      color: perfil.cidade === z ? "#fff" : "#5F5E5A",
                    }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tipo de transporte</label>
              <div style={{ display: "flex", gap: 8 }}>
                {tiposEntrega.map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => { setPerfil((prev) => ({ ...prev, tipo: t.value })); setSaved(false); }}
                    style={{
                      flex: 1, padding: "10px 0",
                      borderRadius: 10, fontSize: 13, fontWeight: 500,
                      border: `0.5px solid ${perfil.tipo === t.value ? VERDE : VERDE_CLARO}`,
                      cursor: "pointer",
                      backgroundColor: perfil.tipo === t.value ? VERDE : "#f4f9f7",
                      color: perfil.tipo === t.value ? "#fff" : "#5F5E5A",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Zonas de actuação <span style={{ color: "#B4B2A9", fontWeight: 400 }}>(opcional)</span></label>
              <input type="text" name="zonas" value={perfil.zonas}
                onChange={handleChange}
                placeholder="Ex: Matola, Polana, Museu"
                style={inputStyle} />
              <p style={{ fontSize: 11, color: "#B4B2A9", margin: 0, marginTop: 5 }}>
                Separa as zonas por vírgula
              </p>
            </div>

            <div>
              <label style={labelStyle}>Preço base (MT)</label>
              <input type="number" name="precoBase" value={perfil.precoBase}
                onChange={handleChange} placeholder="Ex: 150"
                style={inputStyle} />
            </div>
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

          {/* Sucesso */}
          {saved && (
            <div style={{
              backgroundColor: VERDE_CLARO, border: `0.5px solid ${VERDE_MEDIO}`,
              borderRadius: 10, padding: "10px 13px",
              fontSize: 13, color: VERDE_ESCURO, marginBottom: 14,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              ✓ Perfil actualizado com sucesso
            </div>
          )}

          {/* Botões */}
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/delivery/dashboard" style={{
              flex: 1, backgroundColor: "#f4f9f7",
              color: "#5F5E5A", border: `0.5px solid ${VERDE_CLARO}`,
              borderRadius: 10, padding: "12px 0",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              Cancelar
            </Link>
            <button type="submit" disabled={saving} style={{
              flex: 2, backgroundColor: VERDE,
              color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 0",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {saving ? (
                <div style={{
                  width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              ) : "Guardar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
