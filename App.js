import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, Lalezar_400Regular } from '@expo-google-fonts/lalezar';
import { Tajawal_400Regular, Tajawal_700Bold, Tajawal_800ExtraBold } from '@expo-google-fonts/tajawal';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

import { AuthProvider, useAuth } from './src/lib/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import HomeScreen from './src/screens/HomeScreen';
import { colors } from './src/theme/theme';

function RootSwitch() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return isLoggedIn ? <HomeScreen /> : <AuthNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Lalezar_400Regular,
    Tajawal_400Regular,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    JetBrainsMono_500Medium,
  });

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
        <RootSwitch />
      </NavigationContainer>
    </AuthProvider>
  );
}
