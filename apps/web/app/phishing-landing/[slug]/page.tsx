/**
 * Landing page factice post-clic phishing.
 *
 * Flux UX (spec 08-ui-ux-spec.md §7.2) :
 * 1. Affiche une page visuellement crédible pendant 3 secondes
 * 2. Révèle le bandeau "Ceci était une simulation" automatiquement
 * 3. Propose le debrief avec les 4 indices à repérer
 * 4. Lance un micro-module JIT si disponible
 *
 * Ton : adulte et factuel, pas moralisateur.
 */
import type { Metadata } from "next";
import { PhishingDebriefPage } from "./phishing-debrief";

export const metadata: Metadata = {
  title: "Simulation de cybersécurité — SONABHY CyberGuard",
  robots: "noindex, nofollow", // Ne pas indexer les pages de simulation
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ send?: string }>;
}

// Définition des landings factices contextualisées
const LANDING_CONFIGS: Record<
  string,
  {
    name: string;
    redFlags: string[];
    context: string;
  }
> = {
  "orange-money-verify": {
    name: "Vérification Orange Money",
    redFlags: [
      "L'URL du lien ne correspond pas au domaine officiel d'Orange (orange.bf)",
      "La demande de PIN complet est une pratique qu'Orange Money ne fait jamais",
      "L'email d'envoi utilisait un domaine similaire mais différent (@orange-bf.com au lieu de @orange.bf)",
      "La création d'urgence (\"Votre compte sera suspendu dans 24h\") est une technique classique d'hameçonnage",
    ],
    context: "Simulation : faux email Orange Money demandant une vérification de compte",
  },
  "sonabhy-rh": {
    name: "RH SONABHY — Mise à jour informations",
    redFlags: [
      "L'expéditeur était rh@sonabhy-update.com, pas le domaine officiel sonabhy.bf",
      "SONABHY ne demande jamais les informations bancaires par email",
      "Le logo utilisé était légèrement différent de l'original (pixels décalés)",
      "Le lien pointait vers un domaine différent de l'intranet SONABHY",
    ],
    context: "Simulation : faux email RH SONABHY demandant une mise à jour de vos informations",
  },
  "min-finances": {
    name: "Ministère des Finances — Remboursement",
    redFlags: [
      "Le Ministère des Finances ne contacte jamais par email pour des remboursements",
      "L'adresse email d'expéditeur (@minfinances-bf.org) n'est pas le domaine officiel",
      "La promesse de remboursement urgent est une technique de fraude courante",
      "Le formulaire demandait vos coordonnées bancaires, ce qu'aucune administration ne fait par email",
    ],
    context: "Simulation : faux email du Ministère des Finances promettant un remboursement",
  },
  "moov-money": {
    name: "Vérification Moov Money",
    redFlags: [
      "Le SMS/email provenait d'un numéro/domaine non officiel Moov",
      "Moov Money ne demande jamais votre code secret par message",
      "La demande d'action immédiate en 30 minutes est une technique de pression",
      "Le lien pointait vers un domaine similaire mais différent de moov.bf",
    ],
    context: "Simulation : faux message Moov Money demandant une vérification urgente",
  },
  default: {
    name: "Email suspect",
    redFlags: [
      "Vérifiez toujours l'adresse email complète de l'expéditeur, pas seulement le nom affiché",
      "Méfiez-vous des demandes urgentes demandant des informations personnelles ou un clic immédiat",
      "Survolez les liens avant de cliquer pour voir la vraie destination (URL dans la barre de statut)",
      "En cas de doute, contactez directement l'organisation par un canal connu, pas en répondant à l'email",
    ],
    context: "Simulation d'hameçonnage générique",
  },
};

export default async function PhishingLandingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { send: sendId } = await searchParams;

  const config = LANDING_CONFIGS[slug] ?? LANDING_CONFIGS["default"]!;

  return (
    <PhishingDebriefPage
      sendId={sendId ?? null}
      config={config}
      slug={slug}
    />
  );
}
