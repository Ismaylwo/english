'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Home, Sparkles, MessageSquareText } from 'lucide-react';

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
    // Fire celebratory confetti!
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#06b6d4', '#6366f1', '#10b981'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#f59e0b', '#ec4899', '#3b82f6'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ['#a855f7', '#06b6d4'],
    });
  }, []);

  const accuracy = stats.totalTested > 0 
    ? Math.max(0, Math.round(((stats.totalTested - stats.mistakes) / stats.totalTested) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 sm:p-8 text-center border border-cyan-500/40 glow-cyan relative shadow-2xl">
        {/* Trophy icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/30">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {isSentencesMode ? 'Предложения освоены!' : 'Слова блока выучены!'}
          </span>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight">
          День {day} • Блок {batch}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isSentencesMode 
            ? 'Вы успешно закрепили все слова блока в контексте живой речи.' 
            : 'Отличный результат! Теперь пора закрепить эти слова в реальных фразах.'}
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-3 gap-2 my-6 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {isSentencesMode ? 'Фраз' : 'Слов'}
            </span>
            <p className="text-lg font-black text-cyan-400 mt-0.5">{stats.masteredWords || stats.totalTested}</p>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Ошибок</span>
            <p className="text-lg font-black text-rose-400 mt-0.5">{stats.mistakes}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Точность</span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">{accuracy}%</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          {!isSentencesMode && onStartSentences ? (
            <>
              {/* Primary: Go to Sentences! */}
              <button
                onClick={onStartSentences}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400 hover:opacity-95 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageSquareText className="w-4 h-4 text-slate-950" />
                <span>Закрепить в предложениях ▶</span>
              </button>

              <button
                onClick={onNextBatch}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              >
                Пропустить к следующему блоку
              </button>
            </>
          ) : (
            <button
              onClick={onNextBatch}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Следующий блок слов</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onRepeatBatch}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Повторить</span>
            </button>

            <button
              onClick={onHome}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
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
