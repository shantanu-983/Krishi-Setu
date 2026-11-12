import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProfileView() {
  const { user, updateProfile } = useAuth();
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const [name, setName] = useState(user?.name || (isHindi ? 'रमेश यादव' : 'Ramesh Yadav'));
  const [phone, setPhone] = useState(user?.phone || '');
  const [village, setVillage] = useState(user?.village || 'Kukrail');
  const [district, setDistrict] = useState(user?.district || 'Lucknow');
  const [landHolding, setLandHolding] = useState(user?.farmSizeAcres ? String(user.farmSizeAcres) : '2.4');
  const [stateName, setStateName] = useState(user?.state || 'Uttar Pradesh');
  const [soilType, setSoilType] = useState(user?.soilType || 'Loam');
  const [waterSource, setWaterSource] = useState(user?.irrigationSource || 'Borewell');
  const [primaryCrop, setPrimaryCrop] = useState(user?.primaryCrops?.[0] || 'Wheat');
  const [farmerCategory, setFarmerCategory] = useState(user?.farmerCategory || 'Small farmer');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      name,
      phone,
      village,
      district,
      state: stateName,
      farmSizeAcres: parseFloat(landHolding) || 2.4,
      soilType,
      irrigationSource: waterSource,
      primaryCrops: [primaryCrop],
      farmerCategory,
    };

    if (updateProfile) {
      await updateProfile(payload);
    }
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  }

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
      <div className="text-[10px] font-bold tracking-widest text-[#d97736] uppercase">
        {isHindi ? 'किसान प्रोफाइल' : 'KISAN PROFILE'}
      </div>

      {/* Heading & Subtitle */}
      <div className="space-y-2">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
          {isHindi
            ? 'आपका खेत। आपकी संभावनाएं।'
            : 'Your farm. Your possibilities.'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
          {isHindi
            ? 'नमूना सिफारिशों को वैयक्तिकृत करने के लिए अपने खेत के बारे में बताएं। प्रोफ़ाइल परिवर्तन इस ऐप सत्र तक रहते हैं।'
            : 'Tell us about your field to personalize sample recommendations. Profile changes last for this app session.'}
        </p>
      </div>

      {/* Top Farmer Card (Screenshot 3) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex items-center gap-5 sm:gap-6">
        <img
          src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=240&q=80"
          alt={name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80';
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shrink-0 ring-2 ring-slate-100 dark:ring-slate-800"
        />

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {village}, {district} • {stateName}
          </p>
          <span className="inline-block mt-2 bg-[#e6f3ee] dark:bg-emerald-950/40 text-[#1a5b46] dark:text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">
            {isHindi ? 'नमूना खेत प्रोफाइल' : 'Sample farm profile'}
          </span>
        </div>
      </div>

      {/* 2-Column Farm Details Form (Screenshot 3) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {/* Farmer name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'किसान का नाम' : 'Farmer name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Mobile / WhatsApp (optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'मोबाइल / व्हाट्सएप (वैकल्पिक)' : 'Mobile / WhatsApp (optional)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Village */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'गांव' : 'Village'}
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'जिला' : 'District'}
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Land holding (acres) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'भूमि जोत (एकड़)' : 'Land holding (acres)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={landHolding}
                onChange={(e) => setLandHolding(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'राज्य' : 'State'}
              </label>
              <div className="relative">
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                >
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
              </div>
            </div>

            {/* Soil type */}
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

            {/* Water source */}
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

            {/* Primary crop */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'मुख्य फसल' : 'Primary crop'}
              </label>
              <div className="relative">
                <select
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Gram">Gram / Chana</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Paddy">Paddy</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
              </div>
            </div>

            {/* Farmer category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {isHindi ? 'किसान श्रेणी' : 'Farmer category'}
              </label>
              <div className="relative">
                <select
                  value={farmerCategory}
                  onChange={(e) => setFarmerCategory(e.target.value)}
                  className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                >
                  <option value="Small farmer">{isHindi ? 'लघु किसान (Small farmer)' : 'Small farmer'}</option>
                  <option value="Marginal farmer">{isHindi ? 'सीमांत किसान (Marginal farmer)' : 'Marginal farmer'}</option>
                  <option value="Medium farmer">{isHindi ? 'मध्यम किसान (Medium farmer)' : 'Medium farmer'}</option>
                  <option value="Large farmer">{isHindi ? 'बड़ा किसान (Large farmer)' : 'Large farmer'}</option>
                </select>
                <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#143d35] hover:bg-[#0f3029] text-white px-6 py-3 rounded-full text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
            >
              <i className="ri-leaf-line text-sm text-emerald-300"></i>
              <span>{saving ? (isHindi ? 'सहेज रहे हैं...' : 'Registering...') : (isHindi ? 'मेरे खेत का पंजीकरण करें' : 'Register my farm')}</span>
            </button>

            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                <i className="ri-checkbox-circle-fill text-emerald-600"></i>
                {isHindi ? 'खेत प्रोफाइल सफलतापूर्वक सहेजी गई!' : 'Farm profile registered successfully!'}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Bottom Notice Banner (Screenshot 3) */}
      <div className="bg-[#fbf4ea] dark:bg-amber-950/30 text-[#8a5d28] dark:text-amber-300 border border-[#f3e5d0] dark:border-amber-900/50 rounded-2xl p-4 text-xs flex items-center gap-2.5">
        <i className="ri-information-line text-base shrink-0"></i>
        <span>
          {isHindi
            ? 'नमूना मौसम और मंडी स्थान लखनऊ पर आधारित रहते हैं। इस प्रोटोटाइप में कोई खाता साइनअप या लाइव फार्म सत्यापन नहीं है।'
            : 'Sample weather and mandi locations remain based on Lucknow. This prototype has no account signup or live farm verification.'}
        </span>
      </div>
    </div>
  );
}
