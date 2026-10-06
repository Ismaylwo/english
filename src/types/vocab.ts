export interface WordItem {
  id: number;
  en: string;
  cleanEn: string;
  accepted: string[];
  note?: string;
  level?: string;
  ru: string;
  tj: string;
  day: number;
  batch: number;
  dayIndex: number;
}

export interface DaySummary {
  day: number;
  totalWords: number;
  firstWord: string;
  lastWord: string;
  batches: {
    batch: number;
    count: number;
    sample: string[];
  }[];
}

export interface WordProgress {
  masteryLevel: number; // 0: new, 1: learning, 2: reviewed, 3: mastered
  mistakesCount: number;
  correctCount: number;
  lastReviewed: string; // ISO string
  isMastered: boolean;
}

export interface UserStats {
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayTestedCount: number;
  todayMasteredCount: number;
  todayDate: string; // YYYY-MM-DD
}

export type LanguagePref = 'ru' | 'tj' | 'both';

export interface UserSettings {
  language: LanguagePref;
  autoPronounce: boolean;
  soundFx: boolean;
  voiceSpeed: number; // 0.8 - 1.2
  strictLevel: number; // required mastery: 2 or 3
}

export interface AppStateData {
  syncId: string;
  progress: Record<number, WordProgress>;
  stats: UserStats;
  settings: UserSettings;
  updatedAt: string;
}
