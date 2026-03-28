import 'react-native-gesture-handler';
import './src/i18n';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import { Colors } from './src/utils/theme';
import { GameState } from './src/utils/storage';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { gameState: GameState };
  Settings: undefined;
  Stats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { scheme } = useTheme();
  const colors = Colors[scheme];

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Navigation />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
