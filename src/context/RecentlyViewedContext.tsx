'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/services/api';

interface RecentlyViewedContextType {
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hubpro_recently_viewed');
    if (saved) {
      try {
        setRecentlyViewed(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recently viewed list from localStorage', e);
      }
    }
  }, []);

  const addToRecentlyViewed = (product: Product) => {
    // Deduplicate and move to head of list
    const filtered = recentlyViewed.filter((p) => p.product_id !== product.product_id);
    const newList = [product, ...filtered].slice(0, 10); // keep max 10
    setRecentlyViewed(newList);
    localStorage.setItem('hubpro_recently_viewed', JSON.stringify(newList));
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addToRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
}
