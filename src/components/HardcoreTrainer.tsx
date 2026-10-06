'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  RotateCcw,
  AlertTriangle,
  Send
} from 'lucide-react';
import { WordItem, WordProgress, UserSettings } from '@/types/vocab';
import { soundFx } from '@/lib/soundFx';
import { speechService } from '@/lib/speech';

interface TrainerQueueItem {
  word: WordItem;
  currentLevel: number;
}

interface HardcoreTrainerProps {
  day: number;
  batch: number;
  words: WordItem[];
  progressMap: Record<number, WordProgress>;
  settings: UserSettings;
  onRecordResult: (wordId: number, isCorrect: boolean) => WordProgress;
  onBackToDashboard: () => void;
  onFinishBatch: (stats: { totalTested: number; mistakes: number; masteredWords: number }) => void;
}

export const HardcoreTrainer: React.FC<HardcoreTrainerProps> = ({
  day,
  batch,
  words,
  progressMap,
  settings,
  onRecordResult,
  onBackToDashboard,
  onFinishBatch,
}) => {
  // Build initial queue of words that are not yet mastered in this batch
  const strictTarget = settings.strictLevel || 2;

  const [queue, setQueue] = useState<TrainerQueueItem[]>(() => {
    return words.map(w => {
      const prog = progressMap[w.id];
      const lvl = prog ? prog.masteryLevel : 0;
      return {
        word: w,
        currentLevel: prog?.isMastered ? strictTarget : lvl,
      };
    });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [inputStatus, setInputStatus] = useState<'idle' | 'success' | 'error' | 'correction'>('idle');
  const [combo, setCombo] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [sessionTotalAnswers, setSessionTotalAnswers] = useState(0);
  const [masteredCount, setMasteredCount] = useState(() => {
    return words.filter(w => progressMap[w.id]?.isMastered).length;
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const currentItem = queue[currentIndex] || null;
  const currentWord = currentItem?.word || null;

  // Auto-focus input on change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, inputStatus]);

  // Handle pronouncing word
  const speakCurrent = (text?: string) => {
    const toSpeak = text || currentWord?.en;
    if (toSpeak) {
      speechService.speak(toSpeak, settings.voiceSpeed);
    }
  };

  const isAnswerCorrect = (input: string, word: WordItem): boolean => {
    const clean = input.trim().toLowerCase();
    if (!clean) return false;
    // Check against accepted array or base cleanEn
    if (word.accepted.includes(clean)) return true;
    if (word.cleanEn === clean) return true;
    // Strip hyphens/spaces check
    const normalizedInput = clean.replace(/[- ]/g, '');
    const normalizedCleanEn = word.cleanEn.replace(/[- ]/g, '');
    if (normalizedInput === normalizedCleanEn) return true;

    return false;
  };

  // Submit answer
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !userInput.trim()) return;

    // In correction mode, user must type the correct answer to advance
    if (inputStatus === 'correction') {
      if (isAnswerCorrect(userInput, currentWord)) {
        soundFx.playSuccess();
        setInputStatus('idle');
        setUserInput('');
        advanceToNext();
      } else {
        soundFx.playError();
        soundFx.triggerHaptic('error');
      }
      return;
    }

    setSessionTotalAnswers(prev => prev + 1);
    const correct = isAnswerCorrect(userInput, currentWord);

    if (correct) {
      // SUCCESS!
      soundFx.playSuccess();
      soundFx.triggerHaptic('success');
      const newCombo = combo + 1;
      setCombo(newCombo);

      if (settings.autoPronounce) {
        speakCurrent();
      }

      const updatedProgress = onRecordResult(currentWord.id, true);
      const newLvl = updatedProgress.masteryLevel;

      if (updatedProgress.isMastered && !progressMap[currentWord.id]?.isMastered) {
        soundFx.playMastered();
        setMasteredCount(prev => prev + 1);
      }

      setInputStatus('success');

      // Update current item in queue
      const updatedQueue = [...queue];
      updatedQueue[currentIndex] = {
        ...updatedQueue[currentIndex],
        currentLevel: newLvl,
      };

      setTimeout(() => {
        setInputStatus('idle');
        setUserInput('');
        setQueue(updatedQueue);
        advanceToNext(updatedQueue);
      }, 500);

    } else {
      // MISTAKE / HARDCORE RESET!
      soundFx.playError();
      soundFx.triggerHaptic('error');
      setCombo(0);
      setSessionMistakes(prev => prev + 1);

      onRecordResult(currentWord.id, false);
      speakCurrent();

      // Enter correction mode & re-queue the word
      setInputStatus('correction');

      // Reset level in queue and append copy of word to queue
      const updatedQueue = [...queue];
      updatedQueue[currentIndex] = {
        ...updatedQueue[currentIndex],
        currentLevel: 0,
      };
      // Re-queue so it repeats later in the batch!
      updatedQueue.push({
        word: currentWord,
        currentLevel: 0,
      });
      setQueue(updatedQueue);
    }
  };

  // Give up / reveal answer
  const handleGiveUp = () => {
    if (!currentWord || inputStatus === 'correction') return;
    soundFx.playError();
    soundFx.triggerHaptic('error');
    setCombo(0);
    setSessionMistakes(prev => prev + 1);
    onRecordResult(currentWord.id, false);
    speakCurrent();

    setInputStatus('correction');
    setUserInput('');

    // Re-queue
    const updatedQueue = [...queue];
    updatedQueue[currentIndex] = {
      ...updatedQueue[currentIndex],
      currentLevel: 0,
    };
    updatedQueue.push({
      word: currentWord,
      currentLevel: 0,
    });
    setQueue(updatedQueue);
  };

  // Advance queue
  const advanceToNext = (latestQueue = queue) => {
    // Check if all words in this batch have reached mastery level
    const remainingUnmastered = latestQueue.filter(item => item.currentLevel < strictTarget);

    if (remainingUnmastered.length === 0) {
      // Batch finished!
      onFinishBatch({
        totalTested: sessionTotalAnswers + 1,
        mistakes: sessionMistakes,
        masteredWords: words.length,
      });
      return;
    }

    // Move to next unmastered word in queue
    let nextIdx = currentIndex + 1;
    while (nextIdx < latestQueue.length && latestQueue[nextIdx].currentLevel >= strictTarget) {
      nextIdx++;
    }

    if (nextIdx >= latestQueue.length) {
      // Loop back to first remaining unmastered
      const firstUnmastered = latestQueue.findIndex(item => item.currentLevel < strictTarget);
      if (firstUnmastered !== -1) {
        setCurrentIndex(firstUnmastered);
      } else {
        onFinishBatch({
          totalTested: sessionTotalAnswers,
          mistakes: sessionMistakes,
          masteredWords: words.length,
        });
      }
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  if (!currentWord) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Блок завершен!</h2>
        <p className="text-slate-400 mb-6">Все слова в этом блоке успешно выучены.</p>
        <button
          onClick={onBackToDashboard}
          className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95"
        >
          Вернуться в меню
        </button>
      </div>
    );
  }

  // Calculate completion percentage for this batch
  const totalInBatch = words.length;
  const masteredInBatch = words.filter(w => {
    const qItem = queue.find(q => q.word.id === w.id);
    return qItem && qItem.currentLevel >= strictTarget;
  }).length;
  const progressPercent = Math.round((masteredInBatch / totalInBatch) * 100);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col min-h-[calc(100vh-65px)] justify-between">
      {/* Top Header Navigation & Stats */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>В меню</span>
          </button>

          <div className="flex items-center gap-2">
            {combo > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{combo}X КОМБО</span>
              </div>
            )}
            <div className="text-xs font-medium text-slate-400 px-2.5 py-1 rounded-xl bg-slate-900/60 border border-slate-800">
              День {day} • Блок {batch}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span className="font-medium">
              Освоено: <strong className="text-cyan-400 font-bold">{masteredInBatch}</strong> / {totalInBatch}
            </span>
            <span className="font-mono text-cyan-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Word Challenge Card */}
        <div 
          className={`glass-panel rounded-3xl p-6 sm:p-8 relative transition-all duration-300 shadow-2xl ${
            inputStatus === 'error' || inputStatus === 'correction'
              ? 'border-rose-500/60 glow-rose animate-shake'
              : inputStatus === 'success'
              ? 'border-emerald-500/60 glow-emerald animate-pulse-glow'
              : 'border-slate-800 glow-cyan'
          }`}
        >
          {/* Mastery Level Indicators (Pills) */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Закрепление:
              </span>
              {[...Array(strictTarget)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    i < (currentItem?.currentLevel || 0)
                      ? 'bg-emerald-400 ring-2 ring-emerald-500/40 shadow-sm shadow-emerald-400'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Audio Button */}
            <button
              onClick={() => speakCurrent()}
              title="Послушать произношение"
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-slate-700/80 transition-transform active:scale-90"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Translations */}
          <div className="text-center py-4 sm:py-6">
            {/* Russian Translation */}
            {(settings.language === 'ru' || settings.language === 'both') && (
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {currentWord.ru}
              </div>
            )}

            {/* Tajik Translation */}
            {(settings.language === 'tj' || settings.language === 'both') && (
              <div className="text-lg sm:text-xl font-bold text-cyan-300/90 tracking-wide mb-1">
                {currentWord.tj}
              </div>
            )}

            {/* Context Note / CEFR Level / Letter count */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono">
                {currentWord.cleanEn.length} букв
              </span>
              {currentWord.level && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  {currentWord.level}
                </span>
              )}
              {currentWord.note && (
                <span className="text-slate-400 italic">
                  ({currentWord.note})
                </span>
              )}
            </div>
          </div>

          {/* Correction Mode Message */}
          {inputStatus === 'correction' && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Сброс на 0! Запомните написание:</span>
              </div>
              <div className="text-2xl font-mono font-black text-rose-300 tracking-widest my-1 uppercase">
                {currentWord.en}
              </div>
              <p className="text-xs text-rose-300/80 mt-1">
                Наберите слово правильно в поле ниже, чтобы продолжить:
              </p>
            </div>
          )}

          {/* Active Recall Input Field */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  inputStatus === 'correction' 
                    ? `Наберите "${currentWord.cleanEn}"` 
                    : 'Введите английское слово...'
                }
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={inputStatus === 'success'}
                className={`w-full py-4 px-5 text-center text-xl sm:text-2xl font-bold tracking-wide rounded-2xl bg-slate-950/80 border transition-all outline-none ${
                  inputStatus === 'correction'
                    ? 'border-rose-500 text-rose-200 placeholder:text-rose-500/40 focus:ring-2 focus:ring-rose-500/50'
                    : inputStatus === 'success'
                    ? 'border-emerald-500 text-emerald-300 focus:ring-2 focus:ring-emerald-500/50'
                    : 'border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30'
                }`}
              />
              {userInput && inputStatus !== 'success' && (
                <button
                  type="button"
                  onClick={() => setUserInput('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Bottom Action Controls */}
            <div className="flex items-center gap-3 mt-4">
              {inputStatus !== 'correction' && (
                <button
                  type="button"
                  onClick={handleGiveUp}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Сдаюсь</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!userInput.trim() || inputStatus === 'success'}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                  inputStatus === 'correction'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                    : userInput.trim()
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                <span>{inputStatus === 'correction' ? 'Подтвердить ввод' : 'Проверить'}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Hint / Info Bar */}
      <div className="mt-6 text-center text-xs text-slate-500">
        <p>
          💡 Хардкорный режим: любая опечатка сбрасывает уровень слова до 0. Нажмите Enter для отправки.
        </p>
      </div>
    </div>
  );
};
