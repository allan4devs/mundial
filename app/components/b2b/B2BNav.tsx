"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Map,
  ClipboardList,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  House,
  X,
  Sparkles,
  Building2,
  BellRing,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/helpers/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/b2b/dashboard", label: "Command Center", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/b2b/tours", label: "Tours", icon: <Map className="h-4 w-4" /> },
  { href: "/b2b/bookings", label: "Reservas", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/b2b/profile", label: "Perfil", icon: <BellRing className="h-4 w-4" /> },
];

const ACCESS_SHORTCUTS = [
  { href: "/", label: "Inicio", icon: <House className="h-4 w-4" /> },
  { href: "/dashboard", label: "Usuario", icon: <UserRound className="h-4 w-4" /> },
  { href: "/b2b/admin", label: "Admin", icon: <ShieldCheck className="h-4 w-4" /> },
];

interface B2BNavProps {
  operatorName: string;
  company: string;
}

export default function B2BNav({ operatorName, company }: B2BNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/b2b/auth/logout", { method: "POST" });
    router.push("/b2b/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <Link href="/b2b/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-900/30">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">La Vieja Adventures</p>
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              <Sparkles className="h-3 w-3" /> B2B Global
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-300"
                  : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-right shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:block">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{operatorName}</p>
            <p className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Building2 className="h-3.5 w-3.5" />
              {company}
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {ACCESS_SHORTCUTS.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {shortcut.icon}
                {shortcut.label}
              </Link>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="hidden items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 md:flex"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-zinc-200 p-2 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-2 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          <div className="mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{operatorName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{company}</p>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-1 gap-2 pt-2">
              {ACCESS_SHORTCUTS.map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {shortcut.icon}
                  {shortcut.label}
                </Link>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
