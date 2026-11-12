import React from 'react';

export default function LoadingSpinner({ message = 'Loading data from backend...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
