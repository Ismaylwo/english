'use client';

import React from 'react';
import { Flame, Settings, BookOpen, Cloud, Volume2, Globe } from 'lucide-react';
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
      case 'ru': return '🇷🇺 RU';
      case 'tj': return '🇹🇯 TJ';
      case 'both': return '🌐 RU+TJ';
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <span className="text-white font-black text-sm tracking-tighter">5K</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                VOCAB
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                HARDCORE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">30 дней • 5000 слов</p>
          </div>
        </button>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          <div 
            title={`Ударный режим: ${stats.streakDays} дн.`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
            <span>{stats.streakDays}</span>
          </div>

          {/* Quick Language Toggle */}
          <button
            onClick={cycleLanguage}
            title="Сменить язык перевода (Русский / Тоҷикӣ / Оба)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{getLanguageLabel(settings.language)}</span>
          </button>

          {/* Dictionary Button */}
          <button
            onClick={onOpenDictionary}
            title="Словарь и поиск слов"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Settings Button with Cloud Indicator */}
          <button
            onClick={onOpenSettings}
            title={`Настройки и серверная синхронизация (ID: ${syncId})`}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-colors active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-slate-900 ${
                isCloudSynced ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
