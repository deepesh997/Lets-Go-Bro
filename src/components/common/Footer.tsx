import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant dark:border-outline-variant/10 w-full mt-unit-xl">
      <div className="w-full px-gutter py-unit-xl max-w-container-max mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-unit-lg">
        {/* Brand Description */}
        <div className="col-span-2 space-y-unit-sm">
          <Link href="/" className="text-h3 font-h3 text-primary dark:text-primary-fixed-dim font-bold block">
            HubPro
          </Link>
          <p className="text-on-surface-variant dark:text-surface-variant/80 text-body-sm max-w-xs">
            HubPro is your ultimate companion for smart shopping. We simplify product discovery through data-driven research and real-time deal tracking.
          </p>
          <div className="flex gap-unit-md pt-2">
            <a href="#" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-all">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="#" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-all">
              <span className="material-symbols-outlined">share</span>
            </a>
            <a href="#" className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-all">
              <span className="material-symbols-outlined">mail</span>
            </a>
          </div>
        </div>

        {/* Sitemap Columns */}
        <div>
          <h4 className="font-label-md text-label-md text-on-surface dark:text-white mb-unit-md">Products</h4>
          <ul className="space-y-unit-sm text-body-sm text-on-surface-variant dark:text-surface-variant/70">
            <li><Link href="/search" className="hover:text-primary transition-colors">Browse All</Link></li>
            <li><Link href="/search?filter=deals" className="hover:text-primary transition-colors">Trending Deals</Link></li>
            <li><Link href="/compare" className="hover:text-primary transition-colors">Compare Tool</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-on-surface dark:text-white mb-unit-md">Categories</h4>
          <ul className="space-y-unit-sm text-body-sm text-on-surface-variant dark:text-surface-variant/70">
            <li><Link href="/category/electronics" className="hover:text-primary transition-colors">Electronics</Link></li>
            <li><Link href="/category/fashion" className="hover:text-primary transition-colors">Fashion</Link></li>
            <li><Link href="/category/beauty" className="hover:text-primary transition-colors">Beauty</Link></li>
            <li><Link href="/category/home" className="hover:text-primary transition-colors">Home & Living</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-on-surface dark:text-white mb-unit-md">Company</h4>
          <ul className="space-y-unit-sm text-body-sm text-on-surface-variant dark:text-surface-variant/70">
            <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
            <li><a href="#" className="hover:text-primary transition-colors">Partnerships</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-on-surface dark:text-white mb-unit-md">Support</h4>
          <ul className="space-y-unit-sm text-body-sm text-on-surface-variant dark:text-surface-variant/70">
            <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Disclosures & Copyright */}
      <div className="max-w-container-max mx-auto px-gutter py-unit-md border-t border-outline-variant dark:border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-unit-md">
        <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/60 text-center md:text-left leading-relaxed">
          © 2026 HubPro Discovery. All rights reserved. 
          <br className="md:hidden" />
          <span className="md:ml-2 font-medium">Partnership Disclosure:</span> We may earn commissions from qualifying purchases made via our external merchant links at no additional cost to you.
        </p>
      </div>
    </footer>
  );
}
