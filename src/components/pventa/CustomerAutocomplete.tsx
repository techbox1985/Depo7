import React, { useState, useEffect } from 'react';
import { customersService, Customer } from '../../services/customersService';

interface CustomerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (customer: Customer) => void;
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({ value, onChange, onSelect }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    customersService.getCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    if (!value) {
      setFiltered(customers);
      setShowList(false);
      return;
    }
    const q = value.toLowerCase();
    const f = customers.filter(c => c.name.toLowerCase().includes(q));
    setFiltered(f);
    setShowList(f.length > 0);
  }, [value, customers]);

  return (
    <div className="relative">
      <input
        className="border rounded px-2 py-1 w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => value && setShowList(true)}
        placeholder="Consumidor Final o buscar cliente..."
      />
      {showList && (
        <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-auto shadow">
          {filtered.map(c => (
            <li
              key={c.id}
              className="px-2 py-1 hover:bg-indigo-100 cursor-pointer"
              onMouseDown={() => { onSelect(c); setShowList(false); }}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
