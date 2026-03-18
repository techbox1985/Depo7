import { Product } from '../types';

export const hasEnoughStock = (product: Product, requestedQuantity: number): boolean => {
  return product.stock >= requestedQuantity;
};

export const calculateRemainingStock = (product: Product, requestedQuantity: number): number => {
  return Math.max(0, product.stock - requestedQuantity);
};
