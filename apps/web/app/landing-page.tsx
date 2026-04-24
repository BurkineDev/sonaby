"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Shield, ShieldCheck, BarChart3, Brain, Target,
  AlertTriangle, TrendingUp, Users, Mail, Smartphone,
  CheckCircle2, ArrowRight, Flame, ChevronRight,
} from "lucide-react";

// ─── Compteur animé au scroll ─────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = to / 50;
        const t = setInterval(() => {
          cur += step;
          if (cur >= to) { setVal(to); clearInterval(t); } else setVal(Math.floor(cur));
        }, 30);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{val.toLocaleString("fr-BF")}{suffix}</span>;
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(11,25,51,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
          >
            <Flame className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="leading-none">
            <span className="text-white font-bold text-sm tracking-tight">CyberGuard</span>
            <span className="block text-xs font-semibold" style={{ color: "#E8A228" }}>SONABHY</span>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #E8A228, #C98B1A)",
            color: "white",
            boxShadow: "0 2px 12px rgba(232,162,40,0.30)",
          }}
        >
          Connexion
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #040D1E 0%, #0B1933 40%, #163061 80%, #1F3F7A 100%)" }}
    >
      {/* Glow décoratif */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(201,139,26,0.18) 0%, rgba(22,48,97,0.05) 60%, transparent 100%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />

      {/* Badge institutionnel */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 animate-fade-in"
        style={{
          background: "rgba(201,139,26,0.12)",
          border: "1px solid rgba(201,139,26,0.30)",
          color: "#F5C842",
        }}
      >
        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
        Société Nationale Burkinabè des Hydrocarbures — Lot 2
      </div>

      {/* Titre */}
      <h1
        className="text-center font-bold leading-tight mb-6 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <span className="block text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
          Réduire le risque humain.
        </span>
        <span
          className="block"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            background: "linear-gradient(90deg, #E8A228, #F5C842, #C98B1A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Mesurer la maturité cyber.
        </span>
      </h1>

      <p
        className="text-center max-w-xl leading-relaxed mb-10 animate-fade-up"
        style={{ color: "rgba(255,255,255,0.58)", fontSize: "1.075rem", animationDelay: "200ms" }}
      >
        CyberGuard transforme la sensibilisation cybersécurité en données exploitables —
        simulations contextualisées, micro-learning adaptatif, reporting direction en temps réel.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: "300ms" }}>
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #E8A228, #C98B1A)",
            color: "white",
            boxShadow: "0 6px 28px rgba(201,139,26,0.40)",
          }}
        >
          Accéder à la plateforme
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <a
          href="#fonctionnalites"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-white/10"
          style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.78)" }}
        >
          Découvrir la solution
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>

      {/* Stats rapides */}
      <div
        className="mt-20 w-full max-w-2xl animate-fade-up rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          animationDelay: "400ms",
        }}
      >
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: "rgba(255,255,255,0.09)" }}>
          {[
            { value: 90, suffix: "%", label: "Des incidents liés au facteur humain" },
            { value: 60, suffix: "%", label: "De réduction du taux de clic phishing" },
            { value: 12, suffix: " mois", label: "Pour une maturité cyber mesurable" },
          ].map(({ value, suffix, label }) => (
            <div key={label} className="px-6 py-6 text-center" style={{ borderColor: "rgba(255,255,255,0.09)" }}>
              <p className="text-2xl font-bold font-mono text-white mb-1">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Fonctionnalités ──────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Mail,
      color: "#E67E22",
      title: "Simulations phishing contextualisées",
      desc: "Emails Orange Money, SMS SONABHY RH, WhatsApp collègue — des scénarios ancrés dans le terrain burkinabè, pas des templates génériques.",
    },
    {
      icon: Brain,
      color: "#2D7DC8",
      title: "Micro-learning adaptatif (JIT)",
      desc: "Un employé clique sur un lien piégé ? Un module Just-In-Time se déclenche en moins de 60 secondes. L'apprentissage au bon moment.",
    },
    {
      icon: BarChart3,
      color: "#C98B1A",
      title: "Risk Score comportemental",
      desc: "Score individuel 0–100 calculé sur quiz, simulations et engagement. Le RSSI consulte les cohortes — pas les individus.",
    },
    {
      icon: Target,
      color: "#27AE60",
      title: "Cyber Maturity Index (CMI)",
      desc: "Score organisationnel composite défendable devant le régulateur et la direction. Jalons contractuels intégrés.",
    },
    {
      icon: Smartphone,
      color: "#8B5CF6",
      title: "PWA mobile-first",
      desc: "Fonctionne sur Android entrée de gamme, réseau 3G, sans installation. Conçu pour le parc hétérogène de SONABHY.",
    },
    {
      icon: Shield,
      color: "#1ABC9C",
      title: "Conformité & audit",
      desc: "RLS Supabase, chiffrement en transit, journal d'audit complet. Conforme OWASP ASVS niveau 2 et loi BF 010-2004.",
    },
  ];

  return (
    <section id="fonctionnalites" className="py-24 px-6" style={{ backgroundColor: "#F4F6FB" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(22,48,97,0.08)", color: "#163061" }}
          >
            Fonctionnalités
          </span>
          <h2 className="text-3xl font-bold" style={{ color: "#0F1B36" }}>
            Une plateforme pensée pour le terrain
          </h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: "#6B7280" }}>
            Six modules intégrés, un seul objectif : réduire le risque humain de façon mesurable sur 12 mois.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
              style={{ border: "1px solid #E2E8F4", boxShadow: "0 2px 8px rgba(22,48,97,0.05)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: "#0F1B36" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comment ça marche ────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Users,
      title: "Baseline T0",
      desc: "Quiz d'évaluation initiale + première simulation. Mesure le niveau de risque de départ de chaque département.",
    },
    {
      num: "02",
      icon: AlertTriangle,
      title: "Simulations & JIT",
      desc: "Campagnes phishing ciblées. En cas d'échec, un module correctif se déclenche immédiatement.",
    },
    {
      num: "03",
      icon: TrendingUp,
      title: "Score & progression",
      desc: "Calcul nocturne du Risk Score individuel. Tableau de bord direction avec CMI en temps réel.",
    },
    {
      num: "04",
      icon: ShieldCheck,
      title: "Rapport direction",
      desc: "Export PDF Comex-ready à J+12 mois. Preuve de réduction de risque mesurable pour le régulateur.",
    },
  ];

  return (
    <section
      className="py-24 px-6"
      style={{ background: "linear-gradient(160deg, #0B1933 0%, #163061 100%)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(232,162,40,0.12)", color: "#E8A228", border: "1px solid rgba(232,162,40,0.25)" }}
          >
            Méthode
          </span>
          <h2 className="text-3xl font-bold text-white">De la baseline au rapport direction</h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.50)" }}>
            Un cycle en 4 phases sur 12 mois, avec des jalons mesurables à chaque étape.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div
              key={num}
              className="relative p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <p
                className="text-5xl font-black mb-4 leading-none select-none"
                style={{ color: "rgba(201,139,26,0.18)" }}
              >
                {num}
              </p>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(201,139,26,0.15)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#E8A228" }} aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Engagements ──────────────────────────────────────────────────────────────
function Commitments() {
  const metrics = [
    { icon: CheckCircle2, color: "#27AE60", stat: "< 5%", label: "Taux de clic phishing cible à T+12" },
    { icon: TrendingUp,   color: "#C98B1A", stat: "≥ 35%", label: "Taux de signalement cible à T+12" },
    { icon: Users,        color: "#2D7DC8", stat: "100%",  label: "Des agents formés sur 12 mois" },
    { icon: Shield,       color: "#8B5CF6", stat: "ASVS 2", label: "Sécurité auditée OWASP niveau 2" },
  ];

  return (
    <section className="py-24 px-6" style={{ backgroundColor: "#F4F6FB" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
              style={{ background: "rgba(22,48,97,0.08)", color: "#163061" }}
            >
              Engagements contractuels
            </span>
            <h2 className="text-3xl font-bold mb-5" style={{ color: "#0F1B36" }}>
              Des résultats mesurables,<br />pas des formations vides.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "#6B7280" }}>
              Chaque indicateur est contractuellement défini dans le Lot 2.
              Le client achète une réduction de risque mesurable — pas une plateforme.
              WendTech assume les objectifs chiffrés.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #163061, #1F3F7A)",
                color: "white",
                boxShadow: "0 4px 16px rgba(22,48,97,0.22)",
              }}
            >
              Accéder à la plateforme
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metrics.map(({ icon: Icon, color, stat, label }) => (
              <div
                key={label}
                className="p-5 rounded-2xl bg-white"
                style={{ border: "1px solid #E2E8F4", boxShadow: "0 2px 8px rgba(22,48,97,0.05)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
                </div>
                <p className="text-2xl font-black font-mono mb-1" style={{ color: "#0F1B36" }}>{stat}</p>
                <p className="text-xs leading-snug" style={{ color: "#9CA3AF" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ────────────────────────────────────────────────────────────────
function Cta() {
  return (
    <section
      className="py-28 px-6"
      style={{ background: "linear-gradient(135deg, #040D1E 0%, #0B1933 50%, #163061 100%)" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{
            background: "linear-gradient(135deg, #E8A228, #C98B1A)",
            boxShadow: "0 8px 32px rgba(201,139,26,0.35)",
          }}
        >
          <Flame className="w-8 h-8 text-white" aria-hidden="true" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">Votre espace vous attend.</h2>
        <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.50)" }}>
          Connectez-vous pour accéder à votre tableau de bord,
          vos formations et votre score de vigilance cyber.
        </p>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-base font-bold transition-all duration-200 hover:-translate-y-1 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #E8A228, #C98B1A)",
            color: "white",
            boxShadow: "0 8px 32px rgba(201,139,26,0.40)",
          }}
        >
          Accéder à CyberGuard
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>

        <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
          Accès réservé aux agents SONABHY enrôlés · Connexion par lien magique
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="px-6 py-8"
      style={{ backgroundColor: "#040D1E", borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
          >
            <Flame className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.40)" }}>
            CyberGuard SONABHY — WendTech Lot 2
          </span>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
          © {new Date().getFullYear()} WendTech · Ouagadougou, Burkina Faso
        </p>
      </div>
    </footer>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="font-sans antialiased">
      <NavBar />
      <Hero />
      <Features />
      <HowItWorks />
      <Commitments />
      <Cta />
      <Footer />
    </div>
  );
}
