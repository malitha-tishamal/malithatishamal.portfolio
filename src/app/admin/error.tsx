'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin panel error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkmode">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-dark dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {error?.message || 'An unexpected error occurred in the admin panel.'}
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
