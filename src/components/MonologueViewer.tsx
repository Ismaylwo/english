'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  Play, 
  Pause, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { CategorySummary, UserSettings } from '@/types/vocab';
import { speechService } from '@/lib/speech';

interface MonologueViewerProps {
  category: CategorySummary;
  settings: UserSettings;
  onBackToDashboard: () => void;
  onNextCategory: () => void;
}

export const MonologueViewer: React.FC<MonologueViewerProps> = ({
  category,
  settings,
  onBackToDashboard,
  onNextCategory,
}) => {
  const monologue = category.monologue;
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);

  // Play individual sentence
  const speakSentence = (index: number) => {
    setActiveSentenceIndex(index);
    const sentence = monologue.sentences[index];
    if (sentence) {
      speechService.speak(sentence.en, settings.voiceSpeed).then(() => {
        if (!isPlayingAll) {
          setActiveSentenceIndex(null);
        }
      });
    }
  };

  // Play entire monologue sequentially
  const handleTogglePlayAll = async () => {
    if (isPlayingAll) {
      setIsPlayingAll(false);
      setActiveSentenceIndex(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setIsPlayingAll(true);

    for (let i = 0; i < monologue.sentences.length; i++) {
      setActiveSentenceIndex(i);
      await speechService.speak(monologue.sentences[i].en, settings.voiceSpeed);
      // Brief natural pause between sentences
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsPlayingAll(false);
    setActiveSentenceIndex(null);
  };

  // Stop speech if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const highlightWordsInSentence = (sentenceText: string, wordsToHighlight: string[]) => {
    if (!wordsToHighlight || wordsToHighlight.length === 0) {
      return <span>{sentenceText}</span>;
    }

    const regex = new RegExp(`\\b(${wordsToHighlight.join('|')})\\b`, 'gi');
    const parts = sentenceText.split(regex);

    return (
      <span>
        {parts.map((part, i) => {
          const isMatch = wordsToHighlight.some(w => w.toLowerCase() === part.toLowerCase());
          if (isMatch) {
            return (
              <span
                key={i}
                className="font-bold text-sky-400 bg-sky-500/10 px-1 py-0.5 rounded border border-sky-500/20 mx-0.5"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-65px)] justify-between animate-fade-in">
      <div>
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>В меню тем</span>
          </button>

          <div className="text-xs font-medium text-sky-300 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
            Тема {category.index} • Финальный монолог
          </div>
        </div>

        {/* Monologue Hero Header Card */}
        <div className="studio-surface rounded-2xl p-6 sm:p-7 mb-6 border border-white/[0.12] relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-sky-400 block mb-1">
                Финальная речь категории
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {monologue.titleEn}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {monologue.titleRu}
              </p>
              {monologue.titleTj && (
                <p className="text-xs text-sky-300/80 mt-0.5">
                  {monologue.titleTj}
                </p>
              )}
            </div>

            {/* Play All Button */}
            <button
              onClick={handleTogglePlayAll}
              className={`p-3 rounded-xl flex items-center gap-2 font-medium text-xs transition-colors shadow-lg ${
                isPlayingAll
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              }`}
            >
              {isPlayingAll ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Пауза</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Слушать всё</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-white/[0.08] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Слова из изученных блоков подсвечены. Нажмите на любое предложение, чтобы прослушать его отдельно.
            </span>
          </p>
        </div>

        {/* Sentences List */}
        <div className="space-y-3">
          {monologue.sentences.map((sent, idx) => {
            const isActive = activeSentenceIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => speakSentence(idx)}
                className={`studio-surface rounded-xl p-4 cursor-pointer transition-all border ${
                  isActive
                    ? 'border-sky-500/60 bg-sky-950/20'
                    : 'border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* English sentence with word highlights */}
                    <div className="text-base sm:text-lg font-medium text-white leading-relaxed mb-2">
                      {highlightWordsInSentence(sent.en, sent.highlightWords)}
                    </div>

                    {/* Translations */}
                    {(settings.language === 'ru' || settings.language === 'both') && (
                      <p className="text-xs sm:text-sm text-slate-300 font-normal mb-1">
                        {sent.ru}
                      </p>
                    )}

                    {(settings.language === 'tj' || settings.language === 'both') && sent.tj && (
                      <p className="text-xs text-sky-300/80 font-normal">
                        {sent.tj}
                      </p>
                    )}
                  </div>

                  {/* Speaker Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakSentence(idx);
                    }}
                    title="Прослушать"
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      isActive
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-white/[0.04] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Completion Actions */}
      <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="flex-1 py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors"
        >
          Вернуться к темам
        </button>

        <button
          onClick={onNextCategory}
          className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <span>Следующая тема</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
