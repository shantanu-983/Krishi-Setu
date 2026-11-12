import React from 'react';
import MandiEngine from '../mandi/MandiEngine';
import CropEngine from '../crop/CropEngine';
import WeatherEngine from '../weather/WeatherEngine';
import SchemesEngine from '../schemes/SchemesEngine';
import VillageDashboard from '../village/VillageDashboard';

export default function Section2({ activeEngine, onSelectEngine }) {
  const tabs = [
    { key: 'mandi', label: 'Smart Mandi Engine', icon: 'ri-scales-3-line', color: 'emerald' },
    { key: 'crop', label: 'Crop Opportunity', icon: 'ri-plant-line', color: 'green' },
    { key: 'weather', label: 'Climate Risk', icon: 'ri-cloud-windy-line', color: 'sky' },
    { key: 'schemes', label: 'Government Support', icon: 'ri-government-line', color: 'purple' },
    { key: 'village', label: 'Village Dashboard', icon: 'ri-community-line', color: 'teal' },
  ];

  return (
    <section id="decision-workspace" className="w-full min-h-screen bg-gray-50/60 py-12 px-6 md:px-12 lg:px-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Interactive Decision Engines
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">
              Agriculture Decision Workspace
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              Select an engine below to evaluate market prices, calculate net realization, check agro-ecological crop fit, view weather forecasts, or inspect government support schemes.
            </p>
          </div>

          {/* Quick Engine Selector Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none bg-gray-200/70 p-1.5 rounded-full">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectEngine(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${
                  activeEngine === tab.key
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }`}
              >
                <i className={tab.icon}></i> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Engine Container */}
        <div className="bg-white rounded-4xl border border-gray-200/80 p-6 md:p-10 shadow-sm transition-all duration-300">
          {activeEngine === 'mandi' && <MandiEngine />}
          {activeEngine === 'crop' && <CropEngine />}
          {activeEngine === 'weather' && <WeatherEngine />}
          {activeEngine === 'schemes' && <SchemesEngine />}
          {activeEngine === 'village' && <VillageDashboard />}
        </div>

        {/* Footer & Academic Disclaimers */}
        <footer className="pt-8 border-t border-gray-200 text-xs text-gray-500 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-semibold text-gray-700">
                Krishi Setu (कृषि सेतु) — B.Tech CSE Minor Project
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Designed & Developed by a 3-student team • Pilot Locations: MP & UP, India
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
              <a
                href="http://localhost:3000/api/v1/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline flex items-center gap-1"
              >
                <i className="ri-code-box-line"></i> Swagger API Docs
              </a>
              <span>•</span>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline"
              >
                Open-Meteo (CC BY 4.0)
              </a>
              <span>•</span>
              <a
                href="https://pmkisan.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black underline"
              >
                PM-KISAN Portal
              </a>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed text-center">
            Academic Project Disclaimer: Recommendations provided by Krishi Setu are based on explainable mathematical rules, general agronomic ranges, and sample/forecast records. They do not constitute certified agricultural extension counsel or legal entitlement to benefits. Always confirm market prices and planting guidelines with local KVK experts.
          </p>
        </footer>
      </div>
    </section>
  );
}
