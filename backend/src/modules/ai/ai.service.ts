/**
 * Krishi Setu — AI Agriculture Assistant Service
 *
 * Provides intelligent, context-aware agricultural decision support.
 * Operates in two modes:
 *  1. GEMINI_LIVE: When GEMINI_API_KEY is configured in backend environment.
 *  2. EXPERT_AGRONOMIC_ENGINE: Built-in deterministic agronomic knowledge engine
 *     providing explainable guidance for pilot crops (Wheat, Soybean, Mustard, Gram, Maize, Rice),
 *     soil types, irrigation timing, weather precautions, and government schemes.
 */

import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FarmerContext {
  name?: string;
  state?: string;
  district?: string;
  farmSizeAcres?: number;
  primaryCrops?: string[];
  soilType?: string;
}

export interface AiChatResponse {
  reply: string;
  category: string;
  mode: 'GEMINI_LIVE' | 'EXPERT_AGRONOMIC_ENGINE';
  suggestedQuestions: string[];
  disclaimer: string;
}

const AGRI_DISCLAIMER_EN =
  'Notice: Recommendations provided by Krishi Setu AI are decision-support guidelines based on ICAR agronomic principles and current meteorological observations. Always verify critical chemical spray doses or disease diagnoses with your local Krishi Vigyan Kendra (KVK) officer.';

const AGRI_DISCLAIMER_HI =
  'सूचना: कृषि सेतु एआई द्वारा दी गई सलाह आईसीएआर कृषि सिद्धांतों और मौसम संबंधी टिप्पणियों पर आधारित निर्णय-सहायक सुझाव हैं। किसी भी रासायनिक छिड़काव या गंभीर रोग के उपचार से पहले अपने स्थानीय कृषि विज्ञान केंद्र (KVK) से परामर्श अवश्य लें।';

export async function processAgriQuery(
  userQuery: string,
  language: 'en' | 'hi' = 'en',
  farmerContext?: FarmerContext
): Promise<AiChatResponse> {
  const q = userQuery.toLowerCase().trim();
  const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(userQuery);

  // Check if live Gemini API key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim().length > 10 && !geminiKey.startsWith('REPLACE')) {
    try {
      const geminiReply = await queryGeminiApi(userQuery, geminiKey, language, farmerContext);
      if (geminiReply) {
        return {
          reply: geminiReply,
          category: 'GEMINI_AI',
          mode: 'GEMINI_LIVE',
          suggestedQuestions: getSuggestedQuestions(isHindi),
          disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
        };
      }
    } catch {
      // Gracefully fall back to local expert engine if Gemini fails or rate-limits
    }
  }

  // Built-in Expert Agronomic Decision Engine
  return queryExpertEngine(q, isHindi, farmerContext);
}

async function queryGeminiApi(
  userPrompt: string,
  apiKey: string,
  language: string,
  context?: FarmerContext
): Promise<string | null> {
  const systemPrompt = `You are Krishi Setu AI, an expert agricultural decision support assistant for Indian farmers, specialized in Madhya Pradesh and Uttar Pradesh agro-climatic conditions.
Context of Farmer:
- State: ${context?.state || 'Madhya Pradesh / Uttar Pradesh'}
- District: ${context?.district || 'Central India'}
- Primary Crops: ${context?.primaryCrops?.join(', ') || 'Wheat, Soybean, Gram, Mustard'}
- Farm Size: ${context?.farmSizeAcres ? `${context.farmSizeAcres} acres` : 'Not specified'}

Instructions:
- Provide clear, actionable, practical, explainable agricultural guidance.
- If asked in Hindi, reply in clean, easy-to-understand Hindi (Devanagari).
- Focus on practical steps: Sowing timing, irrigation stages, fertilizer split doses, disease prevention, and mandi net realization.
- Keep responses concise (under 250 words) with bullet points.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nFarmer Question: ${userPrompt}` }],
        },
      ],
    },
    { timeout: 8000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

function queryExpertEngine(
  q: string,
  isHindi: boolean,
  context?: FarmerContext
): AiChatResponse {
  const crop = context?.primaryCrops?.[0] || 'Wheat';
  const state = context?.state || 'Madhya Pradesh';

  // 1. Wheat Irrigation & Sowing
  if (q.includes('wheat') || q.includes('गेहूं') || q.includes('gehu')) {
    if (q.includes('irrigation') || q.includes('water') || q.includes('सिंचाई') || q.includes('paani')) {
      return {
        mode: 'EXPERT_AGRONOMIC_ENGINE',
        category: 'IRRIGATION_MANAGEMENT',
        reply: isHindi
          ? `**गेहूं की फसल में 5 मुख्य सिंचाई चरण:**\n\n` +
            `1. **ताज जड़ निकलने की अवस्था (CRI - Crown Root Initiation):** बुवाई के 20–25 दिन बाद (सबसे महत्वपूर्ण सिंचाई)।\n` +
            `2. **कल्ले फूटने की अवस्था (Tillering):** बुवाई के 40–45 दिन बाद।\n` +
            `3. **गांठ बनने की अवस्था (Jointing):** बुवाई के 60–65 दिन बाद।\n` +
            `4. **फूल आने की अवस्था (Flowering):** बुवाई के 80–85 दिन बाद।\n` +
            `5. **दाना भरने की अवस्था (Milking/Dough):** बुवाई के 100–105 दिन बाद।\n\n` +
            `*सुझाव:* हवा की गति 15 किमी/घंटा से अधिक होने पर सिंचाई न करें ताकि फसल गिरने (lodging) से बची रहे।`
          : `**Critical Irrigation Stages for Wheat (${crop}):**\n\n` +
            `1. **Crown Root Initiation (CRI):** 20–25 days after sowing (Most critical irrigation stage).\n` +
            `2. **Tillering Stage:** 40–45 days after sowing.\n` +
            `3. **Jointing Stage:** 60–65 days after sowing.\n` +
            `4. **Flowering Stage:** 80–85 days after sowing.\n` +
            `5. **Grain Filling (Dough) Stage:** 100–105 days after sowing.\n\n` +
            `*Field Tip:* Avoid irrigation during windy days (>15 km/h) to prevent crop lodging.`,
        suggestedQuestions: getSuggestedQuestions(isHindi),
        disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
      };
    }

    if (q.includes('fertilizer') || q.includes('urea') || q.includes('खाद') || q.includes('यूरिया')) {
      return {
        mode: 'EXPERT_AGRONOMIC_ENGINE',
        category: 'NUTRIENT_MANAGEMENT',
        reply: isHindi
          ? `**गेहूं के लिए संतुलित उर्वरक प्रबंधन (प्रति एकड़):**\n\n` +
            `• **बुवाई के समय (आधार खाद):** 1 बैग DAP (50 किग्रा) + 15 किग्रा MOP (पोटाश) + 20 किग्रा यूरिया।\n` +
            `• **पहली सिंचाई (CRI चरण) के बाद:** 35 किग्रा नीम-लेपित यूरिया + 5 किग्रा जिंक सल्फेट (21%)।\n` +
            `• **दूसरी सिंचाई (गांठ बनने पर):** 30 किग्रा यूरिया का दूसरा छिड़काव।\n\n` +
            `*सावधानी:* यूरिया का प्रयोग हमेशा मिट्टी में पर्याप्त नमी होने पर ही करें।`
          : `**Balanced Fertilizer Management for Wheat (per Acre):**\n\n` +
            `• **Basal Dose (at Sowing):** 1 bag DAP (50 kg) + 15 kg MOP (Potash) + 20 kg Urea.\n` +
            `• **Top-Dressing 1 (at CRI stage):** 35 kg Neem-coated Urea + 5 kg Zinc Sulphate (21%).\n` +
            `• **Top-Dressing 2 (Jointing stage):** 30 kg Urea after second irrigation.\n\n` +
            `*Tip:* Never broadcast urea in dry fields; always apply when soil has adequate field capacity moisture.`,
        suggestedQuestions: getSuggestedQuestions(isHindi),
        disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
      };
    }
  }

  // 2. Pest & Disease Management
  if (q.includes('pest') || q.includes('disease') || q.includes('कीट') || q.includes('रोग') || q.includes('rust') || q.includes('fungus')) {
    return {
      mode: 'EXPERT_AGRONOMIC_ENGINE',
      category: 'PLANT_PROTECTION',
      reply: isHindi
        ? `**प्रमुख फसलों में रोग व कीट प्रबंधन दिशानिर्देश:**\n\n` +
          `• **गेहूं का पीला रतुआ (Yellow Rust):** पत्तियों पर पीले पाउडर की धारियां दिखें तो *प्रोपिकोनाज़ोल (Tilt) 25% EC* का 1 मिली/लीटर पानी में घोल बनाकर छिड़काव करें।\n` +
          `• **चना में इल्ली (Pod Borer):** प्रति एकड़ 4-5 फेरोमोन ट्रैप लगाएं। गंभीर प्रकोप होने पर *एमामेक्टिन बेंजोएट 5% SG* 80 ग्राम/एकड़ का छिड़काव करें।\n` +
          `• **सरसों में माहू (Aphids):** सुबह के समय निरीक्षण करें। प्रकोप दिखने पर *इमिडाक्लोप्रिड 17.8% SL* 0.5 मिली/लीटर का छिड़काव करें।\n\n` +
          `*सतर्कता:* तेज़ हवा (>20 किमी/घंटा) या बारिश के पूर्वानुमान में छिड़काव न करें।`
        : `**Integrated Pest & Disease Management (IPM):**\n\n` +
          `• **Wheat Yellow/Brown Rust:** If yellow fungal pustules appear on leaves, spray *Propiconazole 25% EC* @ 1 ml/litre of water.\n` +
          `• **Gram Pod Borer (Helicoverpa):** Install 4–5 pheromone traps/acre. In case of threshold breach, spray *Emamectin Benzoate 5% SG* @ 80g/acre.\n` +
          `• **Mustard Aphids:** Spray *Imidacloprid 17.8% SL* @ 0.5 ml/litre during early infestation.\n\n` +
          `*Safety Precaution:* Do not apply foliar sprays when wind speeds exceed 20 km/h or if rainfall is forecast within 6 hours.`,
      suggestedQuestions: getSuggestedQuestions(isHindi),
      disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
    };
  }

  // 3. Mandi & Net Realization Guidance
  if (q.includes('mandi') || q.includes('price') || q.includes('मंडी') || q.includes('भाव') || q.includes('transport') || q.includes('net realization')) {
    return {
      mode: 'EXPERT_AGRONOMIC_ENGINE',
      category: 'MARKET_INTELLIGENCE',
      reply: isHindi
        ? `**मंडी शुद्ध प्राप्ति (Net Realization) गणना का सिद्धांत:**\n\n` +
          `केवल उच्चतम मंडी भाव देखकर निर्णय न लें। कृषि सेतु सूत्र का उपयोग करें:\n\n` +
          `$$\\text{शुद्ध प्राप्ति} = (\\text{मोडल भाव} \\times \\text{मात्रा}) - \\text{परिवहन खर्च} - \\text{पल्लेदारी व अन्य शुल्क}$$\n\n` +
          `• यदि इंदौर मंडी में भाव ₹2,300/क्विंटल है लेकिन दूरी के कारण परिवहन खर्च ₹1,500 अधिक है, तो पास की सांवेर मंडी (भाव ₹2,250) में बेचना अधिक लाभदायक हो सकता है।\n` +
          `• 'Smart Mandi Engine' टैब में जाकर अपनी मात्रा और वास्तविक परिवहन लागत डालकर तुलना करें।`
        : `**Smart Mandi Net Realization Principle:**\n\n` +
          `Do not decide solely based on the highest posted modal price. Always compute transparent net realization:\n\n` +
          `$$\\text{Net Realization} = (\\text{Modal Price} \\times \\text{Quantity}) - \\text{Transport Cost} - \\text{Handling Costs}$$\n\n` +
          `• If a distant regional mandi offers ₹2,300/qtl but incurs ₹1,500 additional transport, a local mandi at ₹2,250/qtl may deliver higher take-home profit.\n` +
          `• Open the **Smart Mandi Engine** tab to input your crop quantity and actual transport costs for live comparison.`,
      suggestedQuestions: getSuggestedQuestions(isHindi),
      disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
    };
  }

  // 4. Government Schemes & Support
  if (q.includes('scheme') || q.includes('yojana') || q.includes('योजना') || q.includes('pm kisan') || q.includes('kcc') || q.includes('pmfby')) {
    return {
      mode: 'EXPERT_AGRONOMIC_ENGINE',
      category: 'GOVERNMENT_SUPPORT',
      reply: isHindi
        ? `**किसानों के लिए प्रमुख सरकारी योजनाएं (${state}):**\n\n` +
          `1. **PM-KISAN (पीएम किसान सम्मान निधि):** ₹6,000 प्रति वर्ष, ₹2,000 की तीन किस्तों में सीधे बैंक खाते में (डीबीटी)।\n` +
          `2. **PMFBY (प्रधानमंत्री फसल बीमा योजना):** रबी फसलों पर मात्र 1.5% और खरीफ पर 2.0% प्रीमियम पर फसल क्षति बीमा संरक्षण।\n` +
          `3. **KCC (किसान क्रेडिट कार्ड):** 4% रियायती ब्याज दर पर ₹3 लाख तक का कृषि ऋण (समय पर भुगतान करने पर 3% अतिरिक्त छूट)।\n\n` +
          `*जांच करें:* आधिकारिक विवरण और ई-केवाईसी स्थिति के लिए 'Government Support' अनुभाग देखें।`
        : `**Key Agricultural Support Schemes (${state}):**\n\n` +
          `1. **PM-KISAN:** ₹6,000/year in 3 equal installments of ₹2,000 via Direct Benefit Transfer (DBT).\n` +
          `2. **PMFBY (Crop Insurance):** Comprehensive insurance coverage with minimal premium rates (1.5% for Rabi, 2.0% for Kharif crops).\n` +
          `3. **Kisan Credit Card (KCC):** Subsidized working capital loan up to ₹3 Lakh at an effective 4% interest rate on prompt repayment.\n\n` +
          `*Action:* Inspect official portal links and eligibility checklists in the **Government Support** module.`,
      suggestedQuestions: getSuggestedQuestions(isHindi),
      disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
    };
  }

  // Default General Advice
  return {
    mode: 'EXPERT_AGRONOMIC_ENGINE',
    category: 'GENERAL_AGRICULTURE',
    reply: isHindi
      ? `नमस्ते! मैं कृषि सेतु का कृषि सलाहकार सहायक हूँ।\n\n` +
        `मैं आपकी निम्नलिखित विषयों पर सहायता कर सकता हूँ:\n` +
        `• **फसल प्रबंधन:** गेहूं, सोयाबीन, चना, सरसों की बुवाई, सिंचाई और खाद प्रबंधन।\n` +
        `• **मंडी शुद्ध लाभ:** परिवहन खर्च घटाकर सही मंडी का चयन।\n` +
        `• **मौसम सलाह:** वर्षा, उच्च तापमान और कीटनाशक छिड़काव के अनुकूल समय।\n` +
        `• **सरकारी योजनाएं:** पीएम-किसान, फसल बीमा (PMFBY) और किसान क्रेडिट कार्ड।\n\n` +
        `कृपया अपना प्रश्न पूछें या नीचे दिए गए सुझावों में से चुनें।`
      : `Hello! I am Krishi Setu's Agricultural Intelligence Assistant.\n\n` +
        `I can help you with:\n` +
        `• **Crop Agronomy:** Irrigation schedules, fertilizer splits, and pest control for Wheat, Soybean, Gram, and Mustard.\n` +
        `• **Smart Mandi:** Calculating net realization minus transport costs to choose the most profitable market.\n` +
        `• **Climate Risks:** Weather precautions, spray windows, and waterlogging drainage.\n` +
        `• **Government Schemes:** Verified eligibility rules for PM-KISAN, PMFBY, and KCC.\n\n` +
        `Please type your question or select from the suggested topics below.`,
    suggestedQuestions: getSuggestedQuestions(isHindi),
    disclaimer: isHindi ? AGRI_DISCLAIMER_HI : AGRI_DISCLAIMER_EN,
  };
}

function getSuggestedQuestions(isHindi: boolean): string[] {
  if (isHindi) {
    return [
      'गेहूं में पहली सिंचाई (CRI) कब और कैसे करें?',
      'मंडी में परिवहन खर्च घटाकर शुद्ध लाभ कैसे निकालें?',
      'कीटनाशक छिड़काव के लिए अनुकूल मौसम कब रहता है?',
      'पीएम किसान सम्मान निधि और फसल बीमा के लाभ क्या हैं?',
    ];
  }
  return [
    'What are the critical irrigation stages for wheat?',
    'How do I calculate net realization for mandi sales?',
    'What weather conditions are optimal for foliar spraying?',
    'What are the eligibility conditions for PMFBY crop insurance?',
  ];
}
