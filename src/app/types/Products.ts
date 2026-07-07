export type ProductType = {
  id: number;
  title: string;
  subtitle: string;
  price: number;
  ref: string;
  identifier: string;
  description: string;
  imgNumber: number;
  stripeProductId?: string;
  prices?: PriceType[];
  createdAt: Date;
  updatedAt: Date;
};

export type PriceType = {
  id: number;
  productId: number;
  stripePriceId: string;
  amount: number;
  currency: string;
  type: string;
  interval?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};
