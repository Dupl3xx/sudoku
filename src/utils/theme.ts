export interface ColorScheme {
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  separator: string;
  // Sudoku-specific
  accent: string;
  accentLight: string;
  accentDim: string;
  cellBg: string;
  cellSelected: string;
  cellHighlight: string;   // Same row/col/box
  cellSameNum: string;     // Same number
  cellError: string;
  cellErrorText: string;
  givenText: string;
  userText: string;
  boardBorder: string;
  boardBorderThick: string;
  // Controls
  controlBg: string;
  controlActive: string;
  numpadBg: string;
  numpadText: string;
  numpadDisabled: string;
  statusBar: 'light' | 'dark';
  // Diff colors
  easyColor: string;
  mediumColor: string;
  hardColor: string;
}

export const Colors: { light: ColorScheme; dark: ColorScheme } = {
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    cardSecondary: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6C6C70',
    textTertiary: '#AEAEB2',
    border: '#C6C6C8',
    separator: '#E5E5EA',

    accent: '#6366F1',
    accentLight: '#E8E8FF',
    accentDim: '#8183F4',
    cellBg: '#FFFFFF',
    cellSelected: '#6366F1',
    cellHighlight: '#EEEEFF',
    cellSameNum: '#D8D9FF',
    cellError: '#FFEEEC',
    cellErrorText: '#FF3B30',
    givenText: '#1C1C1E',
    userText: '#6366F1',
    boardBorder: '#D0D0D8',
    boardBorderThick: '#6C6C70',

    controlBg: '#EBEBF5',
    controlActive: '#6366F1',
    numpadBg: '#FFFFFF',
    numpadText: '#1C1C1E',
    numpadDisabled: '#AEAEB2',
    statusBar: 'dark',

    easyColor: '#34C759',
    mediumColor: '#FF9500',
    hardColor: '#FF3B30',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    cardSecondary: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',
    border: '#38383A',
    separator: '#38383A',

    accent: '#818CF8',
    accentLight: '#2A2B4E',
    accentDim: '#6366F1',
    cellBg: '#1C1C1E',
    cellSelected: '#6366F1',
    cellHighlight: '#252540',
    cellSameNum: '#1E1E3E',
    cellError: '#3D1A1A',
    cellErrorText: '#FF453A',
    givenText: '#FFFFFF',
    userText: '#818CF8',
    boardBorder: '#3A3A3C',
    boardBorderThick: '#6C6C70',

    controlBg: '#2C2C2E',
    controlActive: '#6366F1',
    numpadBg: '#1C1C1E',
    numpadText: '#FFFFFF',
    numpadDisabled: '#48484A',
    statusBar: 'light',

    easyColor: '#30D158',
    mediumColor: '#FF9F0A',
    hardColor: '#FF453A',
  },
};

export function resolveScheme(scheme: string | null | undefined): 'light' | 'dark' {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function getDifficultyColor(
  difficulty: 'easy' | 'medium' | 'hard',
  colors: ColorScheme
): string {
  switch (difficulty) {
    case 'easy': return colors.easyColor;
    case 'medium': return colors.mediumColor;
    case 'hard': return colors.hardColor;
  }
}
