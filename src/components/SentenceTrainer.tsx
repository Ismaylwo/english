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

  const totalSentences = wordsWithExamples.length;
  const progressPercent = Math.min(100, Math.round((masteredCount / totalSentences) * 100));

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
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>{categoryTitle ? `${categoryTitle} • Фразы ${batch}` : `Предложения • Блок ${batch}`}</span>
            </div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>
              Предложений: <strong className="text-white font-medium">{masteredCount}</strong> из {totalSentences}
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sentence Challenge Card */}
        <div 
          className={`studio-surface rounded-2xl p-6 sm:p-8 relative transition-colors ${
            inputStatus === 'error' || inputStatus === 'correction'
              ? 'border-rose-500/50 animate-micro-shake'
              : inputStatus === 'success'
              ? 'border-emerald-500/50'
              : 'border-white/[0.08]'
          }`}
        >
          {/* Top meta */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium text-slate-400">
              Вставьте пропущенное слово
            </span>

            <button
              onClick={speakFullSentence}
              title="Прослушать предложение"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Focal Sentence Display */}
          <div className="text-center py-6">
            <div className="text-xl sm:text-2xl font-medium text-white leading-relaxed mb-4 max-w-lg mx-auto">
              <span>{example.prefix}</span>
              <span className={`inline-block mx-1.5 px-3 py-0.5 rounded font-mono transition-colors border-b-2 ${
                inputStatus === 'success'
                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                  : inputStatus === 'correction'
                  ? 'border-rose-400 bg-rose-500/15 text-rose-300'
                  : 'border-sky-400 bg-sky-500/10 text-sky-300 min-w-[60px]'
              }`}>
                {inputStatus === 'success' ? (example.target || currentWord.en) : '_____'}
              </span>
              <span>{example.suffix}</span>
            </div>

            {/* Sentence Translation */}
            {(settings.language === 'ru' || settings.language === 'both') && (
              <p className="text-sm text-slate-300 font-normal mb-1">
                {example.ru}
              </p>
            )}

            {(settings.language === 'tj' || settings.language === 'both') && example.tj && (
              <p className="text-xs text-sky-300/80 font-normal">
                {example.tj}
              </p>
            )}

            <div className="inline-flex items-center gap-2 mt-4 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400">
              <span>Слово: <strong className="text-white font-medium">{currentWord.ru}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-300">{currentWord.cleanEn.length} букв</span>
            </div>
          </div>

          {/* Correction guidance */}
          {inputStatus === 'correction' && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-rose-300 font-medium text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Правильный ответ:</span>
              </div>
              <div className="text-xl font-mono font-bold text-white tracking-wide my-1">
                {example.target || currentWord.en}
              </div>
              <p className="text-xs text-rose-300/80 mt-1">
                Наберите слово, чтобы закрепить его в памяти:
              </p>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  inputStatus === 'correction' 
                    ? `Наберите "${example.target || currentWord.en}"` 
                    : 'Вставьте английское слово'
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

            {/* Bottom buttons */}
            <div className="flex items-center gap-2.5 mt-4">
              {inputStatus !== 'correction' && (
                <button
                  type="button"
                  onClick={handleGiveUp}
                  className="flex-1 py-3 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Показать</span>
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
          После правильного ответа предложение полностью зачитывается вслух.
        </p>
      </div>
    </div>
  );
};
