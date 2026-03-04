import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useGameStore, LevelId } from './src/store';
import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { BadgesScreen } from './src/screens/BadgesScreen';
import { Level1Screen } from './src/screens/Level1';
import { Level2Screen } from './src/screens/Level2';
import { Level3Screen } from './src/screens/Level3';
import { Level4Screen } from './src/screens/Level4';
import './src/i18n';

type Screen = 'splash' | 'home' | 'badges' | 'level1' | 'level2' | 'level3' | 'level4';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  const handleSelectLevel = (level: LevelId) => {
    const screenMap: Record<LevelId, Screen> = {
      1: 'level1',
      2: 'level2',
      3: 'level3',
      4: 'level4',
    };
    setScreen(screenMap[level]);
  };

  switch (screen) {
    case 'splash':
      return (
        <>
          <StatusBar style="light" />
          <SplashScreen onFinish={() => setScreen('home')} />
        </>
      );
    case 'home':
      return (
        <>
          <StatusBar style="dark" />
          <HomeScreen
            onSelectLevel={handleSelectLevel}
            onViewBadges={() => setScreen('badges')}
          />
        </>
      );
    case 'badges':
      return (
        <>
          <StatusBar style="dark" />
          <BadgesScreen onBack={() => setScreen('home')} />
        </>
      );
    case 'level1':
      return (
        <>
          <StatusBar style="dark" />
          <Level1Screen />
        </>
      );
    case 'level2':
      return (
        <>
          <StatusBar style="dark" />
          <Level2Screen />
        </>
      );
    case 'level3':
      return (
        <>
          <StatusBar style="dark" />
          <Level3Screen />
        </>
      );
    case 'level4':
      return (
        <>
          <StatusBar style="dark" />
          <Level4Screen />
        </>
      );
  }
}
