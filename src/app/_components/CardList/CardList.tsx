"use client";

import React from "react";
import type { ProductType } from "../../types/Products";
import "./CardList.css";
import CardElement from "../CardElement/CardElement";

type Props = {
  productList: ProductType[];
};

export default function CardList(props: Props) {
  return (
    <div className="card-list">
      <div className="card-list__content">
        <h2 className="card-list__content-title">Shop</h2>
        <span className="card-list__content-text">now</span>
      </div>
      <ul className="card-list__items">
        {props.productList.map((product) => (
          <li key={product.identifier} className="card-list__item">
            <CardElement product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
