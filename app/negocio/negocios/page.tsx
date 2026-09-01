"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { watchLeads, type Lead, type EstagioLead } from "@/lib/negocio";

const estagios: Array<{
  nome: EstagioLead;
  corTopo: string;
  corBadge: string;
  corTexto: string;
}> = [
  { nome: "Novo Lead", corTopo: "bg-blue-500", corBadge: "bg-blue-50", corTexto: "text-blue-700" },
  { nome: "Proposta", corTopo: "bg-amber-500", corBadge: "bg-amber-50", corTexto: "text-amber-700" },
  { nome: "Negociação", corTopo: "bg-violet-500", corBadge: "bg-violet-50", corTexto: "text-violet-700" },
  { nome: "Fechado Ganhou", corTopo: "bg-green-500", corBadge: "bg-green-50", corTexto: "text-green-700" },
  { nome: "Fechado Perdeu", corTopo: "bg-red-500", corBadge: "bg-red-50", corTexto: "text-red-700" },
];

function tempoDesde(data: Date) {
  const diffMs = Date.now() - data.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Há 1 dia";
  return `Há ${dias} dias`;
}

export default function NegociosPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchLeads(user.uid, setLeads);
    return () => unsub();
  }, [user]);

  if (!user) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">A carregar...</div>;
  }

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Negócios</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{leads.length} negócios no total</p>
        </div>
        <Link
          href="/negocio/leads"
          className="bg-green-600 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shrink-0"
        >
          + Novo Negócio
        </Link>
      </div>

      <div className="text-xs text-gray-400 mb-2 sm:hidden">Desliza para o lado para ver os outros estágios →</div>

      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
        {estagios.map((col) => {
          const negociosDoEstagio = leads.filter((l) => l.estagio === col.nome);
          const total = negociosDoEstagio.reduce((acc, l) => acc + (l.valor || 0), 0);

          return (
            <div key={col.nome} className="w-[260px] shrink-0 snap-start">
              <div className={`h-1 rounded-full ${col.corTopo} mb-3`} />
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div>
                  <div className="text-sm font-bold text-gray-900">{col.nome}</div>
                  <div className="text-[11px] text-gray-400">{negociosDoEstagio.length} negócios</div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${col.corBadge} ${col.corTexto}`}>
                  {total.toLocaleString("pt-MZ")} MTn
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {negociosDoEstagio.map((l) => (
                  <Link
                    key={l.id}
                    href="/negocio/leads"
                    className="block bg-white rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="text-sm font-semibold text-gray-900 truncate">{l.nome}</div>
                    <div className="text-sm text-gray-700 mt-1">
                      {l.valor > 0 ? `${l.valor.toLocaleString("pt-MZ")} MTn` : "Sem valor definido"}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1.5">{tempoDesde(l.createdAt.toDate())}</div>
                  </Link>
                ))}
                {negociosDoEstagio.length === 0 && (
                  <div className="text-xs text-gray-300 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                    Sem negócios
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}