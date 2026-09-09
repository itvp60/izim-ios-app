import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { Bracelet, ROLE_LABELS } from '@/types/bracelet';
import { getBracelets } from '@/storage/braceletsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBadge } from '@/components/StatusBadge';
import { BraceletAvatar } from '@/components/BraceletAvatar';
import { RouteDots } from '@/components/RouteDots';
import { colors, layout, radius, spacing, type } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MyBracelets'>;

export function MyBraceletsScreen() {
  const navigation = useNavigation<Nav>();
  const [bracelets, setBracelets] = useState<Bracelet[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    getBracelets()
      .then(setBracelets)
      .finally(() => setLoaded(true));
  }, []);

  useFocusEffect(reload);

  function onCreatePress() {
    navigation.navigate('ProfileWebView', { mode: 'create' });
  }

  if (!loaded) return <View style={styles.container} />;

  if (bracelets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <RouteDots count={9} withStartDot />
        <Text style={[type.h1, styles.emptyTitle]}>Пока нет браслетов</Text>
        <Text style={[type.bodyMuted, styles.emptyText]}>
          Заполните профиль и запишите первую метку. Это занимает пару минут.
        </Text>
        <View style={styles.emptyButton}>
          <PrimaryButton title="Настроить первый браслет" onPress={onCreatePress} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bracelets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={type.overline}>
            {bracelets.length === 1 ? '1 браслет' : `${bracelets.length} браслета`}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('BraceletDetail', { braceletId: item.id })}
            accessibilityRole="button"
          >
            <BraceletAvatar photoUri={item.photoUri} name={item.name} />
            <View style={styles.cardBody}>
              <Text style={type.h2} numberOfLines={1}>
                {item.name || 'Без имени'}
              </Text>
              {item.role && <Text style={type.caption}>{ROLE_LABELS[item.role]}</Text>}
              <StatusBadge status={item.status} />
            </View>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton title="Настроить ещё браслет" onPress={onCreatePress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: {
    padding: layout.screenPadding,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardPressed: { backgroundColor: colors.surfaceRaised },
  cardBody: { flex: 1, gap: spacing.xs },
  footer: {
    padding: layout.screenPadding,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.screenPadding,
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: { marginTop: spacing.sm },
  emptyText: { marginBottom: spacing.md },
  emptyButton: { alignSelf: 'stretch' },
});
