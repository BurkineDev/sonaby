import { describe, it, expect } from "vitest";
import {
  cn,
  getRiskColor,
  getRiskBgColor,
  getRiskLabel,
  formatFCFA,
  formatDate,
  formatDateTime,
  truncate,
} from "@/lib/utils";

// ── cn ──────────────────────────────────────────────────────────────────────

describe("cn", () => {
  it("fusionne des classes simples", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("résout les conflits Tailwind (dernière classe gagne)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });
});

// ── getRiskColor ─────────────────────────────────────────────────────────────

describe("getRiskColor", () => {
  const cases: [number, string][] = [
    [0,   "text-risk-critical"],
    [15,  "text-risk-critical"],
    [30,  "text-risk-critical"],
    [31,  "text-risk-high"],
    [50,  "text-risk-high"],
    [51,  "text-risk-medium"],
    [70,  "text-risk-medium"],
    [71,  "text-risk-low"],
    [85,  "text-risk-low"],
    [86,  "text-risk-excellent"],
    [100, "text-risk-excellent"],
  ];

  it.each(cases)("score %i → %s", (score, expected) => {
    expect(getRiskColor(score)).toBe(expected);
  });
});

// ── getRiskLabel ─────────────────────────────────────────────────────────────

describe("getRiskLabel", () => {
  const cases: [number, string][] = [
    [0,   "Critique"],
    [30,  "Critique"],
    [31,  "Élevé"],
    [50,  "Élevé"],
    [51,  "Modéré"],
    [70,  "Modéré"],
    [71,  "Faible"],
    [85,  "Faible"],
    [86,  "Exemplaire"],
    [100, "Exemplaire"],
  ];

  it.each(cases)("score %i → '%s'", (score, expected) => {
    expect(getRiskLabel(score)).toBe(expected);
  });
});

// ── getRiskBgColor ───────────────────────────────────────────────────────────

describe("getRiskBgColor", () => {
  it("score ≤ 30 → rouge", () => {
    expect(getRiskBgColor(10)).toContain("red");
  });
  it("score 86–100 → teal", () => {
    expect(getRiskBgColor(90)).toContain("teal");
  });
});

// ── formatFCFA ───────────────────────────────────────────────────────────────

describe("formatFCFA", () => {
  it("formate 1000 en FCFA", () => {
    const result = formatFCFA(1000);
    // Accepte les variantes de formatage selon la locale système
    expect(result).toMatch(/1\s?000|1000/);
    expect(result).toMatch(/XOF|FCFA|CFA|F/);
  });

  it("formate 0 sans décimales", () => {
    const result = formatFCFA(0);
    expect(result).not.toContain(".");
  });
});

// ── truncate ─────────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("ne tronque pas si texte ≤ maxLength", () => {
    expect(truncate("hello", 5)).toBe("hello");
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("tronque et ajoute … si texte > maxLength", () => {
    const result = truncate("Formation cybersécurité", 10);
    expect(result).toBe("Formation …");
    expect(result.length).toBe(11); // 10 chars + …
  });

  it("gère une chaîne vide", () => {
    expect(truncate("", 5)).toBe("");
  });
});

// ── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("retourne une chaîne non vide pour une date valide", () => {
    const result = formatDate("2024-01-15");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepte un objet Date", () => {
    const result = formatDate(new Date("2024-06-01"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatDateTime ───────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("inclut l'heure dans le résultat", () => {
    const result = formatDateTime("2024-03-20T14:30:00Z");
    // Doit contenir : ou h selon la locale
    expect(result).toMatch(/\d{1,2}[hH:]\d{2}|\d{1,2}:\d{2}/);
  });
});
