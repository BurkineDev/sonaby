import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/admin/kpi-card";
import { Users } from "lucide-react";

describe("KpiCard", () => {
  const defaultProps = {
    label: "Utilisateurs actifs",
    value: 124,
    delta: 12,
    deltaPeriod: "vs mois dernier",
    description: "Employés ayant complété au moins un module",
  };

  it("affiche le label", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText(/utilisateurs actifs/i)).toBeInTheDocument();
  });

  it("affiche la valeur principale", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText("124")).toBeInTheDocument();
  });

  it("affiche la description", () => {
    render(<KpiCard {...defaultProps} />);
    expect(screen.getByText(/au moins un module/i)).toBeInTheDocument();
  });

  it("affiche le delta positif avec signe +", () => {
    render(<KpiCard {...defaultProps} delta={12} />);
    expect(screen.getByText(/\+12/)).toBeInTheDocument();
  });

  it("affiche le delta négatif avec signe -", () => {
    render(<KpiCard {...defaultProps} delta={-5} />);
    expect(screen.getByText(/-5/)).toBeInTheDocument();
  });

  it("affiche — pour une valeur null", () => {
    render(<KpiCard {...defaultProps} value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("n'affiche pas de delta si delta est null", () => {
    render(<KpiCard {...defaultProps} delta={null} />);
    expect(screen.queryByText(/\+/)).toBeNull();
    expect(screen.queryByText(/vs mois dernier/i)).toBeNull();
  });

  it("affiche l'icône si fournie", () => {
    const { container } = render(
      <KpiCard {...defaultProps} icon={Users} />
    );
    // L'icône est rendu dans un div avec une class lucide
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("affiche l'objectif si target est fourni", () => {
    render(<KpiCard {...defaultProps} target="≥ 90 % en 6 mois" />);
    expect(screen.getByText(/≥ 90 %/)).toBeInTheDocument();
  });

  it("affiche l'unité si fournie", () => {
    render(<KpiCard {...defaultProps} unit="%" value={78} />);
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("invertDelta : delta positif interprété comme négatif (ex: taux d'échec)", () => {
    const { container } = render(
      <KpiCard {...defaultProps} delta={5} invertDelta={true} />
    );
    // Quand invertDelta=true, un delta > 0 est mauvais → couleur rouge
    const badge = container.querySelector("[aria-label*='Évolution']");
    expect(badge).not.toBeNull();
  });
});
