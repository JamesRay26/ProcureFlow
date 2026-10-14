'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in a real app
    console.error("Dashboard Error Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30 p-8 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center rounded-full mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Something went wrong!
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
        An unexpected error occurred in this section of the dashboard. The rest of the application is still running securely.
      </p>
      
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl mb-8 w-full max-w-md text-left overflow-hidden">
        <p className="text-xs font-mono text-red-600 dark:text-red-400 break-words">
          {error.message || "Unknown asynchronous failure"}
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-bold transition-colors"
      >
        <RefreshCcw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}
