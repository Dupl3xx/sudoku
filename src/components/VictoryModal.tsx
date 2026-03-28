import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/storage';

interface Props {
  visible: boolean;
  time: number;
  mistakes: number;
  hintsUsed: number;
  isNewBestTime: boolean;
  isNewStreak: boolean;
  streakCount: number;
  isDaily: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function VictoryModal({
  visible,
  time,
  mistakes,
  hintsUsed,
  isNewBestTime,
  isNewStreak,
  streakCount,
  isDaily,
  onPlayAgain,
  onHome,
}: Props) {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();

  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.7);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  const getTitle = () => {
    if (mistakes === 0 && hintsUsed === 0) return t('victory.excellent');
    if (mistakes <= 1) return t('victory.great');
    return t('victory.good');
  };

  const stars = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          {/* Stars */}
          <View style={styles.stars}>
            {[1, 2, 3].map((i) => (
              <Text key={i} style={[styles.star, { opacity: i <= stars ? 1 : 0.25 }]}>
                ⭐
              </Text>
            ))}
          </View>

          <Text style={[styles.title, { color: colors.accent }]}>
            {t('victory.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>{getTitle()}</Text>

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: colors.separator }]}>
            <StatItem
              label={t('victory.time')}
              value={formatTime(time)}
              color={colors.accent}
            />
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <StatItem
              label={t('victory.mistakes')}
              value={String(mistakes)}
              color={mistakes === 0 ? colors.easyColor : colors.mediumColor}
            />
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <StatItem
              label={t('victory.hints')}
              value={String(hintsUsed)}
              color={hintsUsed === 0 ? colors.easyColor : colors.textSecondary}
            />
          </View>

          {/* Badges */}
          {isNewBestTime && (
            <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>
                {t('victory.bestTime')}
              </Text>
            </View>
          )}
          {isNewStreak && streakCount >= 2 && (
            <View style={[styles.badge, { backgroundColor: '#FF9F0A22' }]}>
              <Text style={[styles.badgeText, { color: '#FF9F0A' }]}>
                {t('victory.newStreak', { n: streakCount })}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity
            onPress={onPlayAgain}
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {isDaily ? t('victory.home') : t('victory.playAgain')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onHome}
            style={[styles.secondaryBtn]}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
              {isDaily ? t('victory.daily') : t('victory.home')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
