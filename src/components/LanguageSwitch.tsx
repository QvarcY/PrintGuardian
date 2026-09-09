import { useTranslation } from 'react-i18next';

export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const change = (language: 'lv' | 'en') => {
    localStorage.setItem('printguardian-language', language);
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  };

  return (
    <div className="language-switch" aria-label={t('app.language')}>
      <button className={i18n.language === 'lv' ? 'active' : ''} onClick={() => change('lv')} aria-label="Latviešu">LV</button>
      <span />
      <button className={i18n.language === 'en' ? 'active' : ''} onClick={() => change('en')} aria-label="English">EN</button>
    </div>
  );
}
