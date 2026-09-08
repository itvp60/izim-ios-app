import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { RootNavigator } from '@/navigation/RootNavigator';
import * as nfc from '@/nfc/nfcManager';
import { flushPendingSync } from '@/sync/flushPendingSync';
import { colors } from '@/theme';

// Держим заставку, пока не подгрузятся шрифты: иначе первый кадр покажет
// системный шрифт и текст «прыгнет», когда встанет Jost.
SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    nfc.init().catch(() => {
      // Устройства без NFC обрабатываются на экранах через isSupported();
      // неудачный start() здесь просто означает, что проверки вернут false.
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushPendingSync().catch(() => {});
      }
    });

    return unsubscribe;
  }, []);

  const onLayout = useCallback(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // При ошибке загрузки шрифтов приложение всё равно запускаем — интерфейс
  // откатится на системную гарнитуру, но пользователь не останется у заставки.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}
