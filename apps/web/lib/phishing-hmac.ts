/**
 * Utilitaires HMAC pour les tokens de tracking phishing.
 * Le secret PHISHING_HMAC_SECRET doit être généré avec : openssl rand -hex 32
 * JAMAIS exposé côté client.
 */

/**
 * Génère un token HMAC-SHA256 pour un couple (sendId, userId).
 * Format : base64url(HMAC-SHA256(sendId|userId|ts, secret))
 */
export async function generatePhishingToken(
  sendId: string,
  userId: string,
  timestamp: number
): Promise<string> {
  const secret = process.env.PHISHING_HMAC_SECRET;
  if (!secret) throw new Error("PHISHING_HMAC_SECRET manquant");

  const message = `${sendId}|${userId}|${timestamp}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${sendId}.${timestamp}.${base64}`;
}

/**
 * Valide et décode un token phishing.
 * Retourne { sendId, userId } ou null si invalide.
 */
export async function verifyPhishingToken(
  token: string,
  expectedUserId: string
): Promise<{ sendId: string; timestamp: number } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [sendId, tsStr, signature] = parts as [string, string, string];
  const timestamp = parseInt(tsStr, 10);

  if (isNaN(timestamp)) return null;

  // Expiration : 90 jours
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > ninetyDays) return null;

  const secret = process.env.PHISHING_HMAC_SECRET;
  if (!secret) return null;

  const message = `${sendId}|${expectedUserId}|${timestamp}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const decodedSig = Uint8Array.from(
    atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
  const messageBytes = new TextEncoder().encode(message);

  const valid = await crypto.subtle.verify("HMAC", key, decodedSig, messageBytes);
  if (!valid) return null;

  return { sendId, timestamp };
}
