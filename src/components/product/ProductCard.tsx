'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/services/api';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function trackStoreClick(product: Product) {
  const event = {
    productId: product.product_id,
    productName: product.product_name,
    platform: product.affiliate_platform,
    timestamp: new Date().toISOString(),
    url: product.affiliate_url
  };
  
  console.log('[Analytics] Store Redirect Click Tracked:', event);
  
  // Store click analytics in localStorage for diagnostics
  try {
    const logs = JSON.parse(localStorage.getItem('store_click_logs') || '[]');
    logs.push(event);
    localStorage.setItem('store_click_logs', JSON.stringify(logs.slice(-100)));
  } catch (e) {
    console.error('Error logging click analytics', e);
  }

  // GA4 / GTM integration
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'store_redirect',
      ecommerce: {
        click: {
          actionField: { list: 'Product Discovery Grid' },
          products: [{
            id: product.product_id,
            name: product.product_name,
            brand: product.brand,
            category: product.category,
            price: product.price
          }]
        }
      },
      ...event
    });
  }
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();

  const isSaved = isInWishlist(product.product_id);
  const isCompared = isInCompare(product.product_id);

  // Stock Management Rules
  const qty = product.available_quantity;
  let stockState: 'in' | 'limited' | 'out' = 'in';
  let stockLabel = 'In Stock';
  let stockBadgeColor = 'bg-secondary-container text-on-secondary-container dark:bg-emerald-950 dark:text-emerald-400';

  if (qty > 20) {
    stockState = 'in';
    stockLabel = 'In Stock';
  } else if (qty >= 1 && qty <= 20) {
    stockState = 'limited';
    stockLabel = `Limited Stock (${qty})`;
    stockBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400';
  } else {
    stockState = 'out';
    stockLabel = 'Out of Stock';
    stockBadgeColor = 'bg-error-container text-on-error-container';
  }

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
      removeFromWishlist(product.product_id);
    } else {
      addToWishlist(product);
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompare(product.product_id);
    } else {
      const res = addToCompare(product);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const handleStoreRedirectClick = (e: React.MouseEvent) => {
    if (stockState === 'out') {
      e.preventDefault();
      return;
    }
    trackStoreClick(product);
  };

  return (
    <div className={`glass-card glass-card-hover rounded-xl flex flex-col group overflow-hidden ${className}`}>
      {/* Product Image Panel */}
      <Link href={`/product/${product.product_slug}`} className="relative aspect-square bg-surface-container-low dark:bg-inverse-surface/40 overflow-hidden block">
        <img
          src={product.product_image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'}
          alt={product.product_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.discount_percentage > 25 && (
            <span className="px-2 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded uppercase">
              {product.discount_percentage}% OFF
            </span>
          )}
          {product.is_featured && (
            <span className="px-2 py-1 bg-primary text-on-primary text-[10px] font-bold rounded uppercase">
              Featured
            </span>
          )}
          {product.is_trending && (
            <span className="px-2 py-1 bg-secondary text-on-secondary text-[10px] font-bold rounded uppercase">
              Trending
            </span>
          )}
        </div>

        {/* Wishlist Action Icon Overlay */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-black/60 backdrop-blur rounded-full text-on-surface-variant dark:text-surface-variant hover:text-error dark:hover:text-error transition-colors z-10"
          aria-label={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
            favorite
          </span>
        </button>

        {/* Compare Checkbox Overlay */}
        <button
          onClick={handleCompareClick}
          className={`absolute bottom-2 left-2 px-2 py-1 bg-white/90 dark:bg-black/75 backdrop-blur rounded text-[10px] font-bold flex items-center gap-1 z-10 transition-colors ${
            isCompared ? 'text-primary dark:text-primary-fixed-dim' : 'text-on-surface-variant dark:text-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[12px]">
            {isCompared ? 'check_box' : 'check_box_outline_blank'}
          </span>
          Compare
        </button>
      </Link>

      {/* Info Block */}
      <div className="p-unit-md flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-outline uppercase tracking-wider">
            <span>{product.brand}</span>
            <span className="text-primary dark:text-primary-fixed-dim">{product.subcategory}</span>
          </div>

          <Link href={`/product/${product.product_slug}`} className="block">
            <h3 className="font-label-md text-on-surface dark:text-white line-clamp-1 hover:text-primary transition-colors">
              {product.product_name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant dark:text-surface-variant/80">
            <span className="material-symbols-outlined text-tertiary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span className="font-bold">{product.rating}</span>
            <span>({product.review_count} reviews)</span>
          </div>
        </div>

        {/* Price & Performance block */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-h3 font-bold text-primary dark:text-primary-fixed-dim">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.price && (
                <span className="text-body-sm text-outline line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            
            {/* Stock Level Badge */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stockBadgeColor}`}>
              {stockLabel}
            </span>
          </div>

          {/* Consumer-friendly Performance Metrics */}
          <div className="flex items-center gap-unit-sm py-1 border-y border-outline-variant/30 text-[11px]">
            <div className="bg-primary/5 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-primary dark:text-primary-fixed-dim">visibility</span>
              <span className="font-bold text-primary dark:text-primary-fixed-dim">
                {Math.round(product.review_count * 1.8)} Views
              </span>
            </div>
            <div className="bg-surface-container px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-outline">verified</span>
              <span className="font-bold text-on-surface-variant dark:text-surface-variant/80">
                {Math.round(product.rating * 20)}% Match
              </span>
            </div>
          </div>

          {/* Action button */}
          {stockState === 'out' ? (
            <button
              disabled
              className="w-full bg-surface-container-high text-outline cursor-not-allowed py-2.5 rounded-xl text-body-sm font-bold text-center block"
            >
              Out of Stock
            </button>
          ) : (
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              onClick={handleStoreRedirectClick}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 rounded-xl text-body-sm font-bold transition-all shadow-md hover:translate-y-[-1px] active:scale-95 text-center block"
            >
              Get Deal on {product.affiliate_platform}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
