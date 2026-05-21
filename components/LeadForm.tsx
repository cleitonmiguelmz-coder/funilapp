"use client";

import { useState } from "react";
import { salvarLead } from "@/lib/leads";

export default function LeadForm() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    cidade: "",
    pagamento: "M-Pesa",
    intencao: "Hoje"
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await salvarLead(form);

      const mensagem = `Olá, sou ${form.nome}
Quero comprar o produto.

✔ Método: ${form.pagamento}
✔ Intenção: ${form.intencao}

Cidade: ${form.cidade}

Estou pronto para finalizar.`;

      const url = `https://wa.me/258856669284?text=${encodeURIComponent(
        mensagem
      )}`;

      window.location.href = url;
    } catch (error) {
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <input
        name="nome"
        placeholder="Seu nome"
        required
        className="input"
        onChange={handleChange}
      />

      <input
        name="telefone"
        placeholder="Seu WhatsApp"
        required
        className="input"
        onChange={handleChange}
      />

      <input
        name="cidade"
        placeholder="Cidade"
        required
        className="input"
        onChange={handleChange}
      />

      <select
        name="pagamento"
        className="input"
        onChange={handleChange}
      >
        <option>M-Pesa</option>
        <option>e-Mola</option>
        <option>Outro</option>
      </select>

      <select
        name="intencao"
        className="input"
        onChange={handleChange}
      >
        <option>Hoje</option>
        <option>Esta semana</option>
        <option>Só estou vendo</option>
      </select>

      <button type="submit" disabled={loading} className="btn">
        {loading ? "Enviando..." : "Quero Comprar"}
      </button>
    </form>
  );
}