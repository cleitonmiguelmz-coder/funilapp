"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Plan {
  name: string;
  price: string;
  features: string[];
  current: boolean;
  highlight: boolean;
}

const plans: Plan[] = [
  {
    name: "Gratuito",
    price: "0 MT",
    features: [
      "Até 3 funis",
      "Leads ilimitados",
      "Exportar CSV",
      "Página pública do funil",
      "Redirecionamento WhatsApp",
    ],
    current: true,
    highlight: false,
  },
  {
    name: "Pro",
    price: "999 MT/mês",
    features: [
      "Funis ilimitados",
      "Leads ilimitados",
      "Exportar CSV",
      "Domínio personalizado",
      "Análises avançadas",
      "Suporte prioritário",
      "Remover marca FunilApp",
    ],
    current: false,
    highlight: true,
  },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const snap = await getDoc(doc(db, "users", user!.uid));
      if (snap.exists()) {
        const data = snap.data();
        setNome(data.nome ?? "");
        setTelefone(data.telefone ?? "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, "users", user!.uid), { nome, telefone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Perfil & Planos</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie os seus dados e plano de subscrição</p>
      </div>

      {/* Perfil */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-gray-900 font-semibold text-base mb-5">Informações da Conta</h2>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold uppercase">
              {user?.email?.[0] ?? "U"}
            </span>
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{nome || "Sem nome"}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full border border-green-100">
              Plano Gratuito
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="O seu nome"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+258</span>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="84 000 0000"
                className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="text-gray-400 text-xs mt-1">O email não pode ser alterado</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3 mt-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            <span className="text-green-700 text-sm">Perfil atualizado com sucesso!</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : "Guardar Alterações"}
        </button>
      </div>

      {/* Planos */}
      <div>
        <h2 className="text-gray-900 font-semibold text-base mb-4">Planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 border shadow-sm ${
                plan.highlight
                  ? "bg-green-600 border-green-600"
                  : "bg-white border-gray-100"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Recomendado
                </span>
              )}

              <div className="mb-5">
                <h3 className={`font-bold text-lg ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-2xl font-bold mt-1 ${plan.highlight ? "text-white" : "text-green-600"}`}>
                  {plan.price}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={plan.highlight ? "text-white" : "text-green-600"}>
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    <span className={plan.highlight ? "text-green-50" : "text-gray-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.current ? (
                <div className={`w-full text-center text-sm font-medium py-2.5 rounded-lg border ${
                  plan.highlight
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-gray-50 text-gray-400 border-gray-100"
                }`}>
                  Plano Atual
                </div>
              ) : (
                <button className="w-full bg-white hover:bg-gray-50 text-green-700 text-sm font-semibold py-2.5 rounded-lg transition border border-white">
                  Fazer Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}