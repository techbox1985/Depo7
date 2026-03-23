export const roundMoney = (value: number): number => {
  return Math.round((value || 0) * 100) / 100;
};

export const formatMoney = (value: number): string => {
  return `$${(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
