'use client';

import React, { useState, useMemo } from 'react';
import { Search, Volume2, CheckCircle2, AlertTriangle, Filter, X } from 'lucide-react';
import { WordItem, WordProgress } from '@/types/vocab';
import { speechService } from '@/lib/speech';

interface DictionaryModalProps {
  words: WordItem[];
  progressMap: Record<number, WordProgress>;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  words,
  progressMap,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'mistakes' | 'unlearned'>('all');
  const [limit, setLimit] = useState(40);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return words.filter((w) => {
      // Day filter
      if (filterDay !== 'all' && w.day !== filterDay) return false;

      // Status filter
      const p = progressMap[w.id];
      if (filterStatus === 'mastered' && !p?.isMastered) return false;
      if (filterStatus === 'mistakes' && (!p || p.mistakesCount === 0 || p.isMastered)) return false;
      if (filterStatus === 'unlearned' && p?.isMastered) return false;

      // Search query
      if (!q) return true;
      if (w.en.toLowerCase().includes(q)) return true;
      if (w.ru.toLowerCase().includes(q)) return true;
      if (w.tj.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [words, progressMap, search, filterDay, filterStatus]);

  const visibleWords = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-2xl flex flex-col h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">Словарь 5000 слов</h3>
            <p className="text-xs text-slate-400">
              Найдено: <strong className="text-cyan-400">{filtered.length}</strong> из {words.length} слов
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="my-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по English, русски или тоҷикӣ..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status pills */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              {[
                { id: 'all', label: 'Все' },
                { id: 'mastered', label: 'Выучено' },
                { id: 'mistakes', label: 'С ошибками' },
                { id: 'unlearned', label: 'Не начато' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilterStatus(s.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterStatus === s.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Day Dropdown */}
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 py-1.5 px-2.5 rounded-xl text-xs outline-none focus:border-cyan-400"
            >
              <option value="all">Все 30 дней</option>
              {[...Array(30)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  День {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Word List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {visibleWords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Ничего не найдено по вашему запросу.
            </div>
          ) : (
            visibleWords.map((w) => {
              const p = progressMap[w.id];
              const isMastered = p?.isMastered;
              const hasMistakes = p && p.mistakesCount > 0 && !isMastered;

              return (
                <div
                  key={w.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isMastered
                      ? 'bg-emerald-950/15 border-emerald-500/30'
                      : hasMistakes
                      ? 'bg-rose-950/15 border-rose-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base tracking-wide">
                        {w.en}
                      </span>
                      {w.level && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                          {w.level}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        Д.{w.day}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 mt-0.5 truncate">
                      <span className="text-slate-200">{w.ru}</span>
                      {w.tj && (
                        <span className="text-cyan-400/80 ml-2">/ {w.tj}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {isMastered ? (
                      <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : hasMistakes ? (
                      <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400" title={`Ошибок: ${p.mistakesCount}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    ) : null}

                    {/* Audio pronunciation */}
                    <button
                      onClick={() => speechService.speak(w.en)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Прослушать"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {filtered.length > limit && (
            <button
              onClick={() => setLimit((prev) => prev + 50)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-cyan-400 font-bold border border-slate-800 transition-colors"
            >
              Загрузить ещё (+50 слов)...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
