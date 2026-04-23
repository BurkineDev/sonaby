import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CmiGauge } from "@/components/admin/cmi-gauge";

const PROPS = {
  label: "CMI Organisationnel",
  description: "Score composite de maturité cybersécurité",
};

describe("CmiGauge", () => {
  it("affiche la valeur arrondie", () => {
    render(<CmiGauge value={67.4} delta={null} {...PROPS} />);
    expect(screen.getByText("67")).toBeInTheDocument();
  });

  it("affiche '/ 100'", () => {
    render(<CmiGauge value={50} delta={null} {...PROPS} />);
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("affiche le label passé en prop", () => {
    render(<CmiGauge value={50} delta={null} {...PROPS} />);
    expect(screen.getByText("CMI Organisationnel")).toBeInTheDocument();
  });

  it("affiche la description", () => {
    render(<CmiGauge value={50} delta={null} {...PROPS} />);
    expect(screen.getByText(/score composite/i)).toBeInTheDocument();
  });

  it("affiche le niveau de risque Critique pour score ≤ 30", () => {
    render(<CmiGauge value={20} delta={null} {...PROPS} />);
    expect(screen.getByText("Critique")).toBeInTheDocument();
  });

  it("affiche Exemplaire pour score ≥ 86", () => {
    render(<CmiGauge value={90} delta={null} {...PROPS} />);
    expect(screen.getByText("Exemplaire")).toBeInTheDocument();
  });

  it("affiche le delta positif avec +", () => {
    render(<CmiGauge value={60} delta={4} {...PROPS} />);
    expect(screen.getByText(/\+4 pts/)).toBeInTheDocument();
  });

  it("affiche le delta négatif avec -", () => {
    render(<CmiGauge value={45} delta={-3} {...PROPS} />);
    expect(screen.getByText(/-3 pts/)).toBeInTheDocument();
  });

  it("clamp à 0 pour valeur négative", () => {
    render(<CmiGauge value={-10} delta={null} {...PROPS} />);
    // "0" apparaît dans la valeur centrale ET dans le label d'axe
    const instances = screen.getAllByText("0");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("clamp à 100 pour valeur > 100", () => {
    render(<CmiGauge value={150} delta={null} {...PROPS} />);
    // "100" apparaît dans la valeur centrale ET dans le label d'axe
    const instances = screen.getAllByText("100");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("a un aria-label sur le SVG avec la valeur et le niveau", () => {
    render(<CmiGauge value={72} delta={null} {...PROPS} />);
    const svg = screen.getByRole("img");
    const ariaLabel = svg.getAttribute("aria-label") ?? "";
    expect(ariaLabel).toContain("72");
    expect(ariaLabel).toContain("Faible");
  });

  it("n'affiche pas de badge delta si delta est null", () => {
    render(<CmiGauge value={60} delta={null} {...PROPS} />);
    expect(screen.queryByText(/pts/)).toBeNull();
  });
});
