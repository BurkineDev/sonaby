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
          "950": "#070F22",
          DEFAULT: "#163061",
        },
        gold: {
          "50":  "#FDF8EC",
          "100": "#FAEDCC",
          "200": "#F5D899",
          "300": "#EFBC5E",
          "400": "#E8A228",
          "500": "#C98B1A",
          "600": "#A67015",
          "700": "#7D530F",
          DEFAULT: "#C98B1A",
          foreground: "#FFFFFF",
        },
        app: "#EEF1F8",
        surface: "#FFFFFF",
        fg: {
          DEFAULT: "#0F1B36",
          secondary: "#4A5E7A",
          muted:     "#8496B0",
          inverse:   "#FFFFFF",
        },
        border: "#E2E8F4",
        ring:   "#163061",
        risk: {
          critical:  "#C0392B",
          high:      "#E67E22",
          medium:    "#D4AC0D",
          low:       "#27AE60",
          excellent: "#1ABC9C",
        },
        primary: {
          DEFAULT:    "#163061",
          foreground: "#FFFFFF",
          "50":  "#EEF2F9",
          "500": "#163061",
          "600": "#102449",
          "700": "#0B1933",
        },
        background: "#EEF1F8",
        foreground: "#0F1B36",
        card: {
          DEFAULT:    "#FFFFFF",
          foreground: "#0F1B36",
        },
        muted: {
          DEFAULT:    "#EEF1F8",
          foreground: "#4A5E7A",
        },
        accent: {
          DEFAULT:    "#FDF8EC",
          foreground: "#7D530F",
        },
        destructive: {
          DEFAULT:    "#C0392B",
          foreground: "#FFFFFF",
        },
        input:  "#E2E8F4",
        bg: {
          DEFAULT: "#EEF1F8",
          subtle:  "#E8ECF4",
          muted:   "#DDE3EF",
        },
      },
      fontFamily: {
        sans: ["var(--font-lexend)", "Lexend", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        xl:    "12px",
        lg:    "10px",
        md:    "8px",
        sm:    "6px",
        xs:    "4px",
      },
      boxShadow: {
        xs:      "0 1px 2px 0 rgba(22,48,97,0.05)",
        sm:      "0 2px 6px 0 rgba(22,48,97,0.07)",
        DEFAULT: "0 4px 12px 0 rgba(22,48,97,0.09)",
        md:      "0 8px 24px 0 rgba(22,48,97,0.11)",
        lg:      "0 16px 40px 0 rgba(22,48,97,0.14)",
        xl:      "0 24px 60px 0 rgba(22,48,97,0.18)",
        gold:    "0 4px 20px 0 rgba(201,139,26,0.28)",
        navy:    "0 4px 20px 0 rgba(22,48,97,0.32)",
        card:    "0 2px 8px 0 rgba(22,48,97,0.07), 0 0 0 1px rgba(226,232,244,1)",
        "card-hover": "0 8px 24px 0 rgba(22,48,97,0.12), 0 0 0 1px rgba(22,48,97,0.08)",
        inner:   "inset 0 1px 3px 0 rgba(22,48,97,0.10)",
      },
      backgroundImage: {
        "gradient-navy":    "linear-gradient(135deg, #163061 0%, #0B1933 100%)",
        "gradient-navy-2":  "linear-gradient(160deg, #0D1B36 0%, #163061 60%, #1F3F7A 100%)",
        "gradient-gold":    "linear-gradient(135deg, #E8A228 0%, #C98B1A 100%)",
        "gradient-card":    "linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)",
        "gradient-hero":    "linear-gradient(160deg, #0D1B36 0%, #163061 55%, #2F5696 100%)",
        "gradient-surface": "linear-gradient(180deg, #F8FAFD 0%, #EEF1F8 100%)",
        "stripe-navy":      "linear-gradient(180deg, #163061 0%, #163061aa 100%)",
        "stripe-gold":      "linear-gradient(180deg, #C98B1A 0%, #C98B1Aaa 100%)",
      },
      animation: {
        "fade-up":       "fadeUp 0.35s ease-out both",
        "fade-in":       "fadeIn 0.25s ease-out both",
        "slide-in-left": "slideInLeft 0.3s ease-out both",
        "scale-in":      "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
        "skeleton":      "skeleton 1.5s ease-in-out infinite",
        "score-fill":    "scoreFill 1.2s cubic-bezier(0.4,0,0.2,1) both",
        "ring-pulse":    "ringPulse 2.4s ease-in-out infinite",
        "shimmer":       "shimmer 1.8s ease-in-out infinite",
        "jit-beacon":    "jitBeacon 2s ease-in-out infinite",
        "progress-fill": "progressFill 0.9s ease-out both",
        "glow-gold":     "glowGold 2.4s ease-in-out infinite",
        "pop-in":        "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        "count-up":      "countUp 0.35s ease-out both",
        "bounce-soft":   "bounceSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.88)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        skeleton: {
          "0%, 100%": { opacity: "0.5" },
          "50%":      { opacity: "1" },
        },
        scoreFill: {
          "0%":   { strokeDashoffset: "327" },
        },
        ringPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,139,26,0.4)" },
          "50%":      { boxShadow: "0 0 0 12px rgba(201,139,26,0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        jitBeacon: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(230,126,34,0.55)" },
          "50%":      { boxShadow: "0 0 0 10px rgba(230,126,34,0)" },
        },
        progressFill: {
          "from": { width: "0%" },
        },
        glowGold: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(232,162,40,0.35), 0 0 40px rgba(232,162,40,0.12)" },
          "50%":      { boxShadow: "0 0 32px rgba(232,162,40,0.60), 0 0 64px rgba(232,162,40,0.22)" },
        },
        popIn: {
          "0%":   { transform: "scale(0.4) rotate(-8deg)", opacity: "0" },
          "60%":  { transform: "scale(1.12) rotate(2deg)" },
          "80%":  { transform: "scale(0.96)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        countUp: {
          "from": { opacity: "0", transform: "translateY(6px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)", opacity: "1" },
          "50%":      { transform: "translateY(6px)", opacity: "0.5" },
        },
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      zIndex: {
        "60": "60",
        "70": "70",
      },
    },
  },
  plugins: [animate],
};

export default config;
