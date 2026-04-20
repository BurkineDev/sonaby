"use client";

import { useActionState, useTransition } from "react";
import { updateUserRole, toggleUserActive, type ActionState } from "./actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, UserCheck, UserX } from "lucide-react";

type UserRowProps = {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    is_active: boolean;
    department: string | null;
    risk_score: number | null;
    consent_phishing: boolean;
  };
  isSelf: boolean;
};

const ROLE_OPTIONS = [
  { value: "employee", label: "Employé" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  employee: "outline",
  manager: "secondary",
  admin: "default",
  super_admin: "destructive",
};

export function UserRow({ user, isSelf }: UserRowProps) {
  const [isPending, startTransition] = useTransition();
  const [roleState, roleAction] = useActionState<ActionState, FormData>(
    updateUserRole,
    {}
  );
  const [activeState, activeAction] = useActionState<ActionState, FormData>(
    toggleUserActive,
    {}
  );

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <tr
      className={cn(
        "hover:bg-bg-subtle transition-colors",
        !user.is_active && "opacity-60"
      )}
    >
      {/* Identité */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-DEFAULT truncate">
              {user.full_name ?? "—"}
              {isSelf && (
                <span className="ml-1 text-xs text-fg-subtle">(vous)</span>
              )}
            </p>
            <p className="text-xs text-fg-muted truncate">{user.email ?? "—"}</p>
          </div>
        </div>
      </td>

      {/* Département */}
      <td className="px-4 py-3 hidden md:table-cell text-sm text-fg-muted">
        {user.department ?? "—"}
      </td>

      {/* Rôle */}
      <td className="px-4 py-3">
        {user.role === "super_admin" || isSelf ? (
          <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>
            {user.role === "super_admin" ? "Super Admin" : ROLE_OPTIONS.find(r => r.value === user.role)?.label ?? user.role}
          </Badge>
        ) : (
          <form
            action={(fd) => startTransition(() => roleAction(fd))}
          >
            <input type="hidden" name="userId" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              onChange={(e) => {
                const fd = new FormData();
                fd.set("userId", user.id);
                fd.set("role", e.target.value);
                startTransition(() => roleAction(fd));
              }}
              className="text-sm border border-border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[36px]"
              disabled={isPending}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </form>
        )}
      </td>

      {/* Score */}
      <td className="px-4 py-3 hidden lg:table-cell text-sm font-mono text-fg-DEFAULT">
        {user.risk_score !== null ? (
          <span
            className={cn(
              "font-semibold",
              user.risk_score >= 85
                ? "text-risk-excellent"
                : user.risk_score >= 70
                ? "text-risk-low"
                : user.risk_score >= 50
                ? "text-risk-medium"
                : user.risk_score >= 30
                ? "text-risk-high"
                : "text-risk-critical"
            )}
          >
            {user.risk_score}
          </span>
        ) : (
          <span className="text-fg-subtle">N/A</span>
        )}
      </td>

      {/* Consentement phishing */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            user.consent_phishing
              ? "bg-green-100 text-risk-low"
              : "bg-gray-100 text-fg-subtle"
          )}
        >
          {user.consent_phishing ? "Oui" : "Non"}
        </span>
      </td>

      {/* Statut / action */}
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <form action={(fd) => startTransition(() => activeAction(fd))}>
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="hidden"
              name="active"
              value={user.is_active ? "false" : "true"}
            />
            <button
              type="submit"
              disabled={isPending}
              title={user.is_active ? "Désactiver" : "Activer"}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                user.is_active
                  ? "text-fg-muted hover:text-risk-high hover:bg-red-50"
                  : "text-fg-muted hover:text-risk-low hover:bg-green-50"
              )}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : user.is_active ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}
