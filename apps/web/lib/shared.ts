/**
 * Barrel local — réexporte @cyberguard/shared via chemins relatifs directs.
 *
 * Nécessaire car les packages workspace ne sont pas symlinked tant que
 * `pnpm install` n'a pas été exécuté sur la machine hôte.
 * Ce fichier remplace `import { … } from "@cyberguard/shared"` dans l'app.
 *
 * Usage : import { parseModuleBody } from "@/lib/shared"
 *
 * Chemin : apps/web/lib/ → ../../../ → sonabyv1/ → packages/shared/src/
 */

// Blocs de contenu (Zod schemas + parseModuleBody)
export * from "../../../packages/shared/src/content/blocks";

// Scoring engine (types + calculs)
export * from "../../../packages/shared/src/scoring/engine";
export * from "../../../packages/shared/src/scoring/types";

// Simulation phishing (tokens HMAC)
export * from "../../../packages/shared/src/simulation/token";
