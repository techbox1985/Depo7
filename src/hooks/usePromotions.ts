import { useEffect } from 'react';
import { usePromotionsStore } from '../store/usePromotionsStore';

export const usePromotions = () => {
  const { promotions, isLoading, error, fetchPromotions, addPromotion, updatePromotion, deletePromotion } = usePromotionsStore();

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

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
