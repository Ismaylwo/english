'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  HelpCircle, 
  CheckCircle2, 
  Zap, 
  AlertTriangle,
  Send,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { WordItem, WordProgress, UserSettings } from '@/types/vocab';
import { soundFx } from '@/lib/soundFx';
import { speechService } from '@/lib/speech';

interface HardcoreTrainerProps {
  day: number;
  batch: number;
  categoryTitle?: string;
  words: WordItem[];
  isRetryMode?: boolean;
  progressMap: Record<number, WordProgress>;
  settings: UserSettings;
  onRecordResult: (wordId: number, isCorrect: boolean) => WordProgress;
  onBackToDashboard: () => void;
  onNeedReStudy?: (failedWords: WordItem[]) => void;
  onFinishBatch: (stats: { totalTested: number; mistakes: number; masteredWords: number }) => void;
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

export function shuffleArray<T>(array: T[]): T[] {
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

export const HardcoreTrainer: React.FC<HardcoreTrainerProps> = ({
  day,
  batch,
  categoryTitle,
  words,
  isRetryMode = false,
  progressMap,
  settings,
  onRecordResult,
  onBackToDashboard,
  onNeedReStudy,
  onFinishBatch,
}) => {
  // Active queue of words to be tested (always randomly shuffled)
  const [activeList, setActiveList] = useState<WordItem[]>(() => shuffleArray(words));
  const [currentIndex, setCurrentIndex] = useState(0);
  const failedWordsRef = useRef<WordItem[]>([]);
  const [failedCountInRound, setFailedCountInRound] = useState(0);

  const [userInput, setUserInput] = useState('');
  const [inputStatus, setInputStatus] = useState<'idle' | 'success' | 'error' | 'correction'>('idle');
  const [combo, setCombo] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [sessionTotalAnswers, setSessionTotalAnswers] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentWord = activeList[currentIndex] || null;

  // Reset and shuffle when words prop changes (e.g. when entering retry mode with failed words subset)
  useEffect(() => {
    setActiveList(shuffleArray(words));
    setCurrentIndex(0);
    failedWordsRef.current = [];
    setFailedCountInRound(0);
    setUserInput('');
    setInputStatus('idle');
  }, [words]);

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

  const advanceNextCard = () => {
    if (currentIndex + 1 < activeList.length) {
      setCurrentIndex(prev => prev + 1);
      setInputStatus('idle');
      setUserInput('');
    } else {
      // Reached end of current active list
      const failed = failedWordsRef.current;
      if (failed.length > 0 && onNeedReStudy) {
        // User had mistakes! Go back to Step 1 with ONLY failed words
        onNeedReStudy([...failed]);
      } else {
        // 0 mistakes in this round! Entire batch mastered!
        onFinishBatch({
          totalTested: sessionTotalAnswers + 1,
          mistakes: sessionMistakes,
          masteredWords: words.length,
        });
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !userInput.trim()) return;

    if (inputStatus === 'correction') {
      // User is typing the correct answer to reinforce memory
      if (isAnswerCorrect(userInput, currentWord)) {
        soundFx.playSuccess();
        advanceNextCard();
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

      onRecordResult(currentWord.id, true);
      setInputStatus('success');

      setTimeout(() => {
        advanceNextCard();
      }, 400);

    } else {
      soundFx.playError();
      soundFx.triggerHaptic('error');
      setCombo(0);
      setSessionMistakes(prev => prev + 1);

      onRecordResult(currentWord.id, false);
      speakCurrent();

      setInputStatus('correction');

      // Track failed word for re-study loop
      if (!failedWordsRef.current.some(w => w.id === currentWord.id)) {
        failedWordsRef.current.push(currentWord);
        setFailedCountInRound(failedWordsRef.current.length);
      }
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

    // Track failed word for re-study loop
    if (!failedWordsRef.current.some(w => w.id === currentWord.id)) {
      failedWordsRef.current.push(currentWord);
      setFailedCountInRound(failedWordsRef.current.length);
    }
  };

  if (!currentWord) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Блок завершен</h2>
        <p className="text-slate-400 mb-6 text-sm">Все слова в этом блоке успешно пройдены.</p>
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
  const progressPercent = Math.round(((currentIndex) / totalInActive) * 100);

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
            {combo > 1 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{combo}</span>
              </div>
            )}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
              isRetryMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/25'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              <span>{isRetryMode ? `Шаг 2 • Повтор (${totalInActive})` : 'Шаг 2 • Набор'}</span>
            </div>
            <div className="text-xs font-medium text-slate-400 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              {categoryTitle ? `${categoryTitle} • Блок ${batch}` : `Блок ${batch}`}
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
          <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full border transition-all ${
            isRetryMode
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold shadow-sm'
              : 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-semibold shadow-sm'
          }`}>
            <span className="w-3.5 h-3.5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[9px] font-bold">2</span>
            <span>{isRetryMode ? 'Повторный набор' : 'Набор слов'}</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-slate-500">
            <span className="w-3.5 h-3.5 rounded-full bg-white/[0.05] text-slate-500 flex items-center justify-center text-[9px] font-bold">3</span>
            <span>Предложения</span>
          </div>
        </div>

        {/* Clear Step-by-Step Progress Bar */}
        <div className="mb-2 sm:mb-2.5">
          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
            <span>
              {isRetryMode ? (
                <span className="text-amber-300 font-medium">Повторный набор ошибки: </span>
              ) : (
                <span>Слово: </span>
              )}
              <strong className="text-white font-medium">{currentStep}</strong> из {totalInActive}
            </span>
            <span className="font-mono text-slate-400">
              {Math.min(100, Math.round((currentStep / totalInActive) * 100))}%
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isRetryMode ? 'bg-amber-400' : 'bg-sky-400'}`}
              style={{ width: `${Math.max(4, Math.round((currentStep / totalInActive) * 100))}%` }}
            />
          </div>
        </div>

        {/* Focal Word Card */}
        <div 
          className={`studio-surface rounded-2xl p-4 sm:p-5 relative transition-colors ${
            inputStatus === 'error' || inputStatus === 'correction'
              ? 'border-rose-500/50 animate-micro-shake'
              : inputStatus === 'success'
              ? 'border-emerald-500/50'
              : 'border-white/[0.08]'
          }`}
        >
          {/* Card Meta Row */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-slate-400">
                {isRetryMode ? 'Повторный ввод ошибки' : `Карточка ${currentStep} / ${totalInActive}`}
              </span>
            </div>

            <button
              onClick={() => speakCurrent()}
              title="Прослушать произношение"
              className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Focal Subject: Target Word Prompt */}
          <div className="text-center py-2.5 sm:py-3.5">
            {(settings.language === 'ru' || settings.language === 'both') && (
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
                {currentWord.ru}
              </div>
            )}

            {(settings.language === 'tj' || settings.language === 'both') && (
              <div className="text-sm sm:text-base text-sky-300/80 font-normal">
                {currentWord.tj}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
              <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[10px]">
                {currentWord.cleanEn.length} букв
              </span>
              {currentWord.level && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium">
                  {currentWord.level}
                </span>
              )}
              {currentWord.note && (
                <span className="text-slate-400 text-[11px] italic">
                  ({currentWord.note})
                </span>
              )}
            </div>
          </div>

          {/* Direct, calm correction guidance */}
          {inputStatus === 'correction' && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-medium text-[11px] mb-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>Правильный ответ:</span>
              </div>
              <div className="text-lg font-mono font-bold text-white tracking-wide my-0.5">
                {currentWord.en}
              </div>
              {currentWord.accepted && currentWord.accepted.length > 1 && (
                <p className="text-[10px] text-slate-400 mb-0.5">
                  (допускается: {currentWord.accepted.slice(0, 3).join(', ')})
                </p>
              )}
              <p className="text-[11px] text-rose-300/80">
                Наберите слово ниже, чтобы закрепить его:
              </p>
            </div>
          )}

          {/* Precise Input Form */}
          <form onSubmit={handleSubmit} className="mt-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  inputStatus === 'correction' 
                    ? `Наберите "${currentWord.en}"` 
                    : "Введите перевод на английском..."
                }
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                className={`w-full py-2.5 sm:py-3 px-3.5 rounded-xl text-sm sm:text-base font-mono tracking-wide placeholder:text-slate-500 focus:outline-none transition-colors border ${
                  inputStatus === 'correction'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-100 focus:border-rose-400'
                    : inputStatus === 'success'
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                    : 'bg-black/30 border-white/[0.12] text-white focus:border-sky-400'
                }`}
              />

              <button
                type="submit"
                disabled={!userInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-30 disabled:hover:bg-sky-500 text-slate-950 font-semibold text-xs transition-all flex items-center gap-1"
              >
                <span>Enter</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={handleGiveUp}
              disabled={inputStatus === 'correction'}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 disabled:opacity-40 text-[11px]"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Не помню слово</span>
            </button>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Нажмите <kbd className="px-1 py-0.2 bg-white/[0.06] rounded border border-white/[0.1] font-mono text-[9px]">Enter</kbd>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats helper */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 border-t border-white/[0.06] pt-2">
        <span>
          Ошибок в раунде: <strong className={failedCountInRound > 0 ? "text-rose-400 font-bold" : "text-slate-400"}>{failedCountInRound}</strong>
          {failedCountInRound > 0 && <span className="text-amber-400/80 ml-1 text-[10px]">(пойдут на повтор к Шагу 1)</span>}
        </span>
        <span>Комбо: <strong className="text-amber-400">{combo}</strong></span>
      </div>
    </div>
  );
};
