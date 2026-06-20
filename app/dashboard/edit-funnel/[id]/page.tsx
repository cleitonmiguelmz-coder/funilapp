"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface Depoimento {
  nome: string;
  texto: string;
  foto: string;
  fotoFile?: File;
  fotoPreview?: string;
}

const tiposProduto = [
  {
    value: "produto_fisico",
    label: "Produto Físico",
    desc: "Roupa, calçado, electrodomésticos, etc.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    value: "ebook",
    label: "Ebook / Infoproduto",
    desc: "Livros digitais, PDFs, guias, etc.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    value: "curso",
    label: "Curso Online",
    desc: "Formações, tutoriais, masterclasses, etc.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
  {
    value: "servico",
    label: "Serviço",
    desc: "Design, consultoria, reparação, etc.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    value: "dropshipping",
    label: "Dropshipping",
    desc: "Produtos importados, revendas, etc.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/>
        <path d="M16 8h4l3 5v3h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
];

const coresLayout = [
  { value: "green",  label: "Verde",    cor: "#16a34a" },
  { value: "blue",   label: "Azul",     cor: "#2563eb" },
  { value: "red",    label: "Vermelho", cor: "#dc2626" },
  { value: "purple", label: "Roxo",     cor: "#9333ea" },
  { value: "orange", label: "Laranja",  cor: "#ea580c" },
  { value: "pink",   label: "Rosa",     cor: "#db2777" },
  { value: "black",  label: "Preto",    cor: "#111827" },
];

async function uploadFile(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function EditFunnelPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tipoProduto, setTipoProduto] = useState("");
  const [corLayout, setCorLayout] = useState("green");
  const [form, setForm] = useState({
    nomeProduto: "",
    preco: "",
    descricao: "",
    whatsapp: "",
    linkCompra: "",
    bonusIncluidos: "",
    paraQuem: "",
    tempoEntrega: "",
    oQueInclui: "",
    garantia: "",
  });

  // Imagem
  const [imagemFile, setImagemFile]       = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string>("");   // pode vir do Firestore ou do ficheiro local
  const [imagemUploadPct, setImagemUploadPct] = useState(0);
  const imagemInputRef = useRef<HTMLInputElement>(null);

  // Vídeo
  const [videoFile, setVideoFile]         = useState<File | null>(null);
  const [videoPreview, setVideoPreview]   = useState<string>("");
  const [videoUploadPct, setVideoUploadPct] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Depoimentos
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([
    { nome: "", texto: "", foto: "", fotoFile: undefined, fotoPreview: "" },
  ]);
  const depFotoRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const fetchFunnel = useCallback(async () => {
    if (!user || !id) return;
    try {
      const docSnap = await getDoc(doc(db, "funnels", id));
      if (!docSnap.exists()) { router.push("/dashboard"); return; }
      const data = docSnap.data();
      if (data.userId !== user.uid) { router.push("/dashboard"); return; }

      setTipoProduto(data.tipoProduto ?? "");
      setCorLayout(data.corLayout ?? "green");
      setForm({
        nomeProduto:    data.nomeProduto    ?? "",
        preco:          data.preco          ?? "",
        descricao:      data.descricao      ?? "",
        whatsapp:       data.whatsapp       ?? "",
        linkCompra:     data.linkCompra     ?? "",
        bonusIncluidos: data.bonusIncluidos ?? "",
        paraQuem:       data.paraQuem       ?? "",
        tempoEntrega:   data.tempoEntrega   ?? "",
        oQueInclui:     data.oQueInclui     ?? "",
        garantia:       data.garantia       ?? "",
      });

      // Imagem e vídeo já guardados → usar URL como preview
      if (data.imagemUrl) setImagemPreview(data.imagemUrl);
      if (data.videoUrl)  setVideoPreview(data.videoUrl);

      setDepoimentos(
        Array.isArray(data.depoimentos) && data.depoimentos.length > 0
          ? data.depoimentos.map((d: Depoimento) => ({
              ...d,
              fotoFile: undefined,
              fotoPreview: d.foto ?? "",
            }))
          : [{ nome: "", texto: "", foto: "", fotoFile: undefined, fotoPreview: "" }]
      );
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar funil.");
    } finally {
      setLoading(false);
    }
  }, [user, id, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchFunnel();
  }, [authLoading, user, fetchFunnel, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Imagem ──
  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagemFile(file);
    setImagemPreview(URL.createObjectURL(file));
  };
  const removeImagem = () => {
    setImagemFile(null);
    setImagemPreview("");
    setImagemUploadPct(0);
    if (imagemInputRef.current) imagemInputRef.current.value = "";
  };

  // ── Vídeo ──
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview("");
    setVideoUploadPct(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // ── Depoimentos ──
  const handleDepoimentoChange = (index: number, field: "nome" | "texto", value: string) => {
    setDepoimentos((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };
  const handleDepFotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setDepoimentos((prev) =>
      prev.map((d, i) => (i === index ? { ...d, fotoFile: file, fotoPreview: preview } : d))
    );
  };
  const removeDepFoto = (index: number) => {
    setDepoimentos((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, fotoFile: undefined, fotoPreview: "", foto: "" } : d
      )
    );
    if (depFotoRefs.current[index]) depFotoRefs.current[index]!.value = "";
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.nomeProduto || !form.preco || !form.whatsapp) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      // Imagem: só faz upload se veio um ficheiro novo
      let imagemUrl = imagemFile ? "" : imagemPreview;
      if (imagemFile) {
        imagemUrl = await uploadFile(
          imagemFile,
          `funnels/${user!.uid}/imagem_${Date.now()}`,
          setImagemUploadPct
        );
      }

      // Vídeo: só faz upload se veio um ficheiro novo
      let videoUrl = videoFile ? "" : videoPreview;
      if (videoFile) {
        videoUrl = await uploadFile(
          videoFile,
          `funnels/${user!.uid}/video_${Date.now()}`,
          setVideoUploadPct
        );
      }

      // Fotos dos depoimentos
      const depoimentosValidos = await Promise.all(
        depoimentos
          .filter((d) => d.nome && d.texto)
          .map(async (d) => {
            let fotoUrl = d.fotoFile ? "" : (d.fotoPreview ?? d.foto ?? "");
            if (d.fotoFile) {
              fotoUrl = await uploadFile(
                d.fotoFile,
                `funnels/${user!.uid}/dep_foto_${Date.now()}_${Math.random()}`
              );
            }
            return { nome: d.nome, texto: d.texto, foto: fotoUrl };
          })
      );

      await updateDoc(doc(db, "funnels", id), {
        ...form,
        tipoProduto,
        corLayout,
        imagemUrl,
        videoUrl,
        depoimentos: depoimentosValidos,
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition";

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-4 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Funil</h1>
        <p className="text-gray-400 text-sm mt-1">Atualize as informações do seu funil</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Tipo de produto ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Produto <span className="text-green-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tiposProduto.map((tipo) => (
              <button key={tipo.value} type="button" onClick={() => setTipoProduto(tipo.value)}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition ${
                  tipoProduto === tipo.value
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
                }`}>
                <span className={`mt-0.5 flex-shrink-0 ${tipoProduto === tipo.value ? "text-green-600" : "text-gray-400"}`}>
                  {tipo.icon}
                </span>
                <div>
                  <p className="text-sm font-medium">{tipo.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tipo.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Cor do layout ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Layout</label>
          <div className="flex flex-wrap gap-3">
            {coresLayout.map((c) => (
              <button key={c.value} type="button" onClick={() => setCorLayout(c.value)} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full border-4 transition ${corLayout === c.value ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c.cor }}
                />
                <span className="text-xs text-gray-500">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Nome ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome do Produto <span className="text-green-600">*</span>
          </label>
          <input type="text" name="nomeProduto" value={form.nomeProduto} onChange={handleChange}
            placeholder="Ex: Ténis Nike Air Max" className={inputClass} />
        </div>

        {/* ── Preço ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preço (MZN) <span className="text-green-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MZN</span>
            <input type="number" name="preco" value={form.preco} onChange={handleChange} placeholder="1999"
              className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
          </div>
        </div>

        {/* ── WhatsApp ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            WhatsApp <span className="text-green-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+258</span>
            <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="84 000 0000"
              className="w-full bg-white border border-gray-200 rounded-lg pl-14 pr-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
          </div>
        </div>

        {/* ── Descrição ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descrição <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange}
            placeholder="Descreva o produto com as suas palavras..." rows={4}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
        </div>

        {/* ══════════════════════════════════════════
            UPLOAD DE IMAGEM
        ══════════════════════════════════════════ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Imagem do Produto <span className="text-gray-400 font-normal">(opcional)</span>
          </label>

          {!imagemPreview ? (
            <button type="button" onClick={() => imagemInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-3 text-gray-400 hover:border-green-400 hover:text-green-600 transition group cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition group-hover:scale-110">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium">Clique para escolher uma imagem</p>
                <p className="text-xs mt-0.5">JPG, PNG, WEBP — máx. 10 MB</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={imagemPreview} alt="Preview" className="w-full h-48 object-cover" />
              {imagemUploadPct > 0 && imagemUploadPct < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${imagemUploadPct}%` }} />
                </div>
              )}
              <button type="button" onClick={removeImagem}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition">
                <IconX />
              </button>
              {imagemFile && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                  {imagemFile.name}
                </div>
              )}
            </div>
          )}
          <input ref={imagemInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImagemChange} className="hidden" />
        </div>

        {/* ══════════════════════════════════════════
            UPLOAD DE VÍDEO
        ══════════════════════════════════════════ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Vídeo do Produto <span className="text-gray-400 font-normal">(opcional)</span>
          </label>

          {!videoPreview ? (
            <button type="button" onClick={() => videoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-3 text-gray-400 hover:border-green-400 hover:text-green-600 transition group cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition group-hover:scale-110">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium">Clique para escolher um vídeo</p>
                <p className="text-xs mt-0.5">MP4, MOV, WEBM — máx. 100 MB</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
              {videoFile ? (
                <video src={videoPreview} controls className="w-full max-h-52 object-contain" />
              ) : (
                /* vídeo já guardado — mostra miniatura ou link */
                <div className="w-full h-32 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <span className="text-xs text-white/70">Vídeo guardado</span>
                </div>
              )}
              {videoUploadPct > 0 && videoUploadPct < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${videoUploadPct}%` }} />
                </div>
              )}
              <button type="button" onClick={removeVideo}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition">
                <IconX />
              </button>
              {videoFile && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                  {videoFile.name}
                </div>
              )}
            </div>
          )}
          <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/ogg"
            onChange={handleVideoChange} className="hidden" />
        </div>

        {/* ── Garantia ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Garantia <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input type="text" name="garantia" value={form.garantia} onChange={handleChange}
            placeholder="Ex: 7 dias de garantia ou devolução do dinheiro" className={inputClass} />
        </div>

        {/* ── Campos específicos por tipo ── */}
        {(tipoProduto === "ebook" || tipoProduto === "curso") && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">
              {tipoProduto === "ebook" ? "Detalhes do Ebook" : "Detalhes do Curso"}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Para quem é?</label>
              <input type="text" name="paraQuem" value={form.paraQuem} onChange={handleChange}
                placeholder="Ex: Empreendedores que querem vender mais" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bónus incluídos</label>
              <textarea name="bonusIncluidos" value={form.bonusIncluidos} onChange={handleChange}
                placeholder="Ex: Planilha + Grupo VIP" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Link de compra directa</label>
              <input type="url" name="linkCompra" value={form.linkCompra} onChange={handleChange}
                placeholder="https://hotmart.com/..." className={inputClass} />
            </div>
          </div>
        )}

        {tipoProduto === "produto_fisico" && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
            <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Detalhes do Produto</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">O que está incluído?</label>
              <textarea name="oQueInclui" value={form.oQueInclui} onChange={handleChange}
                placeholder="Ex: 1 par de ténis + caixa original" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition resize-none" />
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
                placeholder="Ex: Design + 3 revisões + ficheiros finais" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition resize-none" />
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
                placeholder="Ex: Produto + embalagem + entrega" rows={2}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition resize-none" />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            DEPOIMENTOS
        ══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Depoimentos</label>
              <p className="text-gray-400 text-xs mt-0.5">O que os seus clientes dizem</p>
            </div>
            <button type="button" onClick={() => setDepoimentos((prev) => [...prev, { nome: "", texto: "", foto: "", fotoFile: undefined, fotoPreview: "" }])}
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
                    <button type="button" onClick={() => setDepoimentos((prev) => prev.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-600 text-xs transition">
                      Remover
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Foto + Nome */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {dep.fotoPreview ? (
                        <>
                          <img src={dep.fotoPreview} alt="Foto"
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                          <button type="button" onClick={() => removeDepFoto(index)}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => depFotoRefs.current[index]?.click()}
                          className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 hover:border-green-400 bg-white flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-green-500 transition"
                          title="Adicionar foto do cliente">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-mt-0.5">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                          </svg>
                        </button>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        ref={(el) => { depFotoRefs.current[index] = el; }}
                        onChange={(e) => handleDepFotoChange(index, e)} />
                    </div>

                    <input type="text" placeholder="Nome do cliente *" value={dep.nome}
                      onChange={(e) => handleDepoimentoChange(index, "nome", e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition" />
                  </div>

                  <textarea placeholder="O que o cliente disse... *" value={dep.texto}
                    onChange={(e) => handleDepoimentoChange(index, "texto", e.target.value)} rows={3}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500 transition resize-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feedback ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            <span className="text-green-700 text-sm">Funil atualizado! Redirecionando...</span>
          </div>
        )}

        {/* ── Botão submit ── */}
        <button type="submit" disabled={saving || success}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {imagemUploadPct > 0 && imagemUploadPct < 100
                ? `A enviar imagem… ${imagemUploadPct}%`
                : videoUploadPct > 0 && videoUploadPct < 100
                ? `A enviar vídeo… ${videoUploadPct}%`
                : "Guardando…"}
            </>
          ) : "Guardar Alterações"}
        </button>
      </form>
    </div>
  );
}
