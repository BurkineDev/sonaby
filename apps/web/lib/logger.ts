/**
 * Logger structuré (pino).
 * Remplace tous les console.log en production.
 * Utilisation : import { logger } from "@/lib/logger"
 *               logger.info({ userId }, "Action utilisateur")
 *
 * Note : pino-pretty n'est pas utilisé — son transport worker est incompatible
 * avec le runtime Next.js App Router. JSON natif en dev et prod.
 */
import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  base: {
    env: process.env.NODE_ENV,
    service: "cyberguard-web",
  },
  // Formatters lisibles en dev sans worker thread
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
