import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Colors, getDifficultyColor } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import {
  loadGame,
  getStats,
  AppStats,
  GameState,
  formatTime,
} from '../utils/storage';
import { generatePuzzle, generateDailyPuzzle, getDailyDateKey } from '../utils/sudokuGenerator';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type Difficulty = 'easy' | 'medium' | 'hard';

export default function HomeScreen() {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [savedGame, setSavedGame] = useState<GameState | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGame().then((g) => {
        if (g && !g.isComplete && !g.isGameOver) setSavedGame(g);
        else setSavedGame(null);
      });
      getStats().then((s) => {
        setStats(s);
        const todayKey = getDailyDateKey();
        setDailyCompleted(s.daily.lastCompletedDate === todayKey);
      });
    }, [])
  );

  const startGame = (difficulty: Difficulty) => {
    const { puzzle, solution } = generatePuzzle(difficulty);
    const given = puzzle.map((v) => v !== 0);
    const gameState: GameState = {
      id: `${difficulty}-${Date.now()}`,
      puzzle,
      solution,
      userInput: Array(81).fill(null),
      notes: Array(81).fill([]),
      given,
      selectedCell: null,
      difficulty,
      isDaily: false,
      timer: 0,
      mistakes: 0,
      maxMistakes: 3,
      hintsUsed: 0,
      isPencilMode: false,
      isPaused: false,
      isComplete: false,
      isGameOver: false,
      history: [],
      createdAt: Date.now(),
    };
    navigation.navigate('Game', { gameState });
  };

  const startDaily = () => {
    const todayKey = getDailyDateKey();
    if (dailyCompleted) {
      Alert.alert(t('home.dailyDone'), '', [{ text: 'OK' }]);
      return;
    }
    const { puzzle, solution } = generateDailyPuzzle();
    const given = puzzle.map((v) => v !== 0);
    const gameState: GameState = {
      id: `daily-${todayKey}`,
      puzzle,
      solution,
      userInput: Array(81).fill(null),
      notes: Array(81).fill([]),
      given,
      selectedCell: null,
      difficulty: 'medium',
      isDaily: true,
      dailyDate: todayKey,
      timer: 0,
      mistakes: 0,
      maxMistakes: 3,
      hintsUsed: 0,
      isPencilMode: false,
      isPaused: false,
      isComplete: false,
      isGameOver: false,
      history: [],
      createdAt: Date.now(),
    };
    navigation.navigate('Game', { gameState });
  };

  const continueSaved = () => {
    if (savedGame) navigation.navigate('Game', { gameState: savedGame });
  };

  const difficulties: { key: Difficulty; icon: string; gradient: [string, string] }[] = [
    { key: 'easy', icon: '🌱', gradient: ['#30D158', '#34C759'] },
    { key: 'medium', icon: '⚡', gradient: ['#FF9F0A', '#FF9500'] },
    { key: 'hard', icon: '🔥', gradient: ['#FF453A', '#FF3B30'] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isTablet && { maxWidth: 640, alignSelf: 'center', width: '100%' },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{t('home.title')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('home.subtitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={[styles.settingsBtn, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Continue button */}
          {savedGame && (
            <TouchableOpacity
              onPress={continueSaved}
              activeOpacity={0.85}
              style={[styles.continueCard, { backgroundColor: colors.accentLight }]}
            >
              <View style={styles.continueLeft}>
                <Text style={[styles.continueLabel, { color: colors.accent }]}>
                  {t('home.continue')}
                </Text>
                <Text style={[styles.continueSub, { color: colors.accent + 'AA' }]}>
                  {t(`home.${savedGame.difficulty}`)} · {formatTime(savedGame.timer)}
                </Text>
              </View>
              <Ionicons name="play-circle" size={36} color={colors.accent} />
            </TouchableOpacity>
          )}

          {/* Difficulty section */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('home.chooseLevel').toUpperCase()}
          </Text>

          <View style={styles.diffCards}>
            {difficulties.map(({ key, icon, gradient }) => {
              const s = stats?.[key];
              const diffLabel = t(`home.${key}`);
              const desc = t(`home.${key}Desc`);
              const bestTime = s?.bestTime ? formatTime(s.bestTime) : '—';
              const streak = s?.currentStreak ?? 0;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => startGame(key)}
                  activeOpacity={0.85}
                  style={styles.diffCardWrap}
                >
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.diffCard}
                  >
                    <Text style={styles.diffIcon}>{icon}</Text>
                    <Text style={styles.diffLabel}>{diffLabel}</Text>
                    <Text style={styles.diffDesc}>{desc}</Text>
                    <View style={styles.diffStats}>
                      {streak > 0 && (
                        <Text style={styles.diffStatText}>
                          🔥 {streak}
                        </Text>
                      )}
                      {s?.bestTime ? (
                        <Text style={styles.diffStatText}>⏱ {bestTime}</Text>
                      ) : null}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Daily Challenge */}
          <TouchableOpacity
            onPress={startDaily}
            activeOpacity={0.85}
            style={[
              styles.dailyCard,
              {
                backgroundColor: dailyCompleted
                  ? colors.card
                  : colors.accent,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.dailyTitle,
                  { color: dailyCompleted ? colors.textSecondary : '#FFFFFF' },
                ]}
              >
                {dailyCompleted ? t('home.dailyDone') : t('home.daily')}
              </Text>
              {stats?.daily.currentStreak ? (
                <Text
                  style={[
                    styles.dailySub,
                    { color: dailyCompleted ? colors.textTertiary : '#FFFFFF99' },
                  ]}
                >
                  {t('home.streak', { n: stats.daily.currentStreak })}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name={dailyCompleted ? 'checkmark-circle' : 'calendar-outline'}
              size={28}
              color={dailyCompleted ? colors.easyColor : '#FFFFFF'}
            />
          </TouchableOpacity>

          {/* Quick stats */}
          {stats && (
            <View style={styles.quickStats}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                const s = stats[d];
                return (
                  <View
                    key={d}
                    style={[styles.quickStatCard, { backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.quickStatNum, { color: getDifficultyColor(d, colors) }]}>
                      {s.gamesWon}
                    </Text>
                    <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                      {t(`home.${d}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Stats button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Stats')}
            activeOpacity={0.7}
            style={[styles.statsBtn, { backgroundColor: colors.card }]}
          >
            <Ionicons name="stats-chart-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.statsBtnText, { color: colors.textSecondary }]}>
              {t('home.stats')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 4,
  },
  title: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  continueLeft: { gap: 4 },
  continueLabel: { fontSize: 17, fontWeight: '700' },
  continueSub: { fontSize: 13 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  diffCards: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  diffCardWrap: { flex: 1 },
  diffCard: {
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  diffIcon: { fontSize: 28 },
  diffLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  diffDesc: { fontSize: 11, color: '#FFFFFFCC', fontWeight: '500' },
  diffStats: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  diffStatText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  dailyTitle: { fontSize: 17, fontWeight: '700' },
  dailySub: { fontSize: 13, marginTop: 3 },
  quickStats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickStatCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  quickStatNum: { fontSize: 26, fontWeight: '800' },
  quickStatLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  statsBtnText: { flex: 1, fontSize: 15, fontWeight: '500' },
});
