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

const tiposProduto = [
  { value: "produto_fisico", label: "📦 Produto Físico", desc: "Roupa, calçado, electrodomésticos, etc." },
  { value: "ebook", label: "📖 Ebook / Infoproduto", desc: "Livros digitais, PDFs, guias, etc." },
  { value: "curso", label: "🎓 Curso Online", desc: "Formações, tutoriais, masterclasses, etc." },
  { value: "servico", label: "🛠️ Serviço", desc: "Design, consultoria, reparação, etc." },
  { value: "dropshipping", label: "🚚 Dropshipping", desc: "Produtos importados, revendas, etc." },
];

const coresLayout = [
  { value: "green", label: "Verde", cor: "#16a34a" },
  { value: "blue", label: "Azul", cor: "#2563eb" },
  { value: "red", label: "Vermelho", cor: "#dc2626" },
  { value: "purple", label: "Roxo", cor: "#9333ea" },
  { value: "orange", label: "Laranja", cor: "#ea580c" },
  { value: "pink", label: "Rosa", cor: "#db2777" },
  { value: "black", label: "Preto", cor: "#111827" },
];

export default function CreateFunnelPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tipoProduto, setTipoProduto] = useState("");
  const [corLayout, setCorLayout] = useState("green");
  const [form, setForm] = useState({
    nomeProduto: "",
    videoUrl: "",
    preco: "",
    descricao: "",
    whatsapp: "",
    linkCompra: "",
    bonusIncluidos: "",
    paraQuem: "",
    tempoEntrega: "",
    oQueInclui: "",
    imagemUrl: "",
    garantia: "",
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

    if (!tipoProduto) {
      setError("Seleciona o tipo de produto.");
      return;
    }

    if (!form.nomeProduto || !form.preco || !form.whatsapp) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const depoimentosValidos = depoimentos.filter((d) => d.nome && d.texto);
      const docRef = await addDoc(collection(db, "funnels"), {
        ...form,
        tipoProduto,
        corLayout,
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

  const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition";

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
        <p className="text-gray-400 text-sm mt-1">Configure a sua página de vendas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Tipo de produto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Produto <span className="text-green-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tiposProduto.map((tipo) => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setTipoProduto(tipo.value)}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition ${
                  tipoProduto === tipo.value
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{tipo.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tipo.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cor do layout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Layout</label>
          <div className="flex flex-wrap gap-3">
            {coresLayout.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCorLayout(c.value)}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-9 h-9 rounded-full border-4 transition ${corLayout === c.value ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.cor }}
                />
                <span className="text-xs text-gray-500">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Campos base */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome do Produto <span className="text-green-600">*</span>
          </label>
          <input type="text" name="nomeProduto" value={form.nomeProduto} onChange={handleChange}
            placeholder="Ex: Ténis Nike Air Max" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preço (MZN) <span className="text-green-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MZN</span>
            <input type="number" name="preco" value={form.preco} onChange={handleChange}
              placeholder="1999"
              className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            WhatsApp para Receber Leads <span className="text-green-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+258</span>
            <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange}
              placeholder="84 000 0000"
              className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descrição <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange}
            placeholder="Descreva o produto com as suas palavras..." rows={4}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Imagem do Produto <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input type="url" name="imagemUrl" value={form.imagemUrl} onChange={handleChange}
            placeholder="https://..." className={inputClass} />
          <p className="text-gray-400 text-xs mt-1.5">Cole o link de uma imagem do produto</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            URL do Vídeo <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input type="url" name="videoUrl" value={form.videoUrl} onChange={handleChange}
            placeholder="https://youtube.com/watch?v=..." className={inputClass} />
          <p className="text-gray-400 text-xs mt-1.5">Suporta links do YouTube e Facebook</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Garantia <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input type="text" name="garantia" value={form.garantia} onChange={handleChange}
            placeholder="Ex: 7 dias de garantia ou devolução do dinheiro"
            className={inputClass} />
        </div>

        {/* Campos específicos por tipo */}
        {(tipoProduto === "ebook" || tipoProduto === "curso") && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">
              {tipoProduto === "ebook" ? "Detalhes do Ebook" : "Detalhes do Curso"}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Para quem é este produto?</label>
              <input type="text" name="paraQuem" value={form.paraQuem} onChange={handleChange}
                placeholder="Ex: Empreendedores que querem vender mais online" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bónus incluídos</label>
              <textarea name="bonusIncluidos" value={form.bonusIncluidos} onChange={handleChange}
                placeholder="Ex: Planilha de vendas + Grupo VIP no WhatsApp" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Link de compra directa</label>
              <input type="url" name="linkCompra" value={form.linkCompra} onChange={handleChange}
                placeholder="Ex: https://hotmart.com/produto/..." className={inputClass} />
            </div>
          </div>
        )}

        {tipoProduto === "produto_fisico" && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
            <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Detalhes do Produto</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">O que está incluído?</label>
              <textarea name="oQueInclui" value={form.oQueInclui} onChange={handleChange}
                placeholder="Ex: 1 par de ténis + caixa original + meias grátis" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tempo de entrega</label>
              <input type="text" name="tempoEntrega" value={form.tempoEntrega} onChange={handleChange}
                placeholder="Ex: 1 a 3 dias em Maputo" className={inputClass} />
            </div>
          </div>
        )}

        {tipoProduto === "servico" && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
            <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide">Detalhes do Serviço</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">O que está incluído?</label>
              <textarea name="oQueInclui" value={form.oQueInclui} onChange={handleChange}
                placeholder="Ex: Design do logótipo + 3 revisões + ficheiros finais" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tempo de entrega</label>
              <input type="text" name="tempoEntrega" value={form.tempoEntrega} onChange={handleChange}
                placeholder="Ex: 3 a 5 dias úteis" className={inputClass} />
            </div>
          </div>
        )}

        {tipoProduto === "dropshipping" && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
            <p className="text-orange-700 text-xs font-semibold uppercase tracking-wide">Detalhes do Dropshipping</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tempo de entrega</label>
              <input type="text" name="tempoEntrega" value={form.tempoEntrega} onChange={handleChange}
                placeholder="Ex: 7 a 14 dias úteis" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">O que está incluído?</label>
              <textarea name="oQueInclui" value={form.oQueInclui} onChange={handleChange}
                placeholder="Ex: Produto + embalagem + entrega ao domicílio" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
            </div>
          </div>
        )}

        {/* Depoimentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Depoimentos</label>
              <p className="text-gray-400 text-xs mt-0.5">O que os seus clientes dizem</p>
            </div>
            <button type="button" onClick={addDepoimento}
              className="flex items-center gap-1.5 text-green-700 hover:text-green-800 text-xs font-medium bg-green-50 hover:bg-green-100 border border-green-100 px-3 py-1.5 rounded-lg transition">
              + Adicionar
            </button>
          </div>
          <div className="space-y-4">
            {depoimentos.map((dep, index) => (
              <div key={index} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs font-medium">Depoimento {index + 1}</span>
                  {depoimentos.length > 1 && (
                    <button type="button" onClick={() => removeDepoimento(index)}
                      className="text-red-400 hover:text-red-600 text-xs transition">Remover</button>
                  )}
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="Nome do cliente *" value={dep.nome}
                    onChange={(e) => handleDepoimentoChange(index, "nome", e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition" />
                  <textarea placeholder="O que o cliente disse... *" value={dep.texto}
                    onChange={(e) => handleDepoimentoChange(index, "texto", e.target.value)} rows={3}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition resize-none" />
                  <input type="url" placeholder="URL da foto do cliente (opcional)" value={dep.foto}
                    onChange={(e) => handleDepoimentoChange(index, "foto", e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</>
          ) : "Criar Funil"}
        </button>
      </form>
    </div>
  );
}