import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SyntheticBanner from '../common/SyntheticBanner';
import Disclaimer from '../common/Disclaimer';

export default function VillageDashboard() {
  const { t } = useLanguage();
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [loadingVillages, setLoadingVillages] = useState(true);

  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVillages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVillages() {
    setLoadingVillages(true);
    const res = await api.getVillages();
    setLoadingVillages(false);

    if (res.ok && res.data?.length > 0) {
      setVillages(res.data);
      setSelectedVillageId(res.data[0]._id);
      loadDashboard(res.data[0]._id);
    } else {
      setError(res.error || 'No pilot villages found.');
    }
  }

  async function loadDashboard(villageId) {
    if (!villageId) return;
    setLoadingDashboard(true);
    setError(null);

    const res = await api.getVillageDashboard(villageId);
    setLoadingDashboard(false);

    if (!res.ok) {
      setError(res.error);
      setDashboard(null);
    } else {
      setDashboard(res.data);
    }
  }

  function handleVillageChange(e) {
    const id = e.target.value;
    setSelectedVillageId(id);
    loadDashboard(id);
  }

  if (loadingVillages) {
    return <LoadingSpinner message="Loading pilot village list..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Farm Top Notice Banner */}
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase">
        <span className="text-[#d97736]">●</span>
        <span>SAMPLE FARM • Weather, prices and advice are illustrative</span>
      </div>

      {/* Category Tag */}
      <div className="text-[10px] font-bold tracking-widest text-[#d97736] uppercase">
        VILLAGE AGRICULTURE DASHBOARD
      </div>

      {/* Module Title */}
      <div className="space-y-2">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
          Holistic agro-climatic intelligence for your village.
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
          {t('villageOverviewSub')}
        </p>
      </div>

      {/* Village Picker */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Select Pilot Village
          </label>
          <select
            value={selectedVillageId}
            onChange={handleVillageChange}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {villages.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name} — Block: {v.block}, District: {v.district} ({v.state})
              </option>
            ))}
          </select>
        </div>

        {dashboard?.village && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              <i className="ri-map-pin-2-fill text-emerald-600 dark:text-emerald-400"></i> {dashboard.village.name}, {dashboard.village.district}
            </div>
            <div className="mt-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Coordinates:{' '}
              {dashboard.village.coordinates?.latitude
                ? `${dashboard.village.coordinates.latitude.toFixed(4)}°N, ${dashboard.village.coordinates.longitude.toFixed(4)}°E`
                : 'Not available'}
              {!dashboard.village.coordinates?.verified && ' (Approximate)'}
            </div>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loadingDashboard && <LoadingSpinner message="Aggregating village intelligence across all 4 modules..." />}
      {error && <ErrorMessage error={error} title="Failed to Load Village Dashboard" onRetry={() => loadDashboard(selectedVillageId)} />}

      {/* Aggregated Dashboard Content */}
      {dashboard && !loadingDashboard && (
        <div className="space-y-8">
          {/* Section 1: Weather Section (Engineered for Graceful Partial Failure) */}
          <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="ri-cloud-windy-line text-sky-600 dark:text-sky-400"></i> Local Weather & Climate Outlook
              </h4>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  dashboard.weather?.status === 'AVAILABLE'
                    ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                {dashboard.weather?.status || 'UNKNOWN'}
              </span>
            </div>

            {dashboard.weather?.status === 'UNAVAILABLE' ? (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <i className="ri-alert-line text-lg text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"></i>
                <div>
                  <h5 className="font-bold text-amber-950 dark:text-amber-100">Weather Data Temporarily Unavailable</h5>
                  <p className="mt-0.5">
                    {dashboard.weather.error || 'Unable to fetch weather forecast for this village coordinates. Mandi prices, crop lists, and schemes continue to operate normally.'}
                  </p>
                </div>
              </div>
            ) : dashboard.weather?.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Today Card */}
                  <div className="bg-sky-50 dark:bg-sky-950/20 rounded-2xl p-4 border border-sky-100 dark:border-sky-900/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
                      Today's Weather
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                      {dashboard.weather.data.today?.maxTempC !== undefined ? `${dashboard.weather.data.today.maxTempC}°C` : '—'}
                      <span className="text-xs font-normal text-slate-500">
                        {' '}/ {dashboard.weather.data.today?.minTempC !== undefined ? `${dashboard.weather.data.today.minTempC}°C` : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                      {dashboard.weather.data.today?.weatherDescription || 'Fair'}
                    </p>
                    <p className="text-[11px] text-sky-800 dark:text-sky-300 mt-2 font-mono">
                      Rain: {dashboard.weather.data.today?.precipitationMm ?? 0} mm
                    </p>
                  </div>

                  {/* Multi-day Forecast Pills */}
                  {dashboard.weather.data.forecast?.slice(1, 4).map((f) => (
                    <div key={f.date} className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          {new Date(f.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                          {f.maxTempC}°C <span className="text-xs font-normal text-slate-400">/ {f.minTempC}°C</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{f.weatherDescription}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-2">
                        Rain: {f.precipitationSumMm ?? 0} mm
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 text-right">
                  Attribution: {dashboard.weather.data.attribution || 'Open-Meteo.com'} (CC BY 4.0)
                </div>
              </div>
            ) : null}
          </div>

          {/* Section 2: Nearby Mandi Modal Prices */}
          <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="ri-scales-3-line text-emerald-600 dark:text-emerald-400"></i> Nearby Mandi Market Prices
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {dashboard.mandiPrices?.data?.mandis?.length ?? 0} nearby mandis linked
              </span>
            </div>

            <SyntheticBanner
              sourceName="Krishi Setu Development Fixtures"
              observationDate={dashboard.mandiPrices?.data?.mandis?.[0]?.prices?.[0]?.observationDate}
            />

            {dashboard.mandiPrices?.data?.mandis?.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No nearby mandis linked to this village profile.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.mandiPrices?.data?.mandis?.map((m) => (
                  <div key={m.mandiId} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">{m.mandiName}</h5>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{m.district}</span>
                    </div>

                    <div className="space-y-2">
                      {m.prices?.map((p, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{p.cropName}</span>
                            <span className="text-[11px] text-slate-400 ml-1.5">({p.category})</span>
                            <div className="text-[10px] text-slate-400">Observed: {p.observationDate || 'Recent'}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">
                              ₹{p.modalPriceInr?.toLocaleString('en-IN') ?? '—'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">/ {p.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Active Regional Crops */}
          <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="ri-plant-line text-emerald-600 dark:text-emerald-400"></i> Active Regional Crops
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {dashboard.crops?.data?.activeCrops?.map((crop) => (
                <div key={crop.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">{crop.name}</span>
                  {crop.localName && <span className="text-[11px] text-slate-500 dark:text-slate-400 italic block">{crop.localName}</span>}
                  <span className="inline-block mt-2 font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                    {crop.seasons?.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Applicable Government Support Schemes */}
          <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="ri-government-line text-purple-600 dark:text-purple-400"></i> Applicable Support Schemes
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard.schemes?.data?.applicableSchemes?.map((s) => (
                <div key={s.id} className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/60 flex flex-col justify-between text-xs space-y-3">
                  <div>
                    <span className="font-mono font-bold text-purple-900 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full text-[10px]">
                      {s.schemeCode}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white mt-2 text-sm">{s.schemeName}</h5>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1">{s.benefitType}</p>
                  </div>
                  {s.officialUrl && (
                    <a
                      href={s.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400 hover:underline pt-2 text-[11px]"
                    >
                      Open Portal <i className="ri-external-link-line"></i>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Disclaimer
            type="info"
            text="Village dashboard combines data across four modules. In case any single service (such as satellite weather) is degraded, other independent sections remain active."
          />
        </div>
      )}
    </div>
  );
}
