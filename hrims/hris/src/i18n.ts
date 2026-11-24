import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

async function loadTranslations() {
  const [en, ar] = await Promise.all([
    fetch('/src/locales/en.json').then(res => res.json()),
    fetch('/src/locales/ar.json').then(res => res.json()),
  ]);
  return { en, ar };
}

loadTranslations().then(({ en, ar }) => {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      lng: 'ar',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
});

export default i18n;
