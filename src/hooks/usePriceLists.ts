import { useEffect, useState } from 'react';
import { priceListsService } from '../services/priceListsService';
import { PriceList } from '../../types';

export function usePriceLists() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    priceListsService.getPriceLists().then(lists => {
      setPriceLists(lists);
      setLoading(false);
    });
  }, []);

  return { priceLists, loading };
}
