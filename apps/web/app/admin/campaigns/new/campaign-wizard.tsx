"use client";

import { useActionState, useState, useTransition } from "react";
import { createCampaign, type CreateCampaignState } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
  Loader2,
  Shield,
  AlertTriangle,
  Users,
  Calendar,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id: string;
  name: string;
  channel: string;
  difficulty: string;
  topic_tags: string[];
  subject: string | null;
};

type Department = {
  id: string;
  name: string;
  member_count?: number;
};

type WizardProps = {
  templates: Template[];
  departments: Department[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: "Email", icon: <Mail className="w-4 h-4" />, color: "text-primary-600" },
  sms: { label: "SMS", icon: <Smartphone className="w-4 h-4" />, color: "text-risk-medium" },
  whatsapp: { label: "WhatsApp", icon: <MessageSquare className="w-4 h-4" />, color: "text-risk-low" },
};

const DIFFICULTY_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  easy: { label: "Facile", variant: "secondary" },
  medium: { label: "Moyen", variant: "default" },
  hard: { label: "Difficile", variant: "destructive" },
};

const ROLE_OPTIONS = [
  { value: "employee", label: "Employés" },
  { value: "manager", label: "Managers" },
  { value: "admin", label: "Administrateurs" },
];

const STEPS = [
  { id: 1, label: "Template", icon: BookOpen },
  { id: 2, label: "Ciblage", icon: Users },
  { id: 3, label: "Planification", icon: Calendar },
  { id: 4, label: "Confirmation", icon: Check },
];

// ─── Wizard steps ──────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Étapes" className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                  done
                    ? "bg-primary-600 border-primary-600 text-white"
                    : active
                    ? "border-primary-600 text-primary-600 bg-white"
                    : "border-border text-fg-subtle bg-bg-subtle"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  active ? "text-primary-600" : done ? "text-fg-DEFAULT" : "text-fg-subtle"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-1rem]",
                  done ? "bg-primary-600" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

function Step1Templates({
  templates,
  selected,
  onSelect,
}: {
  templates: Template[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-fg-DEFAULT">Choisir un template de simulation</h2>
        <p className="text-sm text-fg-muted mt-1">
          Sélectionnez le scénario qui correspond le mieux au profil de votre cohorte cible.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-10 text-fg-muted border border-dashed rounded-lg">
          Aucun template disponible. Contactez votre administrateur.
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => {
            const channel = CHANNEL_META[t.channel] ?? CHANNEL_META["email"]!;
            const diff = DIFFICULTY_META[t.difficulty] ?? DIFFICULTY_META["medium"]!;
            const isSelected = selected === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary-600 bg-primary-50"
                    : "border-border hover:border-primary-300 hover:bg-bg-subtle"
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={channel.color}>{channel.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-fg-DEFAULT truncate">{t.name}</p>
                      {t.subject && (
                        <p className="text-xs text-fg-muted mt-0.5 truncate">
                          Sujet : {t.subject}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={diff.variant} className="text-xs">{diff.label}</Badge>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                {t.topic_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.topic_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-xs bg-bg-subtle text-fg-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Step2Targeting({
  departments,
  selectedDepts,
  selectedRoles,
  onToggleDept,
  onToggleRole,
}: {
  departments: Department[];
  selectedDepts: string[];
  selectedRoles: string[];
  onToggleDept: (id: string) => void;
  onToggleRole: (role: string) => void;
}) {
  const totalSelected =
    selectedDepts.length + selectedRoles.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg-DEFAULT">Cibler la cohorte</h2>
        <p className="text-sm text-fg-muted mt-1">
          Si aucun critère n&apos;est sélectionné, la campagne ciblera tous les employés ayant donné leur consentement.
        </p>
      </div>

      {/* Départements */}
      <div>
        <h3 className="text-sm font-medium text-fg-DEFAULT mb-2">Départements</h3>
        <div className="grid grid-cols-2 gap-2">
          {departments.map((dept) => {
            const checked = selectedDepts.includes(dept.id);
            return (
              <label
                key={dept.id}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  checked ? "border-primary-600 bg-primary-50" : "border-border hover:bg-bg-subtle"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleDept(dept.id)}
                  className="rounded accent-primary-600"
                  name="target_department_ids"
                  value={dept.id}
                />
                <span className="text-sm text-fg-DEFAULT flex-1">{dept.name}</span>
                {dept.member_count !== undefined && (
                  <span className="text-xs text-fg-subtle">{dept.member_count}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Rôles */}
      <div>
        <h3 className="text-sm font-medium text-fg-DEFAULT mb-2">Rôles</h3>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((role) => {
            const checked = selectedRoles.includes(role.value);
            return (
              <label
                key={role.value}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  checked ? "border-primary-600 bg-primary-50" : "border-border hover:bg-bg-subtle"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleRole(role.value)}
                  className="rounded accent-primary-600"
                  name="target_roles"
                  value={role.value}
                />
                <span className="text-sm text-fg-DEFAULT">{role.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {totalSelected > 0 && (
        <div className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 rounded-lg px-3 py-2">
          <Users className="w-4 h-4" />
          <span>
            {selectedDepts.length > 0 && `${selectedDepts.length} département(s)`}
            {selectedDepts.length > 0 && selectedRoles.length > 0 && " + "}
            {selectedRoles.length > 0 && `${selectedRoles.length} rôle(s) sélectionné(s)`}
          </span>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          Seuls les utilisateurs ayant explicitement consenti à la simulation phishing seront ciblés, conformément à la loi 010-2004/AN BF.
        </span>
      </div>
    </div>
  );
}

function Step3Schedule({
  name,
  scheduledAt,
  onChangeName,
  onChangeDate,
  errors,
}: {
  name: string;
  scheduledAt: string;
  onChangeName: (v: string) => void;
  onChangeDate: (v: string) => void;
  errors?: Record<string, string[]>;
}) {
  // Min date = maintenant + 10 min
  const minDate = new Date(Date.now() + 10 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg-DEFAULT">Planification</h2>
        <p className="text-sm text-fg-muted mt-1">
          Nommez votre campagne et définissez la date d&apos;envoi.
        </p>
      </div>

      {/* Nom */}
      <div className="space-y-1">
        <label htmlFor="campaign-name" className="block text-sm font-medium text-fg-DEFAULT">
          Nom de la campagne <span className="text-risk-critical">*</span>
        </label>
        <input
          id="campaign-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Ex: Simulation phishing Août 2026 — DSI"
          className={cn(
            "w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500",
            errors?.name ? "border-risk-critical" : "border-border"
          )}
          maxLength={120}
        />
        {errors?.name && (
          <p className="text-xs text-risk-critical">{errors.name[0]}</p>
        )}
        <p className="text-xs text-fg-subtle">{name.length}/120</p>
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label htmlFor="scheduled-at" className="block text-sm font-medium text-fg-DEFAULT">
          Date et heure d&apos;envoi <span className="text-risk-critical">*</span>
        </label>
        <input
          id="scheduled-at"
          name="scheduled_at"
          type="datetime-local"
          value={scheduledAt}
          min={minDate}
          onChange={(e) => onChangeDate(e.target.value)}
          className={cn(
            "w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500",
            errors?.scheduled_at ? "border-risk-critical" : "border-border"
          )}
        />
        {errors?.scheduled_at && (
          <p className="text-xs text-risk-critical">{errors.scheduled_at[0]}</p>
        )}
        <p className="text-xs text-fg-subtle">
          Heure locale Ouagadougou (UTC+0). L&apos;envoi est déclenché automatiquement par l&apos;Edge Function.
        </p>
      </div>

      <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 flex gap-2 text-sm text-primary-800">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-primary-600" />
        <span>
          Une fois lancée, la campagne ne peut pas être annulée. Vérifiez les paramètres à l&apos;étape suivante avant de confirmer.
        </span>
      </div>
    </div>
  );
}

function Step4Confirm({
  name,
  template,
  selectedDepts,
  selectedRoles,
  scheduledAt,
  departments,
  errors,
}: {
  name: string;
  template: Template | null;
  selectedDepts: string[];
  selectedRoles: string[];
  scheduledAt: string;
  departments: Department[];
  errors?: Record<string, string[]>;
}) {
  const deptNames = departments
    .filter((d) => selectedDepts.includes(d.id))
    .map((d) => d.name);

  const roleNames = ROLE_OPTIONS.filter((r) =>
    selectedRoles.includes(r.value)
  ).map((r) => r.label);

  const channel = template ? CHANNEL_META[template.channel] ?? CHANNEL_META["email"]! : null;
  const diff = template ? DIFFICULTY_META[template.difficulty] ?? DIFFICULTY_META["medium"]! : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg-DEFAULT">Confirmation</h2>
        <p className="text-sm text-fg-muted mt-1">
          Vérifiez les paramètres avant de créer la campagne.
        </p>
      </div>

      <dl className="divide-y divide-border rounded-lg border border-border bg-white">
        <div className="px-4 py-3 flex justify-between gap-3">
          <dt className="text-sm text-fg-subtle">Nom</dt>
          <dd className="text-sm font-medium text-fg-DEFAULT text-right">{name || "—"}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-3">
          <dt className="text-sm text-fg-subtle">Template</dt>
          <dd className="text-sm font-medium text-fg-DEFAULT text-right flex items-center gap-2">
            {channel && <span className={channel.color}>{channel.icon}</span>}
            {template?.name ?? "—"}
            {diff && <Badge variant={diff.variant} className="text-xs">{diff.label}</Badge>}
          </dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-3">
          <dt className="text-sm text-fg-subtle">Cible</dt>
          <dd className="text-sm font-medium text-fg-DEFAULT text-right">
            {deptNames.length === 0 && roleNames.length === 0
              ? "Tous les employés consentants"
              : [...deptNames, ...roleNames].join(", ")}
          </dd>
        </div>
        <div className="px-4 py-3 flex justify-between gap-3">
          <dt className="text-sm text-fg-subtle">Envoi planifié</dt>
          <dd className="text-sm font-medium text-fg-DEFAULT text-right">
            {scheduledAt
              ? new Date(scheduledAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </dd>
        </div>
      </dl>

      {errors?.message && (
        <div className="rounded-lg border border-risk-critical bg-red-50 p-3 text-sm text-risk-critical flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {errors.message}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <span>
          Cette action est irréversible. La campagne sera envoyée automatiquement à la date planifiée aux utilisateurs consentants.
        </span>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function CampaignWizard({ templates, departments }: WizardProps) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [templateId, setTemplateId] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [state, formAction] = useActionState<CreateCampaignState, FormData>(
    createCampaign,
    {}
  );

  const selectedTemplate =
    templates.find((t) => t.id === templateId) ?? null;

  const toggleDept = (id: string) =>
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  const toggleRole = (role: string) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );

  // Validation par étape
  const canGoNext = (): boolean => {
    if (step === 1) return templateId !== "";
    if (step === 2) return true; // ciblage optionnel
    if (step === 3) return name.trim().length >= 3 && scheduledAt !== "";
    return false;
  };

  const handleNext = () => {
    if (canGoNext()) setStep((s) => s + 1);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Ajouter les valeurs d'état qui ne sont pas dans des inputs hidden
    fd.set("template_id", templateId);
    fd.set("name", name);
    fd.set("scheduled_at", scheduledAt);
    // Les checkboxes sont déjà dans fd via les inputs nommés
    selectedDepts.forEach((id) => fd.append("target_department_ids", id));
    selectedRoles.forEach((r) => fd.append("target_roles", r));

    startTransition(() => {
      formAction(fd);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StepIndicator current={step} />

      {/* Contenu de l'étape */}
      <div className="min-h-[320px]">
        {step === 1 && (
          <Step1Templates
            templates={templates}
            selected={templateId}
            onSelect={setTemplateId}
          />
        )}
        {step === 2 && (
          <Step2Targeting
            departments={departments}
            selectedDepts={selectedDepts}
            selectedRoles={selectedRoles}
            onToggleDept={toggleDept}
            onToggleRole={toggleRole}
          />
        )}
        {step === 3 && (
          <Step3Schedule
            name={name}
            scheduledAt={scheduledAt}
            onChangeName={setName}
            onChangeDate={setScheduledAt}
            {...(state.errors ? { errors: state.errors } : {})}
          />
        )}
        {step === 4 && (
          <Step4Confirm
            name={name}
            template={selectedTemplate}
            selectedDepts={selectedDepts}
            selectedRoles={selectedRoles}
            scheduledAt={scheduledAt}
            departments={departments}
            {...(state.message ? { errors: { message: [state.message] } } : {})}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1 || isPending}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </Button>

        {step < 4 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext() || isPending}
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours…
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Créer la campagne
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
