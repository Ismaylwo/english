'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  BookOpen
} from 'lucide-react';
import { WordItem, UserSettings } from '@/types/vocab';
import { speechService } from '@/lib/speech';

interface StudyCardsProps {
  words: WordItem[];
  categoryTitle?: string;
  batch: number;
  isRetryMode?: boolean;
  settings: UserSettings;
  onFinishStudy: (wordsToTest: WordItem[]) => void;
  onBackToDashboard: () => void;
}

export const StudyCards: React.FC<StudyCardsProps> = ({
  words,
  categoryTitle,
  batch,
  isRetryMode = false,
  settings,
  onFinishStudy,
  onBackToDashboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentWord = words[currentIndex] || null;

  // Reset index when words array changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [words]);

  // Auto-pronounce word when card changes
  useEffect(() => {
    if (currentWord && settings.autoPronounce) {
      speechService.speak(currentWord.en, settings.voiceSpeed);
    }
  }, [currentIndex, currentWord, settings.autoPronounce, settings.voiceSpeed]);

  // Keyboard navigation: Enter / Space / ArrowRight = Next, ArrowLeft = Prev
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, words.length]);

  const speakCurrentWord = () => {
    if (currentWord) {
      speechService.speak(currentWord.en, settings.voiceSpeed);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished reviewing all cards -> proceed to Step 2 (Typing)
      onFinishStudy(words);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentWord) return null;

  const progressPercent = Math.round(((currentIndex + 1) / words.length) * 100);

  const renderLevelBadge = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'A1':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">A1 Начальный</span>;
      case 'A2':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">A2 Базовый</span>;
      case 'B1':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">B1 Средний</span>;
      case 'B2':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">B2 Продвинутый</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-3 flex flex-col justify-between min-h-[calc(100vh-70px)] sm:min-h-0 sm:py-6">
      <div>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>В меню</span>
          </button>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
              isRetryMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
            }`}>
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isRetryMode ? `Повтор ошибок (${words.length})` : 'Шаг 1 • Изучение'}</span>
            </div>
            <div className="text-xs font-medium text-slate-400 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              {categoryTitle ? `${categoryTitle} • Блок ${batch}` : `Блок ${batch}`}
            </div>
          </div>
        </div>

        {/* 3-Step Visual Breadcrumbs */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2.5 text-[11px] font-medium">
          <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition-all ${
            isRetryMode
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold shadow-sm'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold shadow-sm'
          }`}>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>{isRetryMode ? 'Повтор' : 'Изучение'}</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-slate-500">
            <span className="w-3.5 h-3.5 rounded-full bg-white/[0.05] text-slate-500 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Набор</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-slate-500">
            <span className="w-3.5 h-3.5 rounded-full bg-white/[0.05] text-slate-500 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Предложения</span>
          </div>
        </div>

        {/* Step-by-Step Progress Bar */}
        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>
              Карточка: <strong className="text-white font-medium">{currentIndex + 1}</strong> из {words.length}
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isRetryMode ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Compact & Focal Study Card */}
        <div className="studio-surface rounded-2xl p-5 sm:p-7 border border-white/[0.1] shadow-2xl relative">
          {/* Card Top Meta */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {renderLevelBadge(currentWord.level)}
              <span className="text-[11px] font-mono text-slate-500">
                {currentWord.cleanEn.length} букв
              </span>
            </div>

            <button
              onClick={speakCurrentWord}
              title="Прослушать произношение"
              className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-white transition-colors border border-sky-500/20"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Focal English Word */}
          <div className="text-center py-4 border-b border-white/[0.06]">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
              {currentWord.en}
            </h2>
            {currentWord.note && (
              <p className="text-xs text-slate-400 italic mb-1.5">
                ({currentWord.note})
              </p>
            )}
            <button
              onClick={speakCurrentWord}
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Прослушать произношение</span>
            </button>
          </div>

          {/* Translations (RU & TJ) */}
          <div className="py-4 space-y-2.5 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-0.5">
                Русский перевод
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {currentWord.ru}
              </p>
            </div>

            {currentWord.tj && (
              <div className="pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] uppercase font-bold text-sky-500/70 tracking-wider block mb-0.5">
                  Тарҷума ба тоҷикӣ
                </span>
                <p className="text-lg sm:text-xl font-medium text-sky-300">
                  {currentWord.tj}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-3">
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.08] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        )}

        <button
          onClick={handleNext}
          className={`flex-1 py-3.5 px-5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            currentIndex + 1 === words.length
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/25'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
          }`}
        >
          {currentIndex + 1 === words.length ? (
            <>
              <span>{isRetryMode ? 'Перейти к набору ошибок (Шаг 2)' : 'Перейти к проверке набором (Шаг 2)'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Понятно, дальше</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
