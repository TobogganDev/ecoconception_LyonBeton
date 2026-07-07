import { publicApi } from "~/trpc/public";
import CardList from "~/app/_components/CardList/CardList";
import type { ProductType } from "~/app/types/Products";

// Rendu statique + ISR : la page est régénérée au plus toutes les heures.
// Combiné au Cache-Control public (next.config.js) et au caller `publicApi`
// (qui ne lit ni cookies ni headers), cela permet à Vercel Edge de renvoyer
// x-vercel-cache: HIT sur cette route publique.
export const revalidate = 3600;

async function fetchAllProducts() {
  return publicApi.products.getAll();
}

export default async function ProductsPage() {
  const productsData = await fetchAllProducts();
  const productsList: ProductType[] =
    productsData?.map((product) => ({
      ...product,
      stripeProductId: product.stripeProductId ?? undefined,
      prices: product.prices?.map((price) => ({
        ...price,
        interval: price.interval ?? undefined,
      })),
    })) ?? [];

  return (
    <div className="products-page" style={{ marginTop: "96px" }}>
      <CardList productList={productsList} />
    </div>
  );
}
