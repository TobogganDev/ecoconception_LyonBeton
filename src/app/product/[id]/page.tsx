import ProductShop from "~/app/_components/ProductShop/ProductShop";
import ProductSlider from "~/app/_components/ProductSlider/ProductSlider";
import type { ProductType } from "~/app/types/Products";
import { publicApi } from "~/trpc/public";
interface PageProps {
  params: Promise<{ id: string }>;
}

// Rendu statique + ISR (régénération horaire) : la fiche produit est publique
// et ne dépend pas de la session. Le caller `publicApi` évite toute API
// dynamique, ce qui rend la page cacheable par l'Edge (x-vercel-cache: HIT).
// Les identifiants inconnus sont générés à la volée puis mis en cache.
export const revalidate = 3600;

async function fetchProductById(id: string) {
  return publicApi.products.productByIdentifier({ identifier: id });
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const productData = await fetchProductById(id);

  if (!productData) {
    return <h1>Produit introuvable</h1>;
  }

  const product = productData as ProductType;

  return (
    <div className="product-page">
      <ProductSlider product={product} />
      <ProductShop product={product} />
    </div>
  );
}
