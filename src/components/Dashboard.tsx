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
  MessageSquareText,
  Volume2,
  Users,
  Plane,
  ShoppingBag,
  Home as HomeIcon,
  Briefcase,
  Heart,
  Trophy,
  Smartphone,
  Sparkles,
  Globe,
  Lock
} from 'lucide-react';
import { CategorySummary, WordItem, WordProgress, UserStats } from '@/types/vocab';

interface DashboardProps {
  categories: CategorySummary[];
  allWords: WordItem[];
  progressMap: Record<number, WordProgress>;
  stats: UserStats;
  onStartSession: (categoryId: string, batch: number) => void;
  onStartSentencesSession: (categoryId: string, batch: number) => void;
  onOpenMonologue: (category: CategorySummary) => void;
  onStartMistakesReview: () => void;
  onOpenDictionary: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  categories,
  allWords,
  progressMap,
  stats,
  onStartSession,
  onStartSentencesSession,
  onOpenMonologue,
  onStartMistakesReview,
  onOpenDictionary,
}) => {
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<CategorySummary | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const totalWords = allWords.length || 4991;
  const masteredCount = Object.values(progressMap).filter(p => p.isMastered).length;
  const totalTested = Object.keys(progressMap).length;
  const overallPercentage = Math.round((masteredCount / totalWords) * 100);

  const mistakesWords = allWords.filter(w => {
    const p = progressMap[w.id];
    return p && p.mistakesCount > 0 && !p.isMastered;
  });

  // Find active category and batch
  let activeCat = categories[0] || null;
  let activeBatch = 1;

  for (const cat of categories) {
    const catWords = allWords.filter(w => w.categoryId === cat.id);
    const catMastered = catWords.filter(w => progressMap[w.id]?.isMastered).length;
    if (catMastered < catWords.length) {
      activeCat = cat;
      for (const b of cat.batches) {
        const bWords = catWords.filter(w => w.categoryBatch === b.batch);
        const bMastered = bWords.filter(w => progressMap[w.id]?.isMastered).length;
        if (bMastered < bWords.length) {
          activeBatch = b.batch;
          break;
        }
      }
      break;
    }
  }

  // Category lock rule: Topic 1 is always unlocked.
  // Topic N is unlocked ONLY IF Topic N-1 is 100% completed!
  const isCategoryUnlocked = (catIndex: number): boolean => {
    if (catIndex === 1) return true;
    const prevCat = categories.find(c => c.index === catIndex - 1);
    if (!prevCat) return true;
    const prevWords = allWords.filter(w => w.categoryId === prevCat.id);
    const prevMastered = prevWords.filter(w => progressMap[w.id]?.isMastered).length;
    return prevWords.length > 0 && prevMastered === prevWords.length;
  };

  // Batch lock rule: Batch 1 is unlocked.
  // Batch B is unlocked ONLY IF Batch B-1 is 100% mastered!
  const isBatchUnlocked = (batchNum: number, catId: string): boolean => {
    if (batchNum === 1) return true;
    const catWords = allWords.filter(w => w.categoryId === catId);
    const prevBatchWords = catWords.filter(w => w.categoryBatch === batchNum - 1);
    const prevMastered = prevBatchWords.filter(w => progressMap[w.id]?.isMastered).length;
    return prevBatchWords.length > 0 && prevMastered === prevBatchWords.length;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5 text-sky-400" />;
      case 'Plane': return <Plane className="w-5 h-5 text-indigo-400" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
      case 'Home': return <HomeIcon className="w-5 h-5 text-amber-400" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-rose-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'Globe': return <Globe className="w-5 h-5 text-teal-400" />;
      default: return <BookOpen className="w-5 h-5 text-sky-400" />;
    }
  };

  const renderLevelBadge = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'A1':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            A1 Начальный
          </span>
        );
      case 'A2':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            A2 Базовый
          </span>
        );
      case 'B1':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            B1 Средний
          </span>
        );
      case 'B2':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            B2 Продвинутый
          </span>
        );
      case 'C1':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            C1 Свободный
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Toast Notice for locked items */}
      {lockedNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-amber-500/90 text-slate-950 font-medium text-xs shadow-xl flex items-center gap-2 animate-fade-in">
          <Lock className="w-3.5 h-3.5" />
          <span>{lockedNotice}</span>
          <button onClick={() => setLockedNotice(null)} className="ml-2 font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

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
                10 жизненных сфер • От А1 до В2
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Освоено {masteredCount} из {totalWords} слов
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Последовательное прохождение тем: каждое новое слово открывает предложения и живой финальный монолог.
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

            {activeCat && (
              <button
                onClick={() => onStartSession(activeCat.id, activeBatch)}
                className="py-3 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Тема {activeCat.index} • Блок {activeBatch}</span>
              </button>
            )}
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

      {/* 10 Thematic Categories Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Путь изучения: 10 сфер жизни</h2>
          <p className="text-xs text-slate-400">Слова по возрастанию сложности (A1 $\rightarrow$ A2 $\rightarrow$ B1 $\rightarrow$ B2) с защитой перехода</p>
        </div>
        <button
          onClick={onOpenDictionary}
          className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Словарь</span>
        </button>
      </div>

      {/* Categories Roadmap List */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catWords = allWords.filter(w => w.categoryId === cat.id);
          const catMastered = catWords.filter(w => progressMap[w.id]?.isMastered).length;
          const catPct = catWords.length > 0 ? Math.round((catMastered / catWords.length) * 100) : 0;
          const isCompleted = catPct === 100;
          const isCurrent = activeCat && activeCat.id === cat.id;
          const isUnlocked = isCategoryUnlocked(cat.index);

          const handleCategoryClick = () => {
            if (!isUnlocked) {
              const prev = categories.find(c => c.index === cat.index - 1);
              setLockedNotice(`Тема заблокирована. Сначала завершите Тему ${cat.index - 1}: «${prev?.titleRu}»`);
              setTimeout(() => setLockedNotice(null), 3500);
              return;
            }
            setSelectedCategoryModal(cat);
          };

          return (
            <div
              key={cat.id}
              onClick={handleCategoryClick}
              className={`studio-surface rounded-xl p-4 sm:p-5 transition-all border group ${
                !isUnlocked
                  ? 'opacity-60 cursor-not-allowed border-white/[0.04] bg-white/[0.01]'
                  : isCompleted
                  ? 'cursor-pointer border-emerald-500/30 bg-emerald-950/10'
                  : isCurrent
                  ? 'cursor-pointer border-sky-500/40 bg-sky-950/10 shadow-lg shadow-sky-500/5'
                  : 'cursor-pointer border-white/[0.08] hover:border-white/[0.16]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${
                    !isUnlocked 
                      ? 'bg-white/[0.02] border-white/[0.04] text-slate-500' 
                      : 'bg-white/[0.04] border-white/[0.08]'
                  }`}>
                    {!isUnlocked ? <Lock className="w-5 h-5 text-slate-500" /> : getCategoryIcon(cat.icon)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        Тема {cat.index}
                      </span>
                      <h3 className={`text-base font-semibold tracking-tight transition-colors ${
                        !isUnlocked ? 'text-slate-400' : 'text-white group-hover:text-sky-300'
                      }`}>
                        {cat.titleRu}
                      </h3>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : !isUnlocked ? (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] flex items-center gap-1 font-medium">
                          <Lock className="w-2.5 h-2.5" /> закрыто
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      {cat.descriptionRu}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{cat.totalWords} слов</span>
                      <span>•</span>
                      <span>{cat.totalBatches} блоков (A1 $\rightarrow$ B2)</span>
                      {cat.monologue && (
                        <>
                          <span>•</span>
                          <span className={`font-medium flex items-center gap-1 ${
                            isCompleted ? 'text-emerald-400' : isUnlocked ? 'text-sky-400' : 'text-slate-500'
                          }`}>
                            <Volume2 className="w-3 h-3" /> Финальный монолог
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {catMastered}/{cat.totalWords}
                  </span>
                  <div className="w-20 sm:w-24 h-1 bg-white/[0.08] rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-400' : isUnlocked ? 'bg-sky-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Detail Modal */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="studio-surface w-full max-w-md rounded-2xl p-6 border border-white/[0.12] shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedCategoryModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06]"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-xs font-medium text-sky-400">
                Тема {selectedCategoryModal.index} из 10
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedCategoryModal.titleRu}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedCategoryModal.totalWords} слов • {selectedCategoryModal.totalBatches} блоков (по 25 слов)
              </p>
            </div>

            {/* Monologue Shortcut Button with Lock Protection */}
            {selectedCategoryModal.monologue && (() => {
              const catWords = allWords.filter(w => w.categoryId === selectedCategoryModal.id);
              const catMastered = catWords.filter(w => progressMap[w.id]?.isMastered).length;
              const isMonologueUnlocked = catWords.length > 0 && catMastered === catWords.length;

              return (
                <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isMonologueUnlocked
                    ? 'bg-sky-500/10 border-sky-500/30'
                    : 'bg-white/[0.02] border-white/[0.06]'
                }`}>
                  <div>
                    <span className={`text-[11px] font-semibold block ${
                      isMonologueUnlocked ? 'text-sky-300' : 'text-slate-400'
                    }`}>
                      Финальный монолог темы
                    </span>
                    <p className="text-xs text-white font-medium truncate max-w-[210px]">
                      {selectedCategoryModal.monologue.titleEn}
                    </p>
                  </div>

                  {isMonologueUnlocked ? (
                    <button
                      onClick={() => {
                        const cat = selectedCategoryModal;
                        setSelectedCategoryModal(null);
                        onOpenMonologue(cat);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Слушать</span>
                    </button>
                  ) : (
                    <div className="py-1.5 px-2.5 rounded-lg bg-white/[0.04] text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>{catMastered}/{catWords.length} слов</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Batches List with Step-by-Step Lock */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {selectedCategoryModal.batches.map((b) => {
                const catWords = allWords.filter(w => w.categoryId === selectedCategoryModal.id);
                const bWords = catWords.filter(w => w.categoryBatch === b.batch);
                const bMastered = bWords.filter(w => progressMap[w.id]?.isMastered).length;
                const bDone = bMastered === bWords.length && bWords.length > 0;
                const isUnlocked = isBatchUnlocked(b.batch, selectedCategoryModal.id);

                return (
                  <div
                    key={b.batch}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      !isUnlocked
                        ? 'opacity-50 bg-white/[0.01] border-white/[0.04]'
                        : bDone
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">Блок {b.batch}</span>
                        {renderLevelBadge(b.level)}
                        {bDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {bMastered}/{b.count}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3 truncate">
                      {b.sample.join(', ')}...
                    </p>

                    {isUnlocked ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const catId = selectedCategoryModal.id;
                            const batchNum = b.batch;
                            setSelectedCategoryModal(null);
                            onStartSession(catId, batchNum);
                          }}
                          className="py-2 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/25 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Изучить блок</span>
                        </button>

                        <button
                          onClick={() => {
                            const catId = selectedCategoryModal.id;
                            const batchNum = b.batch;
                            setSelectedCategoryModal(null);
                            onStartSentencesSession(catId, batchNum);
                          }}
                          className="py-2 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageSquareText className="w-3 h-3" />
                          <span>Фразы (Шаг 3)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-slate-500 text-xs flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Заблокировано (завершите Блок {b.batch - 1})</span>
                      </div>
                    )}
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
