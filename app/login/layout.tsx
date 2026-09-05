import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | FunilApp",
  description: "Acesse sua conta FunilApp para criar e gerir os seus funis de vendas com captação de leads via WhatsApp.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}