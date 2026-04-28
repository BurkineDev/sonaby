"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Users,
  BookOpen,
  FileText,
  ClipboardList,
  Settings,
  Shield,
  ChevronRight,
  Flame,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: string;
  fullName: string;
}

const NAV_ITEMS = [
  { href: "/admin",           label: "Tableau de bord",    icon: LayoutDashboard, exact: true  },
  { href: "/admin/campaigns", label: "Campagnes phishing", icon: Mail,            exact: false },
  { href: "/admin/content",   label: "Contenus & modules", icon: BookOpen,        exact: false },
  { href: "/admin/users",     label: "Utilisateurs",       icon: Users,           exact: false },
  { href: "/admin/reports",   label: "Rapports direction", icon: FileText,        exact: false },
];

const RESTRICTED_ITEMS = [
  { href: "/admin/audit",    label: "Journal d'audit", icon: ClipboardList, roles: ["super_admin"] },
  { href: "/admin/settings", label: "Paramètres",      icon: Settings,      roles: ["super_admin"] },
];

function NavLinks({
  role,
  pathname,
  onClose = () => {},
}: {
  role: string;
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
        Navigation
      </p>

      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/8"
            )}
            style={
              isActive
                ? { background: "linear-gradient(90deg, rgba(201,139,26,0.20) 0%, rgba(201,139,26,0.06) 100%)", borderLeft: "3px solid #C98B1A" }
                : { borderLeft: "3px solid transparent" }
            }
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn("w-4 h-4 shrink-0 transition-colors", !isActive && "text-white/40 group-hover:text-white/70")}
              aria-hidden="true"
              style={isActive ? { color: "#E8A228" } : undefined}
            />
            {label}
            {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: "#C98B1A" }} aria-hidden="true" />}
          </Link>
        );
      })}

      {RESTRICTED_ITEMS.filter((i) => i.roles.includes(role)).length > 0 && (
        <div className="pt-5 mt-5 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Administration avancée
          </p>
          {RESTRICTED_ITEMS.filter((i) => i.roles.includes(role)).map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/8"
                )}
                style={
                  isActive
                    ? { background: "linear-gradient(90deg, rgba(201,139,26,0.20) 0%, rgba(201,139,26,0.06) 100%)", borderLeft: "3px solid #C98B1A" }
                    : { borderLeft: "3px solid transparent" }
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={isActive ? { color: "#E8A228" } : { color: "rgba(255,255,255,0.4)" }}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export function AdminSidebar({ role, fullName }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = fullName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const footer = (
    <div className="px-4 py-4 border-t border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{fullName}</p>
          <p className="text-xs capitalize" style={{ color: "#E8A228" }}>
            {role === "super_admin" ? "Super Admin" : "Administrateur"}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Link href="/employee" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" /> Espace employé
        </Link>
        <Link href="/welcome" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Page de présentation
        </Link>
      </div>
      <p className="text-xs mt-4 px-2" style={{ color: "rgba(255,255,255,0.2)" }}>CyberGuard v1.0 · Marché Lot 2</p>
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          MOBILE : barre supérieure fixe + tiroir latéral
          ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* Barre supérieure — h-14, toujours visible sur mobile */}
        <header
          className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 gap-3"
          style={{
            background: "linear-gradient(135deg, #0B1933 0%, #163061 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          }}
        >
          {/* Bouton hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            <Menu className="w-5 h-5 text-white" aria-hidden="true" />
          </button>

          {/* Logo centré */}
          <div className="flex-1 flex items-center gap-2 justify-center">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
            >
              <Flame className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">CyberGuard</span>
            <span className="text-xs font-medium" style={{ color: "#E8A228" }}>Administration</span>
          </div>

          {/* Avatar initiales (droit) */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
            aria-hidden="true"
          >
            {initials}
          </div>
        </header>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Tiroir latéral */}
        <aside
          id="mobile-nav-drawer"
          className={cn(
            "fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          )}
          style={{ background: "linear-gradient(180deg, #0B1933 0%, #163061 100%)" }}
          aria-label="Navigation administration"
          aria-hidden={!mobileOpen}
        >
          {/* En-tête du tiroir */}
          <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #E8A228 0%, #C98B1A 100%)" }}
              >
                <Flame className="w-4.5 h-4.5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">CyberGuard</p>
                <p className="text-xs font-medium" style={{ color: "#E8A228" }}>SONABHY — Administration</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Liens de navigation */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            <NavLinks role={role} pathname={pathname} onClose={() => setMobileOpen(false)} />
          </nav>

          {footer}
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP : sidebar fixe toujours visible
          ══════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex w-64 flex-col min-h-screen shrink-0 sticky top-0"
        style={{ background: "linear-gradient(180deg, #0B1933 0%, #163061 100%)" }}
        aria-label="Navigation administration"
      >
        {/* Logo desktop */}
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E8A228 0%, #C98B1A 100%)" }}
            >
              <Flame className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">CyberGuard</p>
              <p className="text-xs font-medium" style={{ color: "#E8A228" }}>SONABHY — Administration</p>
            </div>
          </div>
          <div className="mt-5 h-px" style={{ background: "linear-gradient(90deg, #C98B1A 0%, transparent 100%)" }} />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" role="navigation">
          <NavLinks role={role} pathname={pathname} />
        </nav>

        {footer}
      </aside>
    </>
  );
}
