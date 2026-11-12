import React from 'react';

export default function HeroText({ onExploreClick }) {
  return (
    <div className="p-2 md:p-6 space-y-4">
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
        <i className="ri-leaf-line"></i> MP & UP Pilot Project
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
        कृषि सेतु <br />
        <span className="text-emerald-700">Krishi Setu</span> <br />
        <span className="text-2xl sm:text-3xl font-semibold text-gray-500 block mt-2">
          Decision-Support Platform
        </span>
      </h1>

      <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed max-w-md">
        Data-backed agricultural intelligence empowering small and marginal farmers with transparent net realization math, explainable suitability rules, and verified government support.
      </p>

      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={onExploreClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition shadow-md"
        >
          Open Decision Workspace <i className="ri-arrow-down-line"></i>
        </button>
      </div>
    </div>
  );
}
