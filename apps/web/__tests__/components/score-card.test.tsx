import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreCard } from "@/components/employee/score-card";

const DATE = "2024-06-15T00:00:00Z";

describe("ScoreCard", () => {
  it("affiche le score arrondi", () => {
    render(<ScoreCard score={78.6} delta={null} snapshotDate={DATE} />);
    // Le score est dans le SVG comme text — on cherche 79 dans le document
    expect(screen.getByText("79")).toBeInTheDocument();
  });

  it("affiche '/ 100'", () => {
    render(<ScoreCard score={65} delta={null} snapshotDate={DATE} />);
    expect(screen.getByText("/ 100")).toBeInTheDocument();
  });

  it("affiche le label de risque correspondant au score", () => {
    render(<ScoreCard score={25} delta={null} snapshotDate={DATE} />);
    // "Critique" apparaît dans le level badge ET dans la barre de progression
    const instances = screen.getAllByText("Critique");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("score 71–85 → label 'Faible' (risque faible)", () => {
    render(<ScoreCard score={80} delta={null} snapshotDate={DATE} />);
    const instances = screen.getAllByText("Faible");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("score 86–100 → label 'Exemplaire'", () => {
    render(<ScoreCard score={92} delta={null} snapshotDate={DATE} />);
    const instances = screen.getAllByText("Exemplaire");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le delta positif avec signe +", () => {
    render(<ScoreCard score={72} delta={5.3} snapshotDate={DATE} />);
    expect(screen.getByText(/\+5\.3 pts/)).toBeInTheDocument();
  });

  it("affiche le delta négatif avec signe -", () => {
    render(<ScoreCard score={40} delta={-8.0} snapshotDate={DATE} />);
    expect(screen.getByText(/-8\.0 pts/)).toBeInTheDocument();
  });

  it("n'affiche pas de badge delta si delta est null", () => {
    render(<ScoreCard score={60} delta={null} snapshotDate={DATE} />);
    expect(screen.queryByText(/pts/)).toBeNull();
  });

  it("a un attribut aria-label sur le SVG avec le score et le label", () => {
    render(<ScoreCard score={55} delta={null} snapshotDate={DATE} />);
    const svg = screen.getByRole("img");
    const ariaLabel = svg.getAttribute("aria-label") ?? "";
    expect(ariaLabel).toContain("55");
    expect(ariaLabel).toContain("Modéré");
  });

  it("affiche le lien 'Voir le détail'", () => {
    render(<ScoreCard score={70} delta={null} snapshotDate={DATE} />);
    const link = screen.getByRole("link", { name: /détail/i });
    expect(link).toHaveAttribute("href", "/employee/score");
  });

  it("affiche la date de mise à jour", () => {
    render(<ScoreCard score={70} delta={null} snapshotDate="2024-03-20T00:00:00Z" />);
    // Quelque chose contenant "mars" ou "20" doit être visible
    const dateText = screen.getByText(/mis à jour le/i);
    expect(dateText).toBeInTheDocument();
  });
});
