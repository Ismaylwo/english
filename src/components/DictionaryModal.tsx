'use client';

import React, { useState, useMemo } from 'react';
import { Search, Volume2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
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
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'mistakes' | 'unlearned'>('all');
  const [limit, setLimit] = useState(40);

  const categoriesList = useMemo(() => {
    const map = new Map<string, { id: string; title: string; index: number }>();
    words.forEach(w => {
      if (w.categoryId && w.categoryTitleRu && !map.has(w.categoryId)) {
        map.set(w.categoryId, { id: w.categoryId, title: w.categoryTitleRu, index: w.categoryIndex || 0 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.index - b.index);
  }, [words]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return words.filter((w) => {
      if (filterCategory !== 'all' && w.categoryId !== filterCategory) return false;

      const p = progressMap[w.id];
      if (filterStatus === 'mastered' && !p?.isMastered) return false;
      if (filterStatus === 'mistakes' && (!p || p.mistakesCount === 0 || p.isMastered)) return false;
      if (filterStatus === 'unlearned' && p?.isMastered) return false;

      if (!q) return true;
      if (w.en.toLowerCase().includes(q)) return true;
      if (w.ru.toLowerCase().includes(q)) return true;
      if (w.tj.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [words, progressMap, search, filterCategory, filterStatus]);

  const visibleWords = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="studio-surface w-full max-w-2xl rounded-2xl p-5 sm:p-6 border border-white/[0.12] shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Словарь 5000 слов</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Найдено: <strong className="text-white font-medium">{filtered.length}</strong> из {words.length} слов
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="my-3 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по английски, русски или тоҷикӣ..."
              className="w-full pl-9 pr-8 py-2 rounded-xl studio-input text-xs"
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
            <div className="flex rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.08]">
              {[
                { id: 'all', label: 'Все' },
                { id: 'mastered', label: 'Выучено' },
                { id: 'mistakes', label: 'С ошибками' },
                { id: 'unlearned', label: 'Не начато' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFilterStatus(s.id as any)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterStatus === s.id
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#161b22] border border-white/[0.08] text-slate-300 py-1 px-2.5 rounded-lg text-xs outline-none focus:border-sky-400 max-w-[200px] truncate"
            >
              <option value="all">Все 10 тем</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  Тема {c.index}: {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Word List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {visibleWords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
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
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                    isMastered
                      ? 'bg-emerald-950/15 border-emerald-500/25'
                      : hasMistakes
                      ? 'bg-rose-950/15 border-rose-500/25'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm tracking-tight">
                        {w.en}
                      </span>
                      {w.level && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                          {w.level}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        Т.{w.categoryIndex || 1} • Бл.{w.categoryBatch || 1}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 mt-0.5 truncate">
                      <span>{w.ru}</span>
                      {w.tj && (
                        <span className="text-slate-400 ml-2">/ {w.tj}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMastered ? (
                      <span className="p-1 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : hasMistakes ? (
                      <span className="p-1 text-rose-400" title={`Ошибок: ${p.mistakesCount}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    ) : null}

                    <button
                      onClick={() => speechService.speak(w.en)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
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
              className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs text-sky-400 font-medium border border-white/[0.08] transition-colors"
            >
              Загрузить ещё (+50 слов)...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
