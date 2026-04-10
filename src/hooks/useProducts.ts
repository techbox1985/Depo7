import { useEffect } from 'react';
import { useProductsStore } from '../store/useProductsStore';
import { useLocation } from 'react-router-dom';

export const useProducts = () => {
  const { 
    products, 
    isLoading, 
    isLoadingMore,
    hasMore,
    error, 
    fetchProducts, 
    fetchMoreProducts,
    addProduct, 
    updateProduct 
  } = useProductsStore();
  const location = useLocation();
  const isPOS = location.pathname.includes('/pos');

  useEffect(() => {
    if (products.length === 0 && !isLoading && !error) {
      fetchProducts(isPOS);
    }
  }, [products.length, isLoading, error, fetchProducts, isPOS]);

  return {
    products,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    addProduct,
    updateProduct,
    refreshProducts: fetchProducts,
    fetchMoreProducts,
  };
};
