'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkmode">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-dark dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-darkmode transition cursor-pointer"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
