'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Home, CheckCircle2, MessageSquareText } from 'lucide-react';

interface BatchSummaryModalProps {
  stats: {
    totalTested: number;
    mistakes: number;
    masteredWords?: number;
  };
  day: number;
  batch: number;
  isSentencesMode?: boolean;
  onStartSentences?: () => void;
  onNextBatch: () => void;
  onRepeatBatch: () => void;
  onHome: () => void;
}

export const BatchSummaryModal: React.FC<BatchSummaryModalProps> = ({
  stats,
  day,
  batch,
  isSentencesMode = false,
  onStartSentences,
  onNextBatch,
  onRepeatBatch,
  onHome,
}) => {
  useEffect(() => {
    // Discrete celebration confetti
    const count = 120;
    confetti({
      origin: { y: 0.65 },
      particleCount: count,
      spread: 70,
      colors: ['#38bdf8', '#34d399', '#818cf8'],
      disableForReducedMotion: true,
    });
  }, []);

  const accuracy = stats.totalTested > 0 
    ? Math.max(0, Math.round(((stats.totalTested - stats.mistakes) / stats.totalTested) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="studio-surface w-full max-w-sm rounded-2xl p-6 sm:p-7 text-center border border-white/[0.12] shadow-2xl">
        {/* Subtle trophy icon */}
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400">
          <Trophy className="w-6 h-6" />
        </div>

        <span className="inline-block text-xs font-medium text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 mb-2">
          {isSentencesMode ? 'Предложения освоены' : 'Слова выучены'}
        </span>

        <h3 className="text-xl font-bold text-white tracking-tight">
          День {day} • Блок {batch}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isSentencesMode 
            ? 'Все слова блока закреплены в контексте живой речи.' 
            : 'Слова освоены. Теперь закрепите их в реальных фразах.'}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 my-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">
              {isSentencesMode ? 'Фраз' : 'Слов'}
            </span>
            <p className="text-base font-semibold text-white mt-0.5">{stats.masteredWords || stats.totalTested}</p>
          </div>
          <div className="border-x border-white/[0.08]">
            <span className="text-[10px] text-slate-400 font-medium">Ошибок</span>
            <p className="text-base font-semibold text-rose-400 mt-0.5">{stats.mistakes}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Точность</span>
            <p className="text-base font-semibold text-emerald-400 mt-0.5">{accuracy}%</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          {!isSentencesMode && onStartSentences ? (
            <>
              <button
                onClick={onStartSentences}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Закрепить в предложениях</span>
              </button>

              <button
                onClick={onNextBatch}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium border border-white/[0.08] transition-colors"
              >
                Пропустить к следующему блоку
              </button>
            </>
          ) : (
            <button
              onClick={onNextBatch}
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Следующий блок слов</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onRepeatBatch}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Повторить</span>
            </button>

            <button
              onClick={onHome}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>В меню</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
