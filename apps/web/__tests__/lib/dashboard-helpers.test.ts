/**
 * Tests des fonctions utilitaires de la page /employee.
 * Ces fonctions sont dupliquées ici depuis page.tsx pour les tester isolément.
 * Si elles sont extraites dans un lib partagé, importer depuis là.
 */
import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers copiés depuis apps/web/app/employee/page.tsx
// (à remplacer par des imports une fois extraits)
// ─────────────────────────────────────────────────────────────────────────────

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type DashboardModule = {
  id: string;
  title: string;
  kind: string;
  estimated_minutes: number;
  topic_tags: string[];
};

function normalizeModule(value: unknown): DashboardModule | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;

  const record = row as Record<string, unknown>;
  if (typeof record["id"] !== "string") return null;

  return {
    id: record["id"],
    title: typeof record["title"] === "string" ? record["title"] : "Module de formation",
    kind: typeof record["kind"] === "string" ? record["kind"] : "micro_lesson",
    estimated_minutes:
      typeof record["estimated_minutes"] === "number" ? record["estimated_minutes"] : 5,
    topic_tags: Array.isArray(record["topic_tags"])
      ? (record["topic_tags"] as unknown[]).filter((t): t is string => typeof t === "string")
      : [],
  };
}

type DeptArg =
  | { name?: string | null }
  | Array<{ name?: string | null }>
  | null
  | undefined;

function getDepartmentName(departments: DeptArg): string {
  const dept = Array.isArray(departments) ? departments[0] : departments;
  return dept?.name ?? "SONABHY";
}

// ─────────────────────────────────────────────────────────────────────────────

describe("toNumber", () => {
  it("retourne le nombre si déjà un number", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(3.14)).toBe(3.14);
  });

  it("convertit une chaîne numérique", () => {
    expect(toNumber("75")).toBe(75);
    expect(toNumber("0.5")).toBe(0.5);
  });

  it("retourne le fallback pour NaN / undefined / null", () => {
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber(null)).toBe(0);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber(NaN)).toBe(0);
    expect(toNumber(undefined, 50)).toBe(50);
  });

  it("retourne le fallback pour Infinity", () => {
    expect(toNumber(Infinity)).toBe(0);
    expect(toNumber(-Infinity)).toBe(0);
  });
});

describe("normalizeModule", () => {
  it("normalise un objet valide", () => {
    const mod = normalizeModule({
      id: "mod-1",
      title: "Phishing SONABHY",
      kind: "micro_lesson",
      estimated_minutes: 7,
      topic_tags: ["phishing", "mobile_money"],
    });

    expect(mod).not.toBeNull();
    expect(mod!.id).toBe("mod-1");
    expect(mod!.title).toBe("Phishing SONABHY");
    expect(mod!.kind).toBe("micro_lesson");
    expect(mod!.estimated_minutes).toBe(7);
    expect(mod!.topic_tags).toEqual(["phishing", "mobile_money"]);
  });

  it("déballe un tableau et normalise le premier élément", () => {
    const mod = normalizeModule([{ id: "mod-2", title: "Quiz", kind: "quiz", estimated_minutes: 5, topic_tags: [] }]);
    expect(mod!.id).toBe("mod-2");
  });

  it("retourne null si pas d'id string", () => {
    expect(normalizeModule({ id: 123, title: "Test" })).toBeNull();
    expect(normalizeModule(null)).toBeNull();
    expect(normalizeModule(undefined)).toBeNull();
    expect(normalizeModule("string")).toBeNull();
  });

  it("utilise des valeurs par défaut pour les champs manquants", () => {
    const mod = normalizeModule({ id: "mod-3" });
    expect(mod!.title).toBe("Module de formation");
    expect(mod!.kind).toBe("micro_lesson");
    expect(mod!.estimated_minutes).toBe(5);
    expect(mod!.topic_tags).toEqual([]);
  });

  it("filtre les tags non-string dans topic_tags", () => {
    const mod = normalizeModule({
      id: "mod-4",
      topic_tags: ["phishing", 42, null, "password", undefined],
    });
    expect(mod!.topic_tags).toEqual(["phishing", "password"]);
  });

  it("retourne null pour un tableau vide", () => {
    expect(normalizeModule([])).toBeNull();
  });
});

describe("getDepartmentName", () => {
  it("retourne le nom du département si présent", () => {
    expect(getDepartmentName({ name: "Direction Générale" })).toBe("Direction Générale");
  });

  it("retourne SONABHY si departments est null", () => {
    expect(getDepartmentName(null)).toBe("SONABHY");
    expect(getDepartmentName(undefined)).toBe("SONABHY");
  });

  it("retourne SONABHY si name est null ou undefined", () => {
    expect(getDepartmentName({ name: null })).toBe("SONABHY");
    expect(getDepartmentName({ name: undefined })).toBe("SONABHY");
  });

  it("extrait le premier département d'un tableau", () => {
    expect(
      getDepartmentName([
        { name: "Exploitation" },
        { name: "Finance" },
      ])
    ).toBe("Exploitation");
  });

  it("retourne SONABHY si le tableau est vide", () => {
    expect(getDepartmentName([])).toBe("SONABHY");
  });
});
