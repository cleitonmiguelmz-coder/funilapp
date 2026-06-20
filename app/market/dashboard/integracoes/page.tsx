'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getIntegracoes,
  salvarIntegracao,
  desactivarIntegracao,
} from '@/lib/marketplace';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
type StatusIntegracao = 'activo' | 'inactivo';

interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'comunicacao' | 'automacao' | 'vendas';
  status: StatusIntegracao;
  icon: string;
  iconBg: string;
  iconColor: string;
  campos: Campo[];
  docUrl?: string;
}

interface Campo {
  key: string;
  label: string;
  placeholder: string;
  tipo: 'text' | 'url' | 'password';
}

interface ConfigSalva {
  [key: string]: string;
}

// ─────────────────────────────────────────────
// DEFINIÇÃO DAS INTEGRAÇÕES
// ─────────────────────────────────────────────
const INTEGRACOES: Integracao[] = [
  {
    id: 'whatsapp',
    nome: 'WhatsApp',
    descricao: 'Envia notificações automáticas de venda e links de download via WhatsApp Business API.',
    categoria: 'comunicacao',
    status: 'inactivo',
    icon: 'whatsapp',
    iconBg: '#E6F9EE',
    iconColor: '#25D366',
    campos: [
      { key: 'token', label: 'Token da API', placeholder: 'EAAxxxxxxx...', tipo: 'password' },
      { key: 'phoneId', label: 'Phone Number ID', placeholder: '1234567890', tipo: 'text' },
    ],
    docUrl: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    id: 'webhook',
    nome: 'Webhook',
    descricao: 'Recebe eventos de venda em tempo real na tua aplicação via HTTP POST.',
    categoria: 'comunicacao',
    status: 'inactivo',
    icon: 'webhook',
    iconBg: '#EEE6FB',
    iconColor: '#7C3AED',
    campos: [
      { key: 'url', label: 'URL do Webhook', placeholder: 'https://meusite.com/webhook', tipo: 'url' },
      { key: 'secret', label: 'Secret (opcional)', placeholder: 'chave secreta para validação', tipo: 'password' },
    ],
  },
  {
    id: 'n8n',
    nome: 'n8n',
    descricao: 'Automação de workflows avançados. Liga o FunilMarket a centenas de outras ferramentas.',
    categoria: 'automacao',
    status: 'inactivo',
    icon: 'n8n',
    iconBg: '#FEF0E6',
    iconColor: '#E04E1A',
    campos: [
      { key: 'webhookUrl', label: 'Webhook URL do n8n', placeholder: 'https://n8n.meusite.com/webhook/xxx', tipo: 'url' },
    ],
    docUrl: 'https://docs.n8n.io',
  },
  {
    id: 'utmify',
    nome: 'UTMify',
    descricao: 'Rastreia de onde vêm as tuas vendas. Monitoriza campanhas e UTMs em tempo real.',
    categoria: 'automacao',
    status: 'inactivo',
    icon: 'utm',
    iconBg: '#E6F1FB',
    iconColor: '#185FA5',
    campos: [
      { key: 'pixelId', label: 'Pixel ID', placeholder: 'utm_xxxxxxxx', tipo: 'text' },
      { key: 'apiKey', label: 'API Key', placeholder: 'chave da API UTMify', tipo: 'password' },
    ],
    docUrl: 'https://utmify.com.br/docs',
  },
  {
    id: 'funis',
    nome: 'Funis de Vendas',
    descricao: 'Cria funis de conversão personalizados para os teus produtos e aumenta as vendas.',
    categoria: 'vendas',
    status: 'inactivo',
    icon: 'funnel',
    iconBg: '#FCEBEB',
    iconColor: '#E24B4A',
    campos: [
      { key: 'funnelUrl', label: 'URL da página de funil', placeholder: 'https://meusite.com/funil', tipo: 'url' },
    ],
  },
  {
    id: 'areas-membro',
    nome: 'Áreas de Membro',
    descricao: 'Entrega automática de acesso a plataformas externas após a compra.',
    categoria: 'vendas',
    status: 'inactivo',
    icon: 'member',
    iconBg: '#FAEEDA',
    iconColor: '#854F0B',
    campos: [
      { key: 'plataforma', label: 'Nome da plataforma', placeholder: 'Ex: Hotmart, Eduzz, Memberkit', tipo: 'text' },
      { key: 'apiKey', label: 'API Key da plataforma', placeholder: 'chave de integração', tipo: 'password' },
      { key: 'webhookUrl', label: 'Webhook de entrega', placeholder: 'https://plataforma.com/webhook', tipo: 'url' },
    ],
  },
];

const CATEGORIAS = [
  { id: 'comunicacao', label: 'Comunicação' },
  { id: 'automacao', label: 'Automação' },
  { id: 'vendas', label: 'Vendas' },
];

// ─────────────────────────────────────────────
// ÍCONES SVG
// ─────────────────────────────────────────────
function Icon({ id, color }: { id: string; color: string }) {
  const s = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8 };
  if (id === 'whatsapp') return (
    <svg {...s} fill={color} stroke="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
  if (id === 'webhook') return <svg {...s}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
  if (id === 'n8n') return <svg {...s}><polyline points="17,1 21,5 17,9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7,23 3,19 7,15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>;
  if (id === 'utm') return <svg {...s}><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>;
  if (id === 'funnel') return <svg {...s}><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>;
  if (id === 'member') return <svg {...s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
  return null;
}

// ─────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────
export default function IntegracoesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, ConfigSalva>>({});
  const [statuses, setStatuses] = useState<Record<string, StatusIntegracao>>({});
  const [aberto, setAberto] = useState<string | null>(null);
  const [formData, setFormData] = useState<ConfigSalva>({});
  const [salvando, setSalvando] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUserId(u.uid);
      const data = await getIntegracoes(u.uid);
      if (data) {
        setConfigs(data.configs || {});
        setStatuses(data.statuses || {});
      }
    });
    return () => unsub();
  }, [router]);

  function getStatus(id: string): StatusIntegracao {
    return statuses[id] || 'inactivo';
  }

  function abrirConfig(integracao: Integracao) {
    setAberto(integracao.id);
    setFormData(configs[integracao.id] || {});
  }

  function fechar() {
    setAberto(null);
    setFormData({});
  }

  async function handleSalvar(integracao: Integracao) {
    if (!userId) return;
    setSalvando(true);
    await salvarIntegracao(userId, integracao.id, formData);
    setConfigs(c => ({ ...c, [integracao.id]: formData }));
    setStatuses(s => ({ ...s, [integracao.id]: 'activo' }));
    setSalvando(false);
    setSavedMsg(integracao.id);
    setTimeout(() => setSavedMsg(null), 2500);
    fechar();
  }

  async function handleDesactivar(id: string) {
    if (!userId) return;
    await desactivarIntegracao(userId, id);
    setStatuses(s => ({ ...s, [id]: 'inactivo' }));
    setConfigs(c => { const n = { ...c }; delete n[id]; return n; });
  }

  const integracaoAberta = INTEGRACOES.find(i => i.id === aberto);

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* HEADER */}
      <div className="bg-[#E24B4A] px-4 pt-5 pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/market/dashboard" className="text-white/80 hover:text-white transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </Link>
            <h1 className="text-white text-lg font-semibold">Integrações</h1>
          </div>
          <p className="text-white/70 text-sm ml-8">
            Liga o FunilMarket às tuas ferramentas para automatizar vendas e notificações.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-2 pb-16 space-y-8">

        {/* Toast de sucesso */}
        {savedMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Integração guardada com sucesso!
          </div>
        )}

        {CATEGORIAS.map(cat => {
          const lista = INTEGRACOES.filter(i => i.categoria === cat.id);
          return (
            <div key={cat.id}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {cat.label}
              </h2>
              <div className="space-y-3">
                {lista.map(integracao => {
                  const status = getStatus(integracao.id);
                  const isActivo = status === 'activo';
                  return (
                    <div
                      key={integracao.id}
                      className={`bg-white rounded-2xl border transition ${
                        isActivo ? 'border-green-200' : 'border-gray-100'
                      }`}
                    >
                      <div className="p-4 flex items-start gap-4">

                        {/* Ícone */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: integracao.iconBg }}
                        >
                          <Icon id={integracao.icon} color={integracao.iconColor} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-[#111827] text-sm">{integracao.nome}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isActivo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isActivo ? '● Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{integracao.descricao}</p>
                        </div>

                        {/* Acções */}
                        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                          <button
                            onClick={() => abrirConfig(integracao)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                              isActivo
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-[#FCEBEB] text-[#E24B4A] hover:bg-[#F7C1C1]'
                            }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                            </svg>
                            {isActivo ? 'Configurar' : 'Activar'}
                          </button>
                          {isActivo && (
                            <button
                              onClick={() => handleDesactivar(integracao.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition"
                            >
                              Desactivar
                            </button>
                          )}
                          {integracao.docUrl && (
                            <a
                              href={integracao.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
                            >
                              Docs
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                <polyline points="15,3 21,3 21,9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CONFIGURAÇÃO */}
      {aberto && integracaoAberta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={fechar}
          />

          {/* Painel */}
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl">

            {/* Header do modal */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: integracaoAberta.iconBg }}
              >
                <Icon id={integracaoAberta.icon} color={integracaoAberta.iconColor} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#111827] text-sm">{integracaoAberta.nome}</p>
                <p className="text-xs text-gray-400">Configuração da integração</p>
              </div>
              <button onClick={fechar} className="text-gray-400 hover:text-gray-600 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Campos */}
            <div className="px-5 py-4 space-y-4">
              {integracaoAberta.campos.map(campo => (
                <div key={campo.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {campo.label}
                  </label>
                  <input
                    type={campo.tipo === 'password' ? 'password' : campo.tipo === 'url' ? 'url' : 'text'}
                    value={formData[campo.key] || ''}
                    onChange={e => setFormData(f => ({ ...f, [campo.key]: e.target.value }))}
                    placeholder={campo.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E24B4A] transition"
                  />
                </div>
              ))}

              {/* Aviso de segurança */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <p className="text-xs text-gray-400">
                  As tuas credenciais são guardadas de forma segura e encriptada.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="px-5 pb-6 flex gap-3">
              <button
                onClick={fechar}
                className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSalvar(integracaoAberta)}
                disabled={salvando}
                className="flex-1 bg-[#E24B4A] text-white py-3 rounded-2xl text-sm font-semibold hover:bg-[#A32D2D] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />A guardar...</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Guardar e activar
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}