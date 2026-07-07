import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductType } from "../../types/Products";
import styles from "./ProductLine.module.scss";

interface ProductLineProps {
  product: ProductType;
  quantity: number;
  onQuantityChange?: (newQuantity: number) => void;
  onRemove?: () => void;
  showControls?: boolean;
  showImage?: boolean;
}

export default function ProductLine({
  product,
  quantity,
  onQuantityChange,
  onRemove,
  showControls = true,
  showImage = true,
}: ProductLineProps) {
  const currentPrice =
    product.prices?.find((p) => p.isDefault && p.isActive)?.amount ??
    product.price;

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const totalPrice = currentPrice * quantity;

  const handleQuantityDecrease = () => {
    if (onQuantityChange && quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    if (onQuantityChange) {
      onQuantityChange(quantity + 1);
    }
  };

  const getImageUrl = () => {
    if (!showImage || !product.imgNumber) return null;
    return `https://res.cloudinary.com/ddlod4evf/image/upload/f_auto,q_auto/products/${product.identifier}_0.webp`;
  };

  return (
    <div className={styles.productLine}>
      {showImage && (
        <div className={styles.productLine__image}>
          {getImageUrl() ? (
            <Image
              src={getImageUrl()!}
              alt={product.title}
              fill
              sizes="20vw"
              className={styles.productLine__img}
              loading="lazy"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div>
              <span>IMG Loading...</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.productLine__info}>
        <div className={styles.productLine__details}>
          <div className={styles.productLine__text}>
            <h3 className={styles.productLine__title}>
              <Link href={`/product/${product.identifier}`}>
                {product.title}
              </Link>
            </h3>
            {product.subtitle && (
              <p className={styles.productLine__subtitle}>{product.subtitle}</p>
            )}
          </div>
          <span className={styles.productLine__totalPrice}>
            {formatPrice(totalPrice)} €
          </span>
        </div>

        {showControls && (
          <div className={styles.productLine__controls}>
            <div className={styles.productLine__quantity}>
              <button
                type="button"
                onClick={handleQuantityDecrease}
                className={styles.productLine__quantityButton}
                disabled={quantity <= 0}
                aria-label="Diminuer la quantité"
              >
                -
              </button>
              <span className={styles.productLine__quantityValue}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleQuantityIncrease}
                className={styles.productLine__quantityButton}
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>

            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className={styles.productLine__removeButton}
                aria-label="Supprimer du panier"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
