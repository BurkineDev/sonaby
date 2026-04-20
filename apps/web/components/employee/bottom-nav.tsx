"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BarChart2, User, Flame, Settings2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: string;
}

const NAV_ITEMS = [
  { href: "/employee",          label: "Accueil",    icon: Home,     exact: true },
  { href: "/employee/parcours", label: "Parcours",   icon: BookOpen, exact: false },
  { href: "/employee/score",    label: "Mon score",  icon: BarChart2,exact: false },
  { href: "/employee/profil",   label: "Profil",     icon: User,     exact: false },
];

export function BottomNav({ role }: Props) {
  const pathname = usePathname();
  const isAdmin  = ["admin", "rssi", "super_admin"].includes(role);

  return (
    <>
      {/* ── Mobile : barre du bas fixe ──────────────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden"
        style={{ borderColor: "#DDE2EE", boxShadow: "0 -4px 16px rgba(22,48,97,0.08)" }}
      >
        <div className="flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors"
                style={isActive ? { color: "#163061" } : { color: "#A0AEC0" }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className={isActive ? "font-semibold" : "font-normal"}>{label}</span>
                {/* Point actif */}
                {isActive && (
                  <span
                    className="absolute bottom-0.5 w-1 h-1 rounded-full"
                    style={{ backgroundColor: "#C98B1A" }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop : sidebar latérale ───────────────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col py-0 z-50"
        style={{ background: "linear-gradient(180deg, #0B1933 0%, #163061 100%)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-6 border-b"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
          >
            <Flame className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">CyberGuard</p>
            <p className="text-xs font-medium" style={{ color: "#E8A228" }}>SONABHY</p>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 flex-1 px-3 py-5">
          <p
            className="text-xs font-semibold uppercase tracking-widest px-3 mb-3"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            Mon espace
          </p>

          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive ? "text-white" : "text-white/55 hover:text-white hover:bg-white/8"
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
                  style={isActive ? { color: "#E8A228" } : { color: "rgba(255,255,255,0.40)" }}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Footer : liens utiles */}
        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
              Espace administration
            </Link>
          )}
          <Link
            href="/welcome"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Page de présentation
          </Link>
        </div>
      </nav>

      {/* Desktop : spacer pour la sidebar */}
      <div className="hidden md:block w-56 shrink-0" aria-hidden="true" />
    </>
  );
}
