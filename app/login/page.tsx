"use client";

import { useState, useEffect, useRef } from "react";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const jaRedirecionou = useRef(false);

  const redirectAfterLogin = () => {
    if (jaRedirecionou.current) return;
    jaRedirecionou.current = true;

    const redirect = sessionStorage.getItem("redirectAfterLogin");
    if (redirect) {
      sessionStorage.removeItem("redirectAfterLogin");
      window.location.href = redirect;
    } else {
      window.location.href = "/dashboard";
    }
  };

  const salvarUtilizador = async (user: {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }) => {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // ── Detectar retorno do redirect do Google ───────────────────────────────
  useEffect(() => {
    let cancelado = false;

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && !cancelado) {
          await salvarUtilizador(result.user);
          redirectAfterLogin();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (!msg.includes("popup-closed-by-user") && !cancelado) {
          setError("Erro ao entrar com Google. Tente novamente.");
        }
      }
    };

    checkRedirect();

    // Rede de segurança — cobre o caso do getRedirectResult não capturar a tempo
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (cancelado) return;

      if (user) {
        await salvarUtilizador(user);
        redirectAfterLogin();
      } else {
        setCheckingAuth(false);
      }
    });

    return () => {
      cancelado = true;
      unsub();
    };
  }, []);

  // ── Login com Google ─────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch {
      setError("Erro ao entrar com Google. Tente novamente.");
      setGoogleLoading(false);
    }
  };

  // ── Login / Registo com email e senha — sem verificação por agora ───────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await salvarUtilizador(result.user);
        redirectAfterLogin();
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await salvarUtilizador(result.user);
        redirectAfterLogin();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Email ou senha incorretos.");
      } else if (msg.includes("email-already-in-use")) {
        setError("Este email já está em uso.");
      } else if (msg.includes("weak-password")) {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-green-600 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FunilApp</span>
        </div>

        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-4">
            Vende mais.<br />Capta leads.<br />Cresce.
          </h1>
          <p className="text-green-100 text-base leading-relaxed mb-8">
            A plataforma de funis de vendas criada para empreendedores moçambicanos.
          </p>

          <div className="space-y-3">
            {[
              "Crie funis de vendas em minutos",
              "Capture leads automaticamente",
              "Receba contactos no WhatsApp",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <span className="text-green-50 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-green-200 text-xs">© 2026 FunilApp. Todos os direitos reservados.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-gray-900 font-bold text-xl tracking-tight">FunilApp</span>
          </div>

          <h2 className="text-gray-900 font-bold text-2xl mb-1">
            {mode === "register" ? "Criar conta" : "Bem-vindo de volta"}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {mode === "register" ? "Crie a sua conta gratuitamente" : "Entre na sua conta para continuar"}
          </p>

          {/* Botão Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium py-3 rounded-lg transition text-sm"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "A entrar..." : mode === "register" ? "Continuar com Google" : "Entrar com Google"}
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs font-medium">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Formulário email/senha */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                mode === "register" ? "Criar conta" : "Entrar"
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            {mode === "register" ? "Já tem conta?" : "Não tem conta?"}{" "}
            <button
              onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}
              className="text-green-600 hover:text-green-700 font-semibold transition"
            >
              {mode === "register" ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
