/**
 * Barrel local — réexporte @cyberguard/db via chemin relatif direct.
 *
 * Nécessaire car les packages workspace ne sont pas symlinked tant que
 * `pnpm install` n'a pas été exécuté sur la machine hôte.
 * Ce fichier remplace `import { … } from "@cyberguard/db/types"` dans l'app.
 *
 * Usage : import type { Database } from "@/lib/db"
 *
 * Chemin : apps/web/lib/ → ../../../ → sonabyv1/ → packages/db/src/
 */
export type {
  Database,
  Json,
  UserRole,
  ConsentScope,
  ModuleDifficulty,
  ModuleKind,
} from "../../../packages/db/src/types";
