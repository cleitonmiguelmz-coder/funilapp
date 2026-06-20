"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const ADMIN_EMAIL = "appmarketmz@gmail.com";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Visão Geral",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/dashboard/create-funnel",
      label: "Novo Funil",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      href: "/dashboard/leads",
      label: "Leads",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: "/dashboard/profile",
      label: "Perfil & Planos",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 tracking-widest uppercase">Carregando</span>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-30
          flex flex-col transition-transform duration-300 ease-in-out shadow-sm
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FunilApp" width={32} height={32} className="rounded-lg" />
            <span className="text-gray-900 font-bold text-lg tracking-tight">FunilApp</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                <span className={isActive ? "text-green-600" : "text-gray-400"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          {/* Separador */}
          <div className="pt-3 pb-1">
            <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider px-3">
              Serviços
            </p>
          </div>

          {/* Delivery — encontrar */}
          <Link
            href="/delivery"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${pathname.startsWith("/delivery") && !pathname.startsWith("/delivery/registar") && !pathname.startsWith("/delivery/dashboard")
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            <span className={pathname.startsWith("/delivery") && !pathname.startsWith("/delivery/registar") ? "text-blue-500" : "text-gray-400"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16,8 20,8 23,11 23,16 16,16 16,8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </span>
            Encontrar Delivery
          </Link>

          {/* Ser Delivery */}
          <Link
            href="/delivery/registar"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${pathname.startsWith("/delivery/registar")
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            <span className={pathname.startsWith("/delivery/registar") ? "text-blue-500" : "text-gray-400"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </span>
            Ser Delivery
          </Link>

          {/* FunilMarket */}
          <Link
            href="/market"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${pathname.startsWith("/market")
                ? "bg-red-50 text-red-700 border border-red-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            <span className={pathname.startsWith("/market") ? "text-red-500" : "text-gray-400"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </span>
            FunilMarket
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mt-2
                ${pathname.startsWith("/admin")
                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                  : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                }
              `}
            >
              <span className="text-amber-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              Painel Admin
            </Link>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold uppercase">
                {user.email?.[0] ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-xs font-semibold truncate">{user.email}</p>
              <p className="text-gray-400 text-xs">Plano Gratuito</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FunilApp" width={24} height={24} className="rounded-md" />
            <span className="text-gray-900 font-bold text-sm">FunilApp</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}