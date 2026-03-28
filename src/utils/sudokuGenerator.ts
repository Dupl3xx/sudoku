// ─────────────────────────────────────────────
//  Sudoku Generator & Solver
// ─────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  puzzle: number[];    // 81 cells, 0 = empty
  solution: number[];  // 81 cells, fully solved
  difficulty: Difficulty;
}

// A valid base Sudoku grid to transform
const BASE_GRID = [
  1,2,3, 4,5,6, 7,8,9,
  4,5,6, 7,8,9, 1,2,3,
  7,8,9, 1,2,3, 4,5,6,
  2,3,4, 5,6,7, 8,9,1,
  5,6,7, 8,9,1, 2,3,4,
  8,9,1, 2,3,4, 5,6,7,
  3,4,5, 6,7,8, 9,1,2,
  6,7,8, 9,1,2, 3,4,5,
  9,1,2, 3,4,5, 6,7,8,
];

// Seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate a random valid Sudoku solution using grid transformations
function generateSolution(rng: () => number): number[] {
  const grid = [...BASE_GRID];

  // 1. Shuffle rows within each band (3 bands of 3 rows)
  for (let band = 0; band < 3; band++) {
    const rowPerm = shuffle([0, 1, 2], rng);
    const slice = grid.slice(band * 27, band * 27 + 27);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 9; j++) {
        grid[band * 27 + i * 9 + j] = slice[rowPerm[i] * 9 + j];
      }
    }
  }

  // 2. Shuffle columns within each stack (3 stacks of 3 cols)
  for (let stack = 0; stack < 3; stack++) {
    const colPerm = shuffle([0, 1, 2], rng);
    const temp = [...grid];
    for (let i = 0; i < 3; i++) {
      for (let r = 0; r < 9; r++) {
        grid[r * 9 + stack * 3 + i] = temp[r * 9 + stack * 3 + colPerm[i]];
      }
    }
  }

  // 3. Shuffle entire bands
  const bandPerm = shuffle([0, 1, 2], rng);
  const temp2 = [...grid];
  for (let b = 0; b < 3; b++) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        grid[b * 27 + r * 9 + c] = temp2[bandPerm[b] * 27 + r * 9 + c];
      }
    }
  }

  // 4. Shuffle entire stacks
  const stackPerm = shuffle([0, 1, 2], rng);
  const temp3 = [...grid];
  for (let s = 0; s < 3; s++) {
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 9; r++) {
        grid[r * 9 + s * 3 + c] = temp3[r * 9 + stackPerm[s] * 3 + c];
      }
    }
  }

  // 5. Relabel numbers (permutation of 1-9)
  const numPerm = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  for (let i = 0; i < 81; i++) {
    grid[i] = numPerm[grid[i] - 1];
  }

  return grid;
}

// Check if placing `num` at position `idx` is valid in `board`
function isValidPlacement(board: number[], idx: number, num: number): boolean {
  const row = Math.floor(idx / 9);
  const col = idx % 9;

  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row * 9 + c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r * 9 + col] === num) return false;
  }
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r * 9 + c] === num) return false;
    }
  }

  return true;
}

// Count solutions, stop after `maxCount` (for uniqueness check)
function countSolutions(board: number[], maxCount = 2): number {
  const b = [...board];
  let count = 0;

  function solve(): void {
    if (count >= maxCount) return;

    // Find empty cell with fewest candidates (MRV heuristic)
    let bestIdx = -1;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if (b[i] !== 0) continue;
      let candidates = 0;
      for (let n = 1; n <= 9; n++) {
        if (isValidPlacement(b, i, n)) candidates++;
      }
      if (candidates === 0) return; // Dead end
      if (candidates < bestCount) {
        bestCount = candidates;
        bestIdx = i;
        if (candidates === 1) break;
      }
    }

    if (bestIdx === -1) {
      count++;
      return;
    }

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(b, bestIdx, num)) {
        b[bestIdx] = num;
        solve();
        b[bestIdx] = 0;
        if (count >= maxCount) return;
      }
    }
  }

  solve();
  return count;
}

// Get valid candidates for a cell
export function getCandidates(board: number[], idx: number): number[] {
  if (board[idx] !== 0) return [];
  const candidates: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (isValidPlacement(board, idx, n)) candidates.push(n);
  }
  return candidates;
}

// Difficulty -> clue count range
const CLUE_RANGES: Record<Difficulty, [number, number]> = {
  easy: [38, 44],
  medium: [30, 36],
  hard: [23, 28],
};

// Generate a puzzle with a unique solution
export function generatePuzzle(difficulty: Difficulty, seed?: number): Puzzle {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 31));
  const solution = generateSolution(rng);
  const puzzle = [...solution];

  const [minClues, maxClues] = CLUE_RANGES[difficulty];
  const targetClues = minClues + Math.floor(rng() * (maxClues - minClues + 1));
  const toRemove = 81 - targetClues;

  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  let removed = 0;

  for (const pos of positions) {
    if (removed >= toRemove) break;
    const val = puzzle[pos];
    puzzle[pos] = 0;

    if (countSolutions(puzzle, 2) === 1) {
      removed++;
    } else {
      puzzle[pos] = val; // Restore: removing this cell breaks uniqueness
    }
  }

  return { puzzle, solution, difficulty };
}

// Generate daily puzzle (same puzzle for everyone on a given date)
export function generateDailyPuzzle(date?: Date): Puzzle {
  const d = date ?? new Date();
  // Use medium difficulty for daily challenges
  // Seed based on date: YYYYMMDD
  const seed =
    d.getFullYear() * 10000 +
    (d.getMonth() + 1) * 100 +
    d.getDate() +
    42; // +42 for variety
  return generatePuzzle('medium', seed);
}

// Get today's daily challenge date key
export function getDailyDateKey(date?: Date): string {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Solve a board (returns solution or null if unsolvable)
export function solvePuzzle(board: number[]): number[] | null {
  const b = [...board];

  function solve(): boolean {
    let bestIdx = -1;
    let bestCount = 10;

    for (let i = 0; i < 81; i++) {
      if (b[i] !== 0) continue;
      let candidates = 0;
      for (let n = 1; n <= 9; n++) {
        if (isValidPlacement(b, i, n)) candidates++;
      }
      if (candidates === 0) return false;
      if (candidates < bestCount) {
        bestCount = candidates;
        bestIdx = i;
        if (candidates === 1) break;
      }
    }

    if (bestIdx === -1) return true; // All filled

    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(b, bestIdx, num)) {
        b[bestIdx] = num;
        if (solve()) return true;
        b[bestIdx] = 0;
      }
    }
    return false;
  }

  return solve() ? b : null;
}

// Find a "best hint" cell: cell with fewest candidates (easiest to determine)
export function findHintCell(puzzle: number[], userInput: (number | null)[], solution: number[]): number | null {
  let bestIdx = -1;
  let bestCandidates = 10;

  const board = puzzle.map((v, i) => (v !== 0 ? v : (userInput[i] ?? 0)));

  for (let i = 0; i < 81; i++) {
    if (puzzle[i] !== 0) continue;     // Skip given cells
    if (userInput[i] !== null) continue; // Skip already filled
    let candidates = 0;
    for (let n = 1; n <= 9; n++) {
      if (isValidPlacement(board, i, n)) candidates++;
    }
    if (candidates < bestCandidates) {
      bestCandidates = candidates;
      bestIdx = i;
      if (candidates === 1) break;
    }
  }

  return bestIdx === -1 ? null : bestIdx;
}
