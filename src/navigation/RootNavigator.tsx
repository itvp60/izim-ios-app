import React from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MyBraceletsScreen } from '@/screens/MyBraceletsScreen';
import { ProfileWebViewScreen } from '@/screens/ProfileWebViewScreen';
import { WriteTagScreen } from '@/screens/WriteTagScreen';
import { LockTagScreen } from '@/screens/LockTagScreen';
import { ReadTagScreen } from '@/screens/ReadTagScreen';
import { HelpScreen } from '@/screens/HelpScreen';
import { colors } from '@/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderLink({ label, to }: { label: string; to: 'ReadTag' | 'Help' }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable onPress={() => navigation.navigate(to)} hitSlop={8}>
      <Text style={{ color: colors.primary, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MyBracelets"
        component={MyBraceletsScreen}
        options={{
          title: 'Мои браслеты',
          headerRight: () => <HeaderLink label="Помощь" to="Help" />,
          headerLeft: () => <HeaderLink label="Метка" to="ReadTag" />,
        }}
      />
      <Stack.Screen name="ProfileWebView" component={ProfileWebViewScreen} options={{ title: 'Профиль' }} />
      <Stack.Screen name="WriteTag" component={WriteTagScreen} options={{ title: 'Запись метки' }} />
      <Stack.Screen name="LockTag" component={LockTagScreen} options={{ title: 'Блокировка' }} />
      <Stack.Screen name="ReadTag" component={ReadTagScreen} options={{ title: 'Прочитать метку' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Помощь' }} />
    </Stack.Navigator>
  );
}
