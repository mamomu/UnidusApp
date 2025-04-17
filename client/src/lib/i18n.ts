import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "../locales/en/translation.json";
import ptBRTranslation from "../locales/pt-BR/translation.json";

// the translations
const resources = {
  en: {
    translation: enTranslation,
  },
  "pt-BR": {
    translation: ptBRTranslation,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: "en", // Fallback language
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ["localStorage", "querystring", "navigator"], // Language detection order
      caches: ["localStorage"], // Cache user language in localStorage
    },
    react: {
      useSuspense: false, // Disable suspense for server-side rendering
    },
  });

export default i18n;
