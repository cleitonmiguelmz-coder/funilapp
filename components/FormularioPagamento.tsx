'use client';

// ===== components/FormularioPagamento.tsx =====

import { useState } from 'react';

interface Props {
  produtoId: string;
  nomeProduto: string;
  preco: number;
  afiliadoId?: string | null;
  onSucesso?: (vendaId: string, metodo: string) => void;
}

type Metodo = 'mpesa' | 'emola';
type Estado = 'idle' | 'carregando' | 'sucesso' | 'aguardando' | 'erro';

export default function FormularioPagamento({ produtoId, nomeProduto, preco, afiliadoId, onSucesso }: Props) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [metodo, setMetodo] = useState<Metodo>('mpesa');
  const [estado, setEstado] = useState<Estado>('idle');
  const [mensagem, setMensagem] = useState('');

  async function handlePagar() {
    if (!nome || !email || !telefone) {
      setMensagem('Preenche todos os campos.');
      setEstado('erro');
      return;
    }

    setEstado('carregando');
    setMensagem('');

    try {
      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoId, afiliadoId: afiliadoId || null, compradorNome: nome, compradorEmail: email, compradorTelefone: telefone, metodo }),
      });

      const data = await res.json();

      if (!res.ok || data.erro) {
        setMensagem(data.erro || 'Erro ao processar pagamento.');
        setEstado('erro');
        return;
      }

      if (data.aguardaWebhook) {
        setEstado('aguardando');
        setMensagem('Confirma o pagamento no teu telemóvel e-Mola.');
        iniciarPolling(data.vendaId);
      } else {
        setEstado('sucesso');
        setMensagem('Pagamento confirmado!');
        onSucesso?.(data.vendaId, metodo);
      }
    } catch {
      setMensagem('Erro de rede. Tenta novamente.');
      setEstado('erro');
    }
  }

  function iniciarPolling(id: string) {
    let tentativas = 0;
    const intervalo = setInterval(async () => {
      tentativas++;
      try {
        const res = await fetch(`/api/pagamento/status?vendaId=${id}`);
        const data = await res.json();
        if (data.status === 'pago') {
          clearInterval(intervalo);
          setEstado('sucesso');
          setMensagem('Pagamento confirmado!');
          onSucesso?.(id, 'emola');
        } else if (data.status === 'falhou') {
          clearInterval(intervalo);
          setEstado('erro');
          setMensagem('Pagamento falhou ou foi cancelado.');
        }
      } catch {}
      if (tentativas >= 24) {
        clearInterval(intervalo);
        setEstado('erro');
        setMensagem('Tempo esgotado. Verifica o teu e-Mola e contacta o suporte.');
      }
    }, 5000);
  }

  const bloqueado = estado === 'carregando' || estado === 'sucesso' || estado === 'aguardando';

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Finalizar Compra</h2>
        <p className="text-sm text-gray-500">{nomeProduto}</p>
        <p className="text-2xl font-bold text-[#1D9E75] mt-1">{preco.toLocaleString('pt-MZ')} MZN</p>
      </div>

      <div className="space-y-3">
        <input type="text" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} disabled={bloqueado}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={bloqueado}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
        <input type="tel" placeholder="Telemóvel (ex: 841234567)" value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={bloqueado}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]" />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Método de pagamento</p>
        <div className="grid grid-cols-2 gap-3">
          {(['mpesa', 'emola'] as Metodo[]).map((m) => (
            <button key={m} onClick={() => setMetodo(m)} disabled={bloqueado}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${metodo === m ? 'border-[#1D9E75] bg-[#1D9E75] text-white' : 'border-gray-200 text-gray-600 hover:border-[#1D9E75]'}`}>
              {m === 'mpesa' ? 'M-Pesa' : 'e-Mola'}
            </button>
          ))}
        </div>
        {metodo === 'emola' && (
          <p className="text-xs text-yellow-600 mt-2">⚠️ e-Mola: confirmação pode demorar até 2 minutos.</p>
        )}
      </div>

      {mensagem && (
        <p className={`text-sm ${estado === 'sucesso' ? 'text-green-600' : estado === 'erro' ? 'text-red-600' : 'text-yellow-600'}`}>
          {mensagem}
        </p>
      )}

      {estado !== 'sucesso' && (
        <button onClick={handlePagar} disabled={bloqueado}
          className="w-full bg-[#1D9E75] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#178a64] disabled:opacity-60 transition-colors">
          {estado === 'carregando' ? 'A processar...' : estado === 'aguardando' ? 'A aguardar confirmação...' : `Pagar ${preco.toLocaleString('pt-MZ')} MZN`}
        </button>
      )}

      {estado === 'sucesso' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-semibold">✅ Pagamento confirmado!</p>
          <p className="text-green-600 text-sm mt-1">Receberás o acesso no email: {email}</p>
        </div>
      )}
    </div>
  );
}
