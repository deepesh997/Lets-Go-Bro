'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '@/components/product/ProductCard';

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-unit-xl min-h-screen text-center flex flex-col items-center justify-center space-y-unit-md">
        <div className="w-20 h-20 rounded-full bg-surface-container dark:bg-surface-container-high flex items-center justify-center text-outline">
          <span className="material-symbols-outlined text-5xl">favorite</span>
        </div>
        <h1 className="text-h2 font-h2 dark:text-white">Your Wishlist is Empty</h1>
        <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-md">
          Save deals you are tracking! Browse products and click the heart icon to build your wishlist here.
        </p>
        <Link
          href="/search"
          className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all inline-block"
        >
          Explore Deals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter py-unit-xl min-h-screen transition-colors duration-200">
      <section className="mb-unit-xl">
        <h1 className="text-h1 font-h1 text-on-surface dark:text-white mb-unit-sm">
          Saved Products
        </h1>
        <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-xl">
          Keep track of your favorite deals, merchant updates, and price drops.
        </p>
      </section>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-unit-lg">
        {wishlist.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>
    </div>
  );
}
