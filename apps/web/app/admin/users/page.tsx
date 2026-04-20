import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UserRow } from "./user-row";
import { Users, ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "Gestion des utilisateurs" };

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  // Charger tous les profils de l'organisation, avec leur dernier score
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      is_active,
      departments(name),
      risk_scores(score, snapshot_date)
    `)
    .order("full_name", { ascending: true });

  // Charger les consentements phishing actifs
  const { data: consents } = await supabase
    .from("security_consents")
    .select("user_id, scope, granted")
    .eq("scope", "phishing_simulation");

  // Construire un set des userId avec consentement phishing actif
  const phishingConsent = new Set<string>();
  if (consents) {
    // Prendre le dernier consentement par user
    const byUser = new Map<string, { granted: boolean; idx: number }>();
    consents.forEach((c, i) => {
      const existing = byUser.get(c.user_id);
      if (!existing || i > existing.idx) {
        byUser.set(c.user_id, { granted: c.granted, idx: i });
      }
    });
    byUser.forEach((v, uid) => {
      if (v.granted) phishingConsent.add(uid);
    });
  }

  // Enrichir les profils
  const users = (profiles ?? []).map((p) => {
    const scores = p.risk_scores as { score: number; snapshot_date: string }[] | null;
    const latestScore = scores
      ? [...scores].sort((a, b) =>
          b.snapshot_date.localeCompare(a.snapshot_date)
        )[0]?.score ?? null
      : null;

    const dept = p.departments as unknown as { name: string } | null;

    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      role: p.role,
      is_active: p.is_active ?? true,
      department: dept?.name ?? null,
      risk_score: latestScore,
      consent_phishing: phishingConsent.has(p.id),
    };
  });

  // Stats rapides
  const activeCount = users.filter((u) => u.is_active).length;
  const consentCount = users.filter((u) => u.consent_phishing).length;
  const adminCount = users.filter((u) =>
    ["admin", "super_admin"].includes(u.role)
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-DEFAULT">Gestion des utilisateurs</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            {activeCount} utilisateur(s) actif(s) · {consentCount} consentement(s) phishing
          </p>
        </div>
      </div>

      {/* Bannière anonymisation */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 flex gap-2 text-sm text-primary-800">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-primary-600" />
        <span>
          Les scores individuels sont visibles uniquement par les administrateurs. Aucune donnée individuelle n&apos;est exposée dans les rapports agrégés.
        </span>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Utilisateurs actifs", value: activeCount, sub: `sur ${users.length} total` },
          { label: "Consentement phishing", value: consentCount, sub: "utilisateurs ciblables" },
          { label: "Administrateurs", value: adminCount, sub: "dont super_admin" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-border p-4">
            <p className="text-3xl font-bold font-mono text-fg-DEFAULT">{stat.value}</p>
            <p className="text-sm font-medium text-fg-DEFAULT mt-1">{stat.label}</p>
            <p className="text-xs text-fg-subtle mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-white p-12 text-center space-y-2">
          <Users className="w-10 h-10 text-fg-subtle mx-auto" />
          <p className="text-fg-muted">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-bg-subtle border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Utilisateur
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden md:table-cell">
                  Département
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Rôle
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                  Risk Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                  Phishing OK
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <UserRow key={u.id} user={u} isSelf={u.id === me?.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
