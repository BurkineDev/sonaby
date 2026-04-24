"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BarChart2, User, Flame, Settings2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: string;
}

const NAV_ITEMS = [
  { href: "/employee",          label: "Accueil",   icon: Home,      exact: true  },
  { href: "/employee/parcours", label: "Parcours",  icon: BookOpen,  exact: false },
  { href: "/employee/score",    label: "Score",     icon: BarChart2, exact: false },
  { href: "/employee/profil",   label: "Profil",    icon: User,      exact: false },
];

export function BottomNav({ role }: Props) {
  const pathname = usePathname();
  const isAdmin = ["admin", "rssi", "super_admin"].includes(role);

  return (
    <>
      {/* ── Mobile : barre glassmorphism ─────────────────────────── */}
      <nav
        aria-label="Navigation principale"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(226,232,244,0.8)",
          boxShadow: "0 -4px 24px rgba(22,48,97,0.08)",
        }}
      >
        <div className="flex items-stretch h-16 safe-area-inset-bottom">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 touch-manipulation",
                  isActive ? "text-navy" : "text-fg-muted"
                )}
                style={{ minHeight: "44px", color: isActive ? "#163061" : "#8496B0" }}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Pill indicateur actif */}
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
                  className="text-xs font-semibold tracking-wide"
                  style={{ fontSize: "10px", opacity: isActive ? 1 : 0.6 }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop : sidebar navy ────────────────────────────────── */}
      <aside
        aria-label="Navigation principale"
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-50"
        style={{
          background: "linear-gradient(180deg, #0D1B36 0%, #163061 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #E8A228, #C98B1A)",
              boxShadow: "0 4px 12px rgba(201,139,26,0.35)",
            }}
          >
            <Flame className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">CyberGuard</p>
            <p className="text-xs font-semibold" style={{ color: "#E8A228" }}>SONABHY</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          <p
            className="font-bold uppercase tracking-widest px-3 mb-3"
            style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)" }}
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
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "text-white"
                    : "hover:bg-white/[0.06]"
                )}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(90deg, rgba(201,139,26,0.22) 0%, rgba(201,139,26,0.08) 100%)",
                        borderLeft: "2px solid #E8A228",
                        color: "white",
                      }
                    : {
                        borderLeft: "2px solid transparent",
                        color: "rgba(255,255,255,0.50)",
                      }
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="w-4 h-4 shrink-0 transition-colors duration-200"
                  style={{ color: isActive ? "#E8A228" : "rgba(255,255,255,0.40)" }}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-4 space-y-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer hover:bg-white/[0.06]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
              Administration
            </Link>
          )}
          <Link
            href="/welcome"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer hover:bg-white/[0.06]"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Page de présentation
          </Link>
        </div>
      </aside>

    </>
  );
}
