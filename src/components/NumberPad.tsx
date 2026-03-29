import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { GameState } from '../utils/storage';

interface Props {
  gameState: GameState;
  onNumberPress: (num: number) => void;
  onNumberLongPress: (num: number) => void;
  lockedNumber: number | null;
}

export default function NumberPad({ gameState, onNumberPress, onNumberLongPress, lockedNumber }: Props) {
  const { scheme } = useTheme();
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const PAD_WIDTH = Math.min(width - 32, 540);
  const BTN_SIZE = Math.floor((PAD_WIDTH - 8 * 6) / 9);

  const { puzzle, userInput, given } = gameState;

  // Count how many of each number are already placed
  const counts = Array(10).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = given[i] ? puzzle[i] : (userInput[i] ?? 0);
    if (v > 0) counts[v]++;
  }

  return (
    <View style={[styles.pad, { width: PAD_WIDTH }]}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
        const remaining = 9 - counts[num];
        const isDisabled = remaining <= 0;

        const isLocked = lockedNumber === num;

        return (
          <TouchableOpacity
            key={num}
            activeOpacity={0.6}
            onPress={() => {
              if (isDisabled) return;
              // When a number is locked, any tap writes the locked number
              onNumberPress(lockedNumber !== null ? lockedNumber : num);
            }}
            onLongPress={() => !isDisabled && onNumberLongPress(num)}
            delayLongPress={400}
            style={[
              styles.btn,
              {
                width: BTN_SIZE,
                height: BTN_SIZE + 14,
                backgroundColor: isLocked ? colors.accent : colors.numpadBg,
                opacity: isDisabled ? 0.3 : 1,
                borderColor: isLocked ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.btnNum,
                {
                  color: isLocked ? '#FFFFFF' : (isDisabled ? colors.numpadDisabled : colors.numpadText),
                  fontSize: BTN_SIZE * 0.48,
                },
              ]}
            >
              {num}
            </Text>
            {!isDisabled && (
              <Text style={[styles.btnCount, { color: isLocked ? '#FFFFFFAA' : colors.textTertiary }]}>
                {remaining}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  btn: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
  },
  btnNum: {
    fontWeight: '600',
    includeFontPadding: false,
  },
  btnCount: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
