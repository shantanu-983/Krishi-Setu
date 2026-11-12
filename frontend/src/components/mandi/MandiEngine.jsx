import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function MandiEngine() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isHindi = language === 'hi';

  const [cropsList, setCropsList] = useState([]);
  const [selectedCropName, setSelectedCropName] = useState('Wheat');
  const [quantity, setQuantity] = useState(10);
  const [villageName, setVillageName] = useState(
    user?.village ? `${user.village}, ${user.district || 'Lucknow'}` : 'Kukrail, Lucknow'
  );
  const [exportNotice, setExportNotice] = useState(false);

  // Mandi comparison items
  const [candidateMandis, setCandidateMandis] = useState([
    {
      id: 'm1',
      rank: 1,
      name: 'Mohanlalganj',
      mos: '91 MOS',
      distanceKm: 12,
      quotedPricePerQ: 2580,
      transportPerQ: 100,
      stabilityScore: 88,
      demandScore: 85,
    },
    {
      id: 'm2',
      rank: 2,
      name: 'Aishbagh',
      mos: '87 MOS',
      distanceKm: 18,
      quotedPricePerQ: 2610,
      transportPerQ: 150,
      stabilityScore: 84,
      demandScore: 90,
    },
    {
      id: 'm3',
      rank: 3,
      name: 'Barabanki',
      mos: '78 MOS',
      distanceKm: 35,
      quotedPricePerQ: 2688,
      transportPerQ: 260,
      stabilityScore: 80,
      demandScore: 88,
    },
  ]);

  // Load live reference crops and mandis from backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [cropsRes, mandisRes] = await Promise.allSettled([
          api.getCrops({ limit: 20 }),
          api.getMandis({ limit: 10 }),
        ]);

        if (!isMounted) return;

        if (cropsRes.status === 'fulfilled' && cropsRes.value.ok && Array.isArray(cropsRes.value.data)) {
          setCropsList(cropsRes.value.data);
        }

        if (mandisRes.status === 'fulfilled' && mandisRes.value.ok && Array.isArray(mandisRes.value.data)) {
          const apiMandis = mandisRes.value.data;
          if (apiMandis.length >= 2) {
            setCandidateMandis((prev) =>
              prev.map((item, idx) => {
                if (apiMandis[idx]) {
                  return {
                    ...item,
                    dbId: apiMandis[idx]._id,
                    name: apiMandis[idx].name || item.name,
                    distanceKm: apiMandis[idx].distanceKm || item.distanceKm,
                  };
                }
                return item;
              })
            );
          }
        }
      } catch (err) {
        console.debug('Mandi background load handled:', err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // When crop, quantity or cropsList changes, request backend comparison if matching DB IDs exist
  useEffect(() => {
    let isMounted = true;
    const targetCrop = cropsList.find(
      (c) => c.name?.toLowerCase() === selectedCropName.toLowerCase()
    );
    const validMandis = candidateMandis.filter((m) => m.dbId);

    if (targetCrop && validMandis.length > 0) {
      const payload = {
        cropId: targetCrop._id,
        quantityQuintals: Math.max(1, parseFloat(quantity) || 1),
        mandiEntries: validMandis.map((m) => ({
          mandiId: m.dbId,
          transportCostInr: m.transportPerQ,
          otherCostsInr: 0,
        })),
      };

      api.compareMandis(payload)
        .then((res) => {
          if (!isMounted || !res.ok || !res.data?.mandis) return;
          const serverMandis = res.data.mandis;
          setCandidateMandis((prev) =>
            prev.map((item) => {
              const matched = serverMandis.find((sm) => sm.mandiId === item.dbId);
              if (matched && matched.price?.modalPriceInr) {
                return {
                  ...item,
                  quotedPricePerQ: matched.price.modalPriceInr,
                  transportPerQ: matched.costs?.transportCostInr ?? item.transportPerQ,
                  dataType: matched.price.dataType,
                  observationDate: matched.price.observationDate,
                };
              }
              return item;
            })
          );
        })
        .catch((err) => {
          console.debug('Backend mandi comparison handled:', err);
        });
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCropName, quantity, cropsList]);

  // Compute calculated values based on quantity
  const qtyNumber = Math.max(1, parseFloat(quantity) || 1);

  const calculatedMandis = candidateMandis.map((m) => {
    const netPerQ = m.quotedPricePerQ - m.transportPerQ;
    const netTotal = netPerQ * qtyNumber;
    return {
      ...m,
      netPerQ,
      netTotal,
    };
  });

  // Sort descending by netTotal so highest take-home profit is always #1
  calculatedMandis.sort((a, b) => b.netTotal - a.netTotal);
  const recommended = calculatedMandis[0];

  function handleExport() {
    setExportNotice(true);
    // Simple CSV generation & download
    const headers = 'Rank,Mandi,Quoted Price (INR/Q),Transport (INR/Q),Net (INR/Q),Net Total (INR),Distance\n';
    const rows = calculatedMandis
      .map(
        (m, i) =>
          `${i + 1},"${m.name}",${m.quotedPricePerQ},${m.transportPerQ},${m.netPerQ},${m.netTotal},"${m.distanceKm} km"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Krishi_Setu_Mandi_Comparison_${selectedCropName}_${qtyNumber}Q.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setExportNotice(false), 3000);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Notice Banner */}
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
        {isHindi ? 'स्मार्ट मंडी निर्णय इंजन' : 'SMART MANDI DECISION ENGINE'}
      </div>

      {/* Header and Export Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
            {isHindi
              ? 'सर्वश्रेष्ठ भाव हमेशा सर्वोत्तम लाभ नहीं होता।'
              : "The best price isn't always the best profit."}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {isHindi
              ? 'केवल उद्धृत मूल्य ही नहीं, बल्कि परिवहन के बाद शुद्ध आय की तुलना करें। नीचे दिए गए सभी मूल्य नमूना आंकड़े हैं।'
              : 'Compare net earnings after transport, not just the quoted price. All prices below are sample data.'}
          </p>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExport}
          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs self-start md:self-auto shrink-0"
        >
          <i className="ri-download-2-line text-slate-500"></i>
          <span>{exportNotice ? (isHindi ? 'डाउनलोड हुआ ✓' : 'Exported ✓') : (isHindi ? 'तुलना निर्यात करें' : 'Export comparison')}</span>
        </button>
      </div>

      {/* 3-Input Bar (Screenshot 2) */}
      <div className="bg-white dark:bg-[#111927] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Crop Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'फसल' : 'Crop'}
            </label>
            <div className="relative">
              <select
                value={selectedCropName}
                onChange={(e) => setSelectedCropName(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="Wheat">Wheat</option>
                <option value="Mustard">Mustard</option>
                <option value="Gram">Gram / Chana</option>
                <option value="Soybean">Soybean</option>
                <option value="Paddy">Paddy / Rice</option>
                {cropsList.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-3.5 top-2.5 text-slate-400 pointer-events-none text-base"></i>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'मात्रा (क्विंटल)' : 'Quantity (quintals)'}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              placeholder="10"
            />
          </div>

          {/* Village Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {isHindi ? 'आपका गांव' : 'Your village'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full bg-[#f8fafb] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                placeholder="Kukrail, Lucknow"
              />
              <span className="absolute left-3 top-2.5 text-xs">📍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Mandi Highlight Banner (Screenshot 2) */}
      {recommended && (
        <div className="bg-[#dce7eb] dark:bg-slate-800/90 border border-[#c8d9df] dark:border-slate-700 p-6 sm:p-7 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#3d6067] dark:text-slate-400 uppercase block mb-1">
              {isHindi ? 'अनुशंसित मंडी' : 'RECOMMENDED MANDI'}
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              {recommended.name}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {recommended.distanceKm} {isHindi ? 'किमी आपके गांव से • परिवहन सम्मिलित' : 'km from sample village • transport included'}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold tracking-widest text-[#3d6067] dark:text-slate-400 uppercase block mb-1">
              {isHindi ? `${qtyNumber} क्विंटल के लिए अनुमानित शुद्ध आय` : `ESTIMATED NET FOR ${qtyNumber} QUINTALS`}
            </span>
            <div className="font-serif font-bold text-3xl sm:text-4xl text-[#143d35] dark:text-emerald-400">
              ₹{recommended.netTotal.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Mandis List (Screenshot 2) */}
      <div className="space-y-4">
        {calculatedMandis.map((mandi, idx) => (
          <div
            key={mandi.id}
            className="bg-white dark:bg-[#111927] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs"
          >
            {/* Card Header: Rank Circle, Name, MOS Badge */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/70">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {mandi.name}
                </h3>
              </div>

              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {mandi.mos}
              </span>
            </div>

            {/* 4-Column Breakdown Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  MANDI PRICE / Q
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  ₹{mandi.quotedPricePerQ.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  TRANSPORT / Q
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-400">
                  - ₹{mandi.transportPerQ}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  NET / Q
                </span>
                <span className="text-sm sm:text-base font-bold text-[#143d35] dark:text-emerald-400">
                  ₹{mandi.netPerQ.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  NET TOTAL
                </span>
                <span className="text-base sm:text-lg font-bold text-[#143d35] dark:text-emerald-400">
                  ₹{mandi.netTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Subtext info */}
            <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {mandi.distanceKm} km • Stability {mandi.stabilityScore}/100 • Demand {mandi.demandScore}/100
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
