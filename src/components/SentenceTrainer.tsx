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
  MessageSquareText,
  ArrowRight
} from 'lucide-react';
import { WordItem, UserSettings } from '@/types/vocab';
import { soundFx } from '@/lib/soundFx';
import { speechService } from '@/lib/speech';
import { isAnswerCorrect } from './HardcoreTrainer';

interface SentenceTrainerProps {
  day: number;
  batch: number;
  categoryTitle?: string;
  words: WordItem[];
  settings: UserSettings;
  onBackToDashboard: () => void;
  onFinishSentences: (stats: { totalTested: number; mistakes: number }) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const SentenceTrainer: React.FC<SentenceTrainerProps> = ({
  day,
  batch,
  categoryTitle,
  words,
  settings,
  onBackToDashboard,
  onFinishSentences,
}) => {
  const wordsWithExamples = words.filter(w => w.example && w.example.en);

  const [activeList, setActiveList] = useState<WordItem[]>(() => shuffleArray(wordsWithExamples));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReviewPhase, setIsReviewPhase] = useState(false);
  const [mistakesList, setMistakesList] = useState<WordItem[]>([]);

  const [userInput, setUserInput] = useState('');
  const [inputStatus, setInputStatus] = useState<'idle' | 'success' | 'error' | 'correction'>('idle');
  const [combo, setCombo] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [sessionTotalAnswers, setSessionTotalAnswers] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Re-shuffle when words array changes
  useEffect(() => {
    const list = words.filter(w => w.example && w.example.en);
    setActiveList(shuffleArray(list));
    setCurrentIndex(0);
    setIsReviewPhase(false);
    setMistakesList([]);
    setUserInput('');
    setInputStatus('idle');
  }, [words]);

  const currentWord = activeList[currentIndex] || null;
  const example = currentWord?.example || null;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, inputStatus, isReviewPhase]);

  const speakFullSentence = () => {
    if (example?.en) {
      speechService.speak(example.en, settings.voiceSpeed);
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
        setIsReviewPhase(true);
        setActiveList(shuffleArray([...nextMistakes]));
        setMistakesList([]);
        setCurrentIndex(0);
        setInputStatus('idle');
        setUserInput('');
      } else {
        onFinishSentences({
          totalTested: sessionTotalAnswers + 1,
          mistakes: sessionMistakes,
        });
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !example || !userInput.trim()) return;

    if (inputStatus === 'correction') {
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
        speakFullSentence();
      }

      setInputStatus('success');

      setTimeout(() => {
        advanceNextCard();
      }, 500);

    } else {
      soundFx.playError();
      soundFx.triggerHaptic('error');
      setCombo(0);
      setSessionMistakes(prev => prev + 1);

      speakFullSentence();
      setInputStatus('correction');

      let updatedMistakes = mistakesList;
      if (!mistakesList.some(w => w.id === currentWord.id)) {
        updatedMistakes = [...mistakesList, currentWord];
        setMistakesList(updatedMistakes);
      }
    }
  };

  const handleGiveUp = () => {
    if (!currentWord || !example || inputStatus === 'correction') return;
    soundFx.playError();
    soundFx.triggerHaptic('error');
    setCombo(0);
    setSessionMistakes(prev => prev + 1);
    speakFullSentence();

    setInputStatus('correction');
    setUserInput('');

    let updatedMistakes = mistakesList;
    if (!mistakesList.some(w => w.id === currentWord.id)) {
      updatedMistakes = [...mistakesList, currentWord];
      setMistakesList(updatedMistakes);
    }
  };

  if (!currentWord || !example) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Предложения освоены</h2>
        <p className="text-slate-400 mb-6 text-sm">Все предложения этого блока успешно закреплены.</p>
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
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>{categoryTitle ? `${categoryTitle} • Шаг 3` : `Шаг 3 • Фразы ${batch}`}</span>
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
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Набрано</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-semibold shadow-sm">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold">3</span>
            <span>Предложения</span>
          </div>
        </div>

        {/* Clear Progress Bar */}
        <div className="mb-2 sm:mb-2.5">
          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-0.5">
            <span>
              {isReviewPhase ? (
                <span className="text-amber-300 font-medium">Закрепление ошибок: </span>
              ) : (
                <span>Предложение: </span>
              )}
              <strong className="text-white font-medium">{currentStep}</strong> из {totalInActive}
            </span>
            <span className="font-mono text-slate-400">
              {Math.min(100, Math.round((currentStep / totalInActive) * 100))}%
            </span>
          </div>
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isReviewPhase ? 'bg-amber-400' : 'bg-indigo-400'}`}
              style={{ width: `${Math.max(4, Math.round((currentStep / totalInActive) * 100))}%` }}
            />
          </div>
        </div>

        {/* Sentence Challenge Card */}
        <div 
          className={`studio-surface rounded-2xl p-4 sm:p-5 relative transition-colors ${
            inputStatus === 'error' || inputStatus === 'correction'
              ? 'border-rose-500/50 animate-micro-shake'
              : inputStatus === 'success'
              ? 'border-emerald-500/50'
              : 'border-white/[0.08]'
          }`}
        >
          {/* Top meta */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-400">
              {isReviewPhase ? 'Повторный ввод фразы' : 'Вставьте пропущенное слово'}
            </span>

            <button
              onClick={speakFullSentence}
              title="Прослушать предложение"
              className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-indigo-300 hover:text-white transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Focal Sentence Display */}
          <div className="text-center py-2 sm:py-3">
            <div className="text-base sm:text-xl font-serif text-slate-100 leading-relaxed tracking-wide mb-2.5">
              <span>{example.prefix}</span>
              <span className={`inline-block px-2 py-0.5 mx-1 font-mono font-bold rounded-lg border border-dashed transition-all ${
                inputStatus === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : inputStatus === 'correction'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-white/[0.06] text-sky-400 border-sky-400/50'
              }`}>
                {inputStatus === 'success' 
                  ? currentWord.cleanEn 
                  : inputStatus === 'correction' 
                  ? currentWord.cleanEn 
                  : '_______'}
              </span>
              <span>{example.suffix}</span>
            </div>

            {/* Context Translations */}
            <div className="space-y-1 mt-2.5 pt-2.5 border-t border-white/[0.06]">
              {(settings.language === 'ru' || settings.language === 'both') && (
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  {example.ru}
                </p>
              )}
              {(settings.language === 'tj' || settings.language === 'both') && example.tj && (
                <p className="text-[11px] sm:text-xs text-sky-300/80">
                  {example.tj}
                </p>
              )}
            </div>

            {/* Target Word Hint */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
              <span>Слово:</span>
              <strong className="text-white font-medium">{currentWord.ru}</strong>
              <span className="font-mono text-slate-500">({currentWord.cleanEn.length} б.)</span>
            </div>
          </div>

          {/* Correction banner */}
          {inputStatus === 'correction' && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-medium text-[11px] mb-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span>Пропущенное слово:</span>
              </div>
              <div className="text-lg font-mono font-bold text-white tracking-wide my-0.5">
                {currentWord.en}
              </div>
              <p className="text-[11px] text-rose-300/80">
                Наберите слово ниже, чтобы запомнить фразу:
              </p>
            </div>
          )}

          {/* Input Form */}
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
                    : "Введите пропущенное слово..."
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
                    : 'bg-black/30 border-white/[0.12] text-white focus:border-indigo-400'
                }`}
              />

              <button
                type="submit"
                disabled={!userInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1"
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
              <span>Показать слово</span>
            </button>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Нажмите <kbd className="px-1 py-0.2 bg-white/[0.06] rounded border border-white/[0.1] font-mono text-[9px]">Enter</kbd>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats helper */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 border-t border-white/[0.06] pt-2">
        <span>Ошибок: <strong className="text-rose-400">{sessionMistakes}</strong></span>
        <span>Комбо: <strong className="text-amber-400">{combo}</strong></span>
      </div>
    </div>
  );
};
