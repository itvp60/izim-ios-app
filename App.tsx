import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { RootNavigator } from '@/navigation/RootNavigator';
import * as nfc from '@/nfc/nfcManager';
import { flushPendingSync } from '@/sync/flushPendingSync';
import { colors } from '@/theme/colors';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export default function App() {
  useEffect(() => {
    nfc.init().catch(() => {
      // Devices without NFC hardware are handled per-screen via isSupported();
      // a failed start() here just means those checks will report unsupported.
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushPendingSync().catch(() => {});
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
