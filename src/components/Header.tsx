import React, { useState, useRef, useEffect } from 'react';
import { Network, Sun, Moon, Plus, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../context/ThemeContext';
import type { Language } from '../i18n/config';

interface HeaderProps {
  onOpenCreateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateModal }) => {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLang = (lang: Language) => {
    setLanguage(lang);
    setIsLangMenuOpen(false);
  };

  return (
    <header className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: App Title - "IP Switch" */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center rounded-[6px] shadow-xs shrink-0">
          <Network size={20} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('appTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('appSubtitle')}
          </p>
        </div>
      </div>

      {/* Right: [New Config] [Language Menu] [Theme Toggle] */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
        {/* New Config Button - Located to the LEFT of Language and Theme buttons */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 h-9 text-xs font-semibold rounded-[6px] transition-all cursor-pointer shadow-xs active:translate-y-px"
          onClick={onOpenCreateModal}
          id="btn-add-config"
        >
          <Plus size={15} />
          <span>{t('addConfig')}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="w-9 h-9 inline-flex items-center justify-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-[6px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('themeLight') : t('themeDark')}
          id="btn-theme-toggle"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Language Selector: Placed to the right of Theme button */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            className="flex items-center gap-1.5 h-9 px-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-[6px] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            onClick={() => setIsLangMenuOpen((prev) => !prev)}
            id="btn-language-toggle"
            aria-label="Language selection"
          >
            <span>{language.toUpperCase()}</span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-150 ${
                isLangMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Popup Menu showing full language names */}
          {isLangMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] shadow-xl py-1 z-50 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => handleSelectLang('vi')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  language === 'vi'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                id="btn-lang-vi"
              >
                <span>Tiếng Việt</span>
                {language === 'vi' && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLang('en')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                id="btn-lang-en"
              >
                <span>English</span>
                {language === 'en' && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
