import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  StatusBar,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import {
  GameState,
  formatTime,
  saveGame,
  clearGame,
  recordWin,
  recordGameStart,
  getSettings,
  AppSettings,
  WinResult,
} from '../utils/storage';
import { findHintCell } from '../utils/sudokuGenerator';
import { RootStackParamList } from '../../App';
import SudokuBoard from '../components/SudokuBoard';
import NumberPad from '../components/NumberPad';
import GameControls from '../components/GameControls';
import VictoryModal from '../components/VictoryModal';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type Route = RouteProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [game, setGame] = useState<GameState>(() => route.params.gameState);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isNewBestTime, setIsNewBestTime] = useState(false);
  const [isNewStreak, setIsNewStreak] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const startedRef = useRef(false);

  // Load settings
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Record game start (once)
  useEffect(() => {
    if (!startedRef.current && !game.isComplete && !game.isGameOver) {
      startedRef.current = true;
      if (!game.isDaily) {
        recordGameStart(game.difficulty);
      }
    }
  }, [game.isComplete, game.isDaily, game.isGameOver, game.difficulty]);

  // Timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGame((g) => {
        if (g.isComplete || g.isGameOver || g.isPaused) return g;
        return { ...g, timer: g.timer + 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!game.isComplete && !game.isGameOver && !isPaused) {
        startTimer();
      }
      return () => stopTimer();
    }, [game.isComplete, game.isGameOver, isPaused, startTimer, stopTimer])
  );

  // Back handler
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => handler.remove();
    }, [])
  );

  // Auto-save
  useEffect(() => {
    if (!game.isComplete && !game.isGameOver) {
      saveGame(game);
    }
  }, [game]);

  const handleBack = () => {
    stopTimer();
    setIsPaused(true);
    Alert.alert(t('game.quitConfirm'), t('game.quitConfirmMsg'), [
      {
        text: t('game.cancel'),
        onPress: () => {
          setIsPaused(false);
          startTimer();
        },
        style: 'cancel',
      },
      {
        text: t('game.quit'),
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startTimer();
    } else {
      stopTimer();
      setIsPaused(true);
    }
  };

  const handleCellPress = (idx: number) => {
    if (isPaused || game.isComplete || game.isGameOver) {
      setIsPaused(false);
      startTimer();
      return;
    }
    setGame((g) => ({ ...g, selectedCell: idx }));
  };

  const haptic = (type: 'success' | 'error' | 'light' = 'light') => {
    if (!settings?.hapticFeedback) return;
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const checkVictory = (newGame: GameState): boolean => {
    for (let i = 0; i < 81; i++) {
      if (newGame.given[i]) continue;
      if (newGame.userInput[i] !== newGame.solution[i]) return false;
    }
    return true;
  };

  const handleNumberPress = (num: number) => {
    setGame((g) => {
      if (g.selectedCell === null || g.given[g.selectedCell]) return g;
      const idx = g.selectedCell;

      // Pencil mode: toggle notes
      if (g.isPencilMode) {
        const prevNotes = [...(g.notes[idx] ?? [])];
        const newNotes = [...g.notes];
        const noteSet = new Set(newNotes[idx] ?? []);
        if (noteSet.has(num)) noteSet.delete(num);
        else noteSet.add(num);
        newNotes[idx] = Array.from(noteSet).sort((a, b) => a - b);

        haptic('light');
        return {
          ...g,
          notes: newNotes,
          history: [
            ...g.history.slice(-50),
            { cellIndex: idx, prevValue: g.userInput[idx], prevNotes: prevNotes },
          ],
        };
      }

      // Normal mode
      const prevValue = g.userInput[idx];
      if (prevValue === num) return g; // Same number, no change

      const newInput = [...g.userInput];
      newInput[idx] = num;

      // Clear notes for this cell
      const newNotes = [...g.notes];
      newNotes[idx] = [];

      let newMistakes = g.mistakes;
      let newMaxMistakes = g.maxMistakes;

      const isError = settings?.autoCheckErrors && num !== g.solution[idx];
      if (isError) {
        newMistakes++;
        haptic('error');
        // Trigger shake via ref
        setTimeout(() => {
          (SudokuBoard as any)._shakeCell?.(idx);
        }, 0);
      } else {
        haptic('light');
      }

      const updatedGame: GameState = {
        ...g,
        userInput: newInput,
        notes: newNotes,
        mistakes: newMistakes,
        isGameOver: newMistakes >= newMaxMistakes,
        history: [
          ...g.history.slice(-50),
          { cellIndex: idx, prevValue, prevNotes: g.notes[idx] ?? [] },
        ],
      };

      // Check victory
      if (!isError && checkVictory(updatedGame)) {
        updatedGame.isComplete = true;
        stopTimer();
        clearGame();
        // Record win asynchronously
        recordWin(g.difficulty, updatedGame.timer, g.isDaily, g.dailyDate).then((result) => {
          setIsNewBestTime(result.isNewBest);
          setIsNewStreak(result.isNewStreak);
          setStreakCount(result.streak);
        });
        setTimeout(() => {
          haptic('success');
          setShowVictory(true);
        }, 400);
      } else if (updatedGame.isGameOver) {
        stopTimer();
        clearGame();
        setTimeout(() => {
          Alert.alert(t('game.gameOver'), t('game.gameOverMsg'), [
            { text: t('game.tryAgain'), onPress: () => navigation.goBack() },
          ]);
        }, 200);
      }

      return updatedGame;
    });
  };

  const handleErase = () => {
    setGame((g) => {
      if (g.selectedCell === null || g.given[g.selectedCell]) return g;
      const idx = g.selectedCell;
      const prevValue = g.userInput[idx];
      const prevNotes = [...(g.notes[idx] ?? [])];
      if (prevValue === null && prevNotes.length === 0) return g;

      const newInput = [...g.userInput];
      newInput[idx] = null;
      const newNotes = [...g.notes];
      newNotes[idx] = [];

      haptic('light');
      return {
        ...g,
        userInput: newInput,
        notes: newNotes,
        history: [
          ...g.history.slice(-50),
          { cellIndex: idx, prevValue, prevNotes },
        ],
      };
    });
  };

  const handleUndo = () => {
    setGame((g) => {
      if (g.history.length === 0) return g;
      const last = g.history[g.history.length - 1];
      const newInput = [...g.userInput];
      newInput[last.cellIndex] = last.prevValue;
      const newNotes = [...g.notes];
      newNotes[last.cellIndex] = last.prevNotes;

      haptic('light');
      return {
        ...g,
        userInput: newInput,
        notes: newNotes,
        mistakes: Math.max(0, g.mistakes - (
          g.userInput[last.cellIndex] !== null &&
          settings?.autoCheckErrors &&
          g.userInput[last.cellIndex] !== g.solution[last.cellIndex] ? 1 : 0
        )),
        history: g.history.slice(0, -1),
        selectedCell: last.cellIndex,
      };
    });
  };

  const handleTogglePencil = () => {
    haptic('light');
    setGame((g) => ({ ...g, isPencilMode: !g.isPencilMode }));
  };

  const handleHint = () => {
    const maxHints = settings?.maxHints ?? 3;
    if (maxHints > 0 && game.hintsUsed >= maxHints) {
      Alert.alert(t('game.noHints'));
      return;
    }
    if (game.selectedCell === null || game.given[game.selectedCell]) {
      // Find best cell automatically
      const bestIdx = findHintCell(game.puzzle, game.userInput, game.solution);
      if (bestIdx === null) return;
      applyHint(bestIdx);
      return;
    }
    if (game.userInput[game.selectedCell] === game.solution[game.selectedCell]) {
      // Already correct, find another cell
      const bestIdx = findHintCell(game.puzzle, game.userInput, game.solution);
      if (bestIdx === null) return;
      applyHint(bestIdx);
      return;
    }
    applyHint(game.selectedCell);
  };

  const applyHint = (idx: number) => {
    haptic('success');
    setGame((g) => {
      const newInput = [...g.userInput];
      newInput[idx] = g.solution[idx];
      const newNotes = [...g.notes];
      newNotes[idx] = [];

      const updatedGame: GameState = {
        ...g,
        userInput: newInput,
        notes: newNotes,
        hintsUsed: g.hintsUsed + 1,
        selectedCell: idx,
        history: [
          ...g.history.slice(-50),
          { cellIndex: idx, prevValue: g.userInput[idx], prevNotes: g.notes[idx] ?? [] },
        ],
      };

      if (checkVictory(updatedGame)) {
        updatedGame.isComplete = true;
        stopTimer();
        clearGame();
        setTimeout(() => {
          haptic('success');
          setShowVictory(true);
        }, 400);
      }

      return updatedGame;
    });
  };

  const handlePlayAgain = () => {
    setShowVictory(false);
    navigation.goBack();
  };

  const handleHome = () => {
    setShowVictory(false);
    navigation.goBack();
  };

  const getTitle = () => {
    if (game.isDaily) return t('game.daily', { date: game.dailyDate ?? '' });
    return t(`game.${game.difficulty}`);
  };

  const mistakeIcons = Array(game.maxMistakes).fill(null).map((_, i) => i < game.mistakes);

  if (!settings) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color={colors.accent} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getTitle()}</Text>
            {settings.showTimer && (
              <Text style={[styles.timer, { color: colors.textSecondary }]}>
                {formatTime(game.timer)}
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={handlePause} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Mistakes */}
        {settings.showMistakes && (
          <View style={styles.mistakesRow}>
            <Text style={[styles.mistakesLabel, { color: colors.textSecondary }]}>
              {t('game.mistakes')}:
            </Text>
            <View style={styles.mistakeDots}>
              {mistakeIcons.map((isUsed, i) => (
                <Ionicons
                  key={i}
                  name={isUsed ? 'close-circle' : 'close-circle-outline'}
                  size={22}
                  color={isUsed ? colors.cellErrorText : colors.textTertiary}
                />
              ))}
            </View>
          </View>
        )}

        {/* Board */}
        <View style={styles.boardWrap}>
          <SudokuBoard
            gameState={game}
            settings={{
              autoCheckErrors: settings.autoCheckErrors,
              highlightSameNumbers: settings.highlightSameNumbers,
              highlightRelatedCells: settings.highlightRelatedCells,
            }}
            onCellPress={handleCellPress}
          />

          {/* Pause overlay */}
          {isPaused && (
            <TouchableOpacity
              style={[styles.pauseOverlay, { backgroundColor: colors.background + 'EE' }]}
              onPress={handlePause}
              activeOpacity={1}
            >
              <Text style={[styles.pausedText, { color: colors.text }]}>{t('game.paused')}</Text>
              <Text style={[styles.pausedSub, { color: colors.textSecondary }]}>
                {t('game.tapToResume')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Controls + Numpad */}
        <View style={styles.controls}>
          <GameControls
            gameState={game}
            settings={{ maxHints: settings.maxHints }}
            onUndo={handleUndo}
            onErase={handleErase}
            onTogglePencil={handleTogglePencil}
            onHint={handleHint}
          />
          <View style={{ height: 16 }} />
          <NumberPad gameState={game} onNumberPress={handleNumberPress} />
        </View>
      </SafeAreaView>

      <VictoryModal
        visible={showVictory}
        time={game.timer}
        mistakes={game.mistakes}
        hintsUsed={game.hintsUsed}
        isNewBestTime={isNewBestTime}
        isNewStreak={isNewStreak}
        streakCount={streakCount}
        isDaily={game.isDaily}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  timer: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  mistakesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  mistakesLabel: { fontSize: 13, fontWeight: '500' },
  mistakeDots: { flexDirection: 'row', gap: 4 },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  pausedText: { fontSize: 28, fontWeight: '700' },
  pausedSub: { fontSize: 15, marginTop: 8 },
  controls: { paddingBottom: 8 },
});
