'use client';

import React from 'react';
import { Flame, Settings, BookOpen, Globe } from 'lucide-react';
import { LanguagePref, UserSettings, UserStats } from '@/types/vocab';

interface HeaderProps {
  stats: UserStats;
  settings: UserSettings;
  syncId: string;
  isCloudSynced: boolean;
  onOpenSettings: () => void;
  onOpenDictionary: () => void;
  onChangeLanguage: (lang: LanguagePref) => void;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  settings,
  syncId,
  isCloudSynced,
  onOpenSettings,
  onOpenDictionary,
  onChangeLanguage,
  onHomeClick,
}) => {
  const getLanguageLabel = (lang: LanguagePref) => {
    switch (lang) {
      case 'ru': return 'Русский';
      case 'tj': return 'Тоҷикӣ';
      case 'both': return 'RU + TJ';
    }
  };

  const cycleLanguage = () => {
    const next: Record<LanguagePref, LanguagePref> = {
      ru: 'tj',
      tj: 'both',
      both: 'ru',
    };
    onChangeLanguage(next[settings.language]);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1117]/90 backdrop-blur-md border-b border-white/[0.08] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 text-left group transition-opacity active:opacity-75"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm tracking-tight">
            5K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                Vocab Studio
              </span>
              <span className="text-[11px] font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                30 дней
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Спринт 5000 слов</p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          <div 
            title={`Ударный режим: ${stats.streakDays} дн.`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-amber-300 text-xs font-medium"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{stats.streakDays} дн.</span>
          </div>

          {/* Quick Language Toggle */}
          <button
            onClick={cycleLanguage}
            title="Сменить язык перевода (Русский / Тоҷикӣ / Оба)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{getLanguageLabel(settings.language)}</span>
          </button>

          {/* Dictionary Button */}
          <button
            onClick={onOpenDictionary}
            title="Словарь и поиск слов"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title={`Настройки и синхронизация (ID: ${syncId})`}
            className="relative p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                isCloudSynced ? 'bg-emerald-400' : 'bg-sky-400 animate-pulse'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
