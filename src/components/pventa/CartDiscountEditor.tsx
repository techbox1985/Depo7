import React from 'react';

export interface CartDiscountEditorProps {
  discountType: 'none' | 'percent' | 'amount';
  discountValue: number;
  onChange: (type: 'none' | 'percent' | 'amount', value: number) => void;
  maxValue: number;
}


export const CartDiscountEditor: React.FC<CartDiscountEditorProps> = ({ discountType, discountValue, onChange, maxValue }) => {
  // Etiquetas cortas
  return (
    <div className="flex items-center gap-1">
      <select
        className="border rounded px-1 py-0.5 text-xs min-w-[32px] max-w-[48px] focus:outline-none"
        value={discountType}
        onChange={e => onChange(e.target.value as any, discountValue)}
      >
        <option value="none">-</option>
        <option value="percent">%</option>
        <option value="amount">$</option>
      </select>
      {discountType !== 'none' && (
        <input
          type="number"
          min={0}
          max={discountType === 'percent' ? 100 : maxValue}
          value={discountValue}
          className="border rounded px-1 py-0.5 w-10 text-xs text-right focus:outline-none"
          style={{ minWidth: 32 }}
          onChange={e => {
            let val = Number(e.target.value);
            if (discountType === 'percent') val = Math.min(100, Math.max(0, val));
            else val = Math.min(maxValue, Math.max(0, val));
            onChange(discountType, val);
          }}
        />
      )}
      {/* Icono visual del tipo */}
      {discountType === 'percent' && <span className="text-xs text-gray-500">%</span>}
      {discountType === 'amount' && <span className="text-xs text-gray-500">$</span>}
    </div>
  );
};

export default CartDiscountEditor;
