"use client";

import React from "react";
import type { ProductType } from "../../types/Products";
import "./CardElement.css";
import Link from "next/link";

type Props = {
    product: ProductType;
};

export default function CardElement(props: Props) {
    const { title, subtitle, price, ref, identifier, prices } = props.product;

    const currentPrice = prices?.find(p => p.isDefault && p.isActive)?.amount ?? price;
    const displayPrice = (currentPrice / 100).toFixed(2);
    return (
        <Link className="card-element" href={`product/${identifier}`} style={{ backgroundImage: `url('https://res.cloudinary.com/ddlod4evf/image/upload/f_auto,q_auto/products/${identifier}_0.webp')` }}>
            <div className="card-element__info">
                <h3 className="card-element__info-title">
                    {title}
                </h3>
                <p className="card-element__info-subtitle">
                    {subtitle}
                </p>
            </div>
            <span className="card-element__data">
                <span className="card-element__data-price">
                    eur {displayPrice}
                </span>
                <span className="card-element__data-ref">
                    ref. {ref}
                </span>
            </span>
        </Link>
    );
}
