import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  id: string;
  puzzle: number[];
  solution: number[];
  userInput: (number | null)[];
  notes: number[][];           // notes[i] = array of candidate numbers
  given: boolean[];
  selectedCell: number | null;
  difficulty: Difficulty;
  isDaily: boolean;
  dailyDate?: string;
  timer: number;               // Elapsed seconds
  mistakes: number;
  maxMistakes: number;
  hintsUsed: number;
  isPencilMode: boolean;
  isPaused: boolean;
  isComplete: boolean;
  isGameOver: boolean;
  history: HistoryEntry[];
  createdAt: number;
}

export interface HistoryEntry {
  cellIndex: number;
  prevValue: number | null;
  prevNotes: number[];
}

export interface DifficultyStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number;      // 0 = no record
  totalTime: number;
  currentStreak: number;
  bestStreak: number;
  lastWonDate: string;
}

export interface AppStats {
  easy: DifficultyStats;
  medium: DifficultyStats;
  hard: DifficultyStats;
  daily: {
    totalCompleted: number;
    currentStreak: number;
    bestStreak: number;
    lastCompletedDate: string;
  };
}

export interface AppSettings {
  language: string;
  theme: 'auto' | 'light' | 'dark';
  autoCheckErrors: boolean;
  highlightSameNumbers: boolean;
  highlightRelatedCells: boolean;
  hapticFeedback: boolean;
  maxHints: number;
  showTimer: boolean;
  showMistakes: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DIFF_STATS: DifficultyStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestTime: 0,
  totalTime: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastWonDate: '',
};

const DEFAULT_STATS: AppStats = {
  easy: { ...DEFAULT_DIFF_STATS },
  medium: { ...DEFAULT_DIFF_STATS },
  hard: { ...DEFAULT_DIFF_STATS },
  daily: {
    totalCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: '',
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  language: 'auto',
  theme: 'auto',
  autoCheckErrors: true,
  highlightSameNumbers: true,
  highlightRelatedCells: true,
  hapticFeedback: true,
  maxHints: 3,
  showTimer: true,
  showMistakes: true,
};

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  game: '@sudoku:game',
  stats: '@sudoku:stats',
  settings: '@sudoku:settings',
};

// ─── Game ─────────────────────────────────────────────────────────────────────

export async function saveGame(state: GameState): Promise<void> {
  await AsyncStorage.setItem(KEYS.game, JSON.stringify(state));
}

export async function loadGame(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(KEYS.game);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export async function clearGame(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.game);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<AppStats> {
  const raw = await AsyncStorage.getItem(KEYS.stats);
  if (!raw) return { ...DEFAULT_STATS };
  try {
    const stored = JSON.parse(raw) as AppStats;
    // Merge with defaults to handle new fields
    return {
      easy: { ...DEFAULT_DIFF_STATS, ...stored.easy },
      medium: { ...DEFAULT_DIFF_STATS, ...stored.medium },
      hard: { ...DEFAULT_DIFF_STATS, ...stored.hard },
      daily: { ...DEFAULT_STATS.daily, ...stored.daily },
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export async function saveStats(stats: AppStats): Promise<void> {
  await AsyncStorage.setItem(KEYS.stats, JSON.stringify(stats));
}

export interface WinResult {
  isNewBest: boolean;
  isNewStreak: boolean;
  streak: number;
}

export async function recordWin(
  difficulty: Difficulty,
  timeSeconds: number,
  isDaily: boolean,
  dailyDate?: string
): Promise<WinResult> {
  const stats = await getStats();
  const today = new Date().toISOString().split('T')[0];
  let isNewBest = false;
  let isNewStreak = false;
  let streak = 0;

  if (isDaily && dailyDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];

    const d = stats.daily;
    d.totalCompleted++;
    if (d.lastCompletedDate === yesterdayKey || d.lastCompletedDate === '') {
      d.currentStreak++;
    } else if (d.lastCompletedDate !== today) {
      d.currentStreak = 1;
    }
    d.bestStreak = Math.max(d.bestStreak, d.currentStreak);
    d.lastCompletedDate = today;
    streak = d.currentStreak;
    isNewStreak = d.currentStreak >= 2;
  } else {
    const d = stats[difficulty];
    d.gamesWon++;
    d.totalTime += timeSeconds;
    if (d.bestTime === 0 || timeSeconds < d.bestTime) {
      d.bestTime = timeSeconds;
      isNewBest = true;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    if (d.lastWonDate === yesterdayKey || d.lastWonDate === '') {
      d.currentStreak++;
    } else if (d.lastWonDate !== today) {
      d.currentStreak = 1;
    }
    d.bestStreak = Math.max(d.bestStreak, d.currentStreak);
    d.lastWonDate = today;
    streak = d.currentStreak;
    isNewStreak = d.currentStreak >= 2;
  }

  await saveStats(stats);
  return { isNewBest, isNewStreak, streak };
}

export async function recordGameStart(difficulty: Difficulty): Promise<void> {
  const stats = await getStats();
  stats[difficulty].gamesPlayed++;
  await saveStats(stats);
}

export async function resetStats(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.stats);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
