"use client";

import { useRef } from "react";
import type { ProductType } from "../../types/Products";
import "./ProductSlider.css";

type Props = {
    product: ProductType;
};

export default function ProductSlider({ product }: Props) {
    const carrouselContainerRef = useRef<HTMLDivElement>(null);

    const { title, identifier, imgNumber } = product;

    const images = Array.from({ length: imgNumber ?? 1 }).map((_, index) => (
        <div
            key={`${identifier}_${index}`}
            className="carrousel__image"
            style={{ backgroundImage: `url('https://res.cloudinary.com/ddlod4evf/image/upload/f_auto,q_auto/products/${identifier}_${index}.webp')` }}
        />
    ));

    return (
        <div className="carrousel">
            <div className="carrousel__container" aria-label={title} ref={carrouselContainerRef}>
                {images}
                {images}
                {imgNumber === 1 && images}
            </div>
        </div>
    );
}
