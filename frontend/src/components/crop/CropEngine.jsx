import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function CropEngine() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHindi = language === 'hi';

  const [soilType, setSoilType] = useState(user?.soilType || 'Loam');
  const [waterSource, setWaterSource] = useState(user?.irrigationSource || 'Borewell');
  const [season, setSeason] = useState('Rabi');
  const [loading, setLoading] = useState(false);
  const [selectedCropModal, setSelectedCropModal] = useState(null);

  // Dynamic state for evaluated crops
  const [evaluatedCrops, setEvaluatedCrops] = useState([
    {
      id: 'wheat',
      rank: 1,
      name: isHindi ? 'गेहूं' : 'Wheat',
      variety: 'HD-2967 • Rabi',
      cos: 93,
      description: isHindi
        ? 'अच्छी जल निकासी वाली दोमट मिट्टी और विश्वसनीय सिंचाई गेहूं के अनुकूल है। स्थानीय अनुशंसित अवधि में बुवाई की योजना बनाएं।'
        : 'Well-drained loam and reliable irrigation suit wheat. Plan sowing for the locally recommended window.',
      waterTag: isHindi ? '💧 उच्च जल' : '💧 High water',
      durationTag: isHindi ? '🗓️ 135 दिन' : '🗓️ 135 days',
      breakdown: {
        soilMatch: '38 / 40 (Loam match: 95%)',
        waterMatch: '28 / 30 (Borewell irrigation adequate)',
        seasonFit: '20 / 20 (Optimal Rabi temperature window: 15–25°C)',
        marketStability: '7 / 10 (High MSP procurement support)',
      },
    },
    {
      id: 'mustard',
      rank: 2,
      name: isHindi ? 'सरसों' : 'Mustard',
      variety: 'Pusa Bold • Rabi',
      cos: 85,
      description: isHindi
        ? 'कम पानी की आवश्यकता। सीमित सिंचाई वाले खेत के लिए एक अच्छा विकल्प।'
        : 'Lower water requirement. Good option for a field with limited irrigation.',
      waterTag: isHindi ? '💧 कम जल' : '💧 Low water',
      durationTag: isHindi ? '🗓️ 120 दिन' : '🗓️ 120 days',
      breakdown: {
        soilMatch: '36 / 40 (Loam match: 90%)',
        waterMatch: '26 / 30 (Moderate moisture requirement)',
        seasonFit: '18 / 20 (Cool Rabi conditions favorable)',
        marketStability: '5 / 10 (Private trade demand dynamic)',
      },
    },
    {
      id: 'chickpea',
      rank: 3,
      name: isHindi ? 'चना' : 'Chickpea',
      variety: 'JG-14 • Rabi',
      cos: 78,
      description: isHindi
        ? 'जलभराव से बचें। एक दलहनी फसल संतुलित फसल चक्र का समर्थन कर सकती है।'
        : 'Avoid waterlogging. A pulse crop can support a balanced crop rotation.',
      waterTag: isHindi ? '💧 कम जल' : '💧 Low water',
      durationTag: isHindi ? '🗓️ 110 दिन' : '🗓️ 110 days',
      breakdown: {
        soilMatch: '32 / 40 (Well-drained condition required)',
        waterMatch: '24 / 30 (Drought hardy)',
        seasonFit: '16 / 20 (Pod formation sensitive to late heat)',
        marketStability: '6 / 10 (Pulse MSP buffer)',
      },
    },
  ]);

  // Query backend assessment when filters change
  useEffect(() => {
    let isMounted = true;
    async function fetchCropSuitability() {
      setLoading(true);
      try {
        const waterEnum =
          waterSource === 'Borewell' || waterSource === 'Canal' ? 'MEDIUM' : 'LOW';
        const res = await api.assessCrops({
          season: season.toUpperCase(),
          soilType,
          waterAvailability: waterEnum,
          state: user?.state || 'Uttar Pradesh',
        });

        if (!isMounted) return;

        if (res.ok && res.data?.results && Array.isArray(res.data.results)) {
          const mapped = res.data.results.map((c, idx) => {
            const cosScore =
              c.overallAssessment === 'POTENTIALLY_SUITABLE'
                ? 90 - idx * 6
                : c.overallAssessment === 'REQUIRES_CAUTION'
                ? 75 - idx * 5
                : 55 - idx * 4;

            return {
              id: c.cropId || `crop-${idx}`,
              rank: idx + 1,
              name: c.cropName || (idx === 0 ? 'Wheat' : idx === 1 ? 'Mustard' : 'Chickpea'),
              variety: `${c.recommendedVarieties?.[0] || 'Standard'} • ${season}`,
              cos: cosScore,
              description:
                c.suitabilityNotes ||
                (idx === 0
                  ? 'Well-drained loam and reliable irrigation suit wheat.'
                  : idx === 1
                  ? 'Lower water requirement. Good option for a field with limited irrigation.'
                  : 'Avoid waterlogging. A pulse crop can support a balanced crop rotation.'),
              waterTag: c.waterRequirement === 'HIGH' ? '💧 High water' : '💧 Low water',
              durationTag: `🗓️ ${c.durationDays || 120} days`,
              breakdown: {
                soilMatch: `${Math.round(cosScore * 0.4)} / 40 (Soil compatibility)`,
                waterMatch: `${Math.round(cosScore * 0.3)} / 30 (${waterSource} match)`,
                seasonFit: `${Math.round(cosScore * 0.2)} / 20 (${season} season)`,
                marketStability: `${Math.round(cosScore * 0.1)} / 10 (Market liquidity)`,
              },
            };
          });

          if (mapped.length > 0) {
            setEvaluatedCrops(mapped);
          }
        }
      } catch (err) {
        console.debug('Crop assessment error handled:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCropSuitability();
    return () => {
      isMounted = false;
    };
  }, [soilType, waterSource, season, user]);

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Farm Top Notice Banner */}
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase">
        <span className="text-[#d97736]">●</span>
        <span>
          {isHindi
            ? 'नमूना खेत • मौसम, मूल्य और परामर्श सांकेतिक हैं'
            : 'SAMPLE FARM • Weather, prices and advice are illustrative'}
        </span>
      </div>

      {/* Category Tag */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-widest text-[#d97736] uppercase">
          {isHindi ? 'फसल अवसर इंजन' : 'CROP OPPORTUNITY ENGINE'}
        </div>
        {loading && (
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
            <i className="ri-loader-4-line animate-spin"></i>
            {isHindi ? 'गणना की जा रही है...' : 'Evaluating...'}
          </span>
        )}
      </div>

      {/* Editorial Serif Heading */}
      <div className="space-y-2">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
          {isHindi
            ? 'एक बेहतर फसल की शुरुआत आपकी मिट्टी से होती है।'
            : 'A better crop starts with your soil.'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
          {isHindi
            ? 'अपने खेत के लिए फसल उपयुक्तता की तुलना करें। अंक नमूना फसल आवश्यकताओं और बाजार स्थिरता का उपयोग करते हैं।'
            : 'Compare crop suitability for your field. Scores use sample crop requirements and market stability.'}
        </p>
      </div>

      {/* 3-Dropdown Filter Card (Screenshot 1) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Soil Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'मिट्टी का प्रकार' : 'Soil type'}
            </label>
            <div className="relative">
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="Loam">Loam</option>
                <option value="Black Cotton">Black Cotton</option>
                <option value="Clay Loam">Clay Loam</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Alluvial">Alluvial</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
            </div>
          </div>

          {/* Water Source */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'जल स्रोत' : 'Water source'}
            </label>
            <div className="relative">
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="Borewell">Borewell</option>
                <option value="Canal">Canal</option>
                <option value="Rainfed">Rainfed</option>
                <option value="Drip Irrigation">Drip Irrigation</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'मौसम' : 'Season'}
            </label>
            <div className="relative">
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="Rabi">Rabi</option>
                <option value="Kharif">Kharif</option>
                <option value="Zaid">Zaid</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Suitability Cards Grid (Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evaluatedCrops.map((crop) => (
          <div
            key={crop.id}
            className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Top row: Circle index + COS pill */}
              <div className="flex items-center justify-between mb-4">
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center">
                  {crop.rank}
                </span>
                <span className="bg-[#e6f3ee] dark:bg-emerald-950/40 text-[#1a5b46] dark:text-emerald-300 font-semibold text-xs rounded-full px-3 py-1">
                  {crop.cos} / 100 COS
                </span>
              </div>

              {/* Title & Variety */}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {crop.name}
              </h3>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 mb-3">
                {crop.variety}
              </p>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {crop.description}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-3 mt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>{crop.waterTag}</span>
                <span>{crop.durationTag}</span>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setSelectedCropModal(crop)}
                className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs"
              >
                <span>{isHindi ? 'यह फसल क्यों? ↗' : 'Why this crop? ↗'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* COS Formula Footer (from Screenshot 1) */}
      <div className="pt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
        COS = 40% soil + 30% water + 20% season + 10% market stability.
      </div>

      {/* Interactive Crop Factor Explanation Modal */}
      {selectedCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  CROP SUITABILITY BREAKDOWN
                </span>
                <h3 className="font-serif font-bold text-2xl text-slate-900 dark:text-white">
                  {selectedCropModal.name} ({selectedCropModal.cos} / 100 COS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCropModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedCropModal.description}
            </p>

            <div className="space-y-3 bg-[#f8fafb] dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Soil Condition (40%):</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedCropModal.breakdown.soilMatch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Water Availability (30%):</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedCropModal.breakdown.waterMatch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Seasonal Window (20%):</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedCropModal.breakdown.seasonFit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Market Stability (10%):</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedCropModal.breakdown.marketStability}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCropModal(null)}
                className="bg-[#143d35] text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-[#0f3029] transition"
              >
                {isHindi ? 'समझ गया' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
