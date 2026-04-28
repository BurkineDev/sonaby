"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: string;
  fullName: string;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Campagnes", icon: Mail, exact: false },
  { href: "/admin/content", label: "Contenus", icon: BookOpen, exact: false },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, exact: false },
  { href: "/admin/reports", label: "Rapports", icon: FileText, exact: false },
];

const RESTRICTED_ITEMS = [
  { href: "/admin/audit", label: "Journal d'audit", icon: ClipboardList, roles: ["super_admin"] },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, roles: ["super_admin"] },
];

export function AdminSidebar({ role, fullName }: Props) {
  const pathname = usePathname();

  const initials = fullName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* ── Mobile : barre de navigation basse ───────────────────────────── */}
      <nav
        aria-label="Navigation administration"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(11,25,51,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 touch-manipulation"
                style={{ minHeight: "44px", color: isActive ? "#E8A228" : "rgba(255,255,255,0.45)" }}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #E8A228, #C98B1A)" }}
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")}
                  aria-hidden="true"
                />
                <span
                  className="font-semibold tracking-wide"
                  style={{ fontSize: "9px", opacity: isActive ? 1 : 0.7 }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop : sidebar fixe ────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 flex-col min-h-screen shrink-0 sticky top-0"
        style={{ background: "linear-gradient(180deg, #0B1933 0%, #163061 100%)" }}
        aria-label="Navigation administration"
      >
        {/* Logo SONABHY */}
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
              <p className="text-xs font-medium" style={{ color: "#E8A228" }}>
                SONABHY — Administration
              </p>
            </div>
          </div>
          <div
            className="mt-5 h-px"
            style={{ background: "linear-gradient(90deg, #C98B1A 0%, transparent 100%)" }}
          />
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 px-3 py-5 space-y-1" role="navigation">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Navigation
          </p>

          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(90deg, rgba(201,139,26,0.20) 0%, rgba(201,139,26,0.06) 100%)",
                        borderLeft: "3px solid #C98B1A",
                      }
                    : { borderLeft: "3px solid transparent" }
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-gold-400" : "text-white/40 group-hover:text-white/70"
                  )}
                  aria-hidden="true"
                  style={isActive ? { color: "#E8A228" } : undefined}
                />
                {label}
                {isActive && (
                  <ChevronRight
                    className="w-3.5 h-3.5 ml-auto shrink-0"
                    style={{ color: "#C98B1A" }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}

          {/* Items restreints (super_admin) */}
          {RESTRICTED_ITEMS.filter((item) => item.roles.includes(role)).length > 0 && (
            <div className="pt-5 mt-5 border-t border-white/10">
              <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                Administration avancée
              </p>
              {RESTRICTED_ITEMS.filter((item) => item.roles.includes(role)).map(
                ({ href, label, icon: Icon }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                        isActive
                          ? "text-white"
                          : "text-white/60 hover:text-white hover:bg-white/8"
                      )}
                      style={
                        isActive
                          ? {
                              background: "linear-gradient(90deg, rgba(201,139,26,0.20) 0%, rgba(201,139,26,0.06) 100%)",
                              borderLeft: "3px solid #C98B1A",
                            }
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
                }
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
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
            <Link
              href="/employee"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              Espace employé
            </Link>
            <Link
              href="/welcome"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              Page de présentation
            </Link>
          </div>

          <p className="text-xs mt-4 px-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            CyberGuard v1.0 · Marché Lot 2
          </p>
        </div>
      </aside>
    </>
  );
}
