/**
 * Types Supabase générés automatiquement.
 *
 * Pour régénérer :
 *   pnpm db:types
 * ou manuellement :
 *   supabase gen types typescript --project-id <project-ref> > packages/db/src/types.ts
 *
 * Ce fichier est en .gitignore — ne pas committer les types générés.
 * En attendant la génération réelle, les types sont inlinés dans chaque fichier
 * via l'import `import type { Database } from "@/lib/supabase/types"`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Stub Database en attendant la génération réelle via `pnpm db:types`.
 * Remplacer par le type généré une fois le projet Supabase provisionné.
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type UserRole = "employee" | "manager" | "admin" | "super_admin";
export type ConsentScope =
  | "phishing_simulation"
  | "behavior_analytics"
  | "individual_reporting";
export type ModuleDifficulty = "beginner" | "intermediate" | "advanced";
export type ModuleKind =
  | "micro_lesson"
  | "video"
  | "quiz"
  | "jit_remediation"
  | "podcast";
export type CompletionStatus = "started" | "completed" | "abandoned";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "completed"
  | "cancelled";
export type CampaignChannel = "email" | "sms" | "whatsapp";
export type PhishingEventType =
  | "delivered"
  | "opened"
  | "clicked"
  | "submitted_credentials"
  | "reported";
export type AuditAction =
  | "login"
  | "logout"
  | "profile_update"
  | "consent_grant"
  | "consent_revoke"
  | "module_started"
  | "module_completed"
  | "campaign_created"
  | "campaign_sent"
  | "score_computed"
  | "export_requested";
