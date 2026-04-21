"use client";

/**
 * LandingPage — CyberGuard SONABHY
 * Page d'accueil institutionnelle publique.
 * Design navy/or premium — digne d'un marché public de 45M FCFA.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Flame,
  BarChart3,
  Users,
  Target,
  Brain,
  AlertTriangle,
  TrendingUp,
  Lock,
  Eye,
  Zap,
  CheckCircle,
  ArrowRight,
  Globe,
  Activity,
  Award,
  BookOpen,
  Mail,
  Smartphone,
  ChevronDown,
} from "lucide-react";

// ─── Compteur animé ───────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    const el = document.getElementById(`counter-${target}-${suffix}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, stepTime);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return (
    <span id={`counter-${target}-${suffix}`}>
      {count.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function ShieldIllustration() {
  return (
    <svg viewBox="0 0 200 220" fill="none" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8A228" />
          <stop offset="100%" stopColor="#C98B1A" />
        </linearGradient>
        <linearGradient id="shieldInner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1F3F7A" />
          <stop offset="100%" stopColor="#0B1933" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Halo extérieur */}
      <ellipse cx="100" cy="110" rx="90" ry="95" fill="rgba(201,139,26,0.06)" />
      <ellipse cx="100" cy="110" rx="70" ry="75" fill="rgba(201,139,26,0.08)" />
      {/* Bouclier principal */}
      <path d="M100 10 L175 45 L175 110 C175 155 140 188 100 205 C60 188 25 155 25 110 L25 45 Z"
        fill="url(#shieldGrad)" filter="url(#glow)" />
      <path d="M100 22 L163 53 L163 110 C163 148 132 178 100 193 C68 178 37 148 37 110 L37 53 Z"
        fill="url(#shieldInner)" />
      {/* Motif circuit */}
      <line x1="100" y1="70" x2="100" y2="140" stroke="rgba(201,139,26,0.4)" strokeWidth="1.5" />
      <line x1="65" y1="105" x2="135" y2="105" stroke="rgba(201,139,26,0.4)" strokeWidth="1.5" />
      <circle cx="100" cy="105" r="18" fill="rgba(201,139,26,0.15)" stroke="#E8A228" strokeWidth="1.5" />
      <circle cx="100" cy="105" r="8" fill="#E8A228" filter="url(#glow)" />
      {/* Points aux intersections */}
      {[[100,70],[100,140],[65,105],[135,105]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#E8A228" opacity="0.7" />
      ))}
      {/* Étoiles décoratives */}
      <circle cx="55" cy="60" r="3" fill="rgba(232,162,40,0.5)" />
      <circle cx="145" cy="60" r="2" fill="rgba(232,162,40,0.4)" />
      <circle cx="40" cy="130" r="2" fill="rgba(232,162,40,0.3)" />
      <circle cx="160" cy="130" r="3" fill="rgba(232,162,40,0.5)" />
    </svg>
  );
}

function NetworkIllustration() {
  const nodes = [
    { x: 120, y: 60, r: 14, color: "#E8A228" },
    { x: 220, y: 100, r: 10, color: "#163061" },
    { x: 60, y: 120, r: 10, color: "#163061" },
    { x: 180, y: 180, r: 10, color: "#27AE60" },
    { x: 80, y: 200, r: 8, color: "#27AE60" },
    { x: 260, y: 200, r: 8, color: "#C0392B" },
    { x: 30, y: 60, r: 8, color: "#163061" },
    { x: 240, y: 50, r: 8, color: "#163061" },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[1,5],[2,4],[3,5],[0,6],[0,7],[1,3]];
  return (
    <svg viewBox="0 0 300 260" fill="none" className="w-full h-full" aria-hidden="true">
      {edges.map(([a, b], i) => {
        const na = nodes[a ?? 0]!; const nb = nodes[b ?? 0]!;
        return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
          stroke="rgba(201,139,26,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />;
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 4} fill={n.color} opacity="0.12" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity="0.9" />
          {i === 0 && <circle cx={n.x} cy={n.y} r={n.r - 4} fill="white" opacity="0.3" />}
        </g>
      ))}
    </svg>
  );
}

function OilDerrickSvg() {
  return (
    <svg viewBox="0 0 160 200" fill="none" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="derrickGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8A228" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C98B1A" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* Structure principale */}
      <polygon points="80,10 20,180 140,180" fill="none" stroke="url(#derrickGrad)" strokeWidth="3" />
      {/* Barreaux horizontaux */}
      {[40, 70, 100, 130, 160].map((y, i) => {
        const ratio = (y - 10) / 170;
        const w = ratio * 60;
        return <line key={i} x1={80 - w} y1={y} x2={80 + w} y2={y}
          stroke="#E8A228" strokeWidth="2" strokeOpacity={0.6 - i * 0.08} />;
      })}
      {/* Câbles */}
      <line x1="80" y1="10" x2="60" y2="100" stroke="#C98B1A" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="80" y1="10" x2="100" y2="100" stroke="#C98B1A" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Socle */}
      <rect x="15" y="178" width="130" height="8" rx="4" fill="#C98B1A" opacity="0.6" />
      {/* Flamme au sommet */}
      <path d="M80 10 C78 6 74 2 76 -2 C72 2 70 8 75 10 C72 8 73 4 80 4 C87 4 88 8 85 10 C90 8 88 2 84 -2 C86 2 82 6 80 10Z"
        fill="#E8A228" transform="translate(0,2)" />
      {/* Sol et tuyaux */}
      <ellipse cx="80" cy="185" rx="55" ry="6" fill="rgba(201,139,26,0.15)" />
      <rect x="70" y="185" width="8" height="15" rx="4" fill="#A67015" opacity="0.6" />
      <rect x="90" y="185" width="6" height="12" rx="3" fill="#A67015" opacity="0.4" />
    </svg>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FC", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(11,25,51,0.97)"
            : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.25)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
            >
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white leading-tight">CyberGuard</p>
              <p className="text-xs font-semibold" style={{ color: "#E8A228" }}>SONABHY</p>
            </div>
          </div>

          {/* Nav links desktop */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Plateforme", href: "#plateforme" },
              { label: "Fonctionnalités", href: "#fonctionnalites" },
              { label: "Comment ça marche", href: "#processus" },
              { label: "À propos", href: "#sonabhy" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.75)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E8A228")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
              >
                {label}
              </a>
            ))}
          </div>

          <Link
            href="/auth/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #E8A228, #C98B1A)",
              color: "white",
              boxShadow: "0 4px 12px rgba(201,139,26,0.30)",
            }}
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Accès plateforme</span>
            <span className="sm:hidden">Connexion</span>
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #060F1F 0%, #0B1933 35%, #163061 70%, #1F3F7A 100%)" }}
      >
        {/* Motifs décoratifs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Cercles concentriques */}
          <div
            className="absolute"
            style={{
              top: "-10%", right: "-5%",
              width: "600px", height: "600px",
              borderRadius: "50%",
              border: "1px solid rgba(201,139,26,0.10)",
            }}
          />
          <div
            className="absolute"
            style={{
              top: "-5%", right: "0%",
              width: "450px", height: "450px",
              borderRadius: "50%",
              border: "1px solid rgba(201,139,26,0.08)",
            }}
          />
          <div
            className="absolute"
            style={{
              top: "5%", right: "5%",
              width: "300px", height: "300px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,139,26,0.08) 0%, transparent 70%)",
            }}
          />
          {/* Grille hexagonale abstraite */}
          <svg
            className="absolute bottom-0 left-0 w-full opacity-5"
            viewBox="0 0 800 200"
            preserveAspectRatio="xMidYMid slice"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <polygon
                key={i}
                points="30,0 60,15 60,45 30,60 0,45 0,15"
                fill="none"
                stroke="#E8A228"
                strokeWidth="1"
                transform={`translate(${(i % 10) * 80 + (Math.floor(i / 10) % 2) * 40}, ${Math.floor(i / 10) * 65})`}
              />
            ))}
          </svg>
          {/* Points lumineux */}
          {[[5,20],[15,60],[80,15],[90,70],[50,85],[25,90]].map(([x,y], i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${x}%`, top: `${y}%`,
                backgroundColor: "#E8A228",
                opacity: 0.3 + (i % 3) * 0.15,
                boxShadow: "0 0 6px #E8A228",
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenu gauche */}
          <div className="space-y-8">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "rgba(201,139,26,0.15)",
                border: "1px solid rgba(201,139,26,0.35)",
                color: "#E8A228",
              }}
            >
              <Flame className="w-3.5 h-3.5" />
              Société Nationale Burkinabè des Hydrocarbures
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#E8A228", boxShadow: "0 0 6px #E8A228" }}
              />
            </div>

            {/* Titre principal */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Protéger SONABHY,
              </h1>
              <h1
                className="text-5xl lg:text-6xl font-bold leading-tight mt-1"
                style={{
                  background: "linear-gradient(90deg, #E8A228, #F5C842)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                un employé à la fois.
              </h1>
            </div>

            <p className="text-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.70)" }}>
              Plateforme SaaS de sensibilisation cybersécurité — Lot 2, Marché 2026-007/MICA/SONABHY.
              Réduisez le risque humain, mesurez la maturité cyber sur 12 mois, développez une
              culture de sécurité durable au sein de la SONABHY.
            </p>

            {/* KPIs en ligne */}
            <div className="flex flex-wrap gap-6">
              {[
                { value: "12", unit: "mois", label: "de programme" },
                { value: "7", unit: "critères", label: "Lot 2 couverts" },
                { value: "100%", unit: "", label: "mesurable" },
              ].map(({ value, unit, label }) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-white">
                    {value}<span className="text-sm font-normal ml-1" style={{ color: "#E8A228" }}>{unit}</span>
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #E8A228, #C98B1A)",
                  color: "white",
                  boxShadow: "0 8px 24px rgba(201,139,26,0.35)",
                }}
              >
                Accéder à la plateforme
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#plateforme"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/15"
                style={{
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                Découvrir la solution
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Illustration droite */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-96 h-96">
              {/* Halo */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(201,139,26,0.12) 0%, transparent 70%)",
                }}
              />
              <ShieldIllustration />

              {/* Badges flottants */}
              <div
                className="absolute -top-4 -right-4 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: "rgba(11,25,51,0.90)",
                  border: "1px solid rgba(201,139,26,0.30)",
                  color: "#E8A228",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #4ADE80" }} />
                  Score CMI actif
                </div>
              </div>

              <div
                className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: "rgba(11,25,51,0.90)",
                  border: "1px solid rgba(201,139,26,0.30)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#E8A228" }} />
                  OWASP ASVS Niveau 2
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Découvrir</p>
          <div
            className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: "rgba(255,255,255,0.20)" }}
          >
            <div
              className="w-1 h-2.5 rounded-full animate-landing-bounce"
              style={{ backgroundColor: "#E8A228" }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BARRE DE STATS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b" style={{ borderColor: "#DDE2EE" }}>
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { target: 500, suffix: "+", label: "Employés sensibilisés", icon: <Users className="w-5 h-5" /> },
            { target: 20, suffix: "+", label: "Modules de formation", icon: <BookOpen className="w-5 h-5" /> },
            { target: 95, suffix: "%", label: "Taux de satisfaction", icon: <Award className="w-5 h-5" /> },
            { target: 12, suffix: " mois", label: "Programme complet", icon: <TrendingUp className="w-5 h-5" /> },
          ].map(({ target, suffix, label, icon }) => (
            <div key={label} className="text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "rgba(22,48,97,0.07)", color: "#163061" }}
              >
                {icon}
              </div>
              <p
                className="text-3xl font-bold font-mono mb-1"
                style={{ color: "#163061" }}
              >
                <AnimatedCounter target={target} suffix={suffix} />
              </p>
              <p className="text-sm" style={{ color: "#718096" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SONABHY — CONTEXTE & ACTIVITÉS
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="sonabhy" className="py-24" style={{ backgroundColor: "#F8F9FC" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Illustration */}
            <div className="relative">
              {/* Carte principale */}
              <div
                className="relative rounded-3xl overflow-hidden p-8"
                style={{
                  background: "linear-gradient(135deg, #0B1933 0%, #163061 50%, #1F3F7A 100%)",
                  boxShadow: "0 32px 64px rgba(22,48,97,0.30)",
                }}
              >
                {/* Header carte */}
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
                  >
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">SONABHY</p>
                    <p className="text-xs" style={{ color: "#E8A228" }}>Secteur Hydrocarbures · Burkina Faso</p>
                  </div>
                </div>

                {/* Illustration derrick */}
                <div className="flex justify-center mb-6" style={{ height: "180px" }}>
                  <div className="w-40">
                    <OilDerrickSvg />
                  </div>
                </div>

                {/* Métriques SONABHY */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Dépôts", value: "11", icon: "🏭" },
                    { label: "Régions", value: "13", icon: "🗺️" },
                    { label: "Ans d'histoire", value: "45+", icon: "📅" },
                  ].map(({ label, value, icon }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                    >
                      <p className="text-lg mb-0.5">{icon}</p>
                      <p className="text-xl font-bold text-white">{value}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Badge cyber */}
                <div
                  className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "rgba(201,139,26,0.15)", border: "1px solid rgba(201,139,26,0.25)" }}
                >
                  <Shield className="w-5 h-5 shrink-0" style={{ color: "#E8A228" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
                    Infrastructure critique nationale — protection cyber prioritaire
                  </p>
                </div>
              </div>

              {/* Carte réseau flottante */}
              <div
                className="absolute -bottom-6 -right-6 w-48 h-40 rounded-2xl p-4"
                style={{
                  background: "white",
                  boxShadow: "0 16px 40px rgba(22,48,97,0.15)",
                  border: "1px solid #DDE2EE",
                }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: "#163061" }}>Réseau d'alerte</p>
                <NetworkIllustration />
              </div>
            </div>

            {/* Texte */}
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "rgba(22,48,97,0.08)", color: "#163061" }}
              >
                <Globe className="w-3.5 h-3.5" />
                Entreprise nationale stratégique
              </div>

              <h2 className="text-4xl font-bold leading-tight" style={{ color: "#0F1B36" }}>
                SONABHY : le gardien
                <span style={{ color: "#C98B1A" }}> de l'énergie</span>
                <br />nationale du Burkina Faso
              </h2>

              <p className="text-base leading-relaxed" style={{ color: "#4A5568" }}>
                Créée en 1981, la Société Nationale Burkinabè des Hydrocarbures assure
                l'approvisionnement en produits pétroliers de l'ensemble du territoire burkinabè.
                Avec 11 dépôts couvrant les 13 régions, SONABHY est une infrastructure critique nationale.
              </p>

              <p className="text-base leading-relaxed" style={{ color: "#4A5568" }}>
                Dans ce contexte stratégique, la cybersécurité n'est pas une option — c'est une
                obligation. Les cyberattaques ciblant les infrastructures pétrolières africaines ont
                augmenté de <strong style={{ color: "#C98B1A" }}>340%</strong> depuis 2022.
                Le facteur humain représente <strong style={{ color: "#C98B1A" }}>82%</strong> des
                incidents de sécurité.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Appel d'offres N°2026-007/MICA/SONABHY — Lot 2",
                  "Budget exercice 2026 — 45 millions FCFA TTC",
                  "Programme 12 mois — pilote → déploiement → mesure",
                  "Conformité loi burkinabè 010-2004 sur la cybersécurité",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#27AE60" }} />
                    <p className="text-sm" style={{ color: "#4A5568" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LES 7 CRITÈRES DU LOT 2
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="plateforme"
        className="py-24"
        style={{ background: "linear-gradient(135deg, #060F1F 0%, #0B1933 50%, #163061 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* En-tête section */}
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: "rgba(201,139,26,0.15)", border: "1px solid rgba(201,139,26,0.30)", color: "#E8A228" }}
            >
              <Target className="w-3.5 h-3.5" />
              Réponse aux 7 exigences du Lot 2
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Chaque critère. Couvert.
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.60)" }}>
              CyberGuard répond point par point aux exigences de l'appel d'offres
              N°2026-007/MICA/SONABHY, avec des indicateurs mesurables à chaque étape.
            </p>
          </div>

          {/* Grille critères */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                num: "01",
                icon: <Activity className="w-5 h-5" />,
                title: "Baseline T0",
                desc: "Évaluation initiale du niveau de risque de chaque employé dès l'enrôlement — quiz de positionnement + première simulation phishing.",
                metric: "Score T0 établi en < 48h",
                color: "#E8A228",
              },
              {
                num: "02",
                icon: <Brain className="w-5 h-5" />,
                title: "Apprentissage adaptatif",
                desc: "Les modules sont sélectionnés automatiquement selon le profil de risque. Les employés à risque élevé reçoivent des formations JIT immédiatement.",
                metric: "Adaptation en temps réel",
                color: "#27AE60",
              },
              {
                num: "03",
                icon: <Eye className="w-5 h-5" />,
                title: "Auto-évaluation",
                desc: "Quiz interactifs, scénarios de simulation et auto-diagnostics permettent à chaque employé de mesurer sa progression à tout moment.",
                metric: "Score mis à jour quotidiennement",
                color: "#2D7DC8",
              },
              {
                num: "04",
                icon: <BarChart3 className="w-5 h-5" />,
                title: "KPI comportementaux",
                desc: "Click Rate, Report Rate, Quiz Score, Engagement Score — 4 composantes mesurables formant le Risk Score individuel et le CMI organisationnel.",
                metric: "4 KPIs mesurables en continu",
                color: "#9B59B6",
              },
              {
                num: "05",
                icon: <AlertTriangle className="w-5 h-5" />,
                title: "Réduction ingénierie sociale",
                desc: "Simulations phishing contextualisées : faux emails Ministère BF, faux SMS SONABHY RH, faux WhatsApp Orange Money — zéro template générique.",
                metric: "↓ 70% taux de clic visé",
                color: "#E67E22",
              },
              {
                num: "06",
                icon: <TrendingUp className="w-5 h-5" />,
                title: "Maturité sur 12 mois",
                desc: "Le Cyber Maturity Index (CMI) composite est calculé chaque nuit. Les rapports direction montrent l'évolution T0 → T6 → T12 avec comparaisons inter-départements.",
                metric: "Rapport direction mensuel",
                color: "#1ABC9C",
              },
              {
                num: "07",
                icon: <Award className="w-5 h-5" />,
                title: "Culture durable",
                desc: "Programme Security Champions, badges de progression, classements anonymisés par département — la sécurité devient un réflexe, pas une contrainte.",
                metric: "Engagement > 80% à 6 mois",
                color: "#C0392B",
                wide: true,
              },
            ].map(({ num, icon, title, desc, metric, color, wide }) => (
              <div
                key={num}
                className={`rounded-2xl p-6 transition-transform hover:-translate-y-1 ${wide ? "md:col-span-2 lg:col-span-1" : ""}`}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.30)" }}>Critère {num}</p>
                    <p className="text-base font-bold text-white">{title}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.60)" }}>
                  {desc}
                </p>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FONCTIONNALITÉS DE LA PLATEFORME
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="fonctionnalites" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: "rgba(22,48,97,0.07)", color: "#163061" }}
            >
              <Zap className="w-3.5 h-3.5" />
              Fonctionnalités de la plateforme
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#0F1B36" }}>
              Une plateforme. Tout l'arsenal cyber.
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "#718096" }}>
              Pensée pour le terrain burkinabè — connectivité inégale, parc mobile hétérogène,
              contextes culturels locaux intégrés dans chaque simulation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Espace Employé",
                items: ["Score de vigilance personnel 0–100", "Parcours d'apprentissage adaptatif", "Modules micro-learning (5–15 min)", "Quiz interactifs et scénarios"],
                color: "#163061",
                bg: "rgba(22,48,97,0.06)",
              },
              {
                icon: <Mail className="w-6 h-6" />,
                title: "Simulations Phishing",
                items: ["Emails faux Ministère des Finances BF", "SMS faux SONABHY RH", "WhatsApp Orange Money / Moov Money", "Suivi HMAC + débrief immédiat JIT"],
                color: "#E67E22",
                bg: "rgba(230,126,34,0.06)",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Dashboard Direction",
                items: ["Cyber Maturity Index (CMI) composite", "Classement départements anonymisé", "Tendance 12 mois avec comparaison T0", "Export PDF rapport Comex-ready"],
                color: "#27AE60",
                bg: "rgba(39,174,96,0.06)",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Gestion Utilisateurs",
                items: ["Import CSV jusqu'à 5 000 employés", "Invitation magic link automatique", "Gestion rôles : employé / admin / RSSI", "Cohortes par département et site"],
                color: "#9B59B6",
                bg: "rgba(155,89,182,0.06)",
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "JIT Learning",
                items: ["Module déclenché immédiatement après clic", "Remédiation ciblée sur la vulnérabilité", "Score pénalisé + récupérable en 30 jours", "Historique des incidents individuel"],
                color: "#C0392B",
                bg: "rgba(192,57,43,0.06)",
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: "Mobile-First & Offline",
                items: ["PWA installable sur Android", "Contenu utilisable hors connexion", "Interface tactile optimisée ≥ 44px", "Compatible 3G / EDGE / bas débit"],
                color: "#2D7DC8",
                bg: "rgba(45,125,200,0.06)",
              },
            ].map(({ icon, title, items, color, bg }) => (
              <div
                key={title}
                className="rounded-2xl p-6 border transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ borderColor: "#DDE2EE", backgroundColor: bg }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {icon}
                </div>
                <h3 className="text-lg font-bold mb-4" style={{ color: "#0F1B36" }}>{title}</h3>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "#4A5568" }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-xs" style={{ backgroundColor: color }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          COMMENT ÇA MARCHE — PROCESSUS 3 PHASES
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="processus" className="py-24" style={{ backgroundColor: "#F8F9FC" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: "rgba(22,48,97,0.07)", color: "#163061" }}
            >
              <Activity className="w-3.5 h-3.5" />
              Processus en 3 phases
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#0F1B36" }}>
              De la baseline T0 à la maturité T12
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Ligne de connexion */}
            <div
              className="hidden lg:block absolute top-16 left-1/3 right-1/3 h-0.5"
              style={{ background: "linear-gradient(90deg, #163061, #E8A228, #163061)" }}
            />

            {[
              {
                phase: "Phase 1",
                period: "Mois 1–2",
                title: "Établissement baseline T0",
                desc: "Enrôlement de tous les employés SONABHY. Quiz de positionnement cybersécurité. Première campagne de simulation phishing contextualisée. Calcul du Risk Score initial et du CMI organisationnel T0.",
                steps: ["Import CSV + invitation magic link", "Quiz baseline multi-thématiques", "Simulation phishing Orange Money", "Rapport T0 direction"],
                icon: <Activity className="w-6 h-6" />,
                color: "#163061",
                gradient: "linear-gradient(135deg, #163061, #1F3F7A)",
              },
              {
                phase: "Phase 2",
                period: "Mois 3–9",
                title: "Programme continu adaptatif",
                desc: "Déploiement des modules micro-learning selon les vulnérabilités détectées. Campagnes phishing mensuelles à difficulté progressive. JIT Learning déclenché sur chaque incident.",
                steps: ["Modules adaptatifs par score", "4 campagnes phishing / trimestre", "JIT immédiat post-incident", "Suivi CMI mensuel direction"],
                icon: <Brain className="w-6 h-6" />,
                color: "#C98B1A",
                gradient: "linear-gradient(135deg, #C98B1A, #E8A228)",
              },
              {
                phase: "Phase 3",
                period: "Mois 10–12",
                title: "Mesure de la maturité T12",
                desc: "Comparaison T0 → T12 sur tous les KPIs. Rapport final de maturité cyber pour la direction et le régulateur. Recommandations pour l'année N+1.",
                steps: ["Rapport comparatif T0 → T12", "CMI final toutes cohortes", "Certification Security Champions", "Plan de continuité N+1"],
                icon: <TrendingUp className="w-6 h-6" />,
                color: "#27AE60",
                gradient: "linear-gradient(135deg, #27AE60, #1ABC9C)",
              },
            ].map(({ phase, period, title, desc, steps, icon, color, gradient }) => (
              <div key={phase} className="relative">
                {/* Icône phase */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto lg:mx-0"
                  style={{ background: gradient, boxShadow: `0 8px 24px ${color}30` }}
                >
                  {icon}
                </div>

                <div
                  className="rounded-2xl p-6 border"
                  style={{ borderColor: "#DDE2EE", backgroundColor: "white", boxShadow: "0 4px 16px rgba(22,48,97,0.06)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      {phase}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: `${color}12`, color }}
                    >
                      {period}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "#0F1B36" }}>{title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#718096" }}>{desc}</p>
                  <div className="space-y-2">
                    {steps.map((step) => (
                      <div key={step} className="flex items-center gap-2 text-sm" style={{ color: "#4A5568" }}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          APERÇU PLATEFORME — MOCKUP
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F8F9FC 0%, #EEF2F9 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#0F1B36" }}>
              Interface conçue pour le terrain
            </h2>
            <p className="text-base" style={{ color: "#718096" }}>
              Mobile-first, accessible en 3G, disponible hors connexion.
            </p>
          </div>

          {/* Mockup dashboard */}
          <div
            className="rounded-3xl overflow-hidden shadow-2xl border max-w-5xl mx-auto"
            style={{ borderColor: "#DDE2EE", boxShadow: "0 40px 80px rgba(22,48,97,0.20)" }}
          >
            {/* Barre navigateur */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ backgroundColor: "#1A1A2E" }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
              </div>
              <div
                className="flex-1 mx-4 px-3 py-1 rounded text-xs text-center"
                style={{ backgroundColor: "#2D2D44", color: "rgba(255,255,255,0.50)" }}
              >
                cyberguard.sonabhy.bf/admin
              </div>
            </div>

            {/* Dashboard simulé */}
            <div
              className="flex min-h-80"
              style={{ background: "linear-gradient(135deg, #F8F9FC 0%, #EEF2F9 100%)" }}
            >
              {/* Sidebar simulée */}
              <div
                className="w-44 shrink-0 flex flex-col p-4 gap-2"
                style={{ background: "linear-gradient(180deg, #0B1933 0%, #163061 100%)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
                  >
                    <Flame className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">CyberGuard</span>
                </div>
                {["Vue d'ensemble", "Campagnes", "Contenus", "Utilisateurs", "Rapports"].map((item, i) => (
                  <div
                    key={item}
                    className="px-2.5 py-2 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: i === 0 ? "rgba(201,139,26,0.20)" : "transparent",
                      borderLeft: i === 0 ? "2px solid #C98B1A" : "2px solid transparent",
                      color: i === 0 ? "white" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              {/* Contenu principal simulé */}
              <div className="flex-1 p-5 space-y-4 overflow-hidden">
                {/* Header */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)" }}
                >
                  <p className="text-xs font-bold text-white mb-1">Tableau de bord direction — SONABHY</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Cyber Maturity Index en temps réel</p>
                  <div className="flex gap-3 mt-3">
                    {[["72", "CMI Global"], ["89%", "Complétion"], ["3.2%", "Clic rate"]].map(([v, l]) => (
                      <div
                        key={l}
                        className="rounded-lg px-3 py-2"
                        style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                      >
                        <p className="text-lg font-bold text-white font-mono">{v}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPI Cards simulées */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Risk Score moy.", value: "76/100", up: true, color: "#27AE60" },
                    { label: "Phishing click", value: "3.2%", up: false, color: "#C0392B" },
                    { label: "Report rate", value: "71%", up: true, color: "#163061" },
                    { label: "JIT complétés", value: "94%", up: true, color: "#9B59B6" },
                  ].map(({ label, value, up, color }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 bg-white border"
                      style={{ borderColor: "#DDE2EE" }}
                    >
                      <p className="text-xs mb-1" style={{ color: "#718096" }}>{label}</p>
                      <p className="text-base font-bold font-mono" style={{ color }}>{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: up ? "#27AE60" : "#C0392B" }}>
                        {up ? "↑" : "↓"} vs T0
                      </p>
                    </div>
                  ))}
                </div>

                {/* Barres départements */}
                <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "#DDE2EE" }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: "#0F1B36" }}>Classement par département</p>
                  {[
                    { dept: "Directions", score: 84, color: "#27AE60" },
                    { dept: "Commercial", score: 76, color: "#163061" },
                    { dept: "Technique", score: 68, color: "#E8A228" },
                    { dept: "Logistique", score: 55, color: "#E67E22" },
                  ].map(({ dept, score, color }) => (
                    <div key={dept} className="flex items-center gap-3 mb-2">
                      <p className="text-xs w-20 shrink-0" style={{ color: "#718096" }}>{dept}</p>
                      <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "#F1F3F8" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, backgroundColor: color }}
                        />
                      </div>
                      <p className="text-xs font-mono font-bold w-8" style={{ color }}>{score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1933 0%, #163061 50%, #1F3F7A 100%)" }}
      >
        {/* Motif décoratif */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #C98B1A 0%, transparent 50%), radial-gradient(circle at 80% 50%, #163061 0%, transparent 50%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)", boxShadow: "0 16px 40px rgba(201,139,26,0.35)" }}
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Prêt à sécuriser SONABHY ?
          </h2>
          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
            Marché N°2026-007/MICA/SONABHY — Lot 2. La plateforme est déployée,
            les données de démonstration sont prêtes. Connectez-vous pour explorer
            toutes les fonctionnalités.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #E8A228, #C98B1A)",
                color: "white",
                boxShadow: "0 12px 32px rgba(201,139,26,0.40)",
              }}
            >
              <Lock className="w-5 h-5" />
              Accéder à la plateforme
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Mentions légales */}
          <p className="text-xs mt-10" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 WendTech · Prestataire Marché Lot 2 SONABHY · Confidentiel ·
            Conformité loi BF 010-2004
          </p>
        </div>
      </section>

    </div>
  );
}
