"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Delivery {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  tipo: string;
  fotoUrl?: string;
  status: string;
  trialFim?: Timestamp;
  online?: boolean;
  precoBase?: number;
  avaliacaoMedia?: number;
  totalEntregas?: number;
  zonas?: string;
}

const zonas = [
  "Todas", "Matola", "KaMpfumo", "Polana", "Sommerschield", "Museu", "Alto-Maé", "Maxaquene",
];

const tipos = [
  { value: "todos", label: "Todos" },
  { value: "moto", label: "Moto" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "peao", label: "Peão" },
];

const VERDE = "#1D9E75";
const VERDE_ESCURO = "#0F6E56";
const VERDE_CLARO = "#E1F5EE";
const VERDE_MEDIO = "#9FE1CB";

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [zona, setZona] = useState("Todas");
  const [tipo, setTipo] = useState("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const agora = new Date();
      const snap = await getDocs(query(
        collection(db, "deliveries"),
        where("status", "in", ["trial", "activo"])
      ));

      const data: Delivery[] = [];
      snap.docs.forEach((d) => {
        const delivery = { id: d.id, ...d.data() } as Delivery;
        if (delivery.status === "trial" && delivery.trialFim) {
          if (delivery.trialFim.toDate() < agora) return;
        }
        data.push(delivery);
      });

      data.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
      setDeliveries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtrados = deliveries.filter((d) => {
    if (zona !== "Todas" && d.cidade !== zona) return false;
    if (tipo !== "todos" && d.tipo !== tipo) return false;
    if (search && !d.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const onlineCount = filtrados.filter((d) => d.online).length;

  const iniciais = (nome: string) =>
    nome.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("");

  const renderStars = (media?: number) => {
    const rating = media ?? 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width="11" height="11" viewBox="0 0 24 24"
            fill={i <= Math.round(rating) ? VERDE : VERDE_CLARO}>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
        <span style={{ fontSize: 11, color: "#888780", marginLeft: 4 }}>
          {rating > 0 ? rating.toFixed(1) : "Novo"}
        </span>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f9f7" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ backgroundColor: VERDE }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                backgroundColor: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                  stroke={VERDE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 500, fontSize: 15, lineHeight: 1, margin: 0 }}>FunilApp</p>
                <p style={{ color: VERDE_MEDIO, fontSize: 11, marginTop: 2, margin: 0 }}>Delivery</p>
              </div>
            </div>
            <Link href="/delivery/registar" style={{
              backgroundColor: "#fff",
              color: VERDE_ESCURO,
              fontSize: 12,
              fontWeight: 500,
              padding: "7px 14px",
              borderRadius: 20,
              textDecoration: "none",
            }}>
              Trabalhar como delivery
            </Link>
          </div>

          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 500, letterSpacing: -0.5, marginBottom: 4 }}>
            Encontra um delivery<br />em Maputo
          </h1>
          <p style={{ color: VERDE_MEDIO, fontSize: 13, marginBottom: 16 }}>
            {onlineCount > 0
              ? <><span style={{ color: "#fff", fontWeight: 500 }}>{onlineCount}</span> disponível{onlineCount !== 1 ? "is" : ""} agora</>
              : "Matola, Cidade, KaMpfumo e arredores"}
          </p>

          <div style={{ position: "relative" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#B4B2A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", backgroundColor: "#fff",
                border: "none", borderRadius: 12,
                padding: "11px 14px 11px 38px",
                fontSize: 13, color: "#1a1a1a",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 20px 48px" }}>

        {/* Filtros */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 16,
          padding: 16, marginBottom: 14,
          border: `0.5px solid ${VERDE_CLARO}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Zona
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {zonas.map((z) => (
              <button key={z} onClick={() => setZona(z)} style={{
                padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: "none", cursor: "pointer",
                backgroundColor: zona === z ? VERDE : "#f4f9f7",
                color: zona === z ? "#fff" : "#5F5E5A",
              }}>
                {z}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 10, fontWeight: 500, color: "#888780", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Tipo de entrega
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tipos.map((t) => (
              <button key={t.value} onClick={() => setTipo(t.value)} style={{
                padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: "none", cursor: "pointer",
                backgroundColor: tipo === t.value ? VERDE : "#f4f9f7",
                color: tipo === t.value ? "#fff" : "#5F5E5A",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 160 }}>
            <div style={{
              width: 28, height: 28,
              border: `2.5px solid ${VERDE}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>

        ) : filtrados.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            padding: "48px 24px", textAlign: "center",
            border: `0.5px solid ${VERDE_CLARO}`,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              backgroundColor: VERDE_CLARO,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={VERDE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <p style={{ fontWeight: 500, color: "#1a1a1a", marginBottom: 4 }}>
              Nenhum entregador disponível agora
            </p>
            <p style={{ fontSize: 13, color: "#888780" }}>
              Tenta outra zona ou volta mais tarde
            </p>
          </div>

        ) : (
          <>
            <p style={{ fontSize: 11, color: "#888780", marginBottom: 10 }}>
              {filtrados.length} entregador{filtrados.length !== 1 ? "es" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtrados.map((d) => (
                <div key={d.id} style={{
                  backgroundColor: "#fff", borderRadius: 16,
                  border: `0.5px solid ${VERDE_CLARO}`, overflow: "hidden",
                }}>
                  <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>

                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {d.fotoUrl ? (
                        <img src={d.fotoUrl} alt={d.nome}
                          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div style={{
                          width: 48, height: 48, borderRadius: "50%",
                          backgroundColor: VERDE_CLARO, color: VERDE_ESCURO,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, fontWeight: 500,
                        }}>
                          {iniciais(d.nome)}
                        </div>
                      )}
                      <div style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 12, height: 12, borderRadius: "50%",
                        backgroundColor: d.online ? VERDE : "#D3D1C7",
                        border: "2px solid #fff",
                      }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontWeight: 500, fontSize: 14, color: "#1a1a1a", margin: 0 }}>{d.nome}</p>
                        {d.online && (
                          <span style={{
                            fontSize: 10, fontWeight: 500,
                            backgroundColor: VERDE_CLARO, color: VERDE_ESCURO,
                            padding: "2px 7px", borderRadius: 10,
                          }}>
                            Disponível
                          </span>
                        )}
                        {!d.avaliacaoMedia && (
                          <span style={{
                            fontSize: 10, fontWeight: 500,
                            backgroundColor: VERDE_CLARO, color: VERDE_ESCURO,
                            padding: "2px 7px", borderRadius: 10,
                          }}>
                            Novo
                          </span>
                        )}
                      </div>

                      {renderStars(d.avaliacaoMedia)}

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#888780", display: "flex", alignItems: "center", gap: 3 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                            stroke="#888780" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
                          {d.cidade}
                        </span>
                        <span style={{ color: VERDE_CLARO }}>·</span>
                        <span style={{ fontSize: 11, color: "#888780" }}>
                          {d.tipo === "moto" ? "Moto" : d.tipo === "bicicleta" ? "Bicicleta" : "Peão"}
                        </span>
                        {d.totalEntregas && d.totalEntregas > 0 && (
                          <>
                            <span style={{ color: VERDE_CLARO }}>·</span>
                            <span style={{ fontSize: 11, color: "#888780" }}>{d.totalEntregas} entregas</span>
                          </>
                        )}
                      </div>

                      {d.zonas && (
                        <p style={{ fontSize: 11, color: "#B4B2A9", marginTop: 3 }}>{d.zonas}</p>
                      )}
                    </div>

                    {/* Preço */}
                    {d.precoBase ? (
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "#888780", margin: 0 }}>A partir de</p>
                        <p style={{ fontSize: 16, fontWeight: 500, color: VERDE, margin: 0 }}>{d.precoBase} MT</p>
                      </div>
                    ) : null}
                  </div>

                  {/* CTAs */}
                  <div style={{ padding: "0 14px 14px", display: "flex", gap: 8 }}>
                    <a
                      href={`https://wa.me/258${d.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá *${d.nome}*! Vi o teu perfil no FunilApp Delivery e preciso de uma entrega.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, backgroundColor: VERDE, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 0", borderRadius: 10,
                        fontSize: 13, fontWeight: 500, textDecoration: "none",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.856L.057 23.882l6.187-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.879.936-3.629-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                      </svg>
                      Contactar
                    </a>
                    <Link href={`/delivery/${d.id}`} style={{
                      backgroundColor: VERDE_CLARO, color: VERDE_ESCURO,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "10px 14px", borderRadius: 10,
                      fontSize: 13, fontWeight: 500, textDecoration: "none",
                    }}>
                      Ver perfil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
