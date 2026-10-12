import { AppStateData, UserSettings, UserStats, WordProgress } from '@/types/vocab';

const STORAGE_KEY = 'vocab_master_state_v1';

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateSyncId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'user_' + crypto.randomUUID().slice(0, 8);
  }
  return 'user_' + Math.random().toString(36).substring(2, 10);
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'both',
  autoPronounce: true,
  soundFx: true,
  voiceSpeed: 0.95,
  strictLevel: 1, // 1 error-free cycle = mastered
};

const DEFAULT_STATS: UserStats = {
  streakDays: 1,
  lastActiveDate: getTodayKey(),
  todayTestedCount: 0,
  todayMasteredCount: 0,
  todayDate: getTodayKey(),
};

export function getDefaultState(): AppStateData {
  return {
    syncId: generateSyncId(),
    progress: {},
    stats: { ...DEFAULT_STATS },
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: new Date().toISOString(),
  };
}

export class StorageManager {
  private state: AppStateData;
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor() {
    this.state = getDefaultState();
  }

  public init(): AppStateData {
    if (typeof window === 'undefined') return this.state;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppStateData;
        this.state = {
          ...getDefaultState(),
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          stats: { ...DEFAULT_STATS, ...(parsed.stats || {}) },
        };
      } else {
        this.state = getDefaultState();
        this.saveLocal();
      }
    } catch {
      this.state = getDefaultState();
    }

    this.checkStreak();
    this.scheduleServerSync();
    return this.state;
  }

  public getState(): AppStateData {
    return this.state;
  }

  private checkStreak() {
    const today = getTodayKey();
    if (this.state.stats.todayDate !== today) {
      // Calculate day difference
      const last = new Date(this.state.stats.lastActiveDate).getTime();
      const curr = new Date(today).getTime();
      const diffDays = Math.round((curr - last) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        this.state.stats.streakDays += 1;
      } else if (diffDays > 1) {
        this.state.stats.streakDays = 1; // reset streak if missed a day
      }

      this.state.stats.todayDate = today;
      this.state.stats.todayTestedCount = 0;
      this.state.stats.todayMasteredCount = 0;
      this.saveLocal();
    }
  }

  public saveLocal() {
    if (typeof window === 'undefined') return;
    try {
      this.state.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public recordWordResult(wordId: number, isCorrect: boolean, strictLevel = 2): WordProgress {
    this.checkStreak();
    const now = new Date().toISOString();
    const prev = this.state.progress[wordId] || {
      masteryLevel: 0,
      mistakesCount: 0,
      correctCount: 0,
      lastReviewed: now,
      isMastered: false,
    };

    let newLevel = prev.masteryLevel;
    let becameMastered = false;

    if (isCorrect) {
      newLevel = Math.min(prev.masteryLevel + 1, strictLevel);
      if (newLevel >= strictLevel && !prev.isMastered) {
        becameMastered = true;
      }
    } else {
      // HARDCORE RULE: Any mistake drops mastery level back to 0!
      newLevel = 0;
    }

    const updated: WordProgress = {
      masteryLevel: newLevel,
      mistakesCount: isCorrect ? prev.mistakesCount : prev.mistakesCount + 1,
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
      lastReviewed: now,
      isMastered: becameMastered || (prev.isMastered && newLevel >= strictLevel),
    };

    this.state.progress[wordId] = updated;
    this.state.stats.todayTestedCount += 1;
    if (becameMastered) {
      this.state.stats.todayMasteredCount += 1;
    }
    this.state.stats.lastActiveDate = getTodayKey();

    this.saveLocal();
    this.scheduleServerSync();

    return updated;
  }

  public markWordsAsMastered(wordIds: number[]) {
    const now = new Date().toISOString();
    let newlyMastered = 0;
    for (const id of wordIds) {
      const prev = this.state.progress[id] || {
        masteryLevel: 0,
        mistakesCount: 0,
        correctCount: 0,
        lastReviewed: now,
        isMastered: false,
      };
      if (!prev.isMastered) {
        newlyMastered++;
      }
      this.state.progress[id] = {
        ...prev,
        masteryLevel: Math.max(prev.masteryLevel, 1),
        lastReviewed: now,
        isMastered: true,
      };
    }
    this.state.stats.todayMasteredCount += newlyMastered;
    this.state.stats.lastActiveDate = getTodayKey();
    this.saveLocal();
    this.scheduleServerSync();
  }

  public updateSettings(newSettings: Partial<UserSettings>) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveLocal();
    this.scheduleServerSync();
  }

  public setSyncId(newSyncId: string) {
    this.state.syncId = newSyncId.trim();
    this.saveLocal();
    this.pullFromServer();
  }

  public scheduleServerSync() {
    if (typeof window === 'undefined') return;
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.pushToServer();
    }, 1500); // 1.5s debounce
  }

  public async pushToServer(): Promise<boolean> {
    if (this.isSyncing || typeof window === 'undefined') return false;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncId: this.state.syncId,
          progress: this.state.progress,
          stats: this.state.stats,
          settings: this.state.settings,
          updatedAt: this.state.updatedAt,
        }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  public async pullFromServer(): Promise<boolean> {
    if (typeof window === 'undefined' || !this.state.syncId) return false;
    try {
      const res = await fetch(`/api/progress?syncId=${encodeURIComponent(this.state.syncId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.progress) {
          // Merge progress (keep higher mastery & timestamp)
          const mergedProgress = { ...this.state.progress, ...data.progress };
          this.state.progress = mergedProgress;
          if (data.stats) {
            this.state.stats = {
              ...this.state.stats,
              streakDays: Math.max(this.state.stats.streakDays, data.stats.streakDays || 1),
            };
          }
          this.saveLocal();
          return true;
        }
      }
    } catch {
      // Ignored
    }
    return false;
  }

  public exportBackupJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as AppStateData;
      if (parsed.progress && parsed.stats) {
        this.state = {
          ...getDefaultState(),
          ...parsed,
        };
        this.saveLocal();
        this.scheduleServerSync();
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
}

export const storage = new StorageManager();
