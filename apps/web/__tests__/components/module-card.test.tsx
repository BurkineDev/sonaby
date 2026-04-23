import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleCard } from "@/components/employee/module-card";

// next/link mock — pas de router dans vitest/jsdom
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("ModuleCard", () => {
  it("affiche le titre du module", () => {
    render(<ModuleCard id="m1" title="Introduction au Phishing" kind="micro_lesson" />);
    expect(screen.getByText("Introduction au Phishing")).toBeInTheDocument();
  });

  it("affiche le label du kind (Micro-leçon)", () => {
    render(<ModuleCard id="m1" title="Test" kind="micro_lesson" />);
    expect(screen.getByText("Micro-leçon")).toBeInTheDocument();
  });

  it("affiche le label Quiz pour kind=quiz", () => {
    render(<ModuleCard id="m2" title="Quiz Phishing" kind="quiz" />);
    expect(screen.getByText("Quiz")).toBeInTheDocument();
  });

  it("affiche la durée estimée", () => {
    render(<ModuleCard id="m1" title="Test" kind="micro_lesson" estimatedMinutes={8} />);
    expect(screen.getByText("8 min")).toBeInTheDocument();
  });

  it("utilise 5 min par défaut si estimatedMinutes absent", () => {
    render(<ModuleCard id="m1" title="Test" />);
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("affiche les tags traduits en français", () => {
    render(<ModuleCard id="m1" title="Test" topicTags={["phishing", "mobile_money"]} />);
    expect(screen.getByText("Hameçonnage")).toBeInTheDocument();
    expect(screen.getByText("Mobile Money")).toBeInTheDocument();
  });

  it("n'affiche que les 2 premiers tags", () => {
    render(
      <ModuleCard
        id="m1"
        title="Test"
        topicTags={["phishing", "password", "whatsapp"]}
      />
    );
    expect(screen.getByText("Hameçonnage")).toBeInTheDocument();
    expect(screen.getByText("Mots de passe")).toBeInTheDocument();
    expect(screen.queryByText("WhatsApp")).toBeNull();
  });

  it("affiche 'Terminé' et masque le label kind si completed=true", () => {
    render(<ModuleCard id="m1" title="Test" kind="micro_lesson" completed={true} />);
    expect(screen.getByText("Terminé")).toBeInTheDocument();
    expect(screen.queryByText("Micro-leçon")).toBeNull();
  });

  it("affiche le score si completed=true et score fourni", () => {
    render(<ModuleCard id="m1" title="Test" completed={true} score={82} />);
    expect(screen.getByText("82/100")).toBeInTheDocument();
  });

  it("affiche le badge Urgent pour kind=jit_remediation", () => {
    render(<ModuleCard id="m1" title="Formation urgente" kind="jit_remediation" />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("le lien pointe vers /employee/modules/[id]", () => {
    render(<ModuleCard id="abc-123" title="Test" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/employee/modules/abc-123");
  });

  it("le lien pointe vers /employee/parcours si id est null", () => {
    render(<ModuleCard title="Test" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/employee/parcours");
  });

  it("utilise 'Module de formation' comme titre par défaut si title est null", () => {
    render(<ModuleCard id="m1" title={null} />);
    expect(screen.getByText("Module de formation")).toBeInTheDocument();
  });

  it("a un aria-label descriptif", () => {
    render(
      <ModuleCard id="m1" title="Phishing" kind="quiz" estimatedMinutes={3} />
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("aria-label")).toContain("Phishing");
    expect(link.getAttribute("aria-label")).toContain("3 minutes");
  });
});
