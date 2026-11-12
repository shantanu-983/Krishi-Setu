import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function AIAssistant() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const idCounterRef = useRef(100);

  const [messages, setMessages] = useState(() => {
    return [
      {
        id: 'initial',
        sender: 'ai',
        text:
          language === 'hi'
            ? 'नमस्ते किसान साथी! मैं कृषि सेतु का एग्रोनॉमिक AI सहायक हूँ। आप मुझसे फसल प्रबंधन, सिंचाई समय, उर्वरक मात्रा, मंडी भाव या कीट नियंत्रण के बारे में कोई भी प्रश्न पूछ सकते हैं।'
            : 'Welcome! I am Krishi Setu Agronomic AI Assistant. Ask me anything about crop cycles, irrigation stages, fertilizer doses, mandi net realization, or pest management.',
        mode: 'EXPERT_AGRONOMIC_ENGINE',
        sources: ['ICAR Package of Practices', 'Agmarknet APMC Guidelines'],
        timestamp: 'Just now',
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    {
      hi: 'गेहूं में पहली सिंचाई (CRI) कब करें?',
      en: 'When to do first CRI irrigation in wheat?',
    },
    {
      hi: 'चना में इल्ली (Pod Borer) का नियंत्रण कैसे करें?',
      en: 'How to control pod borer in gram/chana?',
    },
    {
      hi: 'मंडी में शुद्ध प्राप्ति (Net Realization) कैसे निकालें?',
      en: 'How to calculate Mandi Net Realization with transport?',
    },
    {
      hi: 'सरसों में माहू (Aphids) कीट नियंत्रण के उपाय',
      en: 'How to control mustard aphids?',
    },
    {
      hi: 'PM-KISAN eKYC और लैंड सीडिंग कैसे चेक करें?',
      en: 'How to verify PM-KISAN eKYC and land seeding status?',
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(textToSend) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    idCounterRef.current += 1;
    const userMsg = {
      id: 'usr-' + idCounterRef.current,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        cropName: user?.primaryCrops?.[0] || 'Wheat',
        soilType: user?.soilType || 'Black Cotton',
        district: user?.district || 'Indore',
        state: user?.state || 'Madhya Pradesh',
        preferredLanguage: language,
      };

      const res = await api.sendAiChat({ message: query, context });

      idCounterRef.current += 1;
      if (res.ok && res.data) {
        const aiMsg = {
          id: 'ai-' + idCounterRef.current,
          sender: 'ai',
          text: res.data.response,
          mode: res.data.mode || 'EXPERT_AGRONOMIC_ENGINE',
          sources: res.data.sources || ['ICAR Agronomic Guidelines'],
          disclaimer: res.data.disclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const fallbackMsg = {
          id: 'err-' + idCounterRef.current,
          sender: 'ai',
          text:
            language === 'hi'
              ? 'क्षमा करें, AI सेवा से संपर्क नहीं हो पाया। कृपया अपना प्रश्न दोबारा पूछें अथवा इंटरनेट कनेक्शन की जांच करें।'
              : 'Could not reach AI agronomic service. Please try asking your question again.',
          mode: 'ERROR',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      idCounterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + idCounterRef.current,
          sender: 'ai',
          text: 'Network error communicating with agronomic server.',
          mode: 'ERROR',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: 'initial-cleared',
        sender: 'ai',
        text:
          language === 'hi'
            ? 'चैट रीसेट कर दी गई है। आप नया कृषि सम्बन्धी प्रश्न पूछ सकते हैं।'
            : 'Conversation cleared. What farming question can I assist you with today?',
        mode: 'EXPERT_AGRONOMIC_ENGINE',
        timestamp: 'Just now',
      },
    ]);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Farm Top Notice Banner */}
      <div className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase">
        <span className="text-[#d97736]">●</span>
        <span>SAMPLE FARM • Weather, prices and advice are illustrative</span>
      </div>

      {/* Category Tag */}
      <div className="text-[10px] font-bold tracking-widest text-[#d97736] uppercase">
        AI AGRONOMIC ASSISTANT
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-slate-900 dark:text-white leading-tight">
            Expert agricultural intelligence at your fingertips.
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            {t('aiAssistantSub')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto shrink-0 transition"
        >
          <i className="ri-refresh-line text-slate-400"></i>
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Shell */}
      <div className="rounded-3xl bg-white dark:bg-[#111927] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    isAi
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  }`}
                >
                  {isAi ? '🌱' : user?.name ? user.name[0].toUpperCase() : '👨‍🌾'}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                    isAi
                      ? 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 shadow-xs'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-600/10'
                  }`}
                >
                  {/* AI Metadata Tags */}
                  {isAi && msg.mode && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {msg.mode === 'GEMINI_LIVE' ? 'Gemini 2.5 Flash' : 'ICAR Agronomic Engine'}
                      </span>
                      {Array.isArray(msg.sources) &&
                        msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="text-[9px] text-slate-500 dark:text-slate-400 font-mono"
                          >
                            • {src}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Body text with paragraph breaks */}
                  <div className="whitespace-pre-line space-y-2">
                    {msg.text}
                  </div>

                  {/* Timestamp & Disclaimer */}
                  {isAi && (
                    <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 gap-1">
                      <span>Advisory only • Confirm with local KVK</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking spinner */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                🌱
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-3xl p-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-700 animate-bounce [animation-delay:0.4s]"></span>
                <span className="font-medium ml-1">
                  {language === 'hi' ? 'सलाह तैयार की जा रही है...' : 'Evaluating agronomic rules...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips Bar */}
        <div className="p-3 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-2 shrink-0">
            {t('suggestedQuestions') || 'Quick Inquiries:'}
          </span>
          {quickPrompts.map((q, idx) => {
            const promptText = language === 'hi' ? q.hi : q.en;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(promptText)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition shrink-0"
              >
                {promptText}
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-[#111927] border-t border-slate-200/80 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'फसल, कीट, सिंचाई या मंडी के बारे में प्रश्न पूछें...'
                  : 'Ask a question about crop stages, pests, fertilizer doses or mandi realization...'
              }
              className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition disabled:opacity-40 flex items-center gap-2 shrink-0"
            >
              <span>{t('aiAskBtn') || 'Send'}</span>
              <i className="ri-send-plane-fill text-sm"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
