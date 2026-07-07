import "server-only";

import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";

/**
 * Caller tRPC « public » destiné aux Server Components rendus statiquement (ISR).
 *
 * Contrairement à `~/trpc/server`, ce caller ne lit NI les cookies (`auth()`)
 * NI les `headers()` de la requête : il ne dépend d'aucune API dynamique. Les
 * pages qui l'utilisent peuvent donc être générées statiquement puis mises en
 * cache par Vercel Edge (`x-vercel-cache: HIT`) grâce au `Cache-Control` public
 * défini dans `next.config.js`.
 *
 * ⚠️ À n'utiliser QUE pour des `publicProcedure` qui ne lisent pas
 * `ctx.session` (catalogue, fiche produit…). Le contexte est fixe : session à
 * `null` et en-têtes vides.
 */
export const publicApi = createCaller({
  db,
  session: null,
  headers: new Headers(),
});
