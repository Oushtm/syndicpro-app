import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            fr: { translation: fr },
            ar: { translation: ar }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

// Handle RTL
const updateDirection = (lng) => {
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
};

i18n.on('languageChanged', updateDirection);

// Set initial direction
updateDirection(i18n.language);

export default i18n;
