'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { criarProduto } from '@/lib/marketplace';

const CATEGORIAS = ['Ebook', 'Curso', 'Template', 'Software', 'Outro'];
const NIVEIS = ['Iniciante', 'Intermédio', 'Avançado'];
const GARANTIAS = [
  { label: 'Sem garantia', value: 0 },
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
];

const FORMATO_CAPA: Record<string, string> = {
  Ebook: '600×800px (vertical)',
  Curso: '1200×630px (horizontal)',
  Template: '1200×630px (horizontal)',
  Software: '1200×630px (horizontal)',
  Outro: '800×600px',
};

export default function CriarProduto() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState('');
  const [arquivoFile, setArquivoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    nome: '',
    subtitulo: '',
    descricao: '',
    categoria: 'Ebook',
    nivel: 'Iniciante',
    idioma: 'Português',
    paginas: '',
    duracao: '',
    preco: '',
    percentagemAfiliado: '30',
    garantiaDias: 0,
  });

  const [bullets, setBullets] = useState(['', '', '']);
  const [paraQuem, setParaQuem] = useState(['', '']);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImagemFile(f);
    setImagemPreview(URL.createObjectURL(f));
  }

  function validarStep1() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.descricao.trim()) e.descricao = 'Obrigatório';
    if (!imagemFile) e.imagem = 'Adiciona uma imagem de capa';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function validarStep2() {
    const e: Record<string, string> = {};
    if (!arquivoFile) e.arquivo = 'Adiciona o ficheiro do produto';
    if (!form.preco || isNaN(Number(form.preco)) || Number(form.preco) <= 0) e.preco = 'Preço inválido';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (step === 1 && !validarStep1()) return;
    if (step === 2 && !validarStep2()) return;
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  }

  async function handleSubmit() {
    if (!user) return;
    setSalvando(true);
    try {
      let imagemUrl = '';
      let arquivoUrl = '';
      if (imagemFile) {
        const imgRef = ref(storage, `marketplace/imagens/${user.uid}/${Date.now()}_${imagemFile.name}`);
        await uploadBytes(imgRef, imagemFile);
        imagemUrl = await getDownloadURL(imgRef);
      }
      if (arquivoFile) {
        const fileRef = ref(storage, `marketplace/produtos/${user.uid}/${Date.now()}_${arquivoFile.name}`);
        await uploadBytes(fileRef, arquivoFile);
        arquivoUrl = await getDownloadURL(fileRef);
      }
      await criarProduto({
        userId: user.uid,
        nome: form.nome,
        subtitulo: form.subtitulo,
        descricao: form.descricao,
        bullets: bullets.filter(b => b.trim() !== ''),
        paraQuem: paraQuem.filter(p => p.trim() !== ''),
        garantiaDias: form.garantiaDias,
        idioma: form.idioma,
        paginas: form.paginas ? Number(form.paginas) : undefined,
        duracao: form.duracao || undefined,
        nivel: form.nivel as any,
        preco: Number(form.preco),
        imagemUrl,
        arquivoUrl,
        categoria: form.categoria,
        percentagemAfiliado: Number(form.percentagemAfiliado),
        status: 'pendente',
      });
      router.push('/market/dashboard?criado=1');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar produto. Tenta novamente.');
    }
    setSalvando(false);
  }

  const prevPreco = Number(form.preco) || 0;
  const prevPerc = Number(form.percentagemAfiliado) || 0;
  const criadorRecebe = prevPreco * (1 - 0.10 - prevPerc / 100);
  const stepLabels = ['Informações', 'Ficheiro & Preço', 'Publicar'];

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-8 h-8 border-2 border-[#E24B4A]/30 border-t-[#E24B4A] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
            className="text-[#E24B4A] flex items-center gap-1 text-sm">
            ← Voltar
          </button>
          <span className="font-semibold text-[#111827] text-sm flex-1">Novo produto</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-[#E24B4A] text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${s === step ? 'text-[#E24B4A]' : s < step ? 'text-green-600' : 'text-gray-400'}`}>
                  {stepLabels[i]}
                </span>
              </div>
              {s < 3 && <div className={`flex-1 h-px mx-2 ${s < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4">

        {step === 1 && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-[#111827] mb-3">Tipo de produto</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {CATEGORIAS.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                    className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition flex flex-col items-center gap-1 ${
                      form.categoria === cat ? 'border-[#E24B4A] bg-[#FCEBEB] text-[#A32D2D]' : 'border-gray-200 text-gray-500'
                    }`}>
                    <span className="text-lg">
                      {cat === 'Ebook' ? '📖' : cat === 'Curso' ? '🎓' : cat === 'Template' ? '📐' : cat === 'Software' ? '💻' : '📦'}
                    </span>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-[#E24B4A] text-xs flex-shrink-0 mt-0.5">ℹ</span>
                <p className="text-xs text-gray-500">
                  Para <strong className="text-[#111827]">{form.categoria}</strong> usa formato <strong className="text-[#111827]">{FORMATO_CAPA[form.categoria]}</strong>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-[#111827] mb-3">
                Imagem de capa <span className="text-[#E24B4A]">*</span>
              </label>
              <label className="cursor-pointer block">
                {imagemPreview ? (
                  <div className={`relative overflow-hidden rounded-xl group mx-auto ${form.categoria === 'Ebook' ? 'w-36' : 'w-full'}`}
                    style={{ aspectRatio: form.categoria === 'Ebook' ? '3/4' : '16/9' }}>
                    <img src={imagemPreview} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">Alterar</span>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 transition bg-[#FCEBEB]/30 ${erros.imagem ? 'border-red-300' : 'border-[#E24B4A]/30 hover:border-[#E24B4A]'}`}>
                    <div className="w-12 h-12 bg-[#FCEBEB] rounded-xl flex items-center justify-center text-2xl">🖼️</div>
                    <p className="text-sm text-gray-600 font-medium">Adicionar imagem de capa</p>
                    <p className="text-xs text-gray-400">JPG ou PNG · {FORMATO_CAPA[form.categoria].split(' ')[0]}</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImagem} className="hidden" />
              </label>
              {imagemPreview && <p className="text-xs text-green-600 mt-2 text-center">✓ Formato correcto para {form.categoria}</p>}
              {erros.imagem && <p className="text-red-500 text-xs mt-2">{erros.imagem}</p>}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-[#111827] text-sm">Informações do produto</h2>
              <Campo label="Nome do produto *" erro={erros.nome}>
                <input type="text" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Guia Completo para Emagrecer em 30 Dias"
                  className={inp(erros.nome)} />
              </Campo>
              <Campo label="Subtítulo (opcional)" erro="">
                <input type="text" value={form.subtitulo}
                  onChange={e => setForm(f => ({ ...f, subtitulo: e.target.value }))}
                  placeholder="Ex: O método que já ajudou 500 pessoas"
                  className={inp('')} />
              </Campo>
              <Campo label="Descrição completa *" erro={erros.descricao}>
                <textarea value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreve o que o comprador vai receber..."
                  rows={4} className={inp(erros.descricao) + ' resize-none'} />
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nível" erro="">
                  <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))} className={inp('')}>
                    {NIVEIS.map(n => <option key={n}>{n}</option>)}
                  </select>
                </Campo>
                <Campo label={form.categoria === 'Curso' ? 'Duração' : 'Nº de páginas'} erro="">
                  <input type={form.categoria === 'Curso' ? 'text' : 'number'}
                    value={form.categoria === 'Curso' ? form.duracao : form.paginas}
                    onChange={e => setForm(f => form.categoria === 'Curso' ? ({ ...f, duracao: e.target.value }) : ({ ...f, paginas: e.target.value }))}
                    placeholder={form.categoria === 'Curso' ? 'Ex: 4 horas' : 'Ex: 120'}
                    className={inp('')} />
                </Campo>
              </div>
            </div>

            <button onClick={nextStep} className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-semibold hover:bg-[#A32D2D] transition">
              Continuar →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <Campo label="Ficheiro do produto *" erro={erros.arquivo}>
                <label className="cursor-pointer block">
                  {arquivoFile ? (
                    <div className="border border-green-200 bg-green-50 rounded-xl px-4 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">📄</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-700 truncate">{arquivoFile.name}</p>
                        <p className="text-xs text-green-500">{(arquivoFile.size / 1024 / 1024).toFixed(2)} MB · Pronto para upload</p>
                      </div>
                      <span className="text-green-500 font-bold">✓</span>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-xl px-4 py-8 text-center transition ${erros.arquivo ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-[#E24B4A]'}`}>
                      <div className="text-4xl mb-3">📁</div>
                      <p className="text-sm font-medium text-gray-600">Clica para seleccionar o ficheiro</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, ZIP, DOCX, MP4 — máx. 100MB</p>
                    </div>
                  )}
                  <input type="file" onChange={e => setArquivoFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
              </Campo>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-[#111827] text-sm">Preço e comissão</h2>
              <Campo label="Preço (MT) *" erro={erros.preco}>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#E24B4A] transition">
                  <span className="px-4 py-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">MT</span>
                  <input type="number" value={form.preco}
                    onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                    placeholder="500" min="1"
                    className="flex-1 px-4 py-3 text-sm outline-none" />
                </div>
              </Campo>
              <Campo label={`Comissão para afiliados: ${prevPerc}%`} erro="">
                <input type="range" min="0" max="70" step="5"
                  value={form.percentagemAfiliado}
                  onChange={e => setForm(f => ({ ...f, percentagemAfiliado: e.target.value }))}
                  className="w-full accent-[#E24B4A]" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span><span>35%</span><span>70%</span>
                </div>
              </Campo>
              {prevPreco > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Divisão por venda de {prevPreco.toLocaleString('pt-MZ')} MT</p>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Tu recebes</span><span className="font-semibold text-[#E24B4A]">{criadorRecebe.toFixed(2)} MT</span></div>
                  {prevPerc > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Afiliado recebe</span><span className="font-semibold text-green-600">{(prevPreco * prevPerc / 100).toFixed(2)} MT</span></div>}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200"><span className="text-gray-400">FunilMarket (10%)</span><span className="text-gray-400">{(prevPreco * 0.10).toFixed(2)} MT</span></div>
                </div>
              )}
            </div>

            <button onClick={nextStep} className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-semibold hover:bg-[#A32D2D] transition">
              Continuar →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-[#111827] text-sm mb-1">O que o comprador vai receber</h2>
              <p className="text-xs text-gray-400 mb-4">Até 6 benefícios principais.</p>
              <div className="space-y-2">
                {bullets.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-500 font-bold flex-shrink-0 text-sm">✓</span>
                    <input type="text" value={b}
                      onChange={e => { const n = [...bullets]; n[i] = e.target.value; setBullets(n); }}
                      placeholder={`Benefício ${i + 1}`}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E24B4A] transition" />
                  </div>
                ))}
              </div>
              {bullets.length < 6 && (
                <button onClick={() => setBullets(b => [...b, ''])} className="mt-3 text-xs text-[#E24B4A] font-medium">+ Adicionar benefício</button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-[#111827] text-sm mb-1">Para quem é este produto?</h2>
              <p className="text-xs text-gray-400 mb-4">Define o público-alvo.</p>
              <div className="space-y-2">
                {paraQuem.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[#E24B4A] flex-shrink-0">→</span>
                    <input type="text" value={p}
                      onChange={e => { const n = [...paraQuem]; n[i] = e.target.value; setParaQuem(n); }}
                      placeholder={i === 0 ? 'Ex: Quem quer emagrecer sem academia' : 'Ex: Mães com pouco tempo'}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E24B4A] transition" />
                  </div>
                ))}
              </div>
              {paraQuem.length < 4 && (
                <button onClick={() => setParaQuem(p => [...p, ''])} className="mt-3 text-xs text-[#E24B4A] font-medium">+ Adicionar público</button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-[#111827] text-sm mb-1">Garantia</h2>
              <p className="text-xs text-gray-400 mb-4">Produtos com garantia vendem muito mais.</p>
              <div className="grid grid-cols-2 gap-2">
                {GARANTIAS.map(g => (
                  <button key={g.value} onClick={() => setForm(f => ({ ...f, garantiaDias: g.value }))}
                    className={`py-3 rounded-xl text-sm font-medium border transition ${
                      form.garantiaDias === g.value ? 'bg-[#E24B4A] text-white border-[#E24B4A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#E24B4A]'
                    }`}>
                    {g.value > 0 ? `🛡️ ${g.label}` : g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 text-white flex items-center gap-4">
              {imagemPreview && <img src={imagemPreview} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">Resumo do produto</p>
                <p className="font-semibold text-sm truncate">{form.nome || 'Sem título'}</p>
                <p className="text-gray-400 text-xs">{form.categoria} · {form.nivel}</p>
                <p className="text-[#E24B4A] font-bold mt-1">{Number(form.preco).toLocaleString('pt-MZ')} MT</p>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={salvando}
              className="w-full bg-[#E24B4A] text-white py-4 rounded-2xl font-semibold hover:bg-[#A32D2D] transition disabled:opacity-50 flex items-center justify-center gap-2">
              {salvando ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />A criar...</> : '🚀 Publicar produto'}
            </button>
            <p className="text-center text-xs text-gray-400">O produto ficará em revisão antes de aparecer no marketplace.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Campo({ label, erro, children }: { label: string; erro: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
      {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
    </div>
  );
}

function inp(erro: string) {
  return `w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E24B4A] transition bg-white ${erro ? 'border-red-300' : 'border-gray-200'}`;
}
