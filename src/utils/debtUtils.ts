// Centralized helper for customer debt calculation
export function getCustomerDebt(debt_initial: number | null | undefined, total_ventas: number | null | undefined, total_pagos: number | null | undefined): number {
  const deudaInicial = Number(debt_initial) || 0;
  const ventas = Number(total_ventas) || 0;
  const pagos = Number(total_pagos) || 0;
  return deudaInicial + ventas - pagos;
}

// Returns true if customer has positive debt
export function hasCustomerDebt(debt_initial: number | null | undefined, total_ventas: number | null | undefined, total_pagos: number | null | undefined): boolean {
  return getCustomerDebt(debt_initial, total_ventas, total_pagos) > 0;
}
