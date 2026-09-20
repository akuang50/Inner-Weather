import { Redirect } from 'expo-router';
import { useApp } from '../src/state/AppContext';

export default function Index() {
  const { onboardingComplete } = useApp();
  if (!onboardingComplete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
