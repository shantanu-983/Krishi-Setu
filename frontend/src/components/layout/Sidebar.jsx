import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) {
  const { language } = useLanguage();
  const { user } = useAuth();

  const isHindi = language === 'hi';

  const navItems = [
    { key: 'dashboard', label: isHindi ? 'होम' : 'Home', icon: 'ri-home-5-line' },
    { key: 'crop', label: isHindi ? 'फसल' : 'Fasal', icon: 'ri-plant-line' },
    { key: 'mandi', label: isHindi ? 'मंडी' : 'Mandi', icon: 'ri-store-2-line' },
    { key: 'weather', label: isHindi ? 'मौसम' : 'Mausam', icon: 'ri-sun-cloudy-line' },
    { key: 'schedule', label: isHindi ? 'कार्यतालिका' : 'Schedule', icon: 'ri-calendar-line' },
    { key: 'schemes', label: isHindi ? 'योजनाएं' : 'Yojanayein', icon: 'ri-government-line' },
    { key: 'ai-assistant', label: isHindi ? 'एआई सहायक' : 'AI Sahayak', icon: 'ri-sparkling-fill' },
  ];

  const farmerName = user?.name || (isHindi ? 'रमेश यादव' : 'Ramesh Yadav');
  const villageInfo = user?.village
    ? `${user.village}, ${user.district || 'Lucknow'}`
    : 'Kukrail, Lucknow';
  const farmAcres = user?.farmSizeAcres || '2.4';
  const soilType = user?.soilType || 'Loam';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-[#f8fafb] dark:bg-[#111927] border-r border-slate-200/70 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'w-64 lg:w-64'}`}
      >
        {/* Top Header & Branding */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                onSelectTab('dashboard');
                onCloseMobile();
              }}
              className="flex items-center gap-3 text-left group overflow-hidden"
            >
              <div className="w-9 h-9 rounded-full bg-[#dbece5] dark:bg-emerald-950/60 flex items-center justify-center text-[#1a5b46] dark:text-emerald-400 shrink-0">
                <i className="ri-leaf-line text-lg"></i>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-serif font-bold text-lg text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                    Krishi Setu
                  </h1>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block truncate">
                    RABI 2026–27
                  </span>
                </div>
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close navigation"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Section Header */}
          {!isCollapsed && (
            <div className="px-6 pt-5 pb-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                {isHindi ? 'आपका खेत, एक नज़र में' : 'YOUR FARM, AT A GLANCE'}
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.key);
                    onCloseMobile();
                  }}
                  title={item.label}
                  className={`w-full flex items-center px-3.5 py-2.5 rounded-2xl text-xs transition-all relative ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50 font-medium'
                  } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <i
                      className={`${item.icon} text-base shrink-0 ${
                        isActive
                          ? 'text-[#143d35] dark:text-emerald-400 font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    ></i>
                    {!isCollapsed && (
                      <span className="truncate text-left text-xs">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Village Intelligence & Kisan Profile */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2.5">
          {/* Village Intelligence Progress Widget */}
          {!isCollapsed && (
            <div
              onClick={() => {
                onSelectTab('village');
                onCloseMobile();
              }}
              className="rounded-2xl p-3.5 bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {isHindi ? 'ग्राम आसूचना' : 'VILLAGE INTELLIGENCE'}
                </span>
                <i className="ri-line-chart-line text-[#143d35] dark:text-emerald-400 text-sm"></i>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900 dark:text-white">72</span>
                <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden my-2">
                <div
                  className="bg-[#143d35] dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: '72%' }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {villageInfo} • {farmAcres} {isHindi ? 'एकड़' : 'acres'} • {soilType}
              </p>
            </div>
          )}

          {/* Farmer Profile Badge */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('profile');
              onCloseMobile();
            }}
            className={`w-full p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 shadow-xs flex items-center hover:border-slate-300 dark:hover:border-slate-600 transition text-left ${
              isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            }`}
            title="Kisan Profile"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80"
                alt={farmerName}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80';
                }}
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
              />
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate leading-tight">
                    {farmerName}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {isHindi ? 'किसान प्रोफाइल' : 'Kisan Profile'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <i className="ri-arrow-right-up-line text-slate-400 text-sm"></i>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center w-full py-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs transition`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i className={isCollapsed ? 'ri-arrow-right-s-line text-lg' : 'ri-arrow-left-s-line text-lg'}></i>
          </button>
        </div>
      </aside>
    </>
  );
}
