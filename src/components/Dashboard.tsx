'use client';

import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Target, 
  Award, 
  ChevronRight, 
  Layers,
  Sparkles,
  BookOpen,
  MessageSquareText
} from 'lucide-react';
import { DaySummary, WordItem, WordProgress, UserStats } from '@/types/vocab';

interface DashboardProps {
  daysSummary: DaySummary[];
  allWords: WordItem[];
  progressMap: Record<number, WordProgress>;
  stats: UserStats;
  onStartSession: (day: number, batch: number) => void;
  onStartSentencesSession: (day: number, batch: number) => void;
  onStartMistakesReview: () => void;
  onOpenDictionary: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  daysSummary,
  allWords,
  progressMap,
  stats,
  onStartSession,
  onStartSentencesSession,
  onStartMistakesReview,
  onOpenDictionary,
}) => {
  const [selectedDayModal, setSelectedDayModal] = useState<DaySummary | null>(null);

  // Calculate overall stats
  const totalWords = allWords.length || 4991;
  const masteredCount = Object.values(progressMap).filter(p => p.isMastered).length;
  const totalTested = Object.keys(progressMap).length;
  const overallPercentage = Math.round((masteredCount / totalWords) * 100);

  // Find mistakes count (words with mistakes that aren't mastered yet)
  const mistakesWords = allWords.filter(w => {
    const p = progressMap[w.id];
    return p && p.mistakesCount > 0 && !p.isMastered;
  });

  // Find the current active day / batch (first day where not all words are mastered)
  let activeDay = 1;
  let activeBatch = 1;

  for (const d of daysSummary) {
    const dayWords = allWords.filter(w => w.day === d.day);
    const dayMastered = dayWords.filter(w => progressMap[w.id]?.isMastered).length;
    if (dayMastered < dayWords.length) {
      activeDay = d.day;
      for (const b of d.batches) {
        const bWords = dayWords.filter(w => w.batch === b.batch);
        const bMastered = bWords.filter(w => progressMap[w.id]?.isMastered).length;
        if (bMastered < bWords.length) {
          activeBatch = b.batch;
          break;
        }
      }
      break;
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Hero Stats Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800 glow-cyan relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Main Progress Ring & Text */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallPercentage / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-cyan-400 transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-black text-white">{overallPercentage}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">План</span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Цель: 1 месяц</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {masteredCount} <span className="text-slate-400 font-normal text-lg">/ {totalWords} слов</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Осталось выучить: <strong className="text-white">{totalWords - masteredCount}</strong> слов
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch gap-3">
            {mistakesWords.length > 0 && (
              <button
                onClick={onStartMistakesReview}
                className="py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Ошибки ({mistakesWords.length})</span>
              </button>
            )}

            <button
              onClick={() => onStartSession(activeDay, activeBatch)}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>День {activeDay} • Блок {activeBatch}</span>
            </button>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="text-center">
            <span className="text-slate-400 text-xs flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Серия
            </span>
            <p className="text-lg font-bold text-white mt-0.5">{stats.streakDays} дн.</p>
          </div>
          <div className="text-center border-x border-slate-800">
            <span className="text-slate-400 text-xs flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" /> Сегодня
            </span>
            <p className="text-lg font-bold text-cyan-400 mt-0.5">+{stats.todayMasteredCount} слов</p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 text-xs flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> Точность
            </span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {totalTested > 0 ? `${Math.round((masteredCount / totalTested) * 100)}%` : '100%'}
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Grid Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Программа на 30 дней</h2>
          <p className="text-xs text-slate-400">Слова + закрепление в предложениях</p>
        </div>
        <button
          onClick={onOpenDictionary}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Все слова</span>
        </button>
      </div>

      {/* 30 Days Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {daysSummary.map((d) => {
          const dayWords = allWords.filter(w => w.day === d.day);
          const masteredInDay = dayWords.filter(w => progressMap[w.id]?.isMastered).length;
          const dayPct = Math.round((masteredInDay / dayWords.length) * 100);
          const isCompleted = dayPct === 100;
          const isCurrent = d.day === activeDay;

          return (
            <div
              key={d.day}
              onClick={() => setSelectedDayModal(d)}
              className={`glass-card rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-98 border relative group ${
                isCompleted
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : isCurrent
                  ? 'border-cyan-500/50 bg-cyan-950/10 glow-cyan'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    ДЕНЬ {String(d.day).padStart(2, '0')}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {masteredInDay}/{d.totalWords}
                </span>
              </div>

              {/* Sample word range */}
              <div className="text-xs text-slate-300 font-medium truncate mb-3">
                <span className="text-white font-semibold">{d.firstWord}</span>
                <span className="text-slate-500 mx-1.5">→</span>
                <span className="text-slate-400">{d.lastWord}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'bg-emerald-400'
                      : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                  }`}
                  style={{ width: `${dayPct}%` }}
                />
              </div>

              {/* Micro batch indicators */}
              <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-500">
                  <Layers className="w-3 h-3" /> {d.batches.length} блоков
                </span>
                <span className="group-hover:text-cyan-400 flex items-center gap-0.5 font-semibold text-slate-400">
                  Выбрать <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Batch Selection Modal */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedDayModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/80"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                ДЕНЬ {selectedDayModal.day} ИЗ 30
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Выберите блок для изучения
              </h3>
              <p className="text-xs text-slate-400">
                {selectedDayModal.totalWords} слов ({selectedDayModal.firstWord} ... {selectedDayModal.lastWord})
              </p>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayModal.batches.map((b) => {
                const dayWords = allWords.filter(w => w.day === selectedDayModal.day);
                const bWords = dayWords.filter(w => w.batch === b.batch);
                const bMastered = bWords.filter(w => progressMap[w.id]?.isMastered).length;
                const bDone = bMastered === bWords.length;

                return (
                  <div
                    key={b.batch}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      bDone
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-900/80 border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">Блок {b.batch}</span>
                        <span className="text-xs text-slate-400">({b.count} слов)</span>
                        {bDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {bMastered}/{b.count}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 truncate">
                      {b.sample.join(', ')}...
                    </p>

                    {/* Dual Action: Words OR Sentences */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const d = selectedDayModal.day;
                          const batchNum = b.batch;
                          setSelectedDayModal(null);
                          onStartSession(d, batchNum);
                        }}
                        className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>1. Слова</span>
                      </button>

                      <button
                        onClick={() => {
                          const d = selectedDayModal.day;
                          const batchNum = b.batch;
                          setSelectedDayModal(null);
                          onStartSentencesSession(d, batchNum);
                        }}
                        className="py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquareText className="w-3 h-3" />
                        <span>2. Предложения</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
