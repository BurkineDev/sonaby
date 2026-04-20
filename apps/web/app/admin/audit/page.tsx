import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ShieldAlert, User, Settings, LogIn, Mail, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Journal d'audit" };
export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_META: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  login: { label: "Connexion", icon: <LogIn className="w-3 h-3" />, variant: "secondary" },
  logout: { label: "Déconnexion", icon: <LogIn className="w-3 h-3" />, variant: "outline" },
  mfa_challenge: { label: "Défi MFA", icon: <ShieldAlert className="w-3 h-3" />, variant: "secondary" },
  consent_grant: { label: "Consentement accordé", icon: <ShieldAlert className="w-3 h-3" />, variant: "default" },
  consent_revoke: { label: "Consentement révoqué", icon: <ShieldAlert className="w-3 h-3" />, variant: "destructive" },
  create_campaign: { label: "Campagne créée", icon: <Mail className="w-3 h-3" />, variant: "secondary" },
  launch_campaign: { label: "Campagne lancée", icon: <Mail className="w-3 h-3" />, variant: "default" },
  cancel_campaign: { label: "Campagne annulée", icon: <Mail className="w-3 h-3" />, variant: "destructive" },
  view_individual_report: { label: "Consultation individuelle", icon: <Eye className="w-3 h-3" />, variant: "destructive" },
  export_report: { label: "Export rapport", icon: <Settings className="w-3 h-3" />, variant: "secondary" },
  role_change: { label: "Rôle modifié", icon: <User className="w-3 h-3" />, variant: "destructive" },
  data_export_request: { label: "Demande export données", icon: <Settings className="w-3 h-3" />, variant: "outline" },
  data_deletion_request: { label: "Demande suppression", icon: <Settings className="w-3 h-3" />, variant: "destructive" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const supabase = await createClient();

  // Vérifier le rôle — seul super_admin accède
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/admin");
  }

  const { page: pageStr, action: actionFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("audit_log")
    .select(
      "id, actor_email, action, target_resource, justification, ip_address, occurred_at, metadata",
      { count: "exact" }
    )
    .order("occurred_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  const { data: logs, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Actions distinctes pour le filtre
  const { data: distinctActions } = await supabase
    .from("audit_log")
    .select("action")
    .order("action");

  const actions = [...new Set((distinctActions ?? []).map((r) => r.action))];

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-DEFAULT">Journal d'audit</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            Append-only · Accès restreint super_admin · {count ?? 0} entrées
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-red-50 text-risk-critical border border-red-200 rounded-full font-medium">
          <ShieldAlert className="w-3 h-3" />
          Super admin only
        </div>
      </div>

      {/* Bannière légale */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 flex gap-2 text-sm text-primary-800">
        <ClipboardList className="w-4 h-4 shrink-0 mt-0.5 text-primary-600" />
        <span>
          Ce journal est immuable (append-only au niveau base de données). Toute consultation de
          rapport individuel (<code className="font-mono text-xs">view_individual_report</code>) doit
          obligatoirement comporter une justification tracée, conformément à la politique
          RGPD/loi 010-2004 BF.
        </span>
      </div>

      {/* Filtres */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/admin/audit"
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              !actionFilter
                ? "bg-primary-700 text-white border-primary-700"
                : "border-border text-fg-muted hover:bg-bg-subtle"
            }`}
          >
            Tous
          </a>
          {actions.map((action) => {
            const meta = ACTION_META[action];
            return (
              <a
                key={action}
                href={`/admin/audit?action=${action}`}
                className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  actionFilter === action
                    ? "bg-primary-700 text-white border-primary-700"
                    : "border-border text-fg-muted hover:bg-bg-subtle"
                }`}
              >
                {meta?.icon}
                {meta?.label ?? action}
              </a>
            );
          })}
        </div>
      )}

      {/* Tableau */}
      {!logs || logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-white p-12 text-center space-y-2">
          <ClipboardList className="w-10 h-10 text-fg-subtle mx-auto" />
          <p className="text-fg-muted text-sm">
            Aucune entrée d'audit enregistrée.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-bg-subtle border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Date / Heure
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Acteur
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden md:table-cell">
                  Ressource cible
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                  Justification
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden xl:table-cell">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const meta = ACTION_META[log.action];
                const isSensitive = log.action === "view_individual_report";

                return (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isSensitive ? "bg-red-50 hover:bg-red-100" : "hover:bg-bg-subtle"
                    }`}
                  >
                    <td className="px-4 py-3 text-fg-muted text-xs whitespace-nowrap">
                      {formatDateTime(log.occurred_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-DEFAULT truncate max-w-[160px]">
                      {log.actor_email}
                    </td>
                    <td className="px-4 py-3">
                      {meta ? (
                        <Badge variant={meta.variant} className="gap-1 text-xs">
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-fg-muted">{log.action}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-fg-muted text-xs truncate max-w-[160px]">
                      {log.target_resource ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-fg-muted text-xs max-w-[200px]">
                      {log.justification ? (
                        <span className="italic">{log.justification}</span>
                      ) : isSensitive ? (
                        <span className="text-risk-critical font-medium">MANQUANTE ⚠</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell font-mono text-xs text-fg-subtle">
                      {log.ip_address ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination du journal d'audit"
          className="flex items-center justify-center gap-2"
        >
          {page > 1 && (
            <a
              href={`/admin/audit?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-subtle transition-colors"
            >
              ← Précédent
            </a>
          )}
          <span className="text-sm text-fg-muted">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/audit?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-subtle transition-colors"
            >
              Suivant →
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
