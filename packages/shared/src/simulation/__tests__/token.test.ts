/**
 * Tests unitaires — HMAC phishing token (simulation/token.ts)
 *
 * Couvre :
 *   - generatePhishingToken : format, reproductibilité, clés différentes → signatures différentes
 *   - verifyPhishingToken   : happy path, format invalide, expiration, signature incorrecte
 *   - Invariants de sécurité : userId non devinable depuis le token
 */

import { describe, it, expect, beforeAll } from "vitest";
import { generatePhishingToken, verifyPhishingToken } from "../token.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SECRET = "test-secret-key-32-bytes-minimum!";
const SEND_ID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const NOW = 1_700_000_000_000; // timestamp fixe pour les tests déterministes

// ─── generatePhishingToken ────────────────────────────────────────────────────

describe("generatePhishingToken", () => {
  let token: string;

  beforeAll(async () => {
    token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, NOW);
  });

  it("retourne une chaîne non vide", () => {
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("a exactement 3 parties séparées par des points", () => {
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("la partie 1 est le sendId", () => {
    const [sendId] = token.split(".");
    expect(sendId).toBe(SEND_ID);
  });

  it("la partie 2 est le timestamp en ms", () => {
    const parts = token.split(".");
    expect(parts[1]).toBe(String(NOW));
  });

  it("la partie 3 (signature) est un base64url valide (pas de +, /, =)", () => {
    const parts = token.split(".");
    const sig = parts[2]!;
    expect(sig).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("est déterministe : même inputs → même token", async () => {
    const token2 = await generatePhishingToken(SEND_ID, USER_ID, SECRET, NOW);
    expect(token2).toBe(token);
  });

  it("secrets différents → tokens différents", async () => {
    const tokenOther = await generatePhishingToken(SEND_ID, USER_ID, "autre-secret-different!!", NOW);
    expect(tokenOther).not.toBe(token);
  });

  it("userIds différents → signatures différentes (même sendId et timestamp)", async () => {
    const tokenOther = await generatePhishingToken(SEND_ID, "autre-user-id", SECRET, NOW);
    // Les deux tokens ont le même sendId et timestamp mais des sigs différentes
    const sig1 = token.split(".")[2];
    const sig2 = tokenOther.split(".")[2];
    expect(sig1).not.toBe(sig2);
  });

  it("sendIds différents → tokens différents", async () => {
    const tokenOther = await generatePhishingToken("autre-send-id", USER_ID, SECRET, NOW);
    expect(tokenOther).not.toBe(token);
  });

  it("le userId n'apparaît PAS dans le token (sécurité : non-devinable)", () => {
    // Le token expose sendId + timestamp + sig mais jamais userId en clair
    expect(token).not.toContain(USER_ID);
  });
});

// ─── verifyPhishingToken — happy path ─────────────────────────────────────────

describe("verifyPhishingToken — happy path", () => {
  it("vérifie un token valide fraîchement généré", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, ts);
    const result = await verifyPhishingToken(token, USER_ID, SECRET);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.sendId).toBe(SEND_ID);
      expect(result.payload.userId).toBe(USER_ID);
      expect(result.payload.timestamp).toBe(ts);
    }
  });

  it("le payload contient sendId, userId, timestamp", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, ts);
    const result = await verifyPhishingToken(token, USER_ID, SECRET);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(typeof result.payload.sendId).toBe("string");
      expect(typeof result.payload.userId).toBe("string");
      expect(typeof result.payload.timestamp).toBe("number");
    }
  });
});

// ─── verifyPhishingToken — formats invalides ──────────────────────────────────

describe("verifyPhishingToken — invalid_format", () => {
  it("chaîne vide → invalid_format", async () => {
    const result = await verifyPhishingToken("", USER_ID, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("invalid_format");
  });

  it("2 parties seulement → invalid_format", async () => {
    const result = await verifyPhishingToken("abc.123", USER_ID, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("invalid_format");
  });

  it("4 parties → invalid_format", async () => {
    const result = await verifyPhishingToken("a.b.c.d", USER_ID, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("invalid_format");
  });

  it("timestamp non numérique → invalid_format", async () => {
    const result = await verifyPhishingToken(`${SEND_ID}.notanumber.somesig`, USER_ID, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("invalid_format");
  });
});

// ─── verifyPhishingToken — expiration ─────────────────────────────────────────

describe("verifyPhishingToken — expired", () => {
  it("token vieux de 31 jours → expired (maxAge défaut = 30j)", async () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, thirtyOneDaysAgo);
    const result = await verifyPhishingToken(token, USER_ID, SECRET);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });

  it("token vieux de 29 jours → valide (< maxAge défaut)", async () => {
    const twentyNineDaysAgo = Date.now() - 29 * 24 * 60 * 60 * 1000;
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, twentyNineDaysAgo);
    const result = await verifyPhishingToken(token, USER_ID, SECRET);
    expect(result.valid).toBe(true);
  });

  it("maxAge personnalisé : token de 2h avec maxAge=1h → expired", async () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, twoHoursAgo);
    const oneHourMs = 60 * 60 * 1000;
    const result = await verifyPhishingToken(token, USER_ID, SECRET, oneHourMs);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });

  it("maxAge personnalisé : token de 30min avec maxAge=1h → valide", async () => {
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, thirtyMinAgo);
    const oneHourMs = 60 * 60 * 1000;
    const result = await verifyPhishingToken(token, USER_ID, SECRET, oneHourMs);
    expect(result.valid).toBe(true);
  });
});

// ─── verifyPhishingToken — signature incorrecte ───────────────────────────────

describe("verifyPhishingToken — signature_mismatch", () => {
  it("mauvais secret → signature_mismatch", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, ts);
    const result = await verifyPhishingToken(token, USER_ID, "mauvais-secret!!");

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("signature_mismatch");
  });

  it("mauvais userId attendu → signature_mismatch", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, ts);
    const result = await verifyPhishingToken(token, "wrong-user-id", SECRET);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("signature_mismatch");
  });

  it("signature modifiée d'un caractère → signature_mismatch", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, ts);
    const parts = token.split(".");
    // Modifier le dernier caractère de la signature
    const sig = parts[2]!;
    const tampered = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    const tamperedToken = `${parts[0]}.${parts[1]}.${tampered}`;

    const result = await verifyPhishingToken(tamperedToken, USER_ID, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("signature_mismatch");
  });

  it("timestamp modifié → signature_mismatch", async () => {
    const ts = Date.now();
    const token = await generatePhishingToken(SEND_ID, USER_ID, SECRET, ts);
    const parts = token.split(".");
    // Modifier le timestamp de 1ms
    const tamperedToken = `${parts[0]}.${Number(parts[1]) + 1}.${parts[2]}`;

    const result = await verifyPhishingToken(tamperedToken, USER_ID, SECRET);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("signature_mismatch");
  });
});

// ─── Invariants de sécurité ───────────────────────────────────────────────────

describe("invariants de sécurité", () => {
  it("deux tokens différents sendId, même userId → signatures distinctes", async () => {
    const ts = Date.now();
    const t1 = await generatePhishingToken("send-1", USER_ID, SECRET, ts);
    const t2 = await generatePhishingToken("send-2", USER_ID, SECRET, ts);
    expect(t1.split(".")[2]).not.toBe(t2.split(".")[2]);
  });

  it("un token valide pour userId A ne valide pas pour userId B", async () => {
    const ts = Date.now();
    const tokenForA = await generatePhishingToken(SEND_ID, "user-A", SECRET, ts);
    const result = await verifyPhishingToken(tokenForA, "user-B", SECRET);
    expect(result.valid).toBe(false);
  });

  it("génère des tokens différents à des timestamps différents", async () => {
    const t1 = await generatePhishingToken(SEND_ID, USER_ID, SECRET, 1_000_000);
    const t2 = await generatePhishingToken(SEND_ID, USER_ID, SECRET, 2_000_000);
    expect(t1).not.toBe(t2);
  });
});
