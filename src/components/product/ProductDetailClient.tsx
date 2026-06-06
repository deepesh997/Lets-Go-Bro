'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/services/api';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { trackStoreClick } from '@/components/product/ProductCard';
import ProductCard from '@/components/product/ProductCard';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Dynamic live product states to load fresh details from Amazon link in background
  const [liveProduct, setLiveProduct] = useState<Product>(product);
  const [loadingLive, setLoadingLive] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([
    product.product_image,
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
  ]);

  const isSaved = isInWishlist(product.product_id);
  const isCompared = isInCompare(product.product_id);

  // Gallery Active Image
  const [activeImage, setActiveImage] = useState(product.product_image);

  // Reset states when the product prop changes (route transition)
  useEffect(() => {
    setLiveProduct(product);
    setActiveImage(product.product_image);
    setGalleryImages([
      product.product_image,
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
    ]);
    addToRecentlyViewed(product);
  }, [product]);

  // Scraping effect for live Amazon information
  useEffect(() => {
    if (!product.affiliate_url) return;

    const isAmazon = product.affiliate_url.includes('amazon') || product.affiliate_url.includes('amzn.to');
    if (!isAmazon) return;

    const fetchLiveDetails = async () => {
      setLoadingLive(true);
      try {
        const res = await fetch(`/api/scrape?url=${encodeURIComponent(product.affiliate_url)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            setLiveProduct(prev => ({
              ...prev,
              price: data.price || prev.price,
              mrp: data.mrp || prev.mrp,
              discount_percentage: data.discount_percentage || prev.discount_percentage,
              full_description: data.description || prev.full_description,
              rating: data.rating || prev.rating,
              review_count: data.reviewCount || prev.review_count,
            }));
            
            if (data.images && data.images.length > 0) {
              setGalleryImages(data.images.slice(0, 4));
              setActiveImage(data.images[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching live product details:', err);
      } finally {
        setLoadingLive(false);
      }
    };

    fetchLiveDetails();
  }, [product.affiliate_url]);

  // Build JSON-LD Breadcrumb Schema
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: typeof window !== 'undefined' ? window.location.origin : '',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: liveProduct.category,
        item: typeof window !== 'undefined' ? `${window.location.origin}/category/${liveProduct.category.toLowerCase()}` : '',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: liveProduct.product_name,
        item: typeof window !== 'undefined' ? window.location.href : '',
      },
    ],
  };

  // Stock Management Rules
  const qty = liveProduct.available_quantity;
  let stockState: 'in' | 'limited' | 'out' = 'in';
  let stockLabel = 'In Stock';
  let stockColorClass = 'text-green-600 dark:text-emerald-400';
  let stockBadgeIcon = 'check_circle';

  if (qty > 20) {
    stockState = 'in';
    stockLabel = 'In Stock - Ready to Ship';
  } else if (qty >= 1 && qty <= 20) {
    stockState = 'limited';
    stockLabel = `Limited Stock Available (${qty})`;
    stockColorClass = 'text-amber-600 dark:text-amber-400';
    stockBadgeIcon = 'warning';
  } else {
    stockState = 'out';
    stockLabel = 'Out of Stock';
    stockColorClass = 'text-error';
    stockBadgeIcon = 'cancel';
  }

  const handleShareClick = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: liveProduct.product_name,
        text: liveProduct.short_description,
        url: window.location.href
      }).catch(console.error);
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  const handleWishlistToggle = () => {
    if (isSaved) {
      removeFromWishlist(liveProduct.product_id);
    } else {
      addToWishlist(liveProduct);
    }
  };

  const handleCompareToggle = () => {
    if (isCompared) {
      removeFromCompare(liveProduct.product_id);
    } else {
      const res = addToCompare(liveProduct);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-gutter py-unit-lg lg:py-unit-xl min-h-screen">
      {/* Dynamic JSON-LD breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumbs UI */}
      <div className="flex items-center gap-unit-xs text-body-sm text-on-surface-variant dark:text-surface-variant/80 mb-unit-lg">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href={`/category/${liveProduct.category.toLowerCase()}`} className="hover:underline">
          {liveProduct.category}
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="font-bold text-on-surface dark:text-white truncate max-w-[200px] sm:max-w-none">
          {liveProduct.product_name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-lg lg:gap-unit-xl items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-unit-md">
          <div className="glass-panel rounded-xl overflow-hidden aspect-square relative transition-colors duration-200">
            {loadingLive && (
              <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-primary/20 text-primary dark:text-primary-fixed-dim rounded-lg text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                Updating price...
              </div>
            )}
            <img
              src={activeImage}
              alt={liveProduct.product_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-unit-sm">
            {galleryImages.map((imgUrl, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(imgUrl)}
                className={`glass-panel rounded-lg overflow-hidden aspect-square cursor-pointer transition-all ${
                  activeImage === imgUrl
                    ? 'border-2 border-primary dark:border-primary-fixed-dim'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Buy Actions & Details */}
        <div className="lg:col-span-5 space-y-unit-lg">
          <div className="space-y-unit-xs">
            <p className="text-label-md font-label-md text-primary dark:text-primary-fixed-dim tracking-widest uppercase">
              {liveProduct.brand}
            </p>
            <h1 className="font-h2 text-h2 text-on-surface dark:text-white leading-tight">
              {liveProduct.product_name}
            </h1>
            
            {/* Ratings */}
            <div className="flex items-center gap-unit-sm mt-unit-sm text-body-sm text-on-surface-variant dark:text-surface-variant/80">
              <div className="flex text-tertiary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings:
                        i < Math.floor(liveProduct.rating)
                          ? "'FILL' 1"
                          : i < liveProduct.rating
                          ? "'FILL' 0.5"
                          : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="font-bold">({liveProduct.review_count} Reviews)</span>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="p-unit-lg glass-panel rounded-xl space-y-unit-md transition-colors duration-200">
            <div className="flex items-end gap-unit-md">
              <span className="font-h1 text-h1 text-on-surface dark:text-white">
                ₹{liveProduct.price.toLocaleString('en-IN')}
              </span>
              {liveProduct.mrp > liveProduct.price && (
                <>
                  <span className="text-body-lg text-outline line-through mb-1">
                    ₹{liveProduct.mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-error-container text-on-error-container px-unit-sm py-1 rounded text-label-md font-label-md mb-1">
                    {liveProduct.discount_percentage}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-unit-sm">
              <span className={`material-symbols-outlined ${stockColorClass}`}>
                {stockBadgeIcon}
              </span>
              <span className={`text-body-sm font-bold ${stockColorClass}`}>
                {stockLabel}
              </span>
            </div>

            {/* Link Actions */}
            <div className="space-y-unit-sm pt-unit-sm">
              {stockState === 'out' ? (
                <button
                  disabled
                  className="w-full py-4 bg-surface-container-high text-outline cursor-not-allowed text-label-md font-bold rounded-xl text-center"
                >
                  Out of Stock
                </button>
              ) : (
                <a
                  href={liveProduct.affiliate_url}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  onClick={() => trackStoreClick(liveProduct)}
                  className="w-full py-4 bg-primary hover:bg-primary-container text-on-primary text-label-md font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-unit-sm"
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  View Deal on {liveProduct.affiliate_platform}
                </a>
              )}

              {/* Utility grid */}
              <div className="grid grid-cols-3 gap-unit-sm">
                <button
                  onClick={handleWishlistToggle}
                  className={`flex flex-col items-center justify-center py-unit-sm border border-outline-variant dark:border-outline-variant/30 rounded-lg hover:bg-surface-container transition-all ${
                    isSaved ? 'text-error' : 'text-on-surface-variant dark:text-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                  <span className="text-[10px] mt-1 uppercase font-bold">
                    {isSaved ? 'Saved' : 'Save'}
                  </span>
                </button>
                <button
                  onClick={handleCompareToggle}
                  className={`flex flex-col items-center justify-center py-unit-sm border border-outline-variant dark:border-outline-variant/30 rounded-lg hover:bg-surface-container transition-all ${
                    isCompared ? 'text-primary dark:text-primary-fixed-dim' : 'text-on-surface-variant dark:text-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined">compare_arrows</span>
                  <span className="text-[10px] mt-1 uppercase font-bold">
                    {isCompared ? 'Compared' : 'Compare'}
                  </span>
                </button>
                <button
                  onClick={handleShareClick}
                  className="flex flex-col items-center justify-center py-unit-sm border border-outline-variant dark:border-outline-variant/30 rounded-lg hover:bg-surface-container text-on-surface-variant dark:text-surface-variant transition-all"
                >
                  <span className="material-symbols-outlined">share</span>
                  <span className="text-[10px] mt-1 uppercase font-bold">Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ad Placement */}
          <div className="glass-panel rounded-xl p-unit-lg flex flex-items-center justify-center min-h-[120px]">
            <code className="font-code text-xs text-outline uppercase tracking-widest self-center text-center">
              Sponsored Content
            </code>
          </div>

          {/* Bullet Point Features list */}
          <div className="space-y-unit-sm">
            <h3 className="font-label-md text-label-md uppercase text-outline dark:text-surface-variant/60 tracking-wider">
              Key Features
            </h3>
            <ul className="space-y-unit-sm">
              {liveProduct.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-unit-sm">
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-sm mt-1">
                    check_circle
                  </span>
                  <span className="text-body-sm dark:text-surface-variant">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detail Specifications block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-xl mt-unit-xl">
        {/* Specifications, Description, Pros/Cons */}
        <div className="lg:col-span-8 space-y-unit-xl">
          {/* About / Description */}
          <section className="space-y-unit-sm">
            <h3 className="font-h2 text-h2 dark:text-white">Product Overview</h3>
            <p className="text-body-md text-on-surface-variant dark:text-surface-variant/80 leading-relaxed">
              {liveProduct.full_description}
            </p>
          </section>

          {/* Pros and Cons lists */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-unit-lg">
            <div className="glass-panel rounded-xl p-unit-lg border-l-4 border-green-500">
              <h4 className="font-h3 text-h3 dark:text-white mb-unit-md flex items-center gap-unit-sm">
                <span className="material-symbols-outlined text-green-500">thumb_up</span> Pros
              </h4>
              <ul className="space-y-unit-sm text-body-md dark:text-surface-variant/90">
                {liveProduct.pros.map((pro, i) => (
                  <li key={i}>• {pro}</li>
                ))}
              </ul>
            </div>
            <div className="glass-panel rounded-xl p-unit-lg border-l-4 border-error">
              <h4 className="font-h3 text-h3 dark:text-white mb-unit-md flex items-center gap-unit-sm">
                <span className="material-symbols-outlined text-error">thumb_down</span> Cons
              </h4>
              <ul className="space-y-unit-sm text-body-md dark:text-surface-variant/90">
                {liveProduct.cons.map((con, i) => (
                  <li key={i}>• {con}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Specs Table */}
          <section>
            <h3 className="font-h2 text-h2 dark:text-white mb-unit-lg">Technical Specifications</h3>
            <div className="glass-panel rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/30 dark:bg-inverse-surface/30 border-b border-outline-variant dark:border-outline-variant/10 text-on-surface dark:text-white">
                    <th className="p-unit-md font-label-md text-label-md">Feature</th>
                    <th className="p-unit-md font-label-md text-label-md">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant dark:divide-outline-variant/10 text-body-sm">
                  {Object.entries(liveProduct.specs).map(([key, val]) => (
                    <tr key={key} className="hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-colors">
                      <td className="p-unit-md font-bold text-on-surface-variant dark:text-surface-variant/80 w-1/3">
                        {key}
                      </td>
                      <td className="p-unit-md dark:text-surface-variant">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right: Sidebar Sticky Accessories Recommendations */}
        <aside className="lg:col-span-4 space-y-unit-lg sticky top-24">
          <div className="glass-panel rounded-xl p-unit-lg transition-colors duration-200">
            <h3 className="font-h3 text-h3 dark:text-white mb-unit-md">Recommended Accessories</h3>
            <div className="space-y-unit-md">
              {/* Accessory 1 */}
              <div className="flex gap-unit-md group cursor-pointer">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=200&q=80"
                    alt="Accessory Stand"
                  />
                </div>
                <div>
                  <h4 className="text-body-sm font-bold dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                    Premium Solid Walnut Headphone Stand
                  </h4>
                  <p className="text-primary dark:text-primary-fixed-dim font-bold mt-1">₹3,499</p>
                  <span className="text-[10px] font-bold text-outline uppercase">Accessory</span>
                </div>
              </div>
              {/* Accessory 2 */}
              <div className="flex gap-unit-md group cursor-pointer">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src="https://images.unsplash.com/photo-1557063673-0493e05d49ef?auto=format&fit=crop&w=200&q=80"
                    alt="Accessory Cable"
                  />
                </div>
                <div>
                  <h4 className="text-body-sm font-bold dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                    Ultra-Durable Braided USB-C Quick Charge Cable
                  </h4>
                  <p className="text-primary dark:text-primary-fixed-dim font-bold mt-1">₹1,299</p>
                  <span className="text-[10px] font-bold text-outline uppercase">Cable</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-unit-lg py-2 border border-primary dark:border-primary-fixed-dim text-primary dark:text-primary-fixed-dim font-label-md text-label-md rounded-lg hover:bg-primary hover:text-on-primary transition-all">
              See More Accessories
            </button>
          </div>

          {/* Vertical Banner Placeholder */}
          <div className="glass-panel border-2 border-dashed border-outline-variant dark:border-outline-variant/20 rounded-xl p-unit-lg flex flex-items-center justify-center min-h-[200px]">
            <code className="font-code text-xs text-outline uppercase tracking-widest text-center self-center">
              Vertical Banner Ad<br />Place Here
            </code>
          </div>
        </aside>
      </div>

      {/* Related Products Panel */}
      {relatedProducts.length > 0 && (
        <section className="mt-unit-xl border-t border-outline-variant/30 pt-unit-xl">
          <div className="flex justify-between items-end mb-unit-lg">
            <div>
              <h2 className="font-h2 text-h2 dark:text-white">Similar Alternatives</h2>
              <p className="text-on-surface-variant dark:text-surface-variant">Top rated deals in this category</p>
            </div>
            <Link
              href={`/category/${liveProduct.category.toLowerCase()}`}
              className="text-primary dark:text-primary-fixed-dim font-bold flex items-center gap-unit-xs hover:underline"
            >
              View All <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-unit-lg">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.product_id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Buy Now Option */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-surface-container/95 dark:bg-inverse-surface/95 backdrop-blur-md p-unit-md border-t border-outline-variant dark:border-outline-variant/20 z-50 flex items-center justify-between gap-unit-md">
        <div className="flex flex-col">
          <span className="text-label-md font-bold text-on-surface dark:text-white">
            ₹{liveProduct.price.toLocaleString('en-IN')}
          </span>
          <span className={`text-[10px] font-bold uppercase ${stockColorClass}`}>
            {qty > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        {stockState === 'out' ? (
          <button
            disabled
            className="flex-1 bg-surface-container-high text-outline py-3 rounded-lg font-label-md text-label-md text-center cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <a
            href={liveProduct.affiliate_url}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            onClick={() => trackStoreClick(liveProduct)}
            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 text-center"
          >
            <span className="material-symbols-outlined text-sm">shopping_cart</span>
            Buy Now
          </a>
        )}
      </div>
    </div>
  );
}
