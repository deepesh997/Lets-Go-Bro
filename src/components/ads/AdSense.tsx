'use client';

import React, { useEffect, useState } from 'react';

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || '';
const isAdsEnabled = ADSENSE_ID !== '';

interface AdProps {
  className?: string;
}

// Helper script load
function useAdSenseScript() {
  useEffect(() => {
    if (!isAdsEnabled) return;
    
    // Check if script already exists
    const existing = document.querySelector(`script[src*="adsbygoogle"]`);
    if (existing) return;

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, []);
}

// Push AdSense block
function AdBlock({ format = 'auto', slot = '', responsive = 'true' }: { format?: string; slot?: string; responsive?: string }) {
  useEffect(() => {
    if (isAdsEnabled) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense push failed', e);
      }
    }
  }, []);

  if (!isAdsEnabled) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive}
    />
  );
}

// 1. Header Ad Slot
export function HeaderAd({ className = '' }: AdProps) {
  useAdSenseScript();

  if (!isAdsEnabled) {
    return (
      <div className={`w-full py-4 bg-surface-container-low dark:bg-surface-container border border-dashed border-outline-variant rounded-xl flex items-center justify-center p-4 text-center ${className}`}>
        <div>
          <code className="text-outline text-xs uppercase tracking-widest block mb-1">Sponsored Content - Header Ad</code>
          <p className="text-on-surface-variant dark:text-surface-variant text-xs italic">Maximize views with premium leaderboard placements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`header-ad-container max-w-container-max mx-auto px-gutter my-unit-sm ${className}`}>
      <AdBlock slot="header-slot" format="horizontal" />
    </div>
  );
}

// 2. Sidebar Ad Slot
export function SidebarAd({ className = '' }: AdProps) {
  useAdSenseScript();

  if (!isAdsEnabled) {
    return (
      <div className={`p-unit-md bg-surface-container-low dark:bg-surface-container rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center min-h-[250px] ${className}`}>
        <code className="font-code text-xs text-outline uppercase tracking-wider block mb-2">Premium Listing Ad</code>
        <div className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center text-primary mb-2">
          <span className="material-symbols-outlined">bolt</span>
        </div>
        <p className="text-[11px] text-outline italic">Target buying-intent shoppers in listings.</p>
      </div>
    );
  }

  return (
    <div className={`sidebar-ad-container my-unit-md ${className}`}>
      <AdBlock slot="sidebar-slot" format="vertical" />
    </div>
  );
}

// 3. In-Content Ad Slot
export function InContentAd({ className = '' }: AdProps) {
  useAdSenseScript();

  if (!isAdsEnabled) {
    return (
      <div className={`w-full py-unit-lg my-unit-md ${className}`}>
        <div className="w-full h-32 bg-surface-container-low dark:bg-surface-container rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="text-center z-10 px-gutter">
            <code className="text-outline text-xs uppercase tracking-widest block mb-2">Sponsored Content - In Content</code>
            <p className="text-on-surface-variant dark:text-surface-variant text-body-sm italic">Promote your brand here with high-converting native display ads.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`in-content-ad-container my-unit-md ${className}`}>
      <AdBlock slot="in-content-slot" format="auto" />
    </div>
  );
}

// 4. Footer Ad Slot
export function FooterAd({ className = '' }: AdProps) {
  useAdSenseScript();

  if (!isAdsEnabled) {
    return (
      <div className={`w-full py-6 bg-surface-container-low dark:bg-surface-container border-t border-dashed border-outline-variant flex items-center justify-center text-center ${className}`}>
        <div>
          <code className="text-outline text-xs uppercase tracking-widest block mb-1">Sponsored Content - Footer Ad</code>
          <p className="text-on-surface-variant dark:text-surface-variant text-xs italic">Sponsored listing options available at checkout.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`footer-ad-container my-unit-md ${className}`}>
      <AdBlock slot="footer-slot" format="horizontal" />
    </div>
  );
}

// 5. Mobile Sticky Ad Slot
export function MobileStickyAd({ className = '' }: AdProps) {
  useAdSenseScript();
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  if (!isAdsEnabled) {
    return (
      <div className={`lg:hidden fixed bottom-16 left-0 w-full bg-surface-container-low/95 dark:bg-inverse-surface/95 border-t-2 border-dashed border-outline-variant p-2 z-50 flex items-center justify-between gap-unit-md shadow-2xl ${className}`}>
        <div className="flex-1 text-center">
          <code className="text-outline text-[10px] uppercase tracking-wider font-bold">Sticky Mobile Promo</code>
          <p className="text-[10px] text-on-surface-variant italic">High CTR Mobile Banner</p>
        </div>
        <button onClick={() => setClosed(true)} className="p-1 rounded-full hover:bg-surface-container text-outline">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`lg:hidden fixed bottom-16 left-0 w-full bg-surface-container/95 border-t border-outline-variant z-50 flex items-center justify-between p-1 shadow-lg ${className}`}>
      <div className="flex-1 h-[50px] overflow-hidden">
        <AdBlock slot="mobile-sticky-slot" format="horizontal" responsive="false" />
      </div>
      <button onClick={() => setClosed(true)} className="p-1 text-outline">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
