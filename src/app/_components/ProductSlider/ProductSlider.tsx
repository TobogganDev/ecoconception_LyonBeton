"use client";

import { useRef } from "react";
import Image from "next/image";
import type { ProductType } from "../../types/Products";
import "./ProductSlider.css";

type Props = {
  product: ProductType;
};

export default function ProductSlider({ product }: Props) {
  const carrouselContainerRef = useRef<HTMLDivElement>(null);

  const { title, identifier, imgNumber } = product;

  const renderImages = (copy: number) =>
    Array.from({ length: imgNumber ?? 1 }).map((_, index) => (
      <div key={`${identifier}_${copy}_${index}`} className="carrousel__image">
        <Image
          src={`https://res.cloudinary.com/ddlod4evf/image/upload/f_auto,q_auto/products/${identifier}_${index}.webp`}
          alt={`${title} ${index + 1}`}
          fill
          sizes="33vw"
          className="carrousel__img"
          loading="lazy"
        />
      </div>
    ));

  return (
    <div className="carrousel">
      <div
        className="carrousel__container"
        aria-label={title}
        ref={carrouselContainerRef}
      >
        {renderImages(0)}
        {renderImages(1)}
        {imgNumber === 1 && renderImages(2)}
      </div>
    </div>
  );
}
