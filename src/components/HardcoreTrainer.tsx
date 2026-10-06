'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  HelpCircle, 
  CheckCircle2, 
  Zap, 
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

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeAnswer(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanAlphanumeric(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isAnswerCorrect(input: string, word: WordItem): boolean {
  const normInput = normalizeAnswer(input);
  const cleanInput = cleanAlphanumeric(input);
  if (!cleanInput) return false;

  const normEn = normalizeAnswer(word.en);
  const cleanEn = cleanAlphanumeric(word.en);
  const normCleanEn = normalizeAnswer(word.cleanEn);
  const cleanCleanEn = cleanAlphanumeric(word.cleanEn);

  if (cleanInput === cleanEn || cleanInput === cleanCleanEn) return true;
  if (normInput === normEn || normInput === normCleanEn) return true;

  for (const acc of (word.accepted || [])) {
    if (cleanInput === cleanAlphanumeric(acc) || normInput === normalizeAnswer(acc)) {
      return true;
    }
  }

  const tokens = normEn.split(' ').filter(t => t.length > 0);
  if (tokens.length > 1) {
    if (tokens.includes(normInput) || tokens.some(t => cleanAlphanumeric(t) === cleanInput)) {
      return true;
    }
  }

  return false;
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
  const strictTarget = settings.strictLevel || 2;

  const [queue, setQueue] = useState<TrainerQueueItem[]>(() => {
    const shuffled = shuffleArray(words);
    return shuffled.map(w => {
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, inputStatus]);

  const speakCurrent = (text?: string) => {
    const toSpeak = text || currentWord?.en;
    if (toSpeak) {
      speechService.speak(toSpeak, settings.voiceSpeed);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !userInput.trim()) return;

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
      soundFx.playSuccess();
      soundFx.triggerHaptic('success');
      setCombo(prev => prev + 1);

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
      soundFx.playError();
      soundFx.triggerHaptic('error');
      setCombo(0);
      setSessionMistakes(prev => prev + 1);

      onRecordResult(currentWord.id, false);
      speakCurrent();

      setInputStatus('correction');

      const updatedQueue = [...queue];
      updatedQueue[currentIndex] = {
        ...updatedQueue[currentIndex],
        currentLevel: 0,
      };

      const remainingCount = updatedQueue.length - (currentIndex + 1);
      const offset = Math.min(
        remainingCount,
        Math.max(2, Math.floor(Math.random() * 4) + 2)
      );
      const insertIndex = currentIndex + 1 + offset;
      updatedQueue.splice(insertIndex, 0, {
        word: currentWord,
        currentLevel: 0,
      });

      setQueue(updatedQueue);
    }
  };

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

    const updatedQueue = [...queue];
    updatedQueue[currentIndex] = {
      ...updatedQueue[currentIndex],
      currentLevel: 0,
    };
    const remainingCount = updatedQueue.length - (currentIndex + 1);
    const offset = Math.min(
      remainingCount,
      Math.max(2, Math.floor(Math.random() * 4) + 2)
    );
    const insertIndex = currentIndex + 1 + offset;
    updatedQueue.splice(insertIndex, 0, {
      word: currentWord,
      currentLevel: 0,
    });
    setQueue(updatedQueue);
  };

  const advanceToNext = (latestQueue = queue) => {
    const remainingUnmastered = latestQueue.filter(item => item.currentLevel < strictTarget);

    if (remainingUnmastered.length === 0) {
      onFinishBatch({
        totalTested: sessionTotalAnswers + 1,
        mistakes: sessionMistakes,
        masteredWords: words.length,
      });
      return;
    }

    let nextIdx = currentIndex + 1;
    while (nextIdx < latestQueue.length && latestQueue[nextIdx].currentLevel >= strictTarget) {
      nextIdx++;
    }

    if (nextIdx >= latestQueue.length) {
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
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Блок завершен</h2>
        <p className="text-slate-400 mb-6 text-sm">Все слова в этом блоке успешно выучены.</p>
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors"
        >
          Вернуться в меню
        </button>
      </div>
    );
  }

  const totalInBatch = words.length;
  const masteredInBatch = words.filter(w => {
    const qItem = queue.find(q => q.word.id === w.id);
    return qItem && qItem.currentLevel >= strictTarget;
  }).length;
  const progressPercent = Math.round((masteredInBatch / totalInBatch) * 100);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-65px)] justify-between">
      <div>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>В меню</span>
          </button>

          <div className="flex items-center gap-2">
            {combo > 1 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{combo} подряд</span>
              </div>
            )}
            <div className="text-xs font-medium text-slate-400 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              {day > 0 ? `День ${day} • Блок ${batch}` : 'Повторение ошибок'}
            </div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>
              Освоено: <strong className="text-white font-medium">{masteredInBatch}</strong> из {totalInBatch}
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Focal Word Card */}
        <div 
          className={`studio-surface rounded-2xl p-6 sm:p-8 relative transition-colors ${
            inputStatus === 'error' || inputStatus === 'correction'
              ? 'border-rose-500/50 animate-micro-shake'
              : inputStatus === 'success'
              ? 'border-emerald-500/50'
              : 'border-white/[0.08]'
          }`}
        >
          {/* Card Meta Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 mr-1">
                Уровень:
              </span>
              {[...Array(strictTarget)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < (currentItem?.currentLevel || 0)
                      ? 'bg-emerald-400'
                      : 'bg-white/[0.12]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => speakCurrent()}
              title="Прослушать произношение"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Focal Subject: Target Word Prompt */}
          <div className="text-center py-6 sm:py-8">
            {(settings.language === 'ru' || settings.language === 'both') && (
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                {currentWord.ru}
              </div>
            )}

            {(settings.language === 'tj' || settings.language === 'both') && (
              <div className="text-base sm:text-lg text-sky-300/80 font-normal">
                {currentWord.tj}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono">
                {currentWord.cleanEn.length} букв
              </span>
              {currentWord.level && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
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

          {/* Direct, calm correction guidance */}
          {inputStatus === 'correction' && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-medium text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Правильный ответ:</span>
              </div>
              <div className="text-xl font-mono font-bold text-white tracking-wide my-1">
                {currentWord.en}
              </div>
              {currentWord.accepted && currentWord.accepted.length > 1 && (
                <p className="text-[11px] text-slate-400 mb-1">
                  (допускается: {currentWord.accepted.slice(0, 3).join(', ')})
                </p>
              )}
              <p className="text-xs text-rose-300/80 mt-1">
                Наберите слово ниже, чтобы закрепить его:
              </p>
            </div>
          )}

          {/* Precise Input Form */}
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  inputStatus === 'correction' 
                    ? `Наберите "${currentWord.en}"` 
                    : 'Введите английское слово'
                }
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={inputStatus === 'success'}
                className={`w-full py-3.5 px-4 text-center text-xl sm:text-2xl font-semibold tracking-normal rounded-xl studio-input transition-all ${
                  inputStatus === 'correction'
                    ? 'border-rose-500 text-rose-200'
                    : inputStatus === 'success'
                    ? 'border-emerald-500 text-emerald-300'
                    : ''
                }`}
              />
              {userInput && inputStatus !== 'success' && (
                <button
                  type="button"
                  onClick={() => setUserInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 mt-4">
              {inputStatus !== 'correction' && (
                <button
                  type="button"
                  onClick={handleGiveUp}
                  className="flex-1 py-3 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Показать ответ</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!userInput.trim() || inputStatus === 'success'}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  inputStatus === 'correction'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : userInput.trim()
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold'
                    : 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.06]'
                }`}
              >
                <span>{inputStatus === 'correction' ? 'Подтвердить ввод' : 'Проверить ответ'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        <p>
          Любая опечатка возвращает слово в очередь. Нажмите Enter для отправки.
        </p>
      </div>
    </div>
  );
};
