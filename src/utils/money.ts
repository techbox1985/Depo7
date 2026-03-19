export const roundMoney = (value: number): number => Math.round(value || 0);

export const formatMoney = (value: number): string => {
  return `$${roundMoney(value)}`;
};
