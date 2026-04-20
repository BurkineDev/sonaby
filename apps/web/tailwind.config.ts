import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Palette institutionnelle SONABHY ────────────────────────────────
        // Navy profond : autorité, État, secteur hydrocarbures
        navy: {
          "50":  "#EEF2F9",
          "100": "#D5DFEF",
          "200": "#ACC0DF",
          "300": "#7A9AC8",
          "400": "#4F76AE",
          "500": "#2F5696",
          "600": "#1F3F7A",
          "700": "#163061",
          "800": "#102449",
          "900": "#0B1933",
          DEFAULT: "#163061",
        },
        // Or SONABHY : chaleur africaine, prestige, hydrocarbures
        gold: {
          "50":  "#FDF8EC",
          "100": "#FAEDCC",
          "200": "#F5D899",
          "300": "#EFBC5E",
          "400": "#E8A228",
          "500": "#C98B1A",
          "600": "#A67015",
          "700": "#7D530F",
          "800": "#543809",
          "900": "#2C1E04",
          DEFAULT: "#C98B1A",
          foreground: "#FFFFFF",
        },
        // Tokens UI de base
        bg: {
          DEFAULT: "#F8F9FC",
          subtle:  "#F1F3F8",
          muted:   "#E4E8F0",
        },
        fg: {
          DEFAULT: "#0F1B36",
          muted:   "#4A5568",
          subtle:  "#718096",
        },
        primary: {
          "50":  "#EEF2F9",
          "100": "#D5DFEF",
          "500": "#163061",
          "600": "#102449",
          "700": "#0B1933",
          "900": "#060F1F",
          DEFAULT: "#163061",
          foreground: "#FFFFFF",
        },
        risk: {
          critical:  "#C0392B",
          high:      "#E67E22",
          medium:    "#D4AC0D",
          low:       "#27AE60",
          excellent: "#1ABC9C",
        },
        border:     "#DDE2EE",
        input:      "#DDE2EE",
        ring:       "#163061",
        background: "#F8F9FC",
        foreground: "#0F1B36",
        card: {
          DEFAULT:    "#FFFFFF",
          foreground: "#0F1B36",
        },
        muted: {
          DEFAULT:    "#F1F3F8",
          foreground: "#4A5568",
        },
        accent: {
          DEFAULT:    "#FDF8EC",
          foreground: "#7D530F",
        },
        destructive: {
          DEFAULT:    "#C0392B",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        xl:    "12px",
        lg:    "10px",
        md:    "8px",
        sm:    "4px",
      },
      boxShadow: {
        xs:      "0 1px 2px 0 rgba(22,48,97,0.06)",
        sm:      "0 2px 4px 0 rgba(22,48,97,0.08)",
        DEFAULT: "0 4px 12px 0 rgba(22,48,97,0.10)",
        md:      "0 8px 24px 0 rgba(22,48,97,0.12)",
        lg:      "0 16px 40px 0 rgba(22,48,97,0.14)",
        gold:    "0 4px 16px 0 rgba(201,139,26,0.25)",
        navy:    "0 4px 16px 0 rgba(22,48,97,0.30)",
      },
      backgroundImage: {
        "gradient-navy": "linear-gradient(135deg, #163061 0%, #0B1933 100%)",
        "gradient-gold":  "linear-gradient(135deg, #E8A228 0%, #C98B1A 100%)",
        "gradient-card":  "linear-gradient(180deg, #FFFFFF 0%, #F8F9FC 100%)",
        "gradient-hero":  "linear-gradient(135deg, #163061 0%, #1F3F7A 50%, #2F5696 100%)",
      },
      animation: {
        "score-fill": "scoreFill 1s ease-out forwards",
        "fade-up":    "fadeUp 0.4s ease-out",
      },
      keyframes: {
        scoreFill: {
          "0%":   { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--dash-offset)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
