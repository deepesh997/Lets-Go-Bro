'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Unhandled runtime error occurred:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-gutter py-unit-xl space-y-unit-md transition-colors duration-200">
      <div className="w-24 h-24 rounded-full bg-error-container flex items-center justify-center text-error">
        <span className="material-symbols-outlined text-5xl">warning</span>
      </div>
      <h1 className="text-h1 font-h1 dark:text-white leading-tight">500 - Server Error</h1>
      <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-md">
        An unexpected error occurred while processing your request. Our team has been notified.
      </p>
      <div className="flex gap-unit-md pt-2">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all inline-block"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-white font-bold rounded-xl hover:bg-surface-container-low transition-all inline-block"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
