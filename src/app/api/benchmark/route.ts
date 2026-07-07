import { NextResponse } from "next/server";
import { faker } from "@faker-js/faker";
import { LRUCache } from "lru-cache";

// Route de benchmark : simule un traitement métier coûteux en CPU.
// Un cache LRU en mémoire (TTL 60 s) évite de recalculer le résultat pour des
// paramètres de requête identiques. Le header X-Cache indique HIT ou MISS.
// Force l'exécution dynamique à chaque requête (pas de mise en cache Next.js) :
// on veut que notre cache LRU soit la seule source de mise en cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORIES = [
  "mobilier",
  "luminaire",
  "decoration",
  "accessoire",
  "beton",
  "textile",
] as const;

// Sous-ensemble de catégories retenues par le filtre métier.
const ALLOWED_CATEGORIES = new Set<string>([
  "mobilier",
  "luminaire",
  "beton",
]);

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  date: string;
}

interface BenchmarkPayload {
  meta: {
    generated: number;
    matched: number;
    returned: number;
    durationMs: number;
  };
  results: Product[];
}

// Cache LRU partagé entre les requêtes (persiste tant que le worker vit).
// - clé : représentation stable des paramètres de la requête.
// - valeur : payload JSON déjà calculé.
// - ttl : 60 000 ms => une entrée expire au bout de 60 secondes.
const CACHE_TTL_MS = 60_000;
const benchmarkCache = new LRUCache<string, BenchmarkPayload>({
  max: 100,
  ttl: CACHE_TTL_MS,
});

// Construit une clé de cache stable à partir des paramètres de la requête.
// Les paramètres sont triés afin que ?a=1&b=2 et ?b=2&a=1 partagent la même clé.
function buildCacheKey(request: Request): string {
  const url = new URL(request.url);
  const sorted = [...url.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return new URLSearchParams(sorted).toString() || "__default__";
}

// Effectue le traitement coûteux (génération + filtres + tri).
function computeBenchmark(): BenchmarkPayload {
  const startedAt = Date.now();

  // 1. Génération de 50 000 produits avec faker.
  const products: Product[] = [];
  for (let i = 0; i < 50_000; i++) {
    products.push({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
      category: faker.helpers.arrayElement(CATEGORIES),
      stock: faker.number.int({ min: 0, max: 500 }),
      date: faker.date.past({ years: 2 }).toISOString(),
    });
  }

  // 2. Trois filtres imbriqués : stock > 0, prix entre 10 et 500,
  //    catégorie dans la liste autorisée.
  const filtered = products
    .filter((p) => p.stock > 0)
    .filter((p) => p.price >= 10 && p.price <= 500)
    .filter((p) => ALLOWED_CATEGORIES.has(p.category));

  // 3. Tri par prix décroissant, puis par nom alphabétique en cas d'égalité.
  filtered.sort((a, b) => {
    if (b.price !== a.price) return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  // 4. On ne retourne que les 100 premiers résultats.
  const results = filtered.slice(0, 100);

  return {
    meta: {
      generated: products.length,
      matched: filtered.length,
      returned: results.length,
      durationMs: Date.now() - startedAt,
    },
    results,
  };
}

export async function GET(request: Request) {
  const cacheKey = buildCacheKey(request);

  let payload = benchmarkCache.get(cacheKey);
  const cacheStatus = payload ? "HIT" : "MISS";

  if (!payload) {
    payload = computeBenchmark();
    benchmarkCache.set(cacheKey, payload);
  }

  return NextResponse.json(payload, {
    headers: {
      // HIT si le résultat provient du cache LRU, MISS s'il vient d'être calculé.
      "X-Cache": cacheStatus,
      // Interdit tout cache côté client, proxy ou CDN : le cache LRU serveur
      // reste la seule source de mise en cache.
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
