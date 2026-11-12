import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProfileModal({ isOpen, onClose }) {
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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.village) setVillage(user.village);
      if (user.district) setDistrict(user.district);
      if (user.farmSizeAcres) setLandHolding(String(user.farmSizeAcres));
      if (user.state) setStateName(user.state);
      if (user.soilType) setSoilType(user.soilType);
      if (user.irrigationSource) setWaterSource(user.irrigationSource);
      if (user.primaryCrops?.[0]) setPrimaryCrop(user.primaryCrops[0]);
      if (user.farmerCategory) setFarmerCategory(user.farmerCategory);
    }
  }, [user, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

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
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative space-y-6 my-6 max-h-[90vh] overflow-y-auto animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <i className="ri-close-line text-xl"></i>
        </button>

        {/* Category & Title */}
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#d97736] uppercase block mb-1">
            {isHindi ? 'किसान प्रोफाइल' : 'KISAN PROFILE'}
          </span>
          <h2 className="font-serif font-bold text-2xl text-slate-900 dark:text-white">
            {isHindi ? 'आपका खेत। आपकी संभावनाएं।' : 'Your farm. Your possibilities.'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'सिफारिशों को वैयक्तिकृत करने के लिए अपने खेत के बारे में बताएं।'
              : 'Tell us about your field to personalize sample recommendations.'}
          </p>
        </div>

        {/* Farmer summary header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafb] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
          <img
            src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=160&q=80"
            alt={name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80';
            }}
            className="w-12 h-12 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{name}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{village}, {district} • {stateName}</p>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <i className="ri-checkbox-circle-fill text-emerald-600"></i>
              <span>{isHindi ? 'प्रोफाइल सहेजी गई!' : 'Profile saved successfully!'}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isHindi ? 'किसान का नाम' : 'Farmer name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isHindi ? 'मोबाइल / व्हाट्सएप' : 'Mobile / WhatsApp (optional)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isHindi ? 'गांव' : 'Village'}
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isHindi ? 'जिला' : 'District'}
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isHindi ? 'भूमि जोत (एकड़)' : 'Land holding (acres)'}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={landHolding}
                onChange={(e) => setLandHolding(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {isHindi ? 'राज्य' : 'State'}
              </label>
              <select
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#143d35] hover:bg-[#0f3029] text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs transition"
            >
              {saving ? (isHindi ? 'सहेज रहे हैं...' : 'Saving...') : (isHindi ? 'सहेजें' : 'Save farm profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
