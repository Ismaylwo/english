'use client';

import React, { useState, useEffect } from 'react';
import wordsData from '@/data/words.json';
import daysSummaryData from '@/data/daysSummary.json';
import { WordItem, DaySummary, AppStateData, WordProgress, LanguagePref, UserSettings } from '@/types/vocab';
import { storage } from '@/lib/storage';
import { soundFx } from '@/lib/soundFx';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { HardcoreTrainer } from '@/components/HardcoreTrainer';
import { BatchSummaryModal } from '@/components/BatchSummaryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { DictionaryModal } from '@/components/DictionaryModal';

const allWords = wordsData as unknown as WordItem[];
const daysSummary = daysSummaryData as unknown as DaySummary[];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [appState, setAppState] = useState<AppStateData | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'trainer'>('dashboard');
  
  // Trainer session parameters
  const [currentSession, setCurrentSession] = useState<{
    day: number;
    batch: number;
    words: WordItem[];
    isMistakesMode?: boolean;
  } | null>(null);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [completedBatchStats, setCompletedBatchStats] = useState<{
    day: number;
    batch: number;
    totalTested: number;
    mistakes: number;
    masteredWords: number;
  } | null>(null);

  // Initialize storage on client mount
  useEffect(() => {
    const initialState = storage.init();
    setAppState({ ...initialState });
    soundFx.setEnabled(initialState.settings.soundFx);
    setIsMounted(true);

    // Initial background sync with server
    storage.pullFromServer().then((synced) => {
      if (synced) {
        setAppState({ ...storage.getState() });
      }
    });
  }, []);

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

  // Start training a specific day and batch
  const handleStartSession = (day: number, batch: number) => {
    const sessionWords = allWords.filter(w => w.day === day && w.batch === batch);
    if (sessionWords.length === 0) return;

    setCurrentSession({
      day,
      batch,
      words: sessionWords,
      isMistakesMode: false,
    });
    setActiveView('trainer');
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

    setCurrentSession({
      day: 0,
      batch: 0,
      words: mistakeWords.slice(0, 30), // review up to 30 mistake words per sprint
      isMistakesMode: true,
    });
    setActiveView('trainer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Batch completion handler
  const handleFinishBatch = (stats: { totalTested: number; mistakes: number; masteredWords: number }) => {
    if (!currentSession) return;
    setCompletedBatchStats({
      day: currentSession.day,
      batch: currentSession.batch,
      ...stats,
    });
  };

  // Advance to next batch
  const handleNextBatch = () => {
    if (!completedBatchStats) return;
    const { day, batch } = completedBatchStats;
    setCompletedBatchStats(null);

    // Find next batch or next day
    const currentDaySummary = daysSummary.find(d => d.day === day);
    const hasMoreBatchesInDay = currentDaySummary && batch < currentDaySummary.batches.length;

    if (hasMoreBatchesInDay) {
      handleStartSession(day, batch + 1);
    } else if (day < 30) {
      handleStartSession(day + 1, 1);
    } else {
      setActiveView('dashboard');
    }
  };

  // Repeat current batch
  const handleRepeatBatch = () => {
    if (!completedBatchStats) return;
    const { day, batch } = completedBatchStats;
    setCompletedBatchStats(null);
    handleStartSession(day, batch);
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

  if (!isMounted || !appState) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 animate-pulse flex items-center justify-center mb-4">
          <span className="text-white font-black">5K</span>
        </div>
        <p className="text-sm font-semibold tracking-wider text-slate-300">
          Загрузка 5000 слов и профиля...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
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
      <main className="flex-1 pb-12">
        {activeView === 'dashboard' ? (
          <Dashboard
            daysSummary={daysSummary}
            allWords={allWords}
            progressMap={appState.progress}
            stats={appState.stats}
            onStartSession={handleStartSession}
            onStartMistakesReview={handleStartMistakesReview}
            onOpenDictionary={() => setShowDictionary(true)}
          />
        ) : currentSession ? (
          <HardcoreTrainer
            day={currentSession.day}
            batch={currentSession.batch}
            words={currentSession.words}
            progressMap={appState.progress}
            settings={appState.settings}
            onRecordResult={handleRecordResult}
            onBackToDashboard={() => setActiveView('dashboard')}
            onFinishBatch={handleFinishBatch}
          />
        ) : null}
      </main>

      {/* Batch Completion Celebratory Modal */}
      {completedBatchStats && (
        <BatchSummaryModal
          stats={completedBatchStats}
          day={completedBatchStats.day}
          batch={completedBatchStats.batch}
          onNextBatch={handleNextBatch}
          onRepeatBatch={handleRepeatBatch}
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
