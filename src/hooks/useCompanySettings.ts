import { useState, useEffect } from 'react';
import { companySettingsService } from '../services/companySettingsService';

export function useCompanySettings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companySettingsService.getCompanySettings();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const save = async (updates: any) => {
    if (!data?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await companySettingsService.updateCompanySettings(data.id, updates);
      setData(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, save, refetch: fetchData };
}
