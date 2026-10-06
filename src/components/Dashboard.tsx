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

  const totalWords = allWords.length || 4991;
  const masteredCount = Object.values(progressMap).filter(p => p.isMastered).length;
  const totalTested = Object.keys(progressMap).length;
  const overallPercentage = Math.round((masteredCount / totalWords) * 100);

  const mistakesWords = allWords.filter(w => {
    const p = progressMap[w.id];
    return p && p.mistakesCount > 0 && !p.isMastered;
  });

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
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Hero Overview Panel */}
      <div className="studio-surface rounded-2xl p-6 sm:p-8 mb-8 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Main Progress Metric */}
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  className="text-white/[0.08]"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallPercentage / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-sky-400 transition-all duration-700"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">{overallPercentage}%</span>
                <span className="text-[10px] text-slate-400 font-medium">пройдено</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-sky-400 mb-1 block">
                Спринт на 1 месяц • 5000 слов
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {masteredCount} <span className="text-slate-400 font-normal text-lg">из {totalWords} слов</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Осталось освоить: <span className="text-slate-200 font-medium">{totalWords - masteredCount} слов</span>
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch gap-2.5">
            {mistakesWords.length > 0 && (
              <button
                onClick={onStartMistakesReview}
                className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-300 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Ошибки ({mistakesWords.length})</span>
              </button>
            )}

            <button
              onClick={() => onStartSession(activeDay, activeBatch)}
              className="py-3 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>День {activeDay} • Блок {activeBatch}</span>
            </button>
          </div>
        </div>

        {/* Quiet status metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
          <div>
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Серия
            </span>
            <p className="text-base font-semibold text-white mt-1">{stats.streakDays} дн. подряд</p>
          </div>
          <div className="border-x border-white/[0.08] px-3">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-400" /> Сегодня
            </span>
            <p className="text-base font-semibold text-sky-400 mt-1">+{stats.todayMasteredCount} слов</p>
          </div>
          <div className="pl-3">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> Точность
            </span>
            <p className="text-base font-semibold text-emerald-400 mt-1">
              {totalTested > 0 ? `${Math.round((masteredCount / totalTested) * 100)}%` : '100%'}
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Grid Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Программа на 30 дней</h2>
          <p className="text-xs text-slate-400">166 слов в день • слова и закрепление в предложениях</p>
        </div>
        <button
          onClick={onOpenDictionary}
          className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Все слова</span>
        </button>
      </div>

      {/* Grid of Days */}
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
              className={`studio-surface rounded-xl p-4 cursor-pointer transition-colors border group ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : isCurrent
                  ? 'border-sky-500/40 bg-sky-950/10'
                  : 'border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    isCompleted
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : isCurrent
                      ? 'bg-sky-500/15 text-sky-300'
                      : 'bg-white/[0.06] text-slate-300'
                  }`}>
                    День {d.day}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {masteredInDay}/{d.totalWords}
                </span>
              </div>

              {/* Sample word range */}
              <div className="text-xs text-slate-300 truncate mb-3">
                <span className="text-white font-medium">{d.firstWord}</span>
                <span className="text-slate-500 mx-1.5">→</span>
                <span className="text-slate-400">{d.lastWord}</span>
              </div>

              {/* Minimal progress bar */}
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-400'
                      : 'bg-sky-400'
                  }`}
                  style={{ width: `${dayPct}%` }}
                />
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-500">
                  <Layers className="w-3 h-3" /> {d.batches.length} блоков
                </span>
                <span className="group-hover:text-sky-300 flex items-center gap-0.5 font-medium transition-colors">
                  Открыть <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Batch Selection Modal */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="studio-surface w-full max-w-md rounded-2xl p-6 border border-white/[0.12] shadow-2xl relative">
            <button
              onClick={() => setSelectedDayModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06]"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-xs font-medium text-sky-400">
                День {selectedDayModal.day} из 30
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Выберите блок для тренировки
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedDayModal.totalWords} слов ({selectedDayModal.firstWord} … {selectedDayModal.lastWord})
              </p>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayModal.batches.map((b) => {
                const dayWords = allWords.filter(w => w.day === selectedDayModal.day);
                const bWords = dayWords.filter(w => w.batch === b.batch);
                const bMastered = bWords.filter(w => progressMap[w.id]?.isMastered).length;
                const bDone = bMastered === bWords.length;

                return (
                  <div
                    key={b.batch}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      bDone
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">Блок {b.batch}</span>
                        <span className="text-xs text-slate-400">({b.count} слов)</span>
                        {bDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
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
                        className="py-2 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
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
                        className="py-2 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
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
