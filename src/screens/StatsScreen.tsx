import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors, getDifficultyColor } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { getStats, AppStats, formatTime } from '../utils/storage';

type Difficulty = 'easy' | 'medium' | 'hard';

export default function StatsScreen() {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [stats, setStats] = useState<AppStats | null>(null);
  const [tab, setTab] = useState<Difficulty | 'daily'>('easy');

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
    }, [])
  );

  const tabs: { key: Difficulty | 'daily'; label: string }[] = [
    { key: 'easy', label: t('stats.easy') },
    { key: 'medium', label: t('stats.medium') },
    { key: 'hard', label: t('stats.hard') },
    { key: 'daily', label: t('stats.daily') },
  ];

  const renderDiffStats = (d: Difficulty) => {
    const s = stats?.[d];
    if (!s) return null;
    const winRate = s.gamesPlayed > 0 ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0;
    const avgTime = s.gamesWon > 0 ? Math.round(s.totalTime / s.gamesWon) : 0;
    const diffColor = getDifficultyColor(d, colors);

    return (
      <View>
        {/* Main ring */}
        <View style={[styles.ringCard, { backgroundColor: colors.card }]}>
          <View style={[styles.ring, { borderColor: diffColor }]}>
            <Text style={[styles.ringNum, { color: diffColor }]}>{winRate}%</Text>
            <Text style={[styles.ringLabel, { color: colors.textSecondary }]}>
              {t('stats.winRate')}
            </Text>
          </View>
          <View style={styles.ringStats}>
            <StatRow
              label={t('stats.played')}
              value={String(s.gamesPlayed)}
              colors={colors}
            />
            <StatRow
              label={t('stats.won')}
              value={String(s.gamesWon)}
              colors={colors}
            />
            <StatRow
              label={t('stats.bestTime')}
              value={s.bestTime ? formatTime(s.bestTime) : '—'}
              colors={colors}
              highlight={diffColor}
            />
            <StatRow
              label={t('stats.avgTime')}
              value={avgTime ? formatTime(avgTime) : '—'}
              colors={colors}
            />
            <StatRow
              label={t('stats.streak')}
              value={s.currentStreak > 0 ? `🔥 ${s.currentStreak}` : '0'}
              colors={colors}
            />
            <StatRow
              label={t('stats.bestStreak')}
              value={String(s.bestStreak)}
              colors={colors}
              isLast={true}
            />
          </View>
        </View>

        {s.gamesPlayed === 0 && (
          <Text style={[styles.noData, { color: colors.textTertiary }]}>
            {t('stats.noData')}
          </Text>
        )}
      </View>
    );
  };

  const renderDailyStats = () => {
    const s = stats?.daily;
    if (!s) return null;
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <StatRow label={t('stats.totalCompleted')} value={String(s.totalCompleted)} colors={colors} />
        <StatRow
          label={t('stats.streak')}
          value={s.currentStreak > 0 ? `🔥 ${s.currentStreak}` : '0'}
          colors={colors}
        />
        <StatRow
          label={t('stats.bestStreak')}
          value={String(s.bestStreak)}
          colors={colors}
          isLast={true}
        />
        {s.totalCompleted === 0 && (
          <Text style={[styles.noData, { color: colors.textTertiary }]}>
            {t('stats.noData')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('stats.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
          {tabs.map((tab_) => (
            <TouchableOpacity
              key={tab_.key}
              onPress={() => setTab(tab_.key)}
              activeOpacity={0.7}
              style={[
                styles.tab,
                tab === tab_.key && { borderBottomWidth: 2, borderBottomColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: tab === tab_.key ? colors.accent : colors.textSecondary,
                    fontWeight: tab === tab_.key ? '600' : '400',
                  },
                ]}
              >
                {tab_.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {stats && tab !== 'daily' && renderDiffStats(tab as Difficulty)}
          {stats && tab === 'daily' && renderDailyStats()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatRow({
  label,
  value,
  colors,
  highlight,
  isLast,
}: {
  label: string;
  value: string;
  colors: any;
  highlight?: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.statRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.separator,
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: highlight ?? colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: { fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 40 },
  ringCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  ring: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: { fontSize: 22, fontWeight: '800' },
  ringLabel: { fontSize: 11, fontWeight: '500' },
  ringStats: { flex: 1 },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 16, fontWeight: '600' },
  noData: { textAlign: 'center', marginTop: 16, fontSize: 14 },
});
