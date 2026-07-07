"use client";

import { useSession } from "next-auth/react";
import bemCondition from "~/app/helpers/bemHelper";
import { api } from "~/trpc/react";
import type { ProductType } from "../../types/Products";
import "./ProductShop.css";

type Props = {
  product: ProductType;
};

export default function ProductShop({ product }: Props) {
  const { title, subtitle, price, description, identifier, prices } = product;

  const currentPrice =
    prices?.find((p) => p.isDefault && p.isActive)?.amount ?? price;
  const displayPrice = (currentPrice / 100).toFixed(2);
  const { data: session } = useSession();
  const utils = api.useUtils();
  const addToCartMutation = api.cart.addToCart.useMutation({
    onSuccess: async () => {
      await utils.cart.getCurrent.invalidate();
    },
  });

  const handleAddToCart = async () => {
    const quantity = 1;
    if (session?.user) {
      await addToCartMutation.mutateAsync({ identifier, quantity });
      return;
    }
    const key = "guest_cart";
    const raw =
      typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const cart: Record<string, number> = raw
      ? (JSON.parse(raw) as Record<string, number>)
      : {};
    cart[identifier] = (cart[identifier] ?? 0) + quantity;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(cart));
    }
  };

  return (
    <div className="product-shop">
      <div className={bemCondition("product-shop__grid", "top-left")}></div>
      <div className={bemCondition("product-shop__grid", "top-right")}>
        <h1>{title}</h1>
        <h2>{subtitle}</h2>
      </div>
      <div className={bemCondition("product-shop__grid", "bottom-left")}>
        <span>Eur {displayPrice}</span>
        <button
          type="button"
          className="product-shop__button"
          onClick={handleAddToCart}
        >
          Ajouter au panier
        </button>
      </div>
      <div className={bemCondition("product-shop__grid", "bottom-right")}>
        {description}
      </div>
    </div>
  );
}
