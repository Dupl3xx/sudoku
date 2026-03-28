import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GameState } from '../utils/storage';

interface Props {
  gameState: GameState;
  settings: { maxHints: number };
  onUndo: () => void;
  onErase: () => void;
  onTogglePencil: () => void;
  onHint: () => void;
}

export default function GameControls({
  gameState,
  settings,
  onUndo,
  onErase,
  onTogglePencil,
  onHint,
}: Props) {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();

  const { isPencilMode, hintsUsed, history } = gameState;
  const maxHints = settings.maxHints;
  const hintsLeft = maxHints <= 0 ? Infinity : Math.max(0, maxHints - hintsUsed);
  const canUndo = history.length > 0;

  const controls = [
    {
      key: 'undo',
      icon: 'arrow-undo-outline' as const,
      label: t('game.undo'),
      onPress: onUndo,
      disabled: !canUndo,
      active: false,
    },
    {
      key: 'erase',
      icon: 'backspace-outline' as const,
      label: t('game.erase'),
      onPress: onErase,
      disabled: false,
      active: false,
    },
    {
      key: 'pencil',
      icon: 'pencil-outline' as const,
      label: t('game.pencil'),
      onPress: onTogglePencil,
      disabled: false,
      active: isPencilMode,
    },
    {
      key: 'hint',
      icon: 'bulb-outline' as const,
      label: maxHints <= 0
        ? t('game.hint')
        : hintsLeft > 0
          ? t('game.hints', { n: hintsLeft })
          : t('game.noHints'),
      onPress: onHint,
      disabled: maxHints > 0 && hintsLeft <= 0,
      active: false,
    },
  ];

  return (
    <View style={styles.row}>
      {controls.map((ctrl) => (
        <TouchableOpacity
          key={ctrl.key}
          activeOpacity={0.7}
          onPress={ctrl.onPress}
          disabled={ctrl.disabled}
          style={[
            styles.btn,
            {
              backgroundColor: ctrl.active ? colors.accent : colors.controlBg,
              opacity: ctrl.disabled ? 0.3 : 1,
            },
          ]}
        >
          <Ionicons
            name={ctrl.icon}
            size={24}
            color={ctrl.active ? '#FFFFFF' : colors.text}
          />
          <Text
            style={[
              styles.label,
              { color: ctrl.active ? '#FFFFFF' : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {ctrl.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    gap: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
