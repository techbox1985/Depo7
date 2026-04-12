import React, { useState, useEffect, useRef } from 'react';

export interface CartDiscountEditorProps {
  discountType: 'none' | 'percent' | 'amount';
  discountValue: number;
  onChange: (type: 'none' | 'percent' | 'amount', value: number) => void;
  maxValue: number;
}


export const CartDiscountEditor: React.FC<CartDiscountEditorProps> = ({ discountType, discountValue, onChange, maxValue }) => {
  // Local state for smooth typing
  const [localType, setLocalType] = useState(discountType);
  const [localValue, setLocalValue] = useState(discountValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when props change (only if not editing)
  useEffect(() => {
    setLocalType(discountType);
  }, [discountType]);
  useEffect(() => {
    setLocalValue(discountValue);
  }, [discountValue]);

  // Commit changes to parent only on blur or Enter
  const commit = () => {
    let val = Number(localValue);
    if (localType === 'percent') val = Math.min(100, Math.max(0, val));
    else val = Math.min(maxValue, Math.max(0, val));
    onChange(localType, val);
  };

  return (
    <div className="flex items-center gap-1">
      <select
        className="border rounded px-1 py-0.5 text-xs min-w-8 max-w-12 focus:outline-none"
        value={localType}
        onChange={e => {
          const newType = e.target.value as 'none' | 'percent' | 'amount';
          setLocalType(newType);
          // Reset value if type changes
          if (newType === 'none') {
            setLocalValue(0);
            onChange('none', 0);
          } else {
            // Commit with current value
            setTimeout(() => commit(), 0);
          }
        }}
      >
        <option value="none">-</option>
        <option value="percent">%</option>
        <option value="amount">$</option>
      </select>
      {localType !== 'none' && (
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={localType === 'percent' ? 100 : maxValue}
          value={localValue}
          step={localType === 'percent' ? 5 : 100}
          className={
            localType === 'amount'
              ? 'border rounded px-2 py-0.5 w-20 text-xs text-right focus:outline-none bg-yellow-50 border-yellow-300'
              : 'border rounded px-1 py-0.5 w-10 text-xs text-right focus:outline-none'
          }
          style={localType === 'amount' ? { minWidth: 60 } : { minWidth: 32 }}
          onChange={e => {
            setLocalValue(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              inputRef.current?.blur();
            }
          }}
        />
      )}
      {/* Icono visual del tipo */}
      {localType === 'percent' && <span className="text-xs text-gray-500">%</span>}
      {localType === 'amount' && <span className="text-xs text-gray-500">$</span>}
    </div>
  );
};

export default CartDiscountEditor;
