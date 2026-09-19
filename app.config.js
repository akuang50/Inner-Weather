const forGitHubPages = process.env.GITHUB_PAGES === '1';

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'Inner Weather',
  slug: 'inner-weather',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'innerweather',
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-av',
      {
        microphonePermission: 'Allow Inner Weather to record voice journals.',
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.hackmit.innerweather',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Inner Weather uses the microphone for voice journals.',
      NSHealthShareUsageDescription:
        'Inner Weather reads health signals you choose to share to learn your personal baseline.',
      NSHealthUpdateUsageDescription: 'Inner Weather does not write to Apple Health.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F7F8FA',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['RECORD_AUDIO'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  experiments: {
    typedRoutes: false,
    ...(forGitHubPages ? { baseUrl: '/Inner-Weather' } : {}),
  },
};

module.exports = { expo: config };
