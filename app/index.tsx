import { Redirect } from 'expo-router';
import { useApp } from '../src/state/AppContext';

export default function Index() {
  const { preferences } = useApp();
  if (!preferences.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/home" />;
}
