import { Product } from '../types';

export const hasEnoughStock = (product: Product, requestedQuantity: number): boolean => {
  return product.stock >= requestedQuantity;
};

export const calculateRemainingStock = (product: Product, requestedQuantity: number): number => {
  return Math.max(0, product.stock - requestedQuantity);
};

export const getFractionalLabel = (product: Product): string => {
  if (!product.es_fraccionable) return '';
  const factor = Number(product.factor_fraccionamiento);
  if (Number.isFinite(factor) && factor > 0) return `Fraccionable x${factor}`;
  return 'Fraccionable';
};
