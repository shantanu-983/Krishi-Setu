import React from 'react';

export default function ErrorMessage({ error, onRetry, title = 'Unable to Load Data' }) {
  const message = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';
  const code = error?.code;

  return (
    <div className="rounded-2xl border border-red-200 dark:border-rose-900/60 bg-red-50/70 dark:bg-rose-950/30 p-6 text-red-900 dark:text-rose-200 my-4 space-y-3">
      <div className="flex items-start gap-3">
        <i className="ri-error-warning-fill text-2xl text-red-600 dark:text-rose-400 shrink-0 mt-0.5"></i>
        <div className="flex-1">
          <h4 className="font-semibold text-base">{title}</h4>
          <p className="text-sm text-red-700 dark:text-rose-300 mt-1 leading-relaxed">{message}</p>
          {code && (
            <span className="inline-block mt-2 font-mono text-xs bg-red-100 dark:bg-rose-900/60 text-red-800 dark:text-rose-300 px-2.5 py-0.5 rounded-full">
              Code: {code}
            </span>
          )}
        </div>
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-full transition"
          >
            <i className="ri-refresh-line"></i> Retry Request
          </button>
        </div>
      )}
    </div>
  );
}
