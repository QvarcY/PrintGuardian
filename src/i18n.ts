import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { lv } from './locales/lv';

const savedLanguage = localStorage.getItem('printguardian-language');
const initialLanguage = savedLanguage === 'lv' || savedLanguage === 'en' ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    lv: { translation: lv }
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
