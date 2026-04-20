import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne les classes Tailwind intelligemment. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retourne la couleur sémantique du Risk Score selon la bande.
 * 0-30 : critical, 31-50 : high, 51-70 : medium, 71-85 : low, 86-100 : excellent
 */
export function getRiskColor(score: number): string {
  if (score <= 30) return "text-risk-critical";
  if (score <= 50) return "text-risk-high";
  if (score <= 70) return "text-risk-medium";
  if (score <= 85) return "text-risk-low";
  return "text-risk-excellent";
}

export function getRiskBgColor(score: number): string {
  if (score <= 30) return "bg-red-50 border-red-200";
  if (score <= 50) return "bg-amber-50 border-amber-200";
  if (score <= 70) return "bg-yellow-50 border-yellow-200";
  if (score <= 85) return "bg-green-50 border-green-200";
  return "bg-teal-50 border-teal-200";
}

export function getRiskLabel(score: number): string {
  if (score <= 30) return "Critique";
  if (score <= 50) return "Élevé";
  if (score <= 70) return "Modéré";
  if (score <= 85) return "Faible";
  return "Exemplaire";
}

/** Formate un nombre en FCFA. */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-BF", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Formate une date FR-BF. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-BF", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-BF", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Tronque un texte à N caractères. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
