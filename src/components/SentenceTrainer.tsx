'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  CheckCircle2, 
  MessageSquareText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { WordItem, UserSettings } from '@/types/vocab';
import { soundFx } from '@/lib/soundFx';
import { speechService } from '@/lib/speech';

interface SentenceTrainerProps {
  day: number;
  batch: number;
  categoryTitle?: string;
  words: WordItem[];
  settings: UserSettings;
  onBackToDashboard: () => void;
  onFinishSentences: (stats: { totalTested: number; mistakes: number }) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  if (array.length <= 1) return [...array];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.length > 2 && arr[0] === array[0]) {
    const swapIdx = 1 + Math.floor(Math.random() * (arr.length - 1));
    [arr[0], arr[swapIdx]] = [arr[swapIdx], arr[0]];
  }
  return arr;
}

export const SentenceTrainer: React.FC<SentenceTrainerProps> = ({
  day,
  batch,
  categoryTitle,
  words,
  settings,
  onBackToDashboard,
  onFinishSentences,
}) => {
  const wordsWithExamples = words.filter(w => w.example && w.example.en);

  const [activeList, setActiveList] = useState<WordItem[]>(() => shuffleArray(wordsWithExamples));
  const [currentIndex, setCurrentIndex] = useState(0);

  // Re-shuffle when words array changes
  useEffect(() => {
    const list = words.filter(w => w.example && w.example.en);
    setActiveList(shuffleArray(list));
    setCurrentIndex(0);
  }, [words]);

  const currentWord = activeList[currentIndex] || null;
  const example = currentWord?.example || null;

  // Auto-pronounce sentence on card change
  useEffect(() => {
    if (example?.en && settings.autoPronounce) {
      speechService.speak(example.en, settings.voiceSpeed);
    }
  }, [currentIndex, example?.en, settings.autoPronounce, settings.voiceSpeed]);

  // Keyboard navigation: Enter / Space / ArrowRight = Next, ArrowLeft = Prev, R/P = Replay Audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        speakFullSentence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeList.length, example]);

  const speakFullSentence = () => {
    if (example?.en) {
      speechService.speak(example.en, settings.voiceSpeed);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeList.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Completed all example sentences!
      soundFx.playSuccess();
      onFinishSentences({
        totalTested: activeList.length,
        mistakes: 0,
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!currentWord || !example) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Предложения освоены</h2>
        <p className="text-slate-400 mb-6 text-sm">Все примеры предложений этого блока успешно изучены.</p>
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors"
        >
          Вернуться в меню
        </button>
      </div>
    );
  }

  const totalInActive = activeList.length;
  const currentStep = currentIndex + 1;
  const progressPercent = Math.round((currentStep / totalInActive) * 100);
  const isLastSentence = currentStep === totalInActive;

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto px-3 sm:px-4 py-2 flex flex-col justify-center flex-1 my-auto">
      <div>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>В меню</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>{categoryTitle ? `${categoryTitle} • Шаг 3` : `Шаг 3 • Фразы ${batch}`}</span>
            </div>
          </div>
        </div>

        {/* 3-Step Visual Breadcrumbs */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1.5 text-[10px] sm:text-[11px] font-medium">
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Изучено</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Набрано</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-semibold shadow-sm">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold">3</span>
            <span>Примеры фраз</span>
          </div>
        </div>

        {/* Clear Progress Bar */}
        <div className="mb-2 sm:mb-2.5">
          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
            <span>
              Пример: <strong className="text-white font-medium">{currentStep}</strong> из {totalInActive}
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-indigo-400"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Sentence Showcase Card */}
        <div className="studio-surface rounded-2xl p-4 sm:p-5 relative border border-white/[0.1] shadow-xl">
          {/* Top word meta chip */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                {currentWord.en}
              </span>
              {currentWord.level && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {currentWord.level}
                </span>
              )}
              <span className="text-xs text-slate-400 truncate max-w-[150px]">
                {currentWord.ru}
              </span>
            </div>

            <button
              onClick={speakFullSentence}
              title="Прослушать фразу (R)"
              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/25 transition-colors flex items-center gap-1 text-xs"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Озвучить</span>
            </button>
          </div>

          {/* Focal Sentence Display with Highlighted Word */}
          <div className="text-center py-2 sm:py-4">
            {(() => {
              if (example.prefix !== undefined && example.suffix !== undefined && (example.prefix || example.suffix)) {
                return (
                  <div className="text-base sm:text-lg md:text-xl font-medium text-slate-100 leading-relaxed tracking-wide">
                    <span>{example.prefix}</span>
                    <span className="inline-block px-2 py-0.5 mx-1 font-bold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm">
                      {example.target || currentWord.cleanEn}
                    </span>
                    <span>{example.suffix}</span>
                  </div>
                );
              }

              // Dynamic highlight fallback inside example.en
              const en = example.en || '';
              const wordToFind = currentWord.cleanEn || '';
              const escaped = wordToFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b(${escaped}[a-z]*)\\b`, 'i');
              const match = en.match(regex);

              if (match && match.index !== undefined) {
                const before = en.slice(0, match.index);
                const matched = match[0];
                const after = en.slice(match.index + matched.length);
                return (
                  <div className="text-base sm:text-lg md:text-xl font-medium text-slate-100 leading-relaxed tracking-wide">
                    <span>{before}</span>
                    <span className="inline-block px-2 py-0.5 mx-1 font-bold rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm">
                      {matched}
                    </span>
                    <span>{after}</span>
                  </div>
                );
              }

              return (
                <div className="text-base sm:text-lg md:text-xl font-medium text-slate-100 leading-relaxed tracking-wide">
                  {en}
                </div>
              );
            })()}

            {/* Context Translations */}
            <div className="space-y-1.5 mt-4 pt-3 border-t border-white/[0.06]">
              {(settings.language === 'ru' || settings.language === 'both') && (
                <p className="text-xs sm:text-sm font-medium text-slate-200">
                  {example.ru}
                </p>
              )}
              {(settings.language === 'tj' || settings.language === 'both') && example.tj && (
                <p className="text-[11px] sm:text-xs text-sky-300/80">
                  {example.tj}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors"
                title="Предыдущее предложение"
              >
                ← Назад
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isLastSentence
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
              }`}
            >
              {isLastSentence ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Завершить блок ({currentStep}/{totalInActive})</span>
                </>
              ) : (
                <>
                  <span>Следующее предложение</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
