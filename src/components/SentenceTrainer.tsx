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
  MessageSquareText
} from 'lucide-react';
import { WordItem, UserSettings } from '@/types/vocab';
import { soundFx } from '@/lib/soundFx';
import { speechService } from '@/lib/speech';
import { isAnswerCorrect } from './HardcoreTrainer';

interface SentenceQueueItem {
  word: WordItem;
  completed: boolean;
}

interface SentenceTrainerProps {
  day: number;
  batch: number;
  words: WordItem[];
  settings: UserSettings;
  onBackToDashboard: () => void;
  onFinishSentences: (stats: { totalTested: number; mistakes: number }) => void;
}

// Fisher-Yates shuffle
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
  words,
  settings,
  onBackToDashboard,
  onFinishSentences,
}) => {
  // Filter words that have valid examples
  const wordsWithExamples = words.filter(w => w.example && w.example.en);

  const [queue, setQueue] = useState<SentenceQueueItem[]>(() => {
    const shuffled = shuffleArray(wordsWithExamples);
    return shuffled.map(w => ({
      word: w,
      completed: false,
    }));
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [inputStatus, setInputStatus] = useState<'idle' | 'success' | 'error' | 'correction'>('idle');
  const [combo, setCombo] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [sessionTotalAnswers, setSessionTotalAnswers] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const currentItem = queue[currentIndex] || null;
  const currentWord = currentItem?.word || null;
  const example = currentWord?.example || null;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, inputStatus]);

  const speakFullSentence = () => {
    if (example?.en) {
      speechService.speak(example.en, settings.voiceSpeed);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || !example || !userInput.trim()) return;

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
      setMasteredCount(prev => prev + 1);

      // Pronounce whole sentence!
      if (settings.autoPronounce) {
        speakFullSentence();
      }

      setInputStatus('success');

      const updatedQueue = [...queue];
      updatedQueue[currentIndex] = {
        ...updatedQueue[currentIndex],
        completed: true,
      };

      setTimeout(() => {
        setInputStatus('idle');
        setUserInput('');
        setQueue(updatedQueue);
        advanceToNext(updatedQueue);
      }, 700);

    } else {
      soundFx.playError();
      soundFx.triggerHaptic('error');
      setCombo(0);
      setSessionMistakes(prev => prev + 1);

      speakFullSentence();
      setInputStatus('correction');

      // Re-queue 2-4 cards ahead
      const updatedQueue = [...queue];
      const remainingCount = updatedQueue.length - (currentIndex + 1);
      const offset = Math.min(
        remainingCount,
        Math.max(2, Math.floor(Math.random() * 3) + 2)
      );
      const insertIndex = currentIndex + 1 + offset;
      updatedQueue.splice(insertIndex, 0, {
        word: currentWord,
        completed: false,
      });

      setQueue(updatedQueue);
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

    const updatedQueue = [...queue];
    const remainingCount = updatedQueue.length - (currentIndex + 1);
    const offset = Math.min(
      remainingCount,
      Math.max(2, Math.floor(Math.random() * 3) + 2)
    );
    const insertIndex = currentIndex + 1 + offset;
    updatedQueue.splice(insertIndex, 0, {
      word: currentWord,
      completed: false,
    });
    setQueue(updatedQueue);
  };

  const advanceToNext = (latestQueue = queue) => {
    const remaining = latestQueue.filter(item => !item.completed);
    if (remaining.length === 0) {
      onFinishSentences({
        totalTested: sessionTotalAnswers + 1,
        mistakes: sessionMistakes,
      });
      return;
    }

    let nextIdx = currentIndex + 1;
    while (nextIdx < latestQueue.length && latestQueue[nextIdx].completed) {
      nextIdx++;
    }

    if (nextIdx >= latestQueue.length) {
      const firstUncompleted = latestQueue.findIndex(item => !item.completed);
      if (firstUncompleted !== -1) {
        setCurrentIndex(firstUncompleted);
      } else {
        onFinishSentences({
          totalTested: sessionTotalAnswers,
          mistakes: sessionMistakes,
        });
      }
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  if (!currentWord || !example) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Предложения освоены!</h2>
        <p className="text-slate-400 mb-6">Все предложения этого блока успешно закреплены.</p>
        <button
          onClick={onBackToDashboard}
          className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95"
        >
          Вернуться в меню
        </button>
      </div>
    );
  }

  const totalSentences = wordsWithExamples.length;
  const progressPercent = Math.min(100, Math.round((masteredCount / totalSentences) * 100));

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col min-h-[calc(100vh-65px)] justify-between">
      <div>
        {/* Navigation Bar */}
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
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800/80">
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Предложения • Блок {batch}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span className="font-medium">
              Предложений: <strong className="text-cyan-400 font-bold">{masteredCount}</strong> / {totalSentences}
            </span>
            <span className="font-mono text-cyan-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-indigo-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Context Challenge Card */}
        <div 
          className={`glass-panel rounded-3xl p-6 sm:p-8 relative transition-all duration-300 shadow-2xl ${
            inputStatus === 'error' || inputStatus === 'correction'
              ? 'border-rose-500/60 glow-rose animate-shake'
              : inputStatus === 'success'
              ? 'border-emerald-500/60 glow-emerald animate-pulse-glow'
              : 'border-slate-800 glow-cyan'
          }`}
        >
          {/* Header row in card */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Вставьте пропущенное слово
            </span>

            <button
              onClick={speakFullSentence}
              title="Прослушать предложение"
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-slate-700/80 transition-transform active:scale-90"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Sentence Display with Blank Slot */}
          <div className="text-center py-4">
            <div className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-4">
              <span>{example.prefix}</span>
              <span className={`inline-block mx-1.5 px-3 py-0.5 rounded-lg border-b-2 font-mono transition-all ${
                inputStatus === 'success'
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-400/30'
                  : inputStatus === 'correction'
                  ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                  : 'border-cyan-400 bg-cyan-500/10 text-cyan-300 min-w-[70px]'
              }`}>
                {inputStatus === 'success' ? (example.target || currentWord.en) : '_______'}
              </span>
              <span>{example.suffix}</span>
            </div>

            {/* Translation of Sentence */}
            {(settings.language === 'ru' || settings.language === 'both') && (
              <p className="text-sm sm:text-base text-slate-300 font-medium mb-1">
                {example.ru}
              </p>
            )}

            {(settings.language === 'tj' || settings.language === 'both') && example.tj && (
              <p className="text-xs sm:text-sm text-cyan-300/80 font-medium">
                {example.tj}
              </p>
            )}

            {/* Hint pill with target word translation & letter count */}
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400">
              <span>Слово: <strong className="text-white font-semibold">{currentWord.ru}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-cyan-400 font-medium">{currentWord.cleanEn.length} букв</span>
            </div>
          </div>

          {/* Correction Mode Box */}
          {inputStatus === 'correction' && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Правильный ответ:</span>
              </div>
              <div className="text-2xl font-mono font-bold text-rose-300 tracking-wider my-1">
                {example.target || currentWord.en}
              </div>
              <p className="text-xs text-rose-300/80 mt-1">
                Наберите слово, чтобы закрепить его в памяти:
              </p>
            </div>
          )}

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  inputStatus === 'correction' 
                    ? `Наберите "${example.target || currentWord.en}"` 
                    : 'Вставьте слово...'
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

            {/* Bottom buttons */}
            <div className="flex items-center gap-3 mt-4">
              {inputStatus !== 'correction' && (
                <button
                  type="button"
                  onClick={handleGiveUp}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Показать</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!userInput.trim() || inputStatus === 'success'}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                  inputStatus === 'correction'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                    : userInput.trim()
                    ? 'bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 hover:opacity-90 text-white shadow-indigo-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                <span>{inputStatus === 'correction' ? 'Подтвердить' : 'Проверить'}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        <p>
          💬 После каждого правильного ответа предложение озвучивается целиком.
        </p>
      </div>
    </div>
  );
};
