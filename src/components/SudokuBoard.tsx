import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { GameState } from '../utils/storage';

interface Props {
  gameState: GameState;
  settings: {
    autoCheckErrors: boolean;
    highlightSameNumbers: boolean;
    highlightRelatedCells: boolean;
  };
  onCellPress: (index: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 28, 420);
const BOX_GAP = 2;
const CELL_GAP = 1;
const BOX_SIZE = (BOARD_SIZE - BOX_GAP * 2) / 3;
const CELL_SIZE = (BOX_SIZE - CELL_GAP * 2) / 3;

export default function SudokuBoard({ gameState, settings, onCellPress }: Props) {
  const { scheme } = useTheme();
  const colors = Colors[scheme];

  // Shake animation for mistakes
  const shakeAnims = useRef(
    Array.from({ length: 81 }, () => new Animated.Value(0))
  ).current;

  const shakeCell = useCallback((idx: number) => {
    const anim = shakeAnims[idx];
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [shakeAnims]);

  // Expose shakeCell through a ref so GameScreen can call it
  useEffect(() => {
    (SudokuBoard as any)._shakeCell = shakeCell;
  }, [shakeCell]);

  const { puzzle, solution, userInput, notes, given, selectedCell } = gameState;

  // Determine cell state for coloring
  const getCellState = (idx: number) => {
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const selRow = selectedCell !== null ? Math.floor(selectedCell / 9) : -1;
    const selCol = selectedCell !== null ? selectedCell % 9 : -1;
    const selBox = selectedCell !== null
      ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3)
      : -1;
    const myBox = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    const isSelected = idx === selectedCell;
    const value = given[idx] ? puzzle[idx] : (userInput[idx] ?? 0);
    const selValue = selectedCell !== null
      ? (given[selectedCell] ? puzzle[selectedCell] : (userInput[selectedCell] ?? 0))
      : 0;

    const isSameNumber =
      settings.highlightSameNumbers &&
      !isSelected &&
      selValue !== 0 &&
      value === selValue;

    const isRelated =
      settings.highlightRelatedCells &&
      !isSelected &&
      !isSameNumber &&
      selectedCell !== null &&
      (row === selRow || col === selCol || myBox === selBox);

    const hasError =
      settings.autoCheckErrors &&
      !given[idx] &&
      userInput[idx] !== null &&
      userInput[idx] !== solution[idx];

    return { isSelected, isSameNumber, isRelated, hasError, value };
  };

  const renderCell = (row: number, col: number) => {
    const idx = row * 9 + col;
    const { isSelected, isSameNumber, isRelated, hasError, value } = getCellState(idx);
    const isGiven = given[idx];
    const cellNotes = notes[idx] ?? [];
    const hasNotes = !value && cellNotes.length > 0;

    let bgColor = colors.cellBg;
    if (isSelected) bgColor = colors.cellSelected;
    else if (hasError) bgColor = colors.cellError;
    else if (isSameNumber) bgColor = colors.cellSameNum;
    else if (isRelated) bgColor = colors.cellHighlight;

    let textColor = isGiven ? colors.givenText : colors.userText;
    if (hasError) textColor = colors.cellErrorText;
    if (isSelected) textColor = '#FFFFFF';

    return (
      <Animated.View
        key={idx}
        style={{ transform: [{ translateX: shakeAnims[idx] }] }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onCellPress(idx)}
          style={[
            styles.cell,
            {
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: bgColor,
            },
          ]}
        >
          {hasNotes ? (
            <View style={styles.notesGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <Text
                  key={n}
                  style={[
                    styles.noteNum,
                    {
                      color: cellNotes.includes(n)
                        ? isSelected ? '#FFFFFF' : colors.userText
                        : 'transparent',
                    },
                  ]}
                >
                  {n}
                </Text>
              ))}
            </View>
          ) : value !== 0 ? (
            <Text
              style={[
                styles.cellNum,
                {
                  color: textColor,
                  fontWeight: isGiven ? '700' : '500',
                  fontSize: CELL_SIZE * 0.52,
                },
              ]}
            >
              {value}
            </Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.board,
        {
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          backgroundColor: colors.boardBorderThick,
          gap: BOX_GAP,
        },
      ]}
    >
      {/* 3 bands (row groups) */}
      {[0, 1, 2].map((bandIdx) => (
        <View key={bandIdx} style={[styles.band, { gap: BOX_GAP }]}>
          {/* 3 stacks (col groups) per band = 3 boxes */}
          {[0, 1, 2].map((stackIdx) => (
            <View
              key={stackIdx}
              style={[
                styles.box,
                {
                  width: BOX_SIZE,
                  height: BOX_SIZE,
                  backgroundColor: colors.boardBorder,
                  gap: CELL_GAP,
                },
              ]}
            >
              {[0, 1, 2].map((rowInBox) => (
                <View key={rowInBox} style={[styles.boxRow, { gap: CELL_GAP }]}>
                  {[0, 1, 2].map((colInBox) => {
                    const row = bandIdx * 3 + rowInBox;
                    const col = stackIdx * 3 + colInBox;
                    return renderCell(row, col);
                  })}
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: 12,
    overflow: 'hidden',
    padding: 2,
    flexDirection: 'column',
    alignSelf: 'center',
  },
  band: {
    flexDirection: 'row',
    flex: 1,
  },
  box: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 1,
  },
  boxRow: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNum: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  notesGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  noteNum: {
    width: '33.33%',
    textAlign: 'center',
    fontSize: CELL_SIZE * 0.22,
    lineHeight: CELL_SIZE * 0.31,
    includeFontPadding: false,
  },
});
