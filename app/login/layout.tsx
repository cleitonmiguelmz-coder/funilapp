import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FunilApp — Funis de Vendas com WhatsApp para Moçambique",
  description: "Crie funis de vendas, capte leads e receba contactos direto no WhatsApp. Plataforma feita para empreendedores e vendedores em Moçambique.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}