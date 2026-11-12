import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function Header({
  onOpenMobileSidebar,
  onOpenProfile,
  onOpenAuth,
  onSelectTab,
  onToggleNotifications,
  unreadNotificationsCount = 0,
}) {
  const { language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [weatherChip, setWeatherChip] = useState({ temp: '24°C', condition: 'Clear', icon: '☀️' });

  const isHindi = language === 'hi';

  // Format current live date in uppercase matching the screenshot (e.g. WEDNESDAY, 9 OCTOBER 2026)
  const today = new Date();
  const dateFormatted = today.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  // Greeting
  const hour = today.getHours();
  const greetingPrefix =
    isHindi
      ? hour < 12
        ? 'सुप्रभात'
        : hour < 17
        ? 'शुभ दोपहर'
        : 'शुभ संध्या'
      : hour < 12
      ? 'Good morning'
      : hour < 17
      ? 'Good afternoon'
      : 'Good evening';

  const farmerName = user?.name || (isHindi ? 'रमेश' : 'Ramesh');
  const districtName = user?.district || 'Lucknow';
  const stateCode = user?.state === 'Madhya Pradesh' ? 'MP' : 'UP';

  // Fetch quick weather for Lucknow / user's coordinates
  useEffect(() => {
    let isMounted = true;
    const lat = user?.latitude || 26.8467;
    const lon = user?.longitude || 80.9462;

    const weatherFn = api.getDailyForecast || api.getWeather;
    if (typeof weatherFn !== 'function') return;

    weatherFn(lat, lon, 1)
      .then((res) => {
        if (!isMounted || !res || !res.ok || !res.data) return;
        const currentData = res.data.current;
        const todayForecast =
          (Array.isArray(res.data.forecastDays) && res.data.forecastDays[0]) ||
          (Array.isArray(res.data.daily) && res.data.daily[0]) ||
          null;

        if (currentData && currentData.temperatureC != null) {
          setWeatherChip({
            temp: `${Math.round(currentData.temperatureC)}°C`,
            condition: currentData.weatherDescription || (isHindi ? 'साफ़' : 'Clear'),
            icon: (currentData.precipitationMm || 0) > 2 ? '🌧️' : '☀️',
          });
        } else if (todayForecast) {
          const tempVal =
            todayForecast.maxTempC ??
            todayForecast.temperature_2m_max ??
            todayForecast.temp ??
            24;
          const rainVal =
            todayForecast.precipitationSumMm ??
            todayForecast.precipitation_sum ??
            0;
          const conditionDesc =
            todayForecast.weatherDescription ||
            (rainVal > 2
              ? isHindi ? 'वर्षा' : 'Rain'
              : isHindi ? 'साफ़' : 'Clear');

          setWeatherChip({
            temp: `${Math.round(tempVal)}°C`,
            condition: conditionDesc,
            icon: rainVal > 2 ? '🌧️' : '☀️',
          });
        }
      })
      .catch(() => {
        // Fallback default
      });

    return () => {
      isMounted = false;
    };
  }, [user, isHindi]);

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#eef4f7]/90 dark:bg-[#0c121e]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-200/40 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Toggle + Clean Headline */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition"
          aria-label="Open Navigation"
        >
          <i className="ri-menu-2-line text-xl"></i>
        </button>

        <div>
          <h2 className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-tight">
            {greetingPrefix},{' '}
            <span className="font-serif font-bold text-slate-900 dark:text-white">
              {farmerName}
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
            {dateFormatted}
          </p>
        </div>
      </div>

      {/* Right Controls: Weather chip, Location chip, Language, Theme, Bell, Orange CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Weather Chip */}
        <button
          type="button"
          onClick={() => onSelectTab('weather')}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
        >
          <span>{weatherChip.icon}</span>
          <span>{weatherChip.temp} • {weatherChip.condition}</span>
        </button>

        {/* Location Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-xs font-medium text-slate-700 dark:text-slate-300">
          <span className="text-xs">📍</span>
          <span>{districtName}, {stateCode}</span>
        </div>

        {/* Language Selector Pill */}
        <button
          type="button"
          onClick={toggleLanguage}
          title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
        >
          <span>{isHindi ? 'हिन्दी' : 'English'}</span>
          <i className="ri-arrow-down-s-line text-slate-400"></i>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
          className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
          aria-label="Toggle Theme"
        >
          <i className={isDark ? 'ri-sun-line text-amber-400 text-sm' : 'ri-moon-line text-slate-600 text-sm'}></i>
        </button>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
          aria-label="Notifications"
        >
          <i className="ri-notification-3-line text-sm"></i>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d97736] ring-2 ring-white dark:ring-slate-800"></span>
          )}
        </button>

        {/* Orange CTA Button (Register / Kisan Profile) */}
        <button
          type="button"
          onClick={() => {
            if (isAuthenticated) {
              onOpenProfile();
            } else {
              onOpenAuth();
            }
          }}
          className="bg-[#d97736] hover:bg-[#c46527] text-white px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold shadow-xs tracking-wide transition shrink-0"
        >
          {isAuthenticated ? (isHindi ? 'प्रोफाइल' : 'Profile') : (isHindi ? 'पंजीकरण' : 'Register')}
        </button>
      </div>
    </header>
  );
}
