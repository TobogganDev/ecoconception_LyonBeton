import { api } from "~/trpc/server";
import CardList from "~/app/_components/CardList/CardList";
import type { ProductType } from "~/app/types/Products";

async function fetchAllProducts() {
  return api.products.getAll();
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
