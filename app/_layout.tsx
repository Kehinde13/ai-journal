import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '@context/AuthContext';

function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('onboarding_complete').then((value) => {
      if (!value) {
        router.replace('/onboarding');
      }
    });
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <OnboardingGate />
    </AuthProvider>
  );
}
