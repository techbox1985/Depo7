import React from 'react';
import { useQueuedSalesStore } from '../../store/useQueuedSalesStore';

interface Props {
  onResume: (id: string) => void;
}

const QueuedSalesList: React.FC<Props> = ({ onResume }) => {
  const queuedSales = useQueuedSalesStore((s) => s.queuedSales);

  if (!queuedSales.length) return null;

  return (
    <div style={{ margin: '1rem 0', background: '#f7f7f7', borderRadius: 8, padding: 8 }}>
      <strong>Ventas en cola</strong>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {queuedSales.map((sale) => (
          <li key={`queued-sale-${sale.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
            <span>{sale.label} — {sale.items.length} ítems — ${sale.total.toFixed(2)}</span>
            <button onClick={() => onResume(sale.id)} style={{ marginLeft: 8 }}>Retomar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QueuedSalesList;
