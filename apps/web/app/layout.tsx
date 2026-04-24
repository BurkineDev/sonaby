import type { Metadata, Viewport } from "next";
import { Lexend, Fira_Code } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | CyberGuard SONABHY",
    default: "CyberGuard SONABHY — Plateforme de sensibilisation cybersécurité",
  },
  description:
    "Réduisez le risque humain en cybersécurité avec des simulations contextualisées et un apprentissage adaptatif.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CyberGuard",
  },
};

export const viewport: Viewport = {
  themeColor: "#163061",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${lexend.variable} ${firaCode.variable} font-sans bg-app text-fg antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
