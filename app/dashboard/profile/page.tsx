"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

const ADMIN_WHATSAPP = "258846669284"; // ajusta se necessário

export default function ProfilePage() {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plano, setPlano] = useState("Gratuito");

  const [showModal, setShowModal] = useState(false);
  const [metodoEscolhido, setMetodoEscolhido] = useState<"mpesa" | "emola">("mpesa");
  const [numeroUser, setNumeroUser] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

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
        setPlano(data.plano ?? "Gratuito");
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

  const handleAbrirModal = () => {
    setNumeroUser(telefone ?? "");
    setPedidoEnviado(false);
    setShowModal(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!numeroUser || numeroUser.length < 8) {
      alert("Insira o número de telefone usado no pagamento.");
      return;
    }
    setEnviando(true);
    try {
      await addDoc(collection(db, "pagamentos"), {
        userId: user!.uid,
        email: user!.email,
        nome: nome || user!.email,
        plano: "Pro",
        valor: 999,
        metodo: metodoEscolhido,
        numero: numeroUser,
        status: "pendente",
        createdAt: serverTimestamp(),
      });
      setPedidoEnviado(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar pedido. Tenta novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const mensagemWhatsapp = encodeURIComponent(
    `Olá! Acabei de fazer o pagamento do Plano Pro (999 MT) via ${metodoEscolhido === "mpesa" ? "M-Pesa" : "E-Mola"}.\n\nNome: ${nome || user?.email}\nNúmero usado: ${numeroUser}\n\nPor favor confirmem a ativação. Obrigado!`
  );

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
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
              plano === "Pro"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-green-50 text-green-700 border-green-100"
            }`}>
              Plano {plano}
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
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === plano;
            return (
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

                {isCurrentPlan ? (
                  <div className={`w-full text-center text-sm font-medium py-2.5 rounded-lg border ${
                    plan.highlight
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}>
                    Plano Atual
                  </div>
                ) : plan.name === "Pro" ? (
                  <button
                    onClick={handleAbrirModal}
                    className="w-full bg-white hover:bg-gray-50 text-green-700 text-sm font-semibold py-2.5 rounded-lg transition border border-white"
                  >
                    Fazer Upgrade
                  </button>
                ) : (
                  <div className="w-full text-center text-sm font-medium py-2.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-100">
                    Plano Gratuito
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!pedidoEnviado ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Ativar Plano Pro</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4 text-center">
                  <p className="text-gray-500 text-xs mb-1">Valor a pagar</p>
                  <p className="text-2xl font-bold text-green-700">999 MT</p>
                  <p className="text-gray-400 text-xs mt-1">Subscrição mensal</p>
                </div>

                <p className="text-gray-700 text-sm font-medium mb-2">1. Escolhe o método e envia para:</p>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setMetodoEscolhido("mpesa")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                      metodoEscolhido === "mpesa"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    onClick={() => setMetodoEscolhido("emola")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                      metodoEscolhido === "emola"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    E-Mola
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-5">
                  <p className="text-gray-500 text-xs mb-1">
                    Número {metodoEscolhido === "mpesa" ? "M-Pesa" : "E-Mola"}
                  </p>
                  <p className="text-gray-900 text-lg font-bold">
                    {metodoEscolhido === "mpesa" ? "85 666 9284" : "87 909 3427"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Cleiton Miguel</p>
                </div>

                <p className="text-gray-700 text-sm font-medium mb-2">2. Confirma com o teu número:</p>
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+258</span>
                  <input
                    type="text"
                    value={numeroUser}
                    onChange={(e) => setNumeroUser(e.target.value)}
                    placeholder="84 000 0000"
                    className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                </div>
                 
                <button
                  onClick={handleConfirmarPagamento}
                  disabled={enviando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Já paguei, confirmar"}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Pedido enviado!</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Vamos confirmar o teu pagamento e ativar o Plano Pro em breve. Para acelerar, envia o comprovativo por WhatsApp.
                </p>
                <a
                  href={`https://wa.me/${ADMIN_WHATSAPP}?text=${mensagemWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-3 rounded-lg transition mb-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L.057 23.882l6.187-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.879.936-3.629-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                  </svg>
                  Enviar comprovativo no WhatsApp
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full text-gray-500 text-sm font-medium py-2"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}