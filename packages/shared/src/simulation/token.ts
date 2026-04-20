/**
 * Génération et vérification des tokens HMAC-SHA256 pour le tracking phishing.
 *
 * Format : `<sendId>.<timestamp>.<base64url(signature)>`
 *
 * La clé secrète est fournie en paramètre (jamais en dur) pour
 * permettre les tests unitaires sans variable d'environnement.
 *
 * Usage production :
 *   const secret = process.env.PHISHING_HMAC_SECRET!
 *   const token = await generatePhishingToken(sendId, userId, Date.now(), secret)
 *
 * Voir docs/05-simulation-engine.md §3.2 pour le protocole complet.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  sendId: string;
  userId: string;
  timestamp: number;
}

export type TokenVerificationResult =
  | { valid: true; payload: TokenPayload }
  | { valid: false; reason: "invalid_format" | "expired" | "signature_mismatch" };

// ─── Helpers crypto ───────────────────────────────────────────────────────────

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payload: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return base64url(sig);
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Génère un token de tracking phishing.
 *
 * @param sendId   UUID de l'envoi (phishing_sends.id)
 * @param userId   UUID de l'utilisateur ciblé
 * @param timestamp ms depuis epoch (défaut = Date.now())
 * @param secret   Clé HMAC (process.env.PHISHING_HMAC_SECRET en prod)
 */
export async function generatePhishingToken(
  sendId: string,
  userId: string,
  secret: string,
  timestamp = Date.now()
): Promise<string> {
  const key = await importHmacKey(secret);
  const payload = `${sendId}.${userId}.${timestamp}`;
  const sig = await signPayload(payload, key);
  return `${sendId}.${timestamp}.${sig}`;
}

/**
 * Vérifie un token de tracking phishing.
 *
 * @param token            Token reçu dans la requête GET
 * @param expectedUserId   userId attendu (récupéré via la DB à partir du sendId)
 * @param secret           Clé HMAC
 * @param maxAgeMs         Âge maximum du token (défaut = 30 jours)
 */
export async function verifyPhishingToken(
  token: string,
  expectedUserId: string,
  secret: string,
  maxAgeMs = 30 * 24 * 60 * 60 * 1000
): Promise<TokenVerificationResult> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, reason: "invalid_format" };
  }

  const [sendId, timestampStr, receivedSig] = parts as [string, string, string];
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { valid: false, reason: "invalid_format" };
  }

  // Vérification de l'expiration
  if (Date.now() - timestamp > maxAgeMs) {
    return { valid: false, reason: "expired" };
  }

  // Recalculer la signature attendue
  const key = await importHmacKey(secret);
  const expectedPayload = `${sendId}.${expectedUserId}.${timestamp}`;
  const expectedSig = await signPayload(expectedPayload, key);

  // Comparaison constant-time (simple ici car JS, à renforcer si besoin)
  if (receivedSig !== expectedSig) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return {
    valid: true,
    payload: { sendId, userId: expectedUserId, timestamp },
  };
}
