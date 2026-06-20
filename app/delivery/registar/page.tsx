"use client";

import { useState, useEffect, useRef } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import Link from "next/link";

const zonas = [
  "Matola", "KaMpfumo", "Polana", "Sommerschield", "Museu", "Alto-Maé", "Maxaquene",
];

const tiposEntrega = [
  { value: "moto", label: "Moto" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "peao", label: "Peão" },
];

const VERDE = "#1D9E75";
const VERDE_ESCURO = "#0F6E56";
const VERDE_CLARO = "#E1F5EE";
const VERDE_MEDIO = "#9FE1CB";

interface UploadState {
  file: File | null;
  preview: string | null;
  progress: number;
  uploading: boolean;
  url: string | null;
  error: string;
}

const emptyUpload: UploadState = {
  file: null, preview: null, progress: 0,
  uploading: false, url: null, error: "",
};

export default function DeliveryRegistarPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [uid, setUid] = useState<string | null>(null);

  const [conta, setConta] = useState({ email: "", password: "" });
  const [perfil, setPerfil] = useState({
    nome: "", telefone: "", cidade: "", tipo: "", bi: "", precoBase: "",
  });

  const [fotoPerfil, setFotoPerfil] = useState<UploadState>(emptyUpload);
  const [fotoBI, setFotoBI] = useState<UploadState>(emptyUpload);

  const fotoPerfilRef = useRef<HTMLInputElement>(null);
  const fotoBIRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "deliveries", user.uid));
        if (snap.exists()) {
          window.location.href = "/delivery/dashboard";
          return;
        }
        setUid(user.uid);
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const handleContaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConta((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerfil((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setter((prev) => ({ ...prev, error: "Apenas imagens são aceites (JPG, PNG)." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setter((prev) => ({ ...prev, error: "O ficheiro não pode ter mais de 5MB." }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setter({ file, preview, progress: 0, uploading: false, url: null, error: "" });
  };

  const uploadFicheiro = (
    file: File,
    caminho: string,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, caminho);
      const task = uploadBytesResumable(storageRef, file);
      setter((prev) => ({ ...prev, uploading: true, progress: 0 }));
      task.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setter((prev) => ({ ...prev, progress }));
        },
        (err) => {
          setter((prev) => ({ ...prev, uploading: false, error: "Erro no upload. Tenta novamente." }));
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setter((prev) => ({ ...prev, uploading: false, url, progress: 100 }));
          resolve(url);
        }
      );
    });
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!conta.email || !conta.password) { setError("Preenche todos os campos."); return; }
    if (conta.password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, conta.email, conta.password);
      setUid(userCred.user.uid);
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err) {
        const code = (err as { code: string }).code;
        if (code === "auth/email-already-in-use") {
          setError("Este email já está registado. Vai para o login.");
        } else {
          setError("Erro ao criar conta. Tenta novamente.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!perfil.nome || !perfil.telefone || !perfil.cidade || !perfil.tipo || !perfil.bi) {
      setError("Preenche todos os campos obrigatórios.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fotoBI.file) { setError("A foto do documento de identificação é obrigatória."); return; }
    if (!uid) { setError("Sessão inválida. Recarrega a página."); return; }
    setLoading(true);
    try {
      let fotoPerfilUrl = "";
      let fotoBIUrl = "";
      if (fotoPerfil.file) {
        fotoPerfilUrl = await uploadFicheiro(fotoPerfil.file, `deliveries/${uid}/foto-perfil`, setFotoPerfil);
      }
      fotoBIUrl = await uploadFicheiro(fotoBI.file, `deliveries/${uid}/documento-bi`, setFotoBI);

      const agora = new Date();
      const trialFim = new Date(agora);
      trialFim.setDate(trialFim.getDate() + 3);

      await setDoc(doc(db, "deliveries", uid), {
        ...perfil,
        precoBase: perfil.precoBase ? Number(perfil.precoBase) : null,
        fotoUrl: fotoPerfilUrl || "",
        fotoBIUrl,
        email: conta.email,
        userId: uid,
        status: "trial",
        trialInicio: serverTimestamp(),
        trialFim: Timestamp.fromDate(trialFim),
        ultimoPagamento: null,
        proximoPagamento: null,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "users", uid), {
        email: conta.email,
        nome: perfil.nome,
        telefone: perfil.telefone,
        plano: "gratuito",
        tipo: "delivery",
        createdAt: serverTimestamp(),
      });

      window.location.href = "/delivery/dashboard?novo=1";
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar o perfil. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", backgroundColor: "#f4f9f7",
    border: `0.5px solid ${VERDE_CLARO}`, borderRadius: 10,
    padding: "11px 13px", fontSize: 13, color: "#1a1a1a",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 500,
    color: "#888780", letterSpacing: "0.07em",
    textTransform: "uppercase", marginBottom: 6,
  };

  const UploadBox = ({
    label, obrigatorio, state, setter, inputRef, dica,
  }: {
    label: string; obrigatorio: boolean;
    state: UploadState; setter: React.Dispatch<React.SetStateAction<UploadState>>;
    inputRef: React.RefObject<HTMLInputElement>; dica: string;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}{" "}
        {!obrigatorio && <span style={{ color: "#B4B2A9", fontWeight: 400 }}>(opcional)</span>}
      </label>
      <input
        ref={inputRef} type="file" accept="image/*" capture="environment"
        onChange={(e) => handleFileSelect(e, setter)}
        style={{ display: "none" }}
      />
      {!state.preview ? (
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ width: "100%", backgroundColor: "#f4f9f7", border: `0.5px dashed ${VERDE_MEDIO}`, borderRadius: 12, padding: "20px 16px", cursor: "pointer", textAlign: "center", boxSizing: "border-box" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <p style={{ fontSize: 13, fontWeight: 500, color: VERDE_ESCURO, margin: 0, marginBottom: 3 }}>
            Tirar foto ou escolher da galeria
          </p>
          <p style={{ fontSize: 11, color: "#B4B2A9", margin: 0 }}>{dica}</p>
        </button>
      ) : (
        <div style={{ position: "relative" }}>
          <img src={state.preview} alt={label}
            style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, border: `0.5px solid ${VERDE_CLARO}`, display: "block" }} />
          {state.uploading && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "0 0 12px 12px", padding: "8px 12px" }}>
              <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", backgroundColor: "#fff", width: `${state.progress}%`, transition: "width 0.2s", borderRadius: 2 }} />
              </div>
              <p style={{ color: "#fff", fontSize: 11, margin: 0, marginTop: 4 }}>{state.progress}% enviado</p>
            </div>
          )}
          <button type="button"
            onClick={() => { setter(emptyUpload); if (inputRef.current) inputRef.current.value = ""; }}
            style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
            Trocar
          </button>
          {state.url && (
            <div style={{ position: "absolute", top: 8, left: 8, backgroundColor: VERDE, color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 11 }}>
              ✓ Enviado
            </div>
          )}
        </div>
      )}
      {state.error && <p style={{ fontSize: 11, color: "#A32D2D", margin: 0, marginTop: 5 }}>{state.error}</p>}
    </div>
  );

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: `2.5px solid ${VERDE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ backgroundColor: VERDE, padding: "20px 20px 32px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <Link href="/delivery" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 20, textDecoration: "none" }}>
              ← Voltar
            </Link>
          </div>

          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 500, letterSpacing: -0.4, marginBottom: 4 }}>
            Junta-te como entregador
          </h1>
          <p style={{ color: VERDE_MEDIO, fontSize: 13, margin: 0 }}>
            Passo {step} de 3 —{" "}
            {step === 1 ? "Criar conta" : step === 2 ? "O teu perfil" : "Documentos e foto"}
          </p>

          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: step >= s ? "#fff" : "rgba(255,255,255,0.3)", transition: "background-color 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 48px" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: `0.5px solid ${VERDE_CLARO}`, padding: 20 }}>

          {/* Passo 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" name="email" value={conta.email} onChange={handleContaChange} placeholder="seuemail@gmail.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Senha</label>
                <input type="password" name="password" value={conta.password} onChange={handleContaChange} placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              {error && <div style={{ backgroundColor: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: "100%", backgroundColor: VERDE, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {loading ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : "Continuar →"}
              </button>
            </form>
          )}

          {/* Passo 2 */}
          {step === 2 && (
            <form onSubmit={handleStep2}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nome completo</label>
                <input type="text" name="nome" value={perfil.nome} onChange={handlePerfilChange} placeholder="O teu nome completo" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Telefone / WhatsApp</label>
                  <input type="text" name="telefone" value={perfil.telefone} onChange={handlePerfilChange} placeholder="84 000 0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Número do BI</label>
                  <input type="text" name="bi" value={perfil.bi} onChange={handlePerfilChange} placeholder="000000000" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Zona de actuação</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {zonas.map((z) => (
                    <button key={z} type="button" onClick={() => setPerfil((prev) => ({ ...prev, cidade: z }))}
                      style={{ padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", backgroundColor: perfil.cidade === z ? VERDE : "#f4f9f7", color: perfil.cidade === z ? "#fff" : "#5F5E5A" }}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Tipo de transporte</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {tiposEntrega.map((t) => (
                    <button key={t.value} type="button" onClick={() => setPerfil((prev) => ({ ...prev, tipo: t.value }))}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 500, border: `0.5px solid ${perfil.tipo === t.value ? VERDE : VERDE_CLARO}`, cursor: "pointer", backgroundColor: perfil.tipo === t.value ? VERDE : "#f4f9f7", color: perfil.tipo === t.value ? "#fff" : "#5F5E5A" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Preço base (MT)</label>
                <input type="number" name="precoBase" value={perfil.precoBase} onChange={handlePerfilChange} placeholder="Ex: 150" style={inputStyle} />
              </div>
              {error && <div style={{ backgroundColor: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, backgroundColor: "#f4f9f7", color: "#5F5E5A", border: `0.5px solid ${VERDE_CLARO}`, borderRadius: 10, padding: "12px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Voltar</button>
                <button type="submit" style={{ flex: 2, backgroundColor: VERDE, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Continuar →</button>
              </div>
            </form>
          )}

          {/* Passo 3 */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <UploadBox
                label="Foto de perfil" obrigatorio={false}
                state={fotoPerfil} setter={setFotoPerfil}
                inputRef={fotoPerfilRef}
                dica="A tua foto de rosto · JPG ou PNG · máx. 5MB"
              />
              <UploadBox
                label="Documento de identificação (BI)" obrigatorio={true}
                state={fotoBI} setter={setFotoBI}
                inputRef={fotoBIRef}
                dica="Foto do teu BI — frente e rosto visível · JPG ou PNG · máx. 5MB"
              />
              <div style={{ backgroundColor: VERDE_CLARO, border: `0.5px solid ${VERDE_MEDIO}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: VERDE_ESCURO, margin: 0, marginBottom: 3 }}>3 dias de teste grátis</p>
                <p style={{ fontSize: 12, color: "#0F6E56", margin: 0 }}>Após o período gratuito, o acesso custa 999 MT/mês.</p>
              </div>
              {error && <div style={{ backgroundColor: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 13px", fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setStep(2)} style={{ flex: 1, backgroundColor: "#f4f9f7", color: "#5F5E5A", border: `0.5px solid ${VERDE_CLARO}`, borderRadius: 10, padding: "12px 0", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Voltar</button>
                <button type="submit" disabled={loading || fotoPerfil.uploading || fotoBI.uploading}
                  style={{ flex: 2, backgroundColor: VERDE, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: loading || fotoPerfil.uploading || fotoBI.uploading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {loading || fotoPerfil.uploading || fotoBI.uploading
                    ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    : "Registar"}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: "center", fontSize: 12, color: "#888780", marginTop: 16 }}>
            Já tens conta?{" "}
            <Link href="/login" style={{ color: VERDE, fontWeight: 500, textDecoration: "none" }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
