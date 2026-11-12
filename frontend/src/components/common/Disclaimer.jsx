import React from 'react';

export default function Disclaimer({
  type = 'info', // 'info' | 'warning' | 'crop' | 'weather' | 'scheme' | 'mandi'
  text,
  attribution,
  attributionUrl,
}) {
  const iconMap = {
    info: 'ri-information-line',
    warning: 'ri-alert-line',
    crop: 'ri-plant-line',
    weather: 'ri-cloud-windy-line',
    scheme: 'ri-shield-check-line',
    mandi: 'ri-scales-3-line',
  };

  const borderBg = {
    info: 'border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200',
    warning: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
    crop: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200',
    weather: 'border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 text-sky-950 dark:text-sky-200',
    scheme: 'border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200',
    mandi: 'border-teal-200 dark:border-teal-900/60 bg-teal-50/60 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200',
  }[type] || 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200';

  return (
    <div className={`rounded-2xl border p-4 text-xs leading-relaxed ${borderBg} my-3 space-y-1.5`}>
      <div className="flex items-start gap-2">
        <i className={`${iconMap[type] || 'ri-information-line'} text-base mt-0.5 shrink-0`}></i>
        <div className="flex-1">
          <p>{text}</p>
          {attribution && (
            <p className="mt-1 font-medium">
              Attribution:{' '}
              {attributionUrl ? (
                <a
                  href={attributionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black dark:hover:text-white font-semibold"
                >
                  {attribution}
                </a>
              ) : (
                <span>{attribution}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
