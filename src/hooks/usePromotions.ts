import { useEffect } from 'react';
import { usePromotionsStore } from '../store/usePromotionsStore';

export const usePromotions = () => {
  const { promotions, isLoading, error, fetchPromotions, addPromotion, updatePromotion, deletePromotion } = usePromotionsStore();

  useEffect(() => {
    fetchPromotions();
    // Solo una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    promotions,
    isLoading,
    error,
    addPromotion,
    updatePromotion,
    deletePromotion,
    refreshPromotions: fetchPromotions,
  };
};
