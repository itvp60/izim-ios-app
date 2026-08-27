import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Constants from 'expo-constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { BraceletRole } from '@/types/bracelet';
import { getBracelet, upsertBracelet } from '@/storage/braceletsStore';
import { colors } from '@/theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ProfileWebView'>;
type Route = RouteProp<RootStackParamList, 'ProfileWebView'>;

const API_BASE_URL = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://id.izim.kz';
const SETUP_PATH = (Constants.expoConfig?.extra?.profileSetupPath as string) ?? '/setup';

/**
 * Bridge message the web constructor posts back once a profile is saved
 * (plan section 6). `role`/`name` are not in the spec's minimal payload but
 * are read here if present, so the local list can show more than a bare
 * code — worth confirming with the web team when the endpoint ships.
 */
interface ProfileSavedMessage {
  type: 'profile-saved';
  code: string;
  profileUrl: string;
  editUrl: string;
  role?: BraceletRole;
  name?: string;
}

function isProfileSavedMessage(value: unknown): value is ProfileSavedMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'profile-saved' &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { profileUrl?: unknown }).profileUrl === 'string' &&
    typeof (value as { editUrl?: unknown }).editUrl === 'string'
  );
}

export function ProfileWebViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [loading, setLoading] = useState(true);
  const handledRef = useRef(false);

  const uri = useMemo(() => {
    if (route.params.mode === 'edit') return route.params.editUrl;
    return `${API_BASE_URL}${SETUP_PATH}`;
  }, [route.params]);

  async function handleMessage(event: WebViewMessageEvent) {
    if (handledRef.current) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (!isProfileSavedMessage(parsed)) return;

    handledRef.current = true;

    if (route.params.mode === 'edit') {
      // Editing profile data must not reset a tag that was already written/locked.
      const existing = await getBracelet(route.params.braceletId);
      await upsertBracelet({
        id: route.params.braceletId,
        code: parsed.code,
        profileUrl: parsed.profileUrl,
        editUrl: parsed.editUrl,
        role: parsed.role ?? existing?.role,
        name: parsed.name ?? existing?.name,
        status: existing?.status ?? 'draft',
      });
      navigation.goBack();
      return;
    }

    const bracelet = await upsertBracelet({
      code: parsed.code,
      profileUrl: parsed.profileUrl,
      editUrl: parsed.editUrl,
      role: parsed.role,
      name: parsed.name,
      status: 'draft',
    });

    navigation.replace('WriteTag', { braceletId: bracelet.id });
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        source={{ uri }}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webview: { flex: 1, backgroundColor: colors.background },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
