"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import ProductLine from "../_components/ProductLine/ProductLine";
import styles from "./Cart.module.scss";

export default function CartPage() {
  const { data: session, status } = useSession();

  const isAuthenticated = !!session?.user;

  const utils = api.useUtils();
  const cartQuery = api.cart.getCurrent.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const updateItem = api.cart.updateItem.useMutation({
    onMutate: async ({
      identifier,
      quantity,
    }: {
      identifier: string;
      quantity: number;
    }) => {
      await utils.cart.getCurrent.cancel();
      const previous = utils.cart.getCurrent.getData();
      if (previous) {
        const items = [...previous.items];
        const index = items.findIndex(
          (i) => i.product.identifier === identifier,
        );
        if (index >= 0) {
          if (quantity <= 0) {
            items.splice(index, 1);
          } else {
            items[index] = { ...items[index]!, quantity };
          }
          utils.cart.getCurrent.setData(undefined, { ...previous, items });
        }
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) utils.cart.getCurrent.setData(undefined, ctx.previous);
    },
    onSettled: async () => {
      await utils.cart.getCurrent.invalidate();
    },
  });
  const removeItem = api.cart.removeItem.useMutation({
    onMutate: async ({ identifier }: { identifier: string }) => {
      await utils.cart.getCurrent.cancel();
      const previous = utils.cart.getCurrent.getData();
      if (previous) {
        const items = previous.items.filter(
          (i) => i.product.identifier !== identifier,
        );
        utils.cart.getCurrent.setData(undefined, { ...previous, items });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) utils.cart.getCurrent.setData(undefined, ctx.previous);
    },
    onSettled: async () => {
      await utils.cart.getCurrent.invalidate();
    },
  });

  const [guestCart, setGuestCart] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const raw = window.localStorage.getItem("guest_cart");
      setGuestCart(raw ? JSON.parse(raw) : {});
    }
  }, [isAuthenticated]);

  const identifiers = useMemo(() => Object.keys(guestCart), [guestCart]);

  const guestProductsQuery = api.products.productsByIdentifiers.useQuery(
    { identifiers },
    { enabled: !isAuthenticated && identifiers.length > 0 },
  );

  const setGuestQty = (identifier: string, quantity: number) => {
    if (typeof window === "undefined") return;
    const next = { ...guestCart };
    if (quantity <= 0) {
      delete next[identifier];
    } else {
      next[identifier] = quantity;
    }
    setGuestCart(next);
    window.localStorage.setItem("guest_cart", JSON.stringify(next));
  };

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async (
    items: { productId: number; quantity: number }[],
  ) => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error("Erreur checkout:", data.error);
        alert("Erreur lors de la création de la session de paiement");
      }
    } catch (error) {
      console.error("Erreur checkout:", error);
      alert("Erreur lors de la création de la session de paiement");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  if (isAuthenticated) {
    const items = cartQuery.data?.items ?? [];
    const total = items.reduce((sum, it) => {
      const currentPrice =
        it.product.prices?.find((p) => p.isDefault && p.isActive)?.amount ??
        it.product.price;
      return sum + currentPrice * it.quantity;
    }, 0);
    const displayTotal = (total / 100).toFixed(2);

    return (
      <div className={styles.cartPage}>
        <h1 className={styles.cartPage__title}>Votre panier</h1>
        <div className={styles.cartPage__asideContainer}>
          {items.length === 0 ? (
            <div className={styles.cartPage__emptyState}>
              <p>Votre panier est vide.</p>
              <Link href="/" className={styles.cartPage__emptyState__link}>
                Retour accueil
              </Link>
            </div>
          ) : (
            <div className={styles.cartPage__items}>
              {items.map((it, index) => (
                <div
                  key={`${it.cartId}-${it.productId}`}
                  className={styles.cartPage__item}
                >
                  <ProductLine
                    product={{
                      ...it.product,
                      stripeProductId: it.product.stripeProductId ?? undefined,
                      prices: it.product.prices?.map((p) => ({
                        ...p,
                        interval: p.interval ?? undefined,
                      })),
                    }}
                    quantity={it.quantity}
                    onQuantityChange={(newQuantity) =>
                      updateItem.mutate({
                        identifier: it.product.identifier,
                        quantity: newQuantity,
                      })
                    }
                    onRemove={() =>
                      removeItem.mutate({ identifier: it.product.identifier })
                    }
                    showControls={true}
                    showImage={true}
                  />
                </div>
              ))}
            </div>
          )}
          <div className={styles.cartPage__price}>
            <div className={styles.cartPage__total}>
              Total: {displayTotal} €
            </div>
            <div className={styles.cartPage__actions}>
              {items.length === 0 ? (
                <Link href="/" className={styles.cartPage__checkoutButton}>
                  Retour accueil
                </Link>
              ) : (
                <button
                  onClick={() =>
                    handleCheckout(
                      items.map((it) => ({
                        productId: it.productId,
                        quantity: it.quantity,
                      })),
                    )
                  }
                  disabled={isCheckingOut}
                  className={styles.cartPage__checkoutButton}
                >
                  {isCheckingOut ? "Redirection..." : "Payer avec Stripe"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const guestProducts = guestProductsQuery.data ?? [];
  const guestItems = guestProducts.map((p) => ({
    product: p,
    quantity: guestCart[p.identifier] ?? 0,
  }));
  const guestTotal = guestItems.reduce((sum, it) => {
    const currentPrice =
      it.product.prices?.find((p) => p.isDefault && p.isActive)?.amount ??
      it.product.price;
    return sum + currentPrice * it.quantity;
  }, 0);
  const displayGuestTotal = (guestTotal / 100).toFixed(2);

  return (
    <div className={styles.cartPage}>
      <h1 className={styles.cartPage__title}>Votre panier</h1>
      <div className={styles.cartPage__asideContainer}>
        {guestItems.length === 0 ? (
          <div className={styles.cartPage__emptyState}>
            <p>Votre panier est vide.</p>
            <Link href="/" className={styles.cartPage__emptyState__link}>
              Retour accueil
            </Link>
          </div>
        ) : (
          <div className={styles.cartPage__items}>
            {guestItems.map((it) => (
              <div
                key={it.product.identifier}
                className={styles.cartPage__item}
              >
                <ProductLine
                  product={{
                    ...it.product,
                    stripeProductId: it.product.stripeProductId ?? undefined,
                    prices: it.product.prices?.map((p) => ({
                      ...p,
                      interval: p.interval ?? undefined,
                    })),
                  }}
                  quantity={it.quantity}
                  onQuantityChange={(newQuantity) =>
                    setGuestQty(it.product.identifier, newQuantity)
                  }
                  onRemove={() => setGuestQty(it.product.identifier, 0)}
                  showControls={true}
                  showImage={true}
                />
              </div>
            ))}
          </div>
        )}
        <div className={styles.cartPage__price}>
          <div className={styles.cartPage__total}>
            Total: {displayGuestTotal} €
          </div>
          <div className={styles.cartPage__actions}>
            {guestItems.length === 0 ? (
              <Link href="/" className={styles.cartPage__checkoutButton}>
                Retour accueil
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles.cartPage__checkoutButton}>
                  Se connecter pour payer
                </Link>
                <button
                  onClick={() => {
                    const items = guestItems.map((it) => ({
                      productId: it.product.id,
                      quantity: it.quantity,
                    }));
                    handleCheckout(items);
                  }}
                  disabled={isCheckingOut}
                  className={styles.cartPage__checkoutButton}
                >
                  {isCheckingOut ? "Redirection..." : "Payer sans compte"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
