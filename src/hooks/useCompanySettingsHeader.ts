import { useState, useEffect } from 'react';
import { companySettingsService } from '../services/companySettingsService';

export function useCompanySettingsHeader() {
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    companySettingsService.getCompanySettings().then(setCompany).catch(() => setCompany(null));
  }, []);

  return { company };
}
