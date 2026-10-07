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
  RotateCcw
} from 'lucide-react';
import { WordItem, WordProgress, UserSettings } from '@/types/vocab';
import { soundFx } from '@/lib/soundFx';
import { speechService } from '@/lib/speech';

interface HardcoreTrainerProps {
  day: number;
  batch: number;
  categoryTitle?: string;
  words: WordItem[];
  progressMap: Record<number, WordProgress>;
  settings: UserSettings;
  onRecordResult: (wordId: number, isCorrect: boolean) => WordProgress;
  onBackToDashboard: () => void;
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

export const HardcoreTrainer: React.FC<HardcoreTrainerProps> = ({
  day,
  batch,
  categoryTitle,
  words,
  progressMap,
  settings,
  onRecordResult,
  onBackToDashboard,
  onFinishBatch,
}) => {
  // Active queue of words to be tested
  const [activeList, setActiveList] = useState<WordItem[]>(() => words);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReviewPhase, setIsReviewPhase] = useState(false);
  const [mistakesList, setMistakesList] = useState<WordItem[]>([]);

  const [userInput, setUserInput] = useState('');
  const [inputStatus, setInputStatus] = useState<'idle' | 'success' | 'error' | 'correction'>('idle');
  const [combo, setCombo] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [sessionTotalAnswers, setSessionTotalAnswers] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentWord = activeList[currentIndex] || null;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, inputStatus, isReviewPhase]);

  const speakCurrent = (text?: string) => {
    const toSpeak = text || currentWord?.en;
    if (toSpeak) {
      speechService.speak(toSpeak, settings.voiceSpeed);
    }
  };

  const advanceNextCard = (nextMistakes = mistakesList) => {
    if (currentIndex + 1 < activeList.length) {
      setCurrentIndex(prev => prev + 1);
      setInputStatus('idle');
      setUserInput('');
    } else {
      // Reached end of current active list
      if (!isReviewPhase && nextMistakes.length > 0) {
        // Move to review phase for words with mistakes
        setIsReviewPhase(true);
        setActiveList([...nextMistakes]);
        setMistakesList([]);
        setCurrentIndex(0);
        setInputStatus('idle');
        setUserInput('');
      } else {
        // Entire batch finished!
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

      // Add to mistakes list for repetition if not already present
      let updatedMistakes = mistakesList;
      if (!mistakesList.some(w => w.id === currentWord.id)) {
        updatedMistakes = [...mistakesList, currentWord];
        setMistakesList(updatedMistakes);
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

    let updatedMistakes = mistakesList;
    if (!mistakesList.some(w => w.id === currentWord.id)) {
      updatedMistakes = [...mistakesList, currentWord];
      setMistakesList(updatedMistakes);
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
            <div className="text-xs font-medium text-slate-300 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              {categoryTitle ? `${categoryTitle} • Блок ${batch}` : day > 0 ? `День ${day} • Блок ${batch}` : 'Тренировка'}
            </div>
          </div>
        </div>

        {/* Clear Step-by-Step Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>
              {isReviewPhase ? (
                <span className="text-amber-300 font-medium">Закрепление ошибок: </span>
              ) : (
                <span>Слово: </span>
              )}
              <strong className="text-white font-medium">{currentStep}</strong> из {totalInActive}
            </span>
            <span className="font-mono text-slate-400">
              {Math.min(100, Math.round((currentStep / totalInActive) * 100))}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isReviewPhase ? 'bg-amber-400' : 'bg-sky-400'}`}
              style={{ width: `${Math.max(4, Math.round((currentStep / totalInActive) * 100))}%` }}
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
              <span className="text-[11px] font-medium text-slate-400">
                {isReviewPhase ? 'Повторный ввод' : `Карточка ${currentStep} / ${totalInActive}`}
              </span>
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
                    : "Введите перевод на английском..."
                }
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                className={`w-full py-3.5 px-4 rounded-xl text-base font-mono tracking-wide placeholder:text-slate-500 focus:outline-none transition-colors border ${
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
                className="absolute right-2 top-2 bottom-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-30 disabled:hover:bg-sky-500 text-slate-950 font-semibold text-xs transition-all flex items-center gap-1"
              >
                <span>Enter</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={handleGiveUp}
              disabled={inputStatus === 'correction'}
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Не помню слово</span>
            </button>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Нажмите <kbd className="px-1 py-0.5 bg-white/[0.06] rounded border border-white/[0.1] font-mono text-[10px]">Enter</kbd> для проверки
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats helper */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-white/[0.06] pt-3">
        <span>Ошибок в сессии: <strong className="text-rose-400">{sessionMistakes}</strong></span>
        <span>Текущий комбо: <strong className="text-amber-400">{combo}</strong></span>
      </div>
    </div>
  );
};
