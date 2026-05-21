"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Depoimento {
  nome: string;
  texto: string;
  foto: string;
}

export default function CreateFunnelPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nomeProduto: "",
    videoUrl: "",
    preco: "",
    descricao: "",
    whatsapp: "",
  });

  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([
    { nome: "", texto: "", foto: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDepoimentoChange = (index: number, field: keyof Depoimento, value: string) => {
    setDepoimentos((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const addDepoimento = () => {
    setDepoimentos((prev) => [...prev, { nome: "", texto: "", foto: "" }]);
  };

  const removeDepoimento = (index: number) => {
    setDepoimentos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nomeProduto || !form.preco || !form.whatsapp) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const depoimentosValidos = depoimentos.filter((d) => d.nome && d.texto);
      const docRef = await addDoc(collection(db, "funnels"), {
        ...form,
        depoimentos: depoimentosValidos,
        userId: user!.uid,
        createdAt: serverTimestamp(),
      });
      router.push(`/dashboard?created=${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Erro ao criar funil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-4 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Criar Novo Funil</h1>
        <p className="text-gray-400 text-sm mt-1">Configure a sua página de vendas e captura de leads</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome do Produto <span className="text-green-600">*</span>
          </label>
          <input
            type="text"
            name="nomeProduto"
            value={form.nomeProduto}
            onChange={handleChange}
            placeholder="Ex: Curso de Marketing Digital"
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preço (MZN) <span className="text-green-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MZN</span>
            <input
              type="number"
              name="preco"
              value={form.preco}
              onChange={handleChange}
              placeholder="1999"
              className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            WhatsApp para Receber Leads <span className="text-green-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+258</span>
            <input
              type="text"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="84 000 0000"
              className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            URL do Vídeo
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="url"
            name="videoUrl"
            value={form.videoUrl}
            onChange={handleChange}
            placeholder="https://youtube.com/embed/..."
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
          />
          <p className="text-gray-400 text-xs mt-1.5">Use o link de incorporação do YouTube (embed)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descrição do Produto
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descreva os benefícios do seu produto..."
            rows={4}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
          />
        </div>

        {/* Depoimentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Depoimentos</label>
              <p className="text-gray-400 text-xs mt-0.5">Adicione provas sociais para aumentar conversões</p>
            </div>
            <button
              type="button"
              onClick={addDepoimento}
              className="flex items-center gap-1.5 text-green-700 hover:text-green-800 text-xs font-medium bg-green-50 hover:bg-green-100 border border-green-100 px-3 py-1.5 rounded-lg transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {depoimentos.map((dep, index) => (
              <div key={index} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs font-medium">Depoimento {index + 1}</span>
                  {depoimentos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDepoimento(index)}
                      className="text-red-400 hover:text-red-600 text-xs transition"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome do cliente *"
                    value={dep.nome}
                    onChange={(e) => handleDepoimentoChange(index, "nome", e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                  <textarea
                    placeholder="O que o cliente disse... *"
                    value={dep.texto}
                    onChange={(e) => handleDepoimentoChange(index, "texto", e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
                  />
                  <input
                    type="url"
                    placeholder="URL da foto do cliente (opcional)"
                    value={dep.foto}
                    onChange={(e) => handleDepoimentoChange(index, "foto", e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                </div>
              </div>
            ))}
          </div>
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

        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-green-700 text-sm">
            Após criar, receberá um link público para partilhar com os seus clientes.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Criando funil...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              Criar Funil
            </>
          )}
        </button>
      </form>
    </div>
  );
}