import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Disclaimer from '../common/Disclaimer';

const PILOT_PRESETS = [
  { label: 'Indore, MP', lat: 22.7196, lon: 75.8577 },
  { label: 'Bhopal, MP', lat: 23.2599, lon: 77.4126 },
  { label: 'Kanpur, UP', lat: 26.4499, lon: 80.3319 },
  { label: 'Lucknow, UP', lat: 26.8467, lon: 80.9462 },
  { label: 'Sanwer (Indore Rural)', lat: 22.9694, lon: 75.8309 },
  { label: 'Berasia (Bhopal Rural)', lat: 23.6267, lon: 77.4322 },
  { label: 'Unnao, UP', lat: 26.5376, lon: 80.4929 },
];

export default function WeatherEngine() {
  const [selectedPreset, setSelectedPreset] = useState(PILOT_PRESETS[0].label);
  const [latitude, setLatitude] = useState(PILOT_PRESETS[0].lat);
  const [longitude, setLongitude] = useState(PILOT_PRESETS[0].lon);
  const [locationLabel, setLocationLabel] = useState(PILOT_PRESETS[0].label);
  const [mode, setMode] = useState('forecast'); // 'forecast' | 'historical'
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-07');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, days, mode]);

  function handlePresetChange(e) {
    const p = PILOT_PRESETS.find((item) => item.label === e.target.value);
    if (p) {
      setSelectedPreset(p.label);
      setLatitude(p.lat);
      setLongitude(p.lon);
      setLocationLabel(p.label);
    }
  }

  async function fetchWeather() {
    setLoading(true);
    setError(null);

    let res;
    if (mode === 'forecast') {
      res = await api.getWeather({
        latitude,
        longitude,
        days,
        locationLabel,
      });
    } else {
      res = await api.getWeatherHistorical({
        latitude,
        longitude,
        startDate,
        endDate,
        locationLabel,
      });
    }

    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setWeatherData(null);
    } else {
      setWeatherData(res.data);
    }
  }

  function getWeatherIcon(desc = '') {
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('drizzle')) return 'ri-rainy-line text-blue-500';
    if (d.includes('thunder')) return 'ri-thunderstorms-line text-amber-500';
    if (d.includes('cloud') || d.includes('overcast')) return 'ri-cloudy-line text-slate-400';
    if (d.includes('snow')) return 'ri-snowy-line text-sky-400';
    if (d.includes('fog')) return 'ri-foggy-line text-slate-400';
    return 'ri-sun-line text-amber-500';
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
        CLIMATE RISK ENGINE
      </div>

      {/* Heading & Subtitle */}
      <div className="space-y-2">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
          Plan every spray, sowing, and irrigation with confidence.
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Live Open-Meteo forecasts with actionable agronomic advisories for your field operations.
        </p>
      </div>

      {/* Controls & Configuration */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Preset Location Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Select Pilot Location
            </label>
            <select
              value={selectedPreset}
              onChange={handlePresetChange}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {PILOT_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label} ({p.lat.toFixed(2)}°N, {p.lon.toFixed(2)}°E)
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Observation Mode
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('forecast')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'forecast'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Forecast (1–16d)
              </button>
              <button
                type="button"
                onClick={() => setMode('historical')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'historical'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ERA5 Historical
              </button>
            </div>
          </div>

          {/* Days Slider or Date Range */}
          {mode === 'forecast' ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Forecast Window
                </label>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 font-mono bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  {days} Days
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                <span>1 day</span>
                <span>7 days (Recommended)</span>
                <span>16 days</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {mode === 'historical' && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition shadow-sm"
            >
              Fetch Historical Range
            </button>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingSpinner message="Fetching meteorological observations from Open-Meteo..." />}
      {error && (
        <ErrorMessage
          title="Open-Meteo Weather Unavailable"
          error={error}
          onRetry={fetchWeather}
        />
      )}

      {/* Weather Content Display */}
      {weatherData && !loading && (
        <div className="space-y-6 pt-2">
          {/* Metadata & Attribution Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-[#111927] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white">
                <i className="ri-map-pin-line text-sky-600 dark:text-sky-400"></i> {weatherData.locationLabel || 'Selected Coordinates'} ({weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E)
              </span>
              <span className="text-slate-400">•</span>
              <span>Timezone: {weatherData.timezone}</span>
              <span className="text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                {weatherData.freshness?.isStale ? (
                  <span className="text-amber-700 dark:text-amber-400">● Cache Stale ({weatherData.freshness.ageHours}h old)</span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400">● Freshly Cached ({weatherData.freshness?.ageHours ?? 0}h)</span>
                )}
              </span>
            </div>

            <div className="shrink-0 text-sky-700 dark:text-sky-400 font-medium">
              Attribution:{' '}
              <a
                href={weatherData.sourceUrl || 'https://open-meteo.com/'}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-sky-950 dark:hover:text-sky-200 font-semibold"
              >
                {weatherData.attribution || 'Open-Meteo.com'} (CC BY 4.0)
              </a>
            </div>
          </div>

          {/* Current Live Weather Conditions Card */}
          {weatherData.current && (
            <div className="bg-gradient-to-br from-white to-sky-50/40 dark:from-[#111927] dark:to-sky-950/20 rounded-3xl border border-sky-200/80 dark:border-sky-900/60 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-100 dark:border-sky-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center text-sky-600 dark:text-sky-300 text-2xl">
                    <i className={getWeatherIcon(weatherData.current.weatherDescription)}></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-sky-600 dark:text-sky-400 uppercase">
                      Current Live Weather
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {weatherData.current.weatherDescription || 'Clear'}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {weatherData.current.temperatureC !== null ? `${Math.round(weatherData.current.temperatureC)}°C` : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {weatherData.current.isDay ? 'Daytime ☀️' : 'Nighttime 🌙'} • Observed live
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                    Relative Humidity
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {weatherData.current.relativeHumidityPercent != null ? `${weatherData.current.relativeHumidityPercent}%` : '—'}
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                    Current Rainfall
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {weatherData.current.precipitationMm != null ? `${weatherData.current.precipitationMm} mm` : '0 mm'}
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                    Wind Speed
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {weatherData.current.windspeedKmh != null ? `${weatherData.current.windspeedKmh} km/h` : '—'}
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                    WMO Code
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {weatherData.current.weatherCode ?? '0'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Agronomic Advisories */}
          {weatherData.advisories && weatherData.advisories.length > 0 && (
            <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="ri-shield-check-line text-emerald-600 dark:text-emerald-400"></i> Actionable Agronomic Advisories & Precautions
                </h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  {weatherData.advisories.length} Active Advisories
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic agronomic advisories computed from Open-Meteo temperature, precipitation, ET₀, and wind speed thresholds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weatherData.advisories.map((adv) => {
                  const isAlert = adv.severity === 'ALERT';
                  const isWarn = adv.severity === 'WARNING';
                  const bgClass = isAlert
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                    : isWarn
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200';

                  const badgeClass = isAlert
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                    : isWarn
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300';

                  const iconClass = isAlert
                    ? 'ri-alarm-warning-line text-rose-600 dark:text-rose-400'
                    : isWarn
                    ? 'ri-alert-line text-amber-600 dark:text-amber-400'
                    : 'ri-checkbox-circle-line text-emerald-600 dark:text-emerald-400';

                  return (
                    <div
                      key={adv.id}
                      className={`rounded-2xl border p-4.5 space-y-3 flex flex-col justify-between shadow-xs ${bgClass}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${badgeClass}`}>
                            {adv.severity} • {adv.id}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {adv.applicableDates?.length} date(s) impacted
                          </span>
                        </div>

                        <h5 className="font-bold text-sm flex items-start gap-1.5 text-slate-900 dark:text-white">
                          <i className={`${iconClass} text-base mt-0.5 shrink-0`}></i>
                          <span>{adv.title}</span>
                        </h5>

                        <p className="text-xs opacity-90 mt-1.5 leading-relaxed text-slate-700 dark:text-slate-300">
                          {adv.description}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 bg-white/70 dark:bg-slate-800/70 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200">
                        <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                          🌱 Recommended Field Action:
                        </span>
                        {adv.actionableAdvice}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Forecast Timeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {weatherData.forecastDays?.map((day, idx) => (
              <div
                key={day.date}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111927] p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                      {day.recordType}
                    </span>
                  </div>

                  {/* Weather Icon & Condition */}
                  <div className="flex items-center gap-3 my-3">
                    <i className={`${getWeatherIcon(day.weatherDescription)} text-4xl`}></i>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm">{day.weatherDescription || 'Fair'}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">WMO Code: {day.weatherCode ?? 'N/A'}</p>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="flex items-baseline justify-between py-2 border-t border-b border-slate-100 dark:border-slate-800 my-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Max / Min Temp:</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {day.maxTempC !== null ? `${day.maxTempC}°C` : '—'}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {day.minTempC !== null ? `${day.minTempC}°C` : '—'}
                      </span>
                    </span>
                  </div>

                  {/* Agro-meteorological metrics */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <i className="ri-drop-line text-blue-500"></i> Precipitation:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {day.precipitationSumMm !== null ? `${day.precipitationSumMm} mm` : '0 mm'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <i className="ri-water-percent-line text-teal-600"></i> Evapotranspiration:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {day.et0FaoEvapotranspirationMm !== null ? `${day.et0FaoEvapotranspirationMm} mm` : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <i className="ri-windy-line text-slate-400"></i> Max Windspeed:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {day.windspeedMaxKmh !== null ? `${day.windspeedMaxKmh} km/h` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 text-right font-mono">
                  {day.date}
                </div>
              </div>
            ))}
          </div>

          {/* Limitations & Legal Disclaimer */}
          <Disclaimer
            type="weather"
            text="Notice: Weather forecasts beyond 7 days experience natural degradation in accuracy. This data represents raw weather observations and forecasts. No drought, heatwave, or flood risk index (CRI) score is computed pending project guide formula approval."
            attribution={weatherData.attribution}
            attributionUrl={weatherData.sourceUrl}
          />
        </div>
      )}
    </div>
  );
}
