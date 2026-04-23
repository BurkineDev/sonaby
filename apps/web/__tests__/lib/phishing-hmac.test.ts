/**
 * Tests unitaires du module phishing-hmac.
 * Ces tests vérifient la génération et vérification des tokens HMAC-SHA256.
 * Le secret est injecté via process.env pour les tests.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { generatePhishingToken, verifyPhishingToken } from "@/lib/phishing-hmac";

const TEST_SECRET = "test-secret-32-chars-long-enough!!";
const SEND_ID = "send-abc-123";
const USER_ID = "user-def-456";

beforeAll(() => {
  process.env["PHISHING_HMAC_SECRET"] = TEST_SECRET;
});

describe("generatePhishingToken", () => {
  it("génère un token au format sendId.timestamp.signature", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, ts);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(SEND_ID);
    expect(Number(parts[1])).toBe(ts);
    expect(parts[2]).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
  });

  it("génère des tokens différents pour des timestamps différents", async () => {
    const t1 = await generatePhishingToken(SEND_ID, USER_ID, 1000000);
    const t2 = await generatePhishingToken(SEND_ID, USER_ID, 2000000);
    expect(t1).not.toBe(t2);
  });

  it("génère des tokens différents pour des users différents", async () => {
    const ts = Date.now();
    const t1 = await generatePhishingToken(SEND_ID, "user-1", ts);
    const t2 = await generatePhishingToken(SEND_ID, "user-2", ts);
    expect(t1).not.toBe(t2);
  });

  it("lève une erreur si PHISHING_HMAC_SECRET est absent", async () => {
    const original = process.env["PHISHING_HMAC_SECRET"];
    delete process.env["PHISHING_HMAC_SECRET"];
    await expect(generatePhishingToken(SEND_ID, USER_ID, Date.now())).rejects.toThrow(
      "PHISHING_HMAC_SECRET"
    );
    process.env["PHISHING_HMAC_SECRET"] = original;
  });
});

describe("verifyPhishingToken", () => {
  it("vérifie un token valide et retourne sendId + timestamp", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, ts);
    const result = await verifyPhishingToken(token, USER_ID);

    expect(result).not.toBeNull();
    expect(result!.sendId).toBe(SEND_ID);
    expect(result!.timestamp).toBe(ts);
  });

  it("retourne null si le userId ne correspond pas (signature invalide)", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, ts);
    const result = await verifyPhishingToken(token, "autre-user");
    expect(result).toBeNull();
  });

  it("retourne null pour un token malformé (2 parties seulement)", async () => {
    const result = await verifyPhishingToken("send.timestamp", USER_ID);
    expect(result).toBeNull();
  });

  it("retourne null pour un token avec timestamp non numérique", async () => {
    const result = await verifyPhishingToken("send.nan.sig", USER_ID);
    expect(result).toBeNull();
  });

  it("retourne null pour un token expiré (> 90 jours)", async () => {
    const ninetyOneDaysAgo = Date.now() - 91 * 24 * 60 * 60 * 1000;
    const token = await generatePhishingToken(SEND_ID, USER_ID, ninetyOneDaysAgo);
    const result = await verifyPhishingToken(token, USER_ID);
    expect(result).toBeNull();
  });

  it("retourne null pour une signature falsifiée", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, ts);
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.INVALIDSIGNATURE`;
    const result = await verifyPhishingToken(tampered, USER_ID);
    expect(result).toBeNull();
  });

  it("est idempotent : vérifier deux fois le même token retourne le même résultat", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, ts);
    const r1 = await verifyPhishingToken(token, USER_ID);
    const r2 = await verifyPhishingToken(token, USER_ID);
    expect(r1).toEqual(r2);
  });
});
