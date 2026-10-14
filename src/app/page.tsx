'use client';

import React, { useState, useEffect } from 'react';
import wordsData from '@/data/words.json';
import categoriesData from '@/data/categories.json';
import { WordItem, CategorySummary, AppStateData, WordProgress, LanguagePref, UserSettings } from '@/types/vocab';
import { storage } from '@/lib/storage';
import { soundFx } from '@/lib/soundFx';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { StudyCards } from '@/components/StudyCards';
import { HardcoreTrainer } from '@/components/HardcoreTrainer';
import { SentenceTrainer } from '@/components/SentenceTrainer';
import { MonologueViewer } from '@/components/MonologueViewer';
import { BatchSummaryModal } from '@/components/BatchSummaryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { DictionaryModal } from '@/components/DictionaryModal';

const allWords = wordsData as unknown as WordItem[];
const categories = categoriesData as unknown as CategorySummary[];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [appState, setAppState] = useState<AppStateData | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'study' | 'trainer' | 'sentences' | 'monologue'>('dashboard');
  const [selectedMonologueCategory, setSelectedMonologueCategory] = useState<CategorySummary | null>(null);
  
  // Trainer session parameters
  const [currentSession, setCurrentSession] = useState<{
    categoryId?: string;
    categoryTitle?: string;
    day: number;
    batch: number;
    words: WordItem[];           // Full batch of words
    activeQueue: WordItem[];     // Current words being studied / typed
    isRetryMode?: boolean;       // True if this is an error retry round
  } | null>(null);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [completedBatchStats, setCompletedBatchStats] = useState<{
    categoryId?: string;
    categoryTitle?: string;
    day: number;
    batch: number;
    totalTested: number;
    mistakes: number;
    masteredWords?: number;
    isSentencesMode?: boolean;
  } | null>(null);
  const [sessionNonce, setSessionNonce] = useState(1);

  // Initialize storage on client mount
  useEffect(() => {
    const initialState = storage.init();
    setAppState({ ...initialState });
    soundFx.setEnabled(initialState.settings.soundFx);
    setIsMounted(true);

    // Restore active session across page reloads on mobile
    try {
      const saved = sessionStorage.getItem('vocab_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.categoryId && parsed.batch) {
          const sessionWords = allWords.filter(
            w => w.categoryId === parsed.categoryId 
              ? w.categoryBatch === parsed.batch 
              : (String(w.day) === parsed.categoryId && w.batch === parsed.batch)
          );
          if (sessionWords.length > 0) {
            const cat = categories.find(c => c.id === parsed.categoryId);
            const queueIds = Array.isArray(parsed.activeQueueIds) ? parsed.activeQueueIds : null;
            const activeQueue = (queueIds && queueIds.length > 0)
              ? sessionWords.filter(w => queueIds.includes(w.id))
              : sessionWords;

            setCurrentSession({
              categoryId: parsed.categoryId,
              categoryTitle: cat ? cat.titleRu : undefined,
              day: cat ? cat.index : Number(parsed.categoryId) || 1,
              batch: parsed.batch,
              words: sessionWords,
              activeQueue: activeQueue.length > 0 ? activeQueue : sessionWords,
              isRetryMode: Boolean(parsed.isRetryMode),
            });
            if (['study', 'trainer', 'sentences'].includes(parsed.activeView)) {
              setActiveView(parsed.activeView);
            }
          }
        }
      }
    } catch {
      // Ignored
    }

    // Initial background sync with server
    storage.pullFromServer().then((synced) => {
      if (synced) {
        setAppState({ ...storage.getState() });
      }
    });
  }, []);

  // Save active session to sessionStorage so page refresh doesn't drop the user out
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (activeView !== 'dashboard' && currentSession?.categoryId && currentSession?.batch) {
        sessionStorage.setItem('vocab_active_session', JSON.stringify({
          categoryId: currentSession.categoryId,
          batch: currentSession.batch,
          activeView: activeView,
          isRetryMode: currentSession.isRetryMode,
          activeQueueIds: currentSession.activeQueue?.map(w => w.id) || [],
        }));
      } else {
        sessionStorage.removeItem('vocab_active_session');
      }
    } catch {
      // Ignored
    }
  }, [activeView, currentSession?.categoryId, currentSession?.batch, currentSession?.isRetryMode, currentSession?.activeQueue]);

  // Update sound settings when state changes
  useEffect(() => {
    if (appState) {
      soundFx.setEnabled(appState.settings.soundFx);
    }
  }, [appState?.settings.soundFx]);

  // Handle recording word answer
  const handleRecordResult = (wordId: number, isCorrect: boolean): WordProgress => {
    if (!appState) return { masteryLevel: 0, mistakesCount: 0, correctCount: 0, lastReviewed: '', isMastered: false };
    const res = storage.recordWordResult(wordId, isCorrect, appState.settings.strictLevel);
    setAppState({ ...storage.getState() });
    return res;
  };

  // Start words session for a category and batch -> Begins with Step 1 (Изучение)!
  const handleStartSession = (categoryId: string, batch: number) => {
    const sessionWords = allWords.filter(
      w => w.categoryId === categoryId 
        ? w.categoryBatch === batch 
        : (String(w.day) === categoryId && w.batch === batch)
    );
    if (sessionWords.length === 0) return;

    const cat = categories.find(c => c.id === categoryId);

    setCurrentSession({
      categoryId,
      categoryTitle: cat ? cat.titleRu : undefined,
      day: cat ? cat.index : Number(categoryId) || 1,
      batch,
      words: sessionWords,
      activeQueue: sessionWords,
      isRetryMode: false,
    });
    setSessionNonce(n => n + 1);
    setActiveView('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1 completed -> transition to Step 2 (Typing)!
  const handleFinishStudy = (wordsToTest: WordItem[]) => {
    if (!currentSession) return;
    setSessionNonce(n => n + 1);
    
    // If in retry mode (re-studying failed words), test ONLY those failed words!
    // If initial mode, test the full batch of words.
    const queueToTest = currentSession.isRetryMode
      ? (wordsToTest && wordsToTest.length > 0 ? wordsToTest : currentSession.activeQueue)
      : currentSession.words;

    setCurrentSession({
      ...currentSession,
      activeQueue: queueToTest,
      // Retain isRetryMode so Step 2 knows it is testing the retried mistakes
      isRetryMode: currentSession.isRetryMode,
    });
    setActiveView('trainer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 failed words callback -> Loop back to Step 1 for ONLY failed words!
  const handleNeedReStudy = (failedWords: WordItem[]) => {
    if (!currentSession) return;
    soundFx.triggerHaptic('error');
    setSessionNonce(n => n + 1);
    setCurrentSession({
      ...currentSession,
      activeQueue: failedWords,
      isRetryMode: true,
    });
    setActiveView('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 finished with 0 errors! -> Advance immediately to Step 3 (Sentences)!
  const handleFinishWordsBatch = (stats: { totalTested: number; mistakes: number; masteredWords: number }) => {
    if (!currentSession) return;
    soundFx.playSuccess();
    // Mark batch words as mastered immediately so progress is never lost even if user reloads!
    storage.markWordsAsMastered(currentSession.words.map(w => w.id));
    setAppState({ ...storage.getState() });
    setSessionNonce(n => n + 1);
    // Advance directly to Step 3 (SentenceTrainer) with the batch words!
    setCurrentSession({
      ...currentSession,
      activeQueue: currentSession.words,
      isRetryMode: false,
    });
    setActiveView('sentences');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start sentences session for a category and batch
  const handleStartSentencesSession = (categoryId: string, batch: number) => {
    const sessionWords = allWords.filter(
      w => w.categoryId === categoryId 
        ? w.categoryBatch === batch 
        : (String(w.day) === categoryId && w.batch === batch)
    );
    if (sessionWords.length === 0) return;

    const cat = categories.find(c => c.id === categoryId);

    setSessionNonce(n => n + 1);
    setCurrentSession({
      categoryId,
      categoryTitle: cat ? cat.titleRu : undefined,
      day: cat ? cat.index : Number(categoryId) || 1,
      batch,
      words: sessionWords,
      activeQueue: sessionWords,
      isRetryMode: false,
    });
    setActiveView('sentences');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open category monologue viewer
  const handleOpenMonologue = (category: CategorySummary) => {
    setSelectedMonologueCategory(category);
    setActiveView('monologue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start reviewing words that have mistakes
  const handleStartMistakesReview = () => {
    if (!appState) return;
    const mistakeWords = allWords.filter(w => {
      const p = appState.progress[w.id];
      return p && p.mistakesCount > 0 && !p.isMastered;
    });

    if (mistakeWords.length === 0) return;

    const reviewWords = mistakeWords.slice(0, 30);
    setCurrentSession({
      categoryId: undefined,
      categoryTitle: 'Повторение ошибок',
      day: 0,
      batch: 0,
      words: reviewWords,
      activeQueue: reviewWords,
      isRetryMode: true,
    });
    setActiveView('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 (Sentences) completion handler -> marks batch words mastered and triggers summary!
  const handleFinishSentences = (stats: { totalTested: number; mistakes: number }) => {
    if (!currentSession) return;
    // Mark words as mastered so the next batch unlocks!
    storage.markWordsAsMastered(currentSession.words.map(w => w.id));
    setAppState({ ...storage.getState() });

    setCompletedBatchStats({
      categoryId: currentSession.categoryId,
      categoryTitle: currentSession.categoryTitle,
      day: currentSession.day,
      batch: currentSession.batch,
      totalTested: stats.totalTested,
      mistakes: stats.mistakes,
      masteredWords: currentSession.words.length,
      isSentencesMode: true,
    });
  };

  // Advance to sentences of the current batch
  const handleTransitionToSentences = () => {
    if (!completedBatchStats) return;
    const { categoryId, day, batch } = completedBatchStats;
    setCompletedBatchStats(null);
    if (categoryId) {
      handleStartSentencesSession(categoryId, batch);
    } else {
      handleStartSentencesSession(String(day), batch);
    }
  };

  // Advance to next batch of words or to category monologue if at end
  const handleNextBatch = () => {
    if (!completedBatchStats) return;
    const { categoryId, batch } = completedBatchStats;
    setCompletedBatchStats(null);

    if (categoryId) {
      const currentCat = categories.find(c => c.id === categoryId);
      if (currentCat) {
        if (batch < currentCat.totalBatches) {
          handleStartSession(categoryId, batch + 1);
          return;
        } else {
          // Finished all batches in this category -> proceed directly to Monologue!
          setSelectedMonologueCategory(currentCat);
          setActiveView('monologue');
          return;
        }
      }
    }

    setActiveView('dashboard');
  };

  // Repeat current session (words or sentences)
  const handleRepeatCurrent = () => {
    if (!completedBatchStats) return;
    const { categoryId, day, batch, isSentencesMode } = completedBatchStats;
    setCompletedBatchStats(null);
    const targetCatId = categoryId || String(day);
    if (isSentencesMode) {
      handleStartSentencesSession(targetCatId, batch);
    } else {
      handleStartSession(targetCatId, batch);
    }
  };

  // Settings update handlers
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    storage.updateSettings(newSettings);
    setAppState({ ...storage.getState() });
  };

  const handleUpdateSyncId = (newSyncId: string) => {
    storage.setSyncId(newSyncId);
    setAppState({ ...storage.getState() });
  };

  const handleReloadState = () => {
    setAppState({ ...storage.getState() });
  };

  const handleResetProgress = async () => {
    await storage.resetProgress();
    setAppState({ ...storage.getState() });
    setCurrentSession(null);
    setCompletedBatchStats(null);
    setActiveView('dashboard');
    setShowSettings(false);
  };

  if (!isMounted || !appState) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] animate-pulse flex items-center justify-center mb-4">
          <span className="text-white font-bold text-sm tracking-tight">5K</span>
        </div>
        <p className="text-xs font-medium tracking-wide text-slate-400">
          Загрузка 5000 слов и сфер жизни...
        </p>
      </div>
    );
  }

  const isCurrentCategoryFinished = Boolean(
    completedBatchStats?.categoryId &&
    (() => {
      const cat = categories.find(c => c.id === completedBatchStats.categoryId);
      return cat && completedBatchStats.batch >= cat.totalBatches;
    })()
  );

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-200">
      {/* Global Header */}
      <Header
        stats={appState.stats}
        settings={appState.settings}
        syncId={appState.syncId}
        isCloudSynced={true}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDictionary={() => setShowDictionary(true)}
        onChangeLanguage={(lang: LanguagePref) => handleUpdateSettings({ language: lang })}
        onHomeClick={() => setActiveView('dashboard')}
      />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-0 ${activeView === 'dashboard' ? 'overflow-y-auto pb-12' : 'overflow-hidden justify-center'}`}>
        {activeView === 'dashboard' ? (
          <Dashboard
            categories={categories}
            allWords={allWords}
            progressMap={appState.progress}
            stats={appState.stats}
            onStartSession={handleStartSession}
            onStartSentencesSession={handleStartSentencesSession}
            onOpenMonologue={handleOpenMonologue}
            onStartMistakesReview={handleStartMistakesReview}
            onOpenDictionary={() => setShowDictionary(true)}
            onResetProgress={handleResetProgress}
          />
        ) : activeView === 'study' && currentSession ? (
          <StudyCards
            key={`study-${currentSession.batch}-${currentSession.isRetryMode ? 'retry' : 'init'}-${sessionNonce}`}
            words={currentSession.activeQueue}
            categoryTitle={currentSession.categoryTitle}
            batch={currentSession.batch}
            isRetryMode={currentSession.isRetryMode}
            settings={appState.settings}
            onFinishStudy={handleFinishStudy}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        ) : activeView === 'trainer' && currentSession ? (
          <HardcoreTrainer
            key={`trainer-${currentSession.batch}-${currentSession.isRetryMode ? 'retry' : 'init'}-${sessionNonce}`}
            day={currentSession.day}
            batch={currentSession.batch}
            categoryTitle={currentSession.categoryTitle}
            words={currentSession.activeQueue}
            isRetryMode={currentSession.isRetryMode}
            progressMap={appState.progress}
            settings={appState.settings}
            onRecordResult={handleRecordResult}
            onBackToDashboard={() => setActiveView('dashboard')}
            onNeedReStudy={handleNeedReStudy}
            onFinishBatch={handleFinishWordsBatch}
          />
        ) : activeView === 'sentences' && currentSession ? (
          <SentenceTrainer
            key={`sentences-${currentSession.batch}-${sessionNonce}`}
            day={currentSession.day}
            batch={currentSession.batch}
            categoryTitle={currentSession.categoryTitle}
            words={currentSession.words}
            settings={appState.settings}
            onBackToDashboard={() => setActiveView('dashboard')}
            onFinishSentences={handleFinishSentences}
          />
        ) : activeView === 'monologue' && selectedMonologueCategory ? (
          <MonologueViewer
            category={selectedMonologueCategory}
            settings={appState.settings}
            onBackToDashboard={() => setActiveView('dashboard')}
            onNextCategory={() => {
              const currentIdx = categories.findIndex(c => c.id === selectedMonologueCategory.id);
              if (currentIdx !== -1 && currentIdx + 1 < categories.length) {
                setSelectedMonologueCategory(categories[currentIdx + 1]);
              } else {
                setActiveView('dashboard');
              }
            }}
          />
        ) : null}
      </main>

      {/* Batch Completion Celebratory Modal */}
      {completedBatchStats && (
        <BatchSummaryModal
          stats={completedBatchStats}
          day={completedBatchStats.day}
          batch={completedBatchStats.batch}
          categoryTitle={completedBatchStats.categoryTitle}
          isLastBatchOfCategory={isCurrentCategoryFinished}
          isSentencesMode={completedBatchStats.isSentencesMode}
          onStartSentences={handleTransitionToSentences}
          onStartMonologue={() => {
            const cat = categories.find(c => c.id === completedBatchStats.categoryId);
            setCompletedBatchStats(null);
            if (cat) {
              setSelectedMonologueCategory(cat);
              setActiveView('monologue');
            }
          }}
          onNextBatch={handleNextBatch}
          onRepeatBatch={handleRepeatCurrent}
          onHome={() => {
            setCompletedBatchStats(null);
            setActiveView('dashboard');
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={appState.settings}
          syncId={appState.syncId}
          isCloudSynced={true}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={handleUpdateSettings}
          onUpdateSyncId={handleUpdateSyncId}
          onReloadState={handleReloadState}
          onResetProgress={handleResetProgress}
        />
      )}

      {/* Dictionary Modal */}
      {showDictionary && (
        <DictionaryModal
          words={allWords}
          progressMap={appState.progress}
          onClose={() => setShowDictionary(false)}
        />
      )}
    </div>
  );
}
