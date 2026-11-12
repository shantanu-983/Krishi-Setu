import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function HomeDashboard({ onSelectTab, onOpenProfile: _onOpenProfile, onOpenAuth: _onOpenAuth }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHindi = language === 'hi';

  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [taskLogged, setTaskLogged] = useState(false);

  // Dynamic real data fetched from backend
  const [mandiItems, setMandiItems] = useState([
    { name: 'Mohanlalganj', price: '₹2,480/q', distance: '12 km', mos: '91 MOS' },
    { name: 'Aishbagh', price: '₹2,460/q', distance: '18 km', mos: '87 MOS' },
  ]);
  const [weatherDays, setWeatherDays] = useState([
    { day: isHindi ? 'बुध' : 'Wed', temp: '24°', icon: '☀️', condition: isHindi ? 'साफ़' : 'Clear' },
    { day: isHindi ? 'गुरु' : 'Thu', temp: '21°', icon: '🌧️', condition: '12mm' },
    { day: isHindi ? 'शुक्र' : 'Fri', temp: '26°', icon: '🌤️', condition: isHindi ? 'धुंध' : 'Haze' },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const mandiFn = api.getMandiPrices || api.getPrices;
        const weatherFn = api.getDailyForecast || api.getWeather;

        const mandiPromise = typeof mandiFn === 'function'
          ? mandiFn({ state: user?.state || 'Uttar Pradesh', district: user?.district || 'Lucknow', limit: 2 })
          : Promise.resolve({ ok: false });

        const weatherPromise = typeof weatherFn === 'function'
          ? weatherFn(user?.latitude || 26.8467, user?.longitude || 80.9462, 3)
          : Promise.resolve({ ok: false });

        const [mandiRes, weatherRes] = await Promise.allSettled([mandiPromise, weatherPromise]);

        if (!isMounted) return;

        if (mandiRes.status === 'fulfilled' && mandiRes.value?.ok && mandiRes.value?.data) {
          const rawData = mandiRes.value.data;
          const recs = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData.records)
            ? rawData.records
            : [];

          if (recs.length > 0) {
            setMandiItems(
              recs.slice(0, 2).map((r, i) => {
                const name =
                  r.mandiId?.name ||
                  r.market ||
                  r.name ||
                  (i === 0 ? 'Mohanlalganj' : 'Aishbagh');
                const price =
                  r.modalPrice ??
                  r.modal_price ??
                  (i === 0 ? 2480 : 2460);
                const distance = r.distanceKm ? `${r.distanceKm} km` : (i === 0 ? '12 km' : '18 km');
                const mos = r.mosScore ? `${r.mosScore} MOS` : `${91 - i * 4} MOS`;
                return {
                  name,
                  price: `₹${Number(price).toLocaleString('en-IN')}/q`,
                  distance,
                  mos,
                };
              })
            );
          }
        }

        if (weatherRes.status === 'fulfilled' && weatherRes.value?.ok && weatherRes.value?.data) {
          const wData = weatherRes.value.data;
          const daysList = Array.isArray(wData.forecastDays)
            ? wData.forecastDays
            : Array.isArray(wData.daily)
            ? wData.daily
            : [];

          if (daysList.length >= 1) {
            const daysNames = isHindi ? ['बुध', 'गुरु', 'शुक्र'] : ['Wed', 'Thu', 'Fri'];
            const formatted = daysList.slice(0, 3).map((d, i) => {
              const maxTemp = d.maxTempC ?? d.temperature_2m_max ?? d.temp ?? 24;
              const rain = d.precipitationSumMm ?? d.precipitation_sum ?? 0;
              const hasRain = rain > 2;
              return {
                day: daysNames[i] || `Day ${i + 1}`,
                temp: `${Math.round(maxTemp)}°`,
                icon: hasRain ? '🌧️' : i === 0 ? '☀️' : '🌤️',
                condition: hasRain ? `${Math.round(rain)}mm` : (isHindi ? 'साफ़' : 'Clear'),
              };
            });
            setWeatherDays(formatted);
          }
        }
      } catch (err) {
        console.debug('Dashboard background refresh handled:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, isHindi]);

  function handleLogTask() {
    setTaskLogged(true);
    setTimeout(() => setTaskLogged(false), 3000);
  }

  const farmerVillage = user?.village || 'Kukrail';

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Farm Top Notice Banner (from screenshots) */}
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase">
        <span className="text-[#d97736]">●</span>
        <span>
          {isHindi
            ? 'नमूना खेत • मौसम, मूल्य और परामर्श सांकेतिक हैं'
            : 'SAMPLE FARM • Weather, prices and advice are illustrative'}
        </span>
      </div>

      {/* 1. Hero Card (Screenshot 5) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-[#143d35] dark:bg-emerald-400"></span>
            <span>
              {isHindi
                ? `आज की सलाह • गेहूं • ${farmerVillage}`
                : `TODAY'S CALL • WHEAT • ${farmerVillage.toUpperCase()}`}
            </span>
          </div>

          {/* Large Serif Headline */}
          <h1 className="font-serif font-semibold text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-white leading-tight">
            {isHindi
              ? 'शुक्रवार की बारिश तक सिंचाई रोकें — पंपिंग पर ₹340 की बचत होगी।'
              : "Hold irrigation until Friday's rain — it saves ₹340 on pumping."}
          </h1>

          {/* Subtext description */}
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            {isHindi
              ? 'खेत में नमी 74% है, और शुक्रवार को 12mm बारिश का अनुमान है। अगली सिंचाई से पहले नमी की जांच करें।'
              : 'Sample soil moisture is at 74%, with 12mm of rain shown for Friday. Check your field before the next irrigation.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogTask}
              className="bg-[#143d35] hover:bg-[#0f3029] text-white px-5 sm:px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
            >
              <i className={taskLogged ? 'ri-checkbox-circle-line text-emerald-300' : 'ri-task-line'}></i>
              <span>
                {taskLogged
                  ? isHindi ? 'कार्य दर्ज हुआ ✓' : 'Task logged ✓'
                  : isHindi ? 'आज का कार्य दर्ज करें' : "Log today's task"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReasoningOpen((prev) => !prev)}
              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold px-4 py-2.5 transition inline-flex items-center gap-1"
            >
              <span>{isHindi ? 'तर्क देखें' : 'See reasoning'}</span>
              <i className="ri-arrow-right-up-line"></i>
            </button>
          </div>

          {/* Optional inline reasoning disclosure */}
          {reasoningOpen && (
            <div className="mt-4 p-4 rounded-2xl bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-fadeIn">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <i className="ri-lightbulb-line text-amber-500"></i>
                <span>{isHindi ? 'कृषि एवं लागत विश्लेषण' : 'Agronomic & Cost Reasoning'}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                {isHindi
                  ? 'सेंसर आधारित मृदा नमी वर्तमान में 74% है (गेहूं के मुकुट जड़ दीक्षा चरण के लिए 50% से अधिक पर्याप्त है)। ओपन-मेटियो द्वारा शुक्रवार को 12 मिमी वर्षा का पूर्वानुमान है। 1 सिंचाई चक्र को टालने से डीजल/विद्युत पंपिंग लागत में ₹340 की बचत होती है और जलभराव का जोखिम समाप्त होता है।'
                  : 'Root-zone moisture is at 74% (above the 50% depletion threshold for wheat crown-root initiation). Open-Meteo forecasts 12mm precipitation on Friday. Deferring 1 irrigation cycle saves ~₹340 in diesel/electricity pumping expense and avoids temporary waterlogging risk.'}
              </p>
            </div>
          )}
        </div>

        {/* Wheat Field Image on Right */}
        <div className="w-full md:w-80 h-44 shrink-0 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xs">
          <img
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80"
            alt="Wheat Crop Field"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>

      {/* 2. 3-Column Intelligence Row (Screenshot 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Mandi Net Realization */}
        <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'मंडी शुद्ध आय' : 'MANDI NET REALIZATION'}
              </span>
              <i className="ri-arrow-right-up-line text-emerald-600 dark:text-emerald-400 text-sm"></i>
            </div>

            <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-4">
              {isHindi ? 'गेहूं बेचने का सर्वोत्तम स्थान' : 'Best place to sell wheat'}
            </h2>

            <div className="space-y-3">
              {mandiItems.map((mandi, idx) => (
                <div key={mandi.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        {mandi.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {mandi.price} • {mandi.distance}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {mandi.mos}
                  </span>
                </div>
              ))}
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-2 mt-5">
              <span className="bg-[#eef4f7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium px-2.5 py-1 rounded-full">
                40% net realization
              </span>
              <span className="bg-[#eef4f7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium px-2.5 py-1 rounded-full">
                30% distance
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('mandi')}
            className="mt-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
          >
            <span>{isHindi ? 'मंडियों की तुलना करें' : 'Compare mandis'}</span>
            <i className="ri-arrow-right-up-line"></i>
          </button>
        </div>

        {/* Card 2: Crop Suitability COS */}
        <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'फसल उपयुक्तता • सीओएस' : 'CROP SUITABILITY • COS'}
              </span>
              <i className="ri-plant-line text-emerald-600 dark:text-emerald-400 text-sm"></i>
            </div>

            <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-4">
              {isHindi ? 'अगली रबी फसल का चयन' : 'Next rabi pick'}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {isHindi ? 'गेहूं • HD-2967' : 'Wheat • HD-2967'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isHindi ? 'मृदा उपयुक्तता • उच्च' : 'Soil match • High'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#1a5b46] dark:text-emerald-300 bg-[#e6f3ee] dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  93 COS
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {isHindi ? 'सरसों • पूसा बोल्ड' : 'Mustard • Pusa Bold'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {isHindi ? 'जल आवश्यकता • कम' : 'Water requirement • Low'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#1a5b46] dark:text-emerald-300 bg-[#e6f3ee] dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  85 COS
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-5 leading-relaxed">
              {isHindi
                ? 'आपकी मिट्टी, पानी की उपलब्धता, मौसम और नमूना बाजार स्थिरता से मेल खाता है।'
                : 'Matched to your soil, water availability, season and sample market stability.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('crop')}
            className="mt-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
          >
            <span>{isHindi ? 'फसलें देखें' : 'Explore crops'}</span>
            <i className="ri-arrow-right-up-line"></i>
          </button>
        </div>

        {/* Card 3: Mausam 5-Day Outlook */}
        <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isHindi ? 'मौसम • 5-दिवसीय पूर्वानुमान' : 'MAUSAM • 5-DAY OUTLOOK'}
              </span>
              <i className="ri-sun-cloudy-line text-amber-500 text-sm"></i>
            </div>

            <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white mb-4">
              {isHindi ? 'शुक्रवार को बारिश, 12mm' : 'Rain Friday, 12mm'}
            </h2>

            {/* 3 mini forecast days */}
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              {weatherDays.map((wd) => (
                <div
                  key={wd.day}
                  className="bg-[#f8fafb] dark:bg-slate-800/60 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800"
                >
                  <span className="text-[10px] font-medium text-slate-400 block">{wd.day}</span>
                  <span className="text-lg block my-0.5">{wd.icon}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{wd.temp}</span>
                  <span className="text-[9px] text-slate-400 block truncate">{wd.condition}</span>
                </div>
              ))}
            </div>

            {/* Soft peach/amber advisory box */}
            <div className="mt-4 bg-[#fbf4ea] dark:bg-amber-950/30 text-[#8a5d28] dark:text-amber-300 border border-[#f3e5d0] dark:border-amber-900/50 rounded-2xl p-3 text-[11px] leading-relaxed">
              {isHindi
                ? 'जलवायु जोखिम: इस नमूना आकलन में कम। बारिश के बाद मिट्टी की नमी की समीक्षा करें।'
                : 'Climate risk: low in this sample assessment. Review soil moisture after the rain.'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('weather')}
            className="mt-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
          >
            <span>{isHindi ? 'मौसम एवं जोखिम' : 'Weather & risk'}</span>
            <i className="ri-arrow-right-up-line"></i>
          </button>
        </div>
      </div>

      {/* 3. Bottom Row: Yojanayein Support (Screenshot 5) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isHindi ? 'योजनाएं • आपके खेत के लिए सहायता' : 'YOJANAYEIN • SUPPORT FOR YOUR FARM'}
          </span>
          <button
            type="button"
            onClick={() => onSelectTab('schemes')}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
          >
            <span>{isHindi ? 'सभी योजनाएं' : 'All schemes'}</span>
            <i className="ri-arrow-right-up-line"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scheme 1 */}
          <div
            onClick={() => onSelectTab('schemes')}
            className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                PM-KISAN installment
              </h3>
              <i className="ri-arrow-right-up-line text-slate-400 text-xs"></i>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">₹6,000 per year</p>
            <span className="inline-block mt-3 text-[10px] font-medium text-[#8a5d28] dark:text-amber-300 bg-[#fbf4ea] dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
              {isHindi ? 'संभावित रूप से पात्र' : 'Potentially eligible'}
            </span>
          </div>

          {/* Scheme 2 */}
          <div
            onClick={() => onSelectTab('schemes')}
            className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Soil Health Card
              </h3>
              <i className="ri-arrow-right-up-line text-slate-400 text-xs"></i>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Soil testing & nutrient guidance
            </p>
            <span className="inline-block mt-3 text-[10px] font-medium text-[#1a5b46] dark:text-emerald-300 bg-[#e6f3ee] dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
              {isHindi ? 'किसानों के लिए खुला' : 'Open to farmers'}
            </span>
          </div>

          {/* Scheme 3 */}
          <div
            onClick={() => onSelectTab('schemes')}
            className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Crop Insurance - Rabi
              </h3>
              <i className="ri-arrow-right-up-line text-slate-400 text-xs"></i>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Crop loss protection</p>
            <span className="inline-block mt-3 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {isHindi ? 'नामांकन जांचें' : 'Check enrollment'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
