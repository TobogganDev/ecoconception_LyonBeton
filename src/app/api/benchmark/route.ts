import { NextResponse } from "next/server";
import { faker } from "@faker-js/faker";

// Route de benchmark : simule un traitement métier coûteux en CPU.
// AUCUN CACHE volontairement — on veut mesurer le pire cas pour un test de charge.
// Force l'exécution dynamique à chaque requête (pas de mise en cache Next.js).
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

export async function GET() {
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

  const durationMs = Date.now() - startedAt;

  return NextResponse.json(
    {
      meta: {
        generated: products.length,
        matched: filtered.length,
        returned: results.length,
        durationMs,
      },
      results,
    },
    {
      // Interdit tout cache côté client, proxy ou CDN.
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
}
