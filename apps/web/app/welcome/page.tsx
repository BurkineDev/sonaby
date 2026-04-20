import { LandingPage } from "@/app/landing-page";

/**
 * /welcome — Page de présentation publique de la plateforme CyberGuard SONABHY.
 * Accessible à tous (connectés ou non). Pas de redirection auth.
 */
export const metadata = {
  title: "CyberGuard SONABHY — Plateforme de Sensibilisation Cybersécurité",
  description:
    "Découvrez CyberGuard, la solution de sensibilisation cybersécurité déployée par WendTech pour SONABHY.",
};

export default function WelcomePage() {
  return <LandingPage />;
}
