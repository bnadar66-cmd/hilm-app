import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useFonts, Lalezar_400Regular } from '@expo-google-fonts/lalezar';
import { Tajawal_400Regular, Tajawal_700Bold, Tajawal_800ExtraBold } from '@expo-google-fonts/tajawal';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

import { AuthProvider, useAuth } from './src/lib/AuthContext';
import { supabase } from './src/lib/supabase';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import StaffNavigator from './src/navigation/StaffNavigator';
import SetStaffPasswordScreen from './src/screens/SetStaffPasswordScreen';
import { colors } from './src/theme/theme';

// روابط دعوة Supabase (invite/recovery) تحمل access_token/refresh_token بعد # —
// Linking.parse ما يفكّك جزء الـ fragment، فنحلّله يدويًا كخطة بديلة.
function parseInviteTokens(url) {
  if (!url) return null;
  const hashIndex = url.indexOf('#');
  if (hashIndex < 0) return null;
  const fragment = url.slice(hashIndex + 1);
  const params = Object.fromEntries(new URLSearchParams(fragment));
  if (params.access_token && params.refresh_token) {
    return { access_token: params.access_token, refresh_token: params.refresh_token };
  }
  return null;
}

function RootSwitch({ needsStaffPassword, onStaffPasswordSet }) {
  const { isLoggedIn, isStaff, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!isLoggedIn) return <AuthNavigator />;
  if (needsStaffPassword) return <SetStaffPasswordScreen onDone={onStaffPasswordSet} />;
  return isStaff ? <StaffNavigator /> : <MainTabNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Lalezar_400Regular,
    Tajawal_400Regular,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    JetBrainsMono_500Medium,
  });
  const [needsStaffPassword, setNeedsStaffPassword] = useState(false);

  const handleIncomingUrl = useCallback(async (url) => {
    const tokens = parseInviteTokens(url);
    if (!tokens) return;
    const { error } = await supabase.auth.setSession(tokens);
    if (!error) setNeedsStaffPassword(true);
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => subscription.remove();
  }, [handleIncomingUrl]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootSwitch needsStaffPassword={needsStaffPassword} onStaffPasswordSet={() => setNeedsStaffPassword(false)} />
      </NavigationContainer>
    </AuthProvider>
  );
}
