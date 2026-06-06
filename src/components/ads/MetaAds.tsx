'use client';

import React from 'react';

interface AdProps {
  className?: string;
}

// 1. Banner Ad
export function BannerAd({ className = '' }: AdProps) {
  return (
    <div className={`w-full bg-surface-container-low dark:bg-surface-container border border-outline-variant/60 rounded-xl p-unit-md flex items-center justify-between text-left relative overflow-hidden group hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center gap-unit-md">
        <div className="w-12 h-12 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-2xl">campaign</span>
        </div>
        <div>
          <span className="text-[10px] bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase">Meta Sponsored</span>
          <h5 className="font-label-md text-body-sm mt-1 text-on-surface dark:text-white">Looking for custom marketing channels?</h5>
          <p className="text-[11px] text-outline italic">Promote direct listings and deals with Meta Ads.</p>
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-label-md text-xs rounded-lg transition-colors flex-shrink-0">
        Learn More
      </button>
    </div>
  );
}

// 2. Native Ad
export function NativeAd({ className = '' }: AdProps) {
  return (
    <div className={`p-unit-lg bg-white dark:bg-surface-container rounded-xl border border-outline-variant dark:border-outline-variant/10 shadow-sm space-y-unit-sm ${className}`}>
      <div className="flex items-center gap-unit-sm">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-sm">public</span>
        </div>
        <div>
          <h6 className="text-body-sm font-bold dark:text-white">Marketing Solutions Inc.</h6>
          <span className="text-[9px] text-outline uppercase font-semibold">Sponsored</span>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/80">
        Increase your sales conversions by targeting user-intent search traffic with highly contextual retargeting campaigns.
      </p>
      <div className="w-full h-32 rounded-lg bg-surface-container-low dark:bg-inverse-surface border border-outline-variant/30 flex items-center justify-center text-outline text-xs uppercase tracking-widest font-mono">
        Native Media Placeholder
      </div>
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-outline">marketing.solutions.com</span>
        <button className="px-4 py-1.5 bg-blue-600 text-white font-label-md text-xs rounded-lg">
          Apply Now
        </button>
      </div>
    </div>
  );
}

// 3. In-Feed Ad
export function InFeedAd({ className = '' }: AdProps) {
  return (
    <div className={`border border-outline-variant dark:border-outline-variant/10 rounded-xl overflow-hidden bg-white dark:bg-surface-container flex flex-col hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <div className="relative aspect-square bg-surface-container-low dark:bg-inverse-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-5xl">photo_library</span>
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase">Sponsored</span>
      </div>
      <div className="p-unit-md space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-code font-code text-blue-600 dark:text-blue-400 uppercase text-[9px] tracking-wider block">Meta Partner Network</span>
          <h4 className="font-label-md text-on-surface dark:text-white line-clamp-1">Automated Social Media Optimization</h4>
          <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/70 line-clamp-2 mt-1">Scale your organic web presence and automate contextual content distribution across networks.</p>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-label-md text-body-sm py-2 rounded-lg transition-colors mt-4">
          Visit Site
        </button>
      </div>
    </div>
  );
}
