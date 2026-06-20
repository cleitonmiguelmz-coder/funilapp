'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { calcularSaldoDisponivel, pedirCashout, getCashoutsDoUtilizador } from '@/lib/marketplace';
import { Cashout } from '@/lib/types';

export default function CashoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [saldo, setSaldo] = useState(0);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    valor: '',
    metodo: 'mpesa' as 'mpesa' | 'emola',
    numero: '',
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      const [s, c] = await Promise.all([
        calcularSaldoDisponivel(u.uid),
        getCashoutsDoUtilizador(u.uid),
      ]);
      setSaldo(s);
      setCashouts(c);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  function validar() {
    const e: Record<string, string> = {};
    const valor = Number(form.valor);
    if (!form.valor || isNaN(valor) || valor <= 0) e.valor = 'Valor inválido';
    if (valor > saldo) e.valor = `Saldo insuficiente. Máximo: ${saldo.toFixed(2)} MT`;
    if (valor < 100) e.valor = 'Valor mínimo: 100 MT';
    if (!form.numero.trim() || form.numero.length < 9) e.numero = 'Número inválido';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSacar() {
    if (!validar() || !user) return;
    setEnviando(true);
    try {
      await pedirCashout({
        userId: user.uid,
        valor: Number(form.valor),
        metodo: form.metodo,
        numero: form.numero,
      });
      setSaldo(s => s - Number(form.valor));
      setSucesso(true);
      setForm({ valor: '', metodo: 'mpesa', numero: '' });
      const c = await getCashoutsDoUtilizador(user.uid);
      setCashouts(c);
    } catch {
      alert('Erro ao solicitar cashout. Tenta novamente.');
    }
    setEnviando(false);
  }

  const statusCor: Record<string, string> = {
    pendente: 'bg-yellow-50 text-yellow-700',
    pago: 'bg-green-50 text-green-700',
    rejeitado: 'bg-red-50 text-red-600',
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-8 h-8 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* HEADER */}
      <div className="bg-[#E24B4A] px-4 pt-5 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/market/dashboard" className="text-white/80 hover:text-white transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </Link>
            <h1 className="text-white text-lg font-semibold">Sacar fundos</h1>
          </div>

          <div>
            <p className="text-white/70 text-xs mb-1">Saldo disponível para saque</p>
            <p className="text-white text-4xl font-bold mb-1">
              {loading ? '—' : `${saldo.toLocaleString('pt-MZ')} MT`}
            </p>
            <p className="text-white/60 text-xs flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Mínimo para saque: 100 MT
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-16">

        {/* SUCESSO */}
        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="font-semibold text-green-700 text-sm">Pedido enviado!</p>
              <p className="text-xs text-green-600">O pagamento será processado em até 24 horas úteis.</p>
            </div>
          </div>
        )}

        {/* FORMULÁRIO */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-5">
          <h2 className="font-semibold text-[#111827] text-sm">Novo pedido de saque</h2>

          {/* Método */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Receber via</label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['mpesa', 'emola'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setForm(f => ({ ...f, metodo: m }))}
                  className={`border-2 rounded-xl p-3 flex items-center gap-3 transition ${
                    form.metodo === m
                      ? 'border-[#E24B4A] bg-[#FCEBEB]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m === 'mpesa' ? 'bg-[#FCEBEB]' : 'bg-blue-50'
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={m === 'mpesa' ? '#E24B4A' : '#185FA5'} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${form.metodo === m ? 'text-[#A32D2D]' : 'text-gray-600'}`}>
                      {m === 'mpesa' ? 'M-Pesa' : 'E-Mola'}
                    </p>
                    <p className="text-xs text-gray-400">{m === 'mpesa' ? 'Vodacom' : 'Movitel'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Número */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Número {form.metodo === 'mpesa' ? 'M-Pesa' : 'E-Mola'}
            </label>
            <div className="flex gap-2">
              <span className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-400 bg-gray-50 flex-shrink-0">+258</span>
              <input
                type="tel"
                value={form.numero}
                onChange={e => setForm(f => ({ ...f, numero: e.target.value.replace(/\D/g, '') }))}
                placeholder={form.metodo === 'mpesa' ? '84 000 0000' : '86 000 0000'}
                maxLength={9}
                className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E24B4A] transition ${
                  erros.numero ? 'border-red-300' : 'border-gray-200'
                }`}
              />
            </div>
            {erros.numero && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {erros.numero}
              </p>
            )}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Valor a sacar (MT)</label>

            {/* Atalhos */}
            <div className="flex gap-2 mb-2 flex-wrap">
              {[100, 200, 500].filter(v => v <= saldo).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, valor: v.toString() }))}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    form.valor === v.toString()
                      ? 'border-[#E24B4A] bg-[#FCEBEB] text-[#A32D2D] font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-[#E24B4A] hover:text-[#E24B4A]'
                  }`}
                >
                  {v} MT
                </button>
              ))}
              {saldo >= 100 && (
                <button
                  onClick={() => setForm(f => ({ ...f, valor: Math.floor(saldo).toString() }))}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    form.valor === Math.floor(saldo).toString()
                      ? 'border-[#E24B4A] bg-[#FCEBEB] text-[#A32D2D] font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-[#E24B4A] hover:text-[#E24B4A]'
                  }`}
                >
                  Máximo ({Math.floor(saldo)} MT)
                </button>
              )}
            </div>

            <div className="flex items-center gap-0 border rounded-xl overflow-hidden focus-within:border-[#E24B4A] transition border-gray-200">
              <span className="px-3 py-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">MT</span>
              <input
                type="number"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder="Ex: 500"
                min="100"
                max={saldo}
                className="flex-1 px-4 py-3 text-sm outline-none bg-white"
              />
            </div>
            {erros.valor ? (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {erros.valor}
              </p>
            ) : (
              <p className="text-gray-400 text-xs mt-1">Disponível: {saldo.toFixed(2)} MT</p>
            )}
          </div>

          {/* Resumo */}
          {form.valor && !erros.valor && Number(form.valor) >= 100 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Resumo do saque</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor solicitado</span>
                <span className="font-medium text-[#111827]">{Number(form.valor).toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxa de processamento</span>
                <span className="font-medium text-[#111827]">0 MT</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="font-medium text-[#111827]">Recebes no {form.metodo === 'mpesa' ? 'M-Pesa' : 'E-Mola'}</span>
                <span className="font-bold text-green-600">{Number(form.valor).toLocaleString('pt-MZ')} MT</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSacar}
            disabled={enviando || saldo < 100}
            className="w-full bg-[#E24B4A] text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#A32D2D] transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {enviando ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>
                Pedir saque{form.valor ? ` de ${Number(form.valor).toLocaleString('pt-MZ')} MT` : ''}
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Processado em até 24 horas úteis
          </p>
        </div>

        {/* HISTÓRICO */}
        {cashouts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-[#111827] text-sm">Histórico de saques</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {cashouts.map(c => {
                const data = c.createdAt instanceof Date
                  ? c.createdAt
                  : (c.createdAt as any)?.toDate?.() ?? new Date();
                return (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        c.status === 'pago' ? 'bg-green-100' : c.status === 'pendente' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {c.status === 'pago' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : c.status === 'pendente' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">
                          {c.metodo === 'mpesa' ? 'M-Pesa' : 'E-Mola'} · +258 {c.numero}
                        </p>
                        <p className="text-xs text-gray-400">{data.toLocaleDateString('pt-MZ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#111827]">{c.valor.toLocaleString('pt-MZ')} MT</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCor[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}