import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import i18n, { SUPPORTED_LANGUAGES } from '../i18n';

import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { getSettings, saveSettings, resetStats, AppSettings } from '../utils/storage';

export default function SettingsScreen() {
  const { scheme, themeSetting, setThemeSetting } = useTheme();
  const colors = Colors[scheme];
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = async (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveSettings(updated);
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    update({ language: code });
  };

  const handleResetStats = () => {
    Alert.alert(t('stats.resetConfirm'), t('stats.resetMsg'), [
      { text: t('stats.cancel'), style: 'cancel' },
      {
        text: t('stats.resetOk'),
        style: 'destructive',
        onPress: () => resetStats(),
      },
    ]);
  };

  if (!settings) return null;

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const themeOptions: { key: 'auto' | 'light' | 'dark'; label: string }[] = [
    { key: 'auto', label: t('settings.themeAuto') },
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar === 'dark' ? 'dark-content' : 'light-content'} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Language */}
          <SectionHeader title={t('settings.language')} colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.langGrid}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = i18n.language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => changeLanguage(lang.code)}
                    activeOpacity={0.7}
                    style={[
                      styles.langBtn,
                      {
                        backgroundColor: isActive ? colors.accent : colors.cardSecondary,
                        borderWidth: isActive ? 0 : StyleSheet.hairlineWidth,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.langLabel,
                        { color: isActive ? '#FFFFFF' : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Theme */}
          <SectionHeader title={t('settings.theme')} colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.segmentRow}>
              {themeOptions.map((opt, i) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setThemeSetting(opt.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.segment,
                    {
                      backgroundColor:
                        themeSetting === opt.key ? colors.accent : 'transparent',
                      borderRightWidth: i < 2 ? StyleSheet.hairlineWidth : 0,
                      borderRightColor: colors.separator,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          themeSetting === opt.key ? '#FFFFFF' : colors.text,
                        fontWeight: themeSetting === opt.key ? '600' : '400',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gameplay */}
          <SectionHeader title={t('settings.gameplay')} colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <ToggleRow
              label={t('settings.autoCheck')}
              desc={t('settings.autoCheckDesc')}
              value={settings.autoCheckErrors}
              onChange={(v) => update({ autoCheckErrors: v })}
              colors={colors}
              accent={colors.accent}
              isLast={false}
            />
            <ToggleRow
              label={t('settings.highlightSame')}
              desc={t('settings.highlightSameDesc')}
              value={settings.highlightSameNumbers}
              onChange={(v) => update({ highlightSameNumbers: v })}
              colors={colors}
              accent={colors.accent}
              isLast={false}
            />
            <ToggleRow
              label={t('settings.highlightRelated')}
              desc={t('settings.highlightRelatedDesc')}
              value={settings.highlightRelatedCells}
              onChange={(v) => update({ highlightRelatedCells: v })}
              colors={colors}
              accent={colors.accent}
              isLast={false}
            />
            <ToggleRow
              label={t('settings.haptic')}
              value={settings.hapticFeedback}
              onChange={(v) => update({ hapticFeedback: v })}
              colors={colors}
              accent={colors.accent}
              isLast={false}
            />
            <ToggleRow
              label={t('settings.showTimer')}
              value={settings.showTimer}
              onChange={(v) => update({ showTimer: v })}
              colors={colors}
              accent={colors.accent}
              isLast={false}
            />
            <ToggleRow
              label={t('settings.showMistakes')}
              value={settings.showMistakes}
              onChange={(v) => update({ showMistakes: v })}
              colors={colors}
              accent={colors.accent}
              isLast={true}
            />
          </View>

          {/* Hints */}
          <SectionHeader title={t('settings.maxHints')} colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.hintRow}>
              {[1, 2, 3, 5, 0].map((n, i, arr) => {
                const label = n === 0 ? t('settings.unlimitedHints') : String(n);
                const isActive = settings.maxHints === n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => update({ maxHints: n })}
                    activeOpacity={0.7}
                    style={[
                      styles.hintBtn,
                      {
                        backgroundColor: isActive ? colors.accent : colors.cardSecondary,
                        borderWidth: isActive ? 0 : StyleSheet.hairlineWidth,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.hintBtnText,
                        { color: isActive ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* About */}
          <SectionHeader title={t('settings.about')} colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.text }]}>
                {t('settings.version', { v: version })}
              </Text>
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity
            onPress={handleResetStats}
            activeOpacity={0.7}
            style={[styles.resetBtn, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.resetText, { color: colors.cellErrorText }]}>
              {t('settings.reset')}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function ToggleRow({
  label, desc, value, onChange, colors, accent, isLast
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: any;
  accent: string;
  isLast: boolean;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
      ]}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
        {desc && (
          <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>{desc}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: accent }}
        thumbColor="#FFFFFF"
      />
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
  scroll: { padding: 20, paddingTop: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 16, overflow: 'hidden' },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 13, fontWeight: '500' },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: { fontSize: 14 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  hintRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  hintBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 48,
    alignItems: 'center',
  },
  hintBtnText: { fontSize: 14, fontWeight: '600' },
  aboutRow: { padding: 16 },
  aboutLabel: { fontSize: 15 },
  resetBtn: {
    marginTop: 24,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  resetText: { fontSize: 15, fontWeight: '600' },
});
