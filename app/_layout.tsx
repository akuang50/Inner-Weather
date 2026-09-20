import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Redirect, Slot, useSegments } from 'expo-router';
import { AppProvider, useApp } from '../src/state/AppContext';
import { colors } from '../src/theme';

function RootNav() {
  const { ready, onboardingComplete } = useApp();
  const segments = useSegments();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const onOnboarding = segments[0] === 'onboarding';
  if (!onboardingComplete && !onOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  if (onboardingComplete && onOnboarding) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar style="dark" />
        <RootNav />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
