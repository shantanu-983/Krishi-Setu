import React from 'react';

export default function SyntheticBanner({
  sourceName = 'Krishi Setu Development Fixtures',
  observationDate = null,
  isStale = false,
  ageHours = null,
}) {
  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200 text-xs my-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
          <i className="ri-flask-line"></i> SYNTHETIC_DEMO DATA
        </span>
        {observationDate && (
          <span className="text-amber-800 dark:text-amber-300 font-medium">
            Observation Date: <span className="font-semibold">{observationDate}</span>
          </span>
        )}
      </div>

      <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
        <strong>Notice:</strong> This price data is clearly labelled sample data for technical demonstration purposes only.
        It is <strong>NOT official government mandi data</strong> and must not be relied upon for real agricultural transactions.
        Source: <em>{sourceName}</em>.
      </p>

      {isStale && (
        <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg font-medium">
          <i className="ri-time-line"></i>
          <span>Stale price warning: Data is {ageHours ? `${ageHours}h` : 'more than 72h'} old and may not reflect recent market dynamics.</span>
        </div>
      )}
    </div>
  );
}
