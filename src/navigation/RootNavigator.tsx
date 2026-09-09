import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MyBraceletsScreen } from '@/screens/MyBraceletsScreen';
import { BraceletDetailScreen } from '@/screens/BraceletDetailScreen';
import { ProfileWebViewScreen } from '@/screens/ProfileWebViewScreen';
import { WriteTagScreen } from '@/screens/WriteTagScreen';
import { LockTagScreen } from '@/screens/LockTagScreen';
import { ReadTagScreen } from '@/screens/ReadTagScreen';
import { HelpScreen } from '@/screens/HelpScreen';
import { colors, fontFamily } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Ссылки в шапке набраны цветом Paper, а не Signal: синий на тёмном фоне
 * даёт 2.6:1 и по брендбуку не используется для текста ни при каком кегле.
 */
function HeaderLink({ label, to }: { label: string; to: 'ReadTag' | 'Help' }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable onPress={() => navigation.navigate(to)} hitSlop={12} accessibilityRole="button">
      <Text style={styles.headerLink}>{label}</Text>
    </Pressable>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: {
          color: colors.text,
          fontFamily: fontFamily.displayMedium,
          fontSize: 17,
        },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MyBracelets"
        component={MyBraceletsScreen}
        options={{
          title: 'Мои браслеты',
          headerLeft: () => <HeaderLink label="Метка" to="ReadTag" />,
          headerRight: () => <HeaderLink label="Помощь" to="Help" />,
        }}
      />
      <Stack.Screen name="BraceletDetail" component={BraceletDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="ProfileWebView" component={ProfileWebViewScreen} options={{ title: 'Профиль' }} />
      <Stack.Screen name="WriteTag" component={WriteTagScreen} options={{ title: 'Запись метки' }} />
      <Stack.Screen name="LockTag" component={LockTagScreen} options={{ title: 'Блокировка' }} />
      <Stack.Screen name="ReadTag" component={ReadTagScreen} options={{ title: 'Прочитать метку' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Помощь' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerLink: {
    color: colors.text,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
  },
});
