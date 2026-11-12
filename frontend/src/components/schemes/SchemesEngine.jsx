import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function SchemesEngine() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHindi = language === 'hi';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalScheme, setActiveModalScheme] = useState(null);

  const farmAcres = user?.farmSizeAcres || '2.4';
  const farmState = user?.state || 'Uttar Pradesh';

  const [schemesList, setSchemesList] = useState([
    {
      id: 'pm-kisan',
      tag: isHindi ? 'आय सहायता' : 'Income support',
      category: 'Income support',
      title: isHindi ? 'पीएम-किसान आय सहायता' : 'PM-KISAN income support',
      benefit: isHindi ? '₹6,000 प्रति वर्ष' : '₹6,000 per year',
      description: isHindi
        ? 'पात्र भू-धारक किसान परिवारों को तीन किस्तों में आय सहायता, आधिकारिक बहिष्करण और सत्यापन के अधीन।'
        : 'Income support in three instalments for eligible landholding farmer families, subject to official exclusions and verification.',
      statusPill: isHindi ? 'संभावित रूप से पात्र' : 'Potentially eligible',
      statusStyle: 'bg-[#fbf4ea] dark:bg-amber-950/40 text-[#8a5d28] dark:text-amber-300',
      portalUrl: 'https://pmkisan.gov.in',
      details: {
        ministry: 'Ministry of Agriculture and Farmers Welfare',
        criteria: 'Small and marginal landholding farmer families with cultivated land in their name.',
        documents: 'Aadhaar Card, Land ownership record (Khatauni/ROR), Active Bank Account linked to Aadhaar.',
      },
    },
    {
      id: 'soil-health-card',
      tag: isHindi ? 'मृदा स्वास्थ्य' : 'Soil health',
      category: 'Soil health',
      title: isHindi ? 'मृदा स्वास्थ्य कार्ड (Soil Health Card)' : 'Soil Health Card',
      benefit: isHindi ? 'मृदा परीक्षण एवं पोषण मार्गदर्शन' : 'Soil testing & nutrient guidance',
      description: isHindi
        ? 'प्रतिभागी स्थानीय मिट्टी परीक्षण सुविधाओं के माध्यम से मिट्टी परीक्षण और फसल-विशिष्ट पोषक तत्व सिफारिशें।'
        : 'Soil testing and crop-specific nutrient recommendations through participating local soil testing facilities.',
      statusPill: isHindi ? 'किसानों के लिए खुला' : 'Open to farmers',
      statusStyle: 'bg-[#e6f3ee] dark:bg-emerald-950/40 text-[#1a5b46] dark:text-emerald-300',
      portalUrl: 'https://soilhealth.dac.gov.in',
      details: {
        ministry: 'Department of Agriculture & Farmers Welfare',
        criteria: 'All resident farmers are eligible to receive soil health cards issued every 2 years.',
        documents: 'Soil sample collected by local agriculture extension worker, Farmer Aadhaar/Khasra number.',
      },
    },
    {
      id: 'pmfby',
      tag: isHindi ? 'बीमा' : 'Insurance',
      category: 'Insurance',
      title: isHindi ? 'प्रधानमंत्री फसल बीमा योजना' : 'Pradhan Mantri Fasal Bima Yojana',
      benefit: isHindi ? 'फसल क्षति सुरक्षा' : 'Crop loss protection',
      description: isHindi
        ? 'कवर किए गए जोखिमों के खिलाफ अधिसूचित फसलों का बीमा। रबी खाद्य एवं तिलहन फसलों के लिए किसान प्रीमियम सामान्यतः 1.5% है; स्थानीय अधिसूचनाएं लागू होती हैं।'
        : 'Insurance for notified crops against covered risks. Farmer premium is generally 1.5% for Rabi food and oilseed crops; local notifications apply.',
      statusPill: isHindi ? 'नामांकन जांचें' : 'Check enrollment',
      statusStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      portalUrl: 'https://pmfby.gov.in',
      details: {
        ministry: 'Ministry of Agriculture and Farmers Welfare',
        criteria: 'Farmers growing notified crops in notified areas, both loanee and non-loanee.',
        documents: 'Land possession certificate, Sowing certificate from Patwari, Bank Passbook, Aadhaar.',
      },
    },
    {
      id: 'pm-kusum',
      tag: isHindi ? 'सिंचाई' : 'Irrigation',
      category: 'Irrigation',
      title: isHindi ? 'पीएम-कुसुम सौर पंप' : 'PM-KUSUM solar pumps',
      benefit: isHindi ? 'पात्र सौर पंपों पर सब्सिडी' : 'Subsidy for eligible solar pumps',
      description: isHindi
        ? 'राज्य-प्रशासित घटकों के तहत सौर सिंचाई के लिए सहायता। सब्सिडी और उपलब्धता राज्य और घटक पर निर्भर करती है।'
        : 'Support for solar irrigation under state-administered components. Subsidies and availability depend on the state and component.',
      statusPill: isHindi ? 'उपलब्धता जांचें' : 'Check availability',
      statusStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      portalUrl: 'https://pmkusum.mnre.gov.in',
      details: {
        ministry: 'Ministry of New and Renewable Energy',
        criteria: 'Individual farmers, farmer groups, cooperatives with agricultural land and valid borewell/source.',
        documents: 'Land ownership papers, Electric bill or proof of un-electrified diesel pump, Bank details.',
      },
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    api.getSchemes({ state: farmState, limit: 12 })
      .then((res) => {
        if (!isMounted || !res.ok || !Array.isArray(res.data) || res.data.length === 0) return;
        const mapped = res.data.map((s) => {
          const bType = s.benefitType || 'Government Scheme';
          const cat = bType.toLowerCase().includes('insurance')
            ? 'Insurance'
            : bType.toLowerCase().includes('soil')
            ? 'Soil health'
            : bType.toLowerCase().includes('solar') || bType.toLowerCase().includes('irrigation')
            ? 'Irrigation'
            : 'Income support';

          return {
            id: s.schemeCode?.toLowerCase() || s.id,
            tag: s.benefitType,
            category: cat,
            title: s.schemeName,
            benefit: s.benefitDescription || s.benefitType,
            description: s.eligibilitySummary,
            statusPill: s.status === 'ACTIVE' ? (isHindi ? 'सक्रिय' : 'Active') : (isHindi ? 'सत्यापन आवश्यक' : 'Requires Verification'),
            statusStyle: s.status === 'ACTIVE'
              ? 'bg-[#e6f3ee] dark:bg-emerald-950/40 text-[#1a5b46] dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            portalUrl: s.officialUrl,
            sourceVerifiedAt: s.sourceVerifiedAt,
            details: {
              ministry: s.ministry || 'Ministry of Agriculture',
              criteria: s.eligibilitySummary,
              documents: 'Aadhaar Card, Land ownership record (Khatauni/ROR), Active Bank Account.',
            },
          };
        });
        setSchemesList(mapped);
      })
      .catch((err) => {
        console.debug('Schemes background fetch handled:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [farmState, isHindi]);

  // Filtering
  const filteredSchemes = schemesList.filter((scheme) => {
    const matchesCategory =
      selectedCategory === 'All' || scheme.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.benefit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        {isHindi ? 'सरकारी सहायता इंजन' : 'GOVERNMENT SUPPORT ENGINE'}
      </div>

      {/* Heading & Subtitle */}
      <div className="space-y-2">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
          {isHindi
            ? 'सहायता जो आपके खेत को आगे बढ़ाती है।'
            : 'Support that helps your farm grow.'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
          {isHindi
            ? `${farmState} में आपके ${farmAcres}-एकड़ खेत के लिए सहायता खोजें। आधिकारिक पात्रता सत्यापित की जानी चाहिए।`
            : `Explore support for your ${farmAcres}-acre farm in ${farmState}. Official eligibility must be verified.`}
        </p>
      </div>

      {/* Filter Bar: Search + Support category dropdown (Screenshot 4) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Search schemes */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'योजनाएं खोजें' : 'Search schemes'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isHindi ? 'नाम या लाभ द्वारा खोजें...' : 'Search by name or benefit...'}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
              <i className="ri-search-line absolute right-3.5 top-2.5 text-slate-400 text-sm"></i>
            </div>
          </div>

          {/* Support category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'सहायता श्रेणी' : 'Support category'}
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="All">{isHindi ? 'सभी' : 'All'}</option>
                <option value="Income support">{isHindi ? 'आय सहायता' : 'Income support'}</option>
                <option value="Soil health">{isHindi ? 'मृदा स्वास्थ्य' : 'Soil health'}</option>
                <option value="Insurance">{isHindi ? 'बीमा' : 'Insurance'}</option>
                <option value="Irrigation">{isHindi ? 'सिंचाई' : 'Irrigation'}</option>
              </select>
              <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Schemes 2x2 Grid (Screenshot 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Top tag pill */}
              <span className="inline-block bg-[#eef4f7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold px-3 py-1 rounded-full mb-3">
                {scheme.tag}
              </span>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
                {scheme.title}
              </h3>

              {/* Benefit Highlight */}
              <p className="text-xs sm:text-sm font-bold text-[#143d35] dark:text-emerald-400 mb-3">
                {scheme.benefit}
              </p>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {scheme.description}
              </p>
            </div>

            {/* Bottom Row: Status pill + Eligibility & details action */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${scheme.statusStyle}`}>
                {scheme.statusPill}
              </span>

              <button
                type="button"
                onClick={() => setActiveModalScheme(scheme)}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition"
              >
                <span>{isHindi ? 'पात्रता एवं विवरण' : 'Eligibility & details'}</span>
                <i className="ri-arrow-right-up-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Disclaimer Banner (from Screenshot 4) */}
      <div className="bg-[#fbf4ea] dark:bg-amber-950/30 text-[#8a5d28] dark:text-amber-300 border border-[#f3e5d0] dark:border-amber-900/50 rounded-2xl p-4 text-xs leading-relaxed">
        {isHindi
          ? 'नमूना मिलान पात्रता की स्वीकृति नहीं है। लाभ, आवेदन अवधि और आवश्यकताएं आधिकारिक योजना नियमों द्वारा शासित होती हैं।'
          : 'Sample matches are not an eligibility approval. Benefits, application windows and requirements are governed by official scheme rules.'}
      </div>

      {/* Scheme Details Modal */}
      {activeModalScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {activeModalScheme.tag}
                </span>
                <h3 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
                  {activeModalScheme.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalScheme(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Ministry / Department:</span>
                <span className="text-slate-600 dark:text-slate-400">{activeModalScheme.details.ministry}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Key Eligibility Criteria:</span>
                <span className="text-slate-600 dark:text-slate-400">{activeModalScheme.details.criteria}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Required Documents:</span>
                <span className="text-slate-600 dark:text-slate-400">{activeModalScheme.details.documents}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <a
                href={activeModalScheme.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#143d35] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Visit Official Portal</span>
                <i className="ri-external-link-line"></i>
              </a>

              <button
                type="button"
                onClick={() => setActiveModalScheme(null)}
                className="bg-[#143d35] text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-[#0f3029] transition"
              >
                {isHindi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
