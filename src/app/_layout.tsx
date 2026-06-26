import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import AuthScreen from '@/components/AuthScreen';
import ActiveWorkoutOverlay from '@/components/ActiveWorkoutOverlay';
import VideoSplashOverlay from '@/components/VideoSplashOverlay';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <VideoSplashOverlay />
      {loading ? (
        <View style={{ flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4FF13" />
        </View>
      ) : !session ? (
        <AuthScreen />
      ) : (
        <>
          <AnimatedSplashOverlay />
          <AppTabs />
          <ActiveWorkoutOverlay />
        </>
      )}
    </ThemeProvider>
  );
}
