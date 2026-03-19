import { Product, Promotion } from '../types';
import { roundMoney } from './money';

const getSafeNumber = (value: unknown): number => {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getBasePrice = (
  product: Product,
  priceType: 'minorista' | 'mayorista'
): number => {
  let basePrice = 0;

  if (Array.isArray(product.product_prices) && product.product_prices.length > 0) {
    const productPrice = product.product_prices.find((pp) => {
      const code = pp?.price_list?.code;
      return code === priceType;
    });

    if (productPrice) {
      if (productPrice.is_fixed && getSafeNumber(productPrice.fixed_price) > 0) {
        basePrice = getSafeNumber(productPrice.fixed_price);
      } else {
        basePrice = getSafeNumber(productPrice.final_price);
      }
    }
  }

  if (basePrice <= 0) {
    basePrice =
      priceType === 'mayorista'
        ? getSafeNumber(product.wholesale_price)
        : getSafeNumber(product.price);
  }

  return basePrice > 0 ? basePrice : 0;
};

export const getEffectivePrice = (
  product: Product,
  priceType: 'minorista' | 'mayorista',
  promotions: Promotion[]
): number => {
  const basePrice = getBasePrice(product, priceType);
  let bestDiscountPercentage = 0;

  promotions.forEach((promo) => {
    const discount = getSafeNumber(promo.discount_percentage);
    let applies = false;

    if (promo.applies_to === 'global') {
      applies = true;
    } else if (promo.applies_to === 'rubro' && promo.target_value === product.rubro) {
      applies = true;
    } else if (promo.applies_to === 'producto' && promo.target_value === product.id) {
      applies = true;
    }

    if (applies && discount > bestDiscountPercentage) {
      bestDiscountPercentage = discount;
    }
  });

  const effectivePrice = basePrice * (1 - bestDiscountPercentage / 100);

  return effectivePrice > 0 ? roundMoney(effectivePrice) : 0;
};
