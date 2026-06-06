import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-gutter py-unit-xl space-y-unit-md transition-colors duration-200">
      <div className="w-24 h-24 rounded-full bg-surface-container dark:bg-surface-container-high flex items-center justify-center text-outline">
        <span className="material-symbols-outlined text-5xl">error</span>
      </div>
      <h1 className="text-h1 font-h1 dark:text-white leading-tight">404 - Page Not Found</h1>
      <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex gap-unit-md pt-2">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all inline-block"
        >
          Go to Homepage
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 border border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-white font-bold rounded-xl hover:bg-surface-container-low transition-all inline-block"
        >
          Search Deals
        </Link>
      </div>
    </div>
  );
}
