import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_language');
      if (saved === 'hi' || saved === 'en') return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('krishi_language', language);
      document.documentElement.setAttribute('lang', language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  function setLanguage(lang) {
    if (lang === 'hi' || lang === 'en') {
      setLanguageState(lang);
    }
  }

  function toggleLanguage() {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  }

  /**
   * Helper function to translate a key
   */
  function t(key, fallback = '') {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  }

  const value = {
    language,
    isHindi: language === 'hi',
    setLanguage,
    toggleLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
