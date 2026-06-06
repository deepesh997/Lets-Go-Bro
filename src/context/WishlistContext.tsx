'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/services/api';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hubpro_wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing wishlist from localStorage', e);
      }
    }
  }, []);

  // Sync wishlist to localStorage whenever it changes
  const saveWishlist = (newWishlist: Product[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('hubpro_wishlist', JSON.stringify(newWishlist));
  };

  const addToWishlist = (product: Product) => {
    if (!wishlist.some((p) => p.product_id === product.product_id)) {
      saveWishlist([...wishlist, product]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    saveWishlist(wishlist.filter((p) => p.product_id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
