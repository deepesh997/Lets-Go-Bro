'use client';

import React from 'react';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { trackStoreClick } from '@/components/product/ProductCard';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  // If comparison is empty, show a friendly dashboard recommending trending options
  if (compareList.length === 0) {
    return (
      <div className="max-w-container-max mx-auto px-gutter py-unit-xl min-h-screen text-center flex flex-col items-center justify-center space-y-unit-md">
        <div className="w-20 h-20 rounded-full bg-surface-container dark:bg-surface-container-high flex items-center justify-center text-outline">
          <span className="material-symbols-outlined text-5xl">compare_arrows</span>
        </div>
        <h1 className="text-h2 font-h2 dark:text-white">Your Comparison List is Empty</h1>
        <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-md">
          Browse products and click the "Compare" checkbox on product cards to add them to your comparison dashboard.
        </p>
        <Link
          href="/search"
          className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all inline-block"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  // All unique features across compared products
  const allFeatures = Array.from(
    new Set(compareList.flatMap((p) => p.features))
  ).slice(0, 5); // compare top 5 features

  return (
    <div className="max-w-container-max mx-auto px-gutter py-unit-xl min-h-screen transition-colors duration-200">
      {/* Header Section */}
      <section className="mb-unit-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-unit-md">
        <div>
          <h1 className="text-h1 font-h1 text-on-surface dark:text-white mb-unit-sm">
            Product Comparison
          </h1>
          <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-2xl">
            Analyze the top-performing products side-by-side. Our data-driven comparison focuses on performance metrics, store availability, and real-world utility.
          </p>
        </div>
        <button
          onClick={clearCompare}
          className="px-4 py-2 border border-error text-error hover:bg-error-container/10 font-bold rounded-xl text-xs transition-colors"
        >
          Clear Comparison
        </button>
      </section>

      {/* Comparison Grid Tool */}
      <div className="glass-panel border border-outline-variant dark:border-outline-variant/10 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto comparison-scroll">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-outline-variant dark:border-outline-variant/10">
                {/* Header Title column */}
                <th className="sticky-column bg-surface-container-low/80 dark:bg-surface-container/80 backdrop-blur-md p-unit-lg border-r border-outline-variant dark:border-outline-variant/10 w-[220px] text-left">
                  <span className="text-label-md font-label-md text-on-surface dark:text-white uppercase tracking-wider block">
                    Product Detail
                  </span>
                </th>
                {/* Render up to 4 compared products */}
                {compareList.map((product) => (
                  <th
                    key={product.product_id}
                    className="p-unit-lg text-center align-top relative min-w-[220px] bg-white/50 dark:bg-inverse-surface/50 backdrop-blur-md"
                  >
                    {/* Close action */}
                    <button
                      onClick={() => removeFromCompare(product.product_id)}
                      className="absolute top-2 right-2 p-1 text-outline hover:text-error hover:bg-surface-container rounded-full"
                      title="Remove product"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    
                    <div className="flex flex-col items-center gap-unit-sm mt-2">
                      <div className="w-32 h-32 rounded-lg overflow-hidden border border-outline-variant dark:border-outline-variant/10 bg-surface-container-low dark:bg-surface-container-high flex-shrink-0">
                        <img
                          src={product.product_image}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Link href={`/product/${product.product_slug}`}>
                        <h3 className="text-body-md font-bold text-on-surface dark:text-white hover:text-primary transition-colors line-clamp-2 mt-2">
                          {product.product_name}
                        </h3>
                      </Link>
                      <span className="text-[10px] bg-surface-container dark:bg-surface-container-high text-outline px-2 py-0.5 rounded font-bold uppercase">
                        {product.brand}
                      </span>
                    </div>
                  </th>
                ))}
                {/* Empty spaces if less than 4 compared */}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <th key={i} className="p-unit-lg min-w-[220px] bg-white/50 dark:bg-inverse-surface/50 backdrop-blur-md text-center opacity-30 text-outline border-l border-outline-variant/30">
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-outline-variant rounded-lg">
                      <span className="material-symbols-outlined text-3xl">add</span>
                      <span className="text-xs font-bold mt-1">Empty Slot</span>
                      <Link href="/search" className="text-[10px] text-primary underline mt-2">
                        Add Product
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant dark:divide-outline-variant/10 text-body-sm dark:text-surface-variant">
              {/* Price row */}
              <tr className="hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors">
                <td className="sticky-column bg-surface-container-low dark:bg-surface-container p-unit-md border-r border-outline-variant dark:border-outline-variant/10 font-bold">
                  <div className="flex items-center gap-unit-sm">
                    <span className="material-symbols-outlined text-outline">payments</span>
                    <span>Price</span>
                  </div>
                </td>
                {compareList.map((product) => (
                  <td key={product.product_id} className="p-unit-md text-center">
                    <span className="text-h3 font-h3 text-primary dark:text-primary-fixed-dim font-bold">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  </td>
                ))}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <td key={i} className="p-unit-md border-l border-outline-variant/30"></td>
                ))}
              </tr>

              {/* Rating row */}
              <tr className="hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors">
                <td className="sticky-column bg-surface-container-low dark:bg-surface-container p-unit-md border-r border-outline-variant dark:border-outline-variant/10 font-bold">
                  <div className="flex items-center gap-unit-sm">
                    <span className="material-symbols-outlined text-outline">star</span>
                    <span>Rating</span>
                  </div>
                </td>
                {compareList.map((product) => (
                  <td key={product.product_id} className="p-unit-md text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold dark:text-white">{product.rating}</span>
                      <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-outline text-xs">({product.review_count})</span>
                    </div>
                  </td>
                ))}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <td key={i} className="p-unit-md border-l border-outline-variant/30"></td>
                ))}
              </tr>

              {/* Stock status row */}
              <tr className="hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors">
                <td className="sticky-column bg-surface-container-low dark:bg-surface-container p-unit-md border-r border-outline-variant dark:border-outline-variant/10 font-bold">
                  <div className="flex items-center gap-unit-sm">
                    <span className="material-symbols-outlined text-outline">inventory_2</span>
                    <span>Stock Status</span>
                  </div>
                </td>
                {compareList.map((product) => {
                  const qty = product.available_quantity;
                  return (
                    <td key={product.product_id} className="p-unit-md text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        qty > 20
                          ? 'bg-secondary-container text-on-secondary-container dark:bg-emerald-950 dark:text-emerald-400'
                          : qty > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {qty > 20 ? 'In Stock' : qty > 0 ? 'Limited Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  );
                })}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <td key={i} className="p-unit-md border-l border-outline-variant/30"></td>
                ))}
              </tr>

              {/* Platform row */}
              <tr className="hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors">
                <td className="sticky-column bg-surface-container-low dark:bg-surface-container p-unit-md border-r border-outline-variant dark:border-outline-variant/10 font-bold">
                  <div className="flex items-center gap-unit-sm">
                    <span className="material-symbols-outlined text-outline">storefront</span>
                    <span>Merchant</span>
                  </div>
                </td>
                {compareList.map((product) => (
                  <td key={product.product_id} className="p-unit-md text-center font-bold text-outline">
                    {product.affiliate_platform}
                  </td>
                ))}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <td key={i} className="p-unit-md border-l border-outline-variant/30"></td>
                ))}
              </tr>

              {/* Key features comparison row */}
              <tr className="hover:bg-surface-container-low dark:hover:bg-surface-container transition-colors">
                <td className="sticky-column bg-surface-container-low dark:bg-surface-container p-unit-md border-r border-outline-variant dark:border-outline-variant/10 font-bold align-top">
                  <div className="flex items-center gap-unit-sm">
                    <span className="material-symbols-outlined text-outline">list</span>
                    <span>Key Features</span>
                  </div>
                </td>
                {compareList.map((product) => (
                  <td key={product.product_id} className="p-unit-md align-top">
                    <ul className="space-y-1.5 list-none text-left">
                      {product.features.slice(0, 3).map((f, idx) => (
                        <li key={idx} className="flex gap-1 items-start text-xs dark:text-surface-variant">
                          <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-xs mt-0.5">check_circle</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <td key={i} className="p-unit-md border-l border-outline-variant/30"></td>
                ))}
              </tr>

              {/* Action Buttons row */}
              <tr>
                <td className="sticky-column bg-surface-container-low dark:bg-surface-container p-unit-md border-r border-outline-variant dark:border-outline-variant/10"></td>
                {compareList.map((product) => (
                  <td key={product.product_id} className="p-unit-lg text-center bg-white dark:bg-inverse-surface">
                    {product.available_quantity > 0 ? (
                      <a
                        href={product.affiliate_url}
                        target="_blank"
                        rel="nofollow sponsored noopener noreferrer"
                        onClick={() => trackStoreClick(product)}
                        className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-1"
                      >
                        View Deal <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <button disabled className="w-full py-2.5 bg-surface-container text-outline font-bold rounded-xl text-xs cursor-not-allowed">
                        Out of Stock
                      </button>
                    )}
                  </td>
                ))}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <td key={i} className="p-unit-lg border-l border-outline-variant/30"></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
