import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Auth navigation wrapper
function AuthNavigationWrapper({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    if (!authState.isLoading) {
      const inAuthGroup = segments[0] === '(tabs)';
      
      if (authState.token && !inAuthGroup) {
        // Redirect to the home page if we have a token and aren't in the authenticated group
        router.replace('/(tabs)');
      } else if (!authState.token && inAuthGroup) {
        // Redirect to welcome page if we have no token but are in the authenticated group
        router.replace('/');
      }
    }
  }, [authState.isLoading, authState.token, segments, router]);
  
  if (authState.isLoading) {
    // Import it here to avoid circular dependencies
    const LoadingScreen = require('@/components/LoadingScreen').default;
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthNavigationWrapper>
          <Stack screenOptions={{ headerStyle: { backgroundColor: colorScheme === 'dark' ? '#151718' : '#fff' }, headerTintColor: colorScheme === 'dark' ? '#ECEDEE' : '#11181C' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </AuthNavigationWrapper>
      </ThemeProvider>
    </AuthProvider>
  );
}
