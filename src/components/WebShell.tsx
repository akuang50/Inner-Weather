import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../theme';

const WEB_CSS = `
  html, body, #root { height: 100%; margin: 0; }
  body {
    overflow: auto !important;
    background:
      radial-gradient(900px 480px at 12% -10%, rgba(255,107,107,0.10), transparent 55%),
      radial-gradient(700px 420px at 92% 8%, rgba(91,200,164,0.10), transparent 50%),
      radial-gradient(520px 360px at 50% 100%, rgba(91,108,255,0.06), transparent 50%),
      #E8E4DC;
    font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
`;

function useWebAtmosphere() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'iw-web-atmosphere';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = WEB_CSS;
    document.head.appendChild(style);
  }, []);
}

/** On desktop web, present the product inside a quiet device frame. */
export function WebShell({ children }: { children: React.ReactNode }) {
  useWebAtmosphere();
  const { width, height } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width >= 820;

  if (!framed) {
    return <View style={styles.fill}>{children}</View>;
  }

  const frameH = Math.min(844, Math.max(640, height - 72));
  const frameW = Math.min(402, Math.round(frameH * 0.462));

  return (
    <View style={styles.stage}>
      <View style={styles.copy}>
        <Text style={styles.kicker}>HackMIT · Inner Weather</Text>
        <Text style={styles.headline}>A 2-minute walk through your personal weather.</Text>
        <Text style={styles.lede}>
          Baseline → body + words + context → rant → insight → replay. Not a diagnosis — a pattern
          against your own week.
        </Text>
      </View>
      <View style={[styles.device, { width: frameW, height: frameH }]}>
        <View style={styles.notch} />
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  stage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 56,
    paddingHorizontal: 40,
    backgroundColor: '#E8E4DC',
  },
  copy: {
    maxWidth: 320,
    gap: 12,
  },
  kicker: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  headline: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.primary,
  },
  lede: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(21,23,26,0.62)',
  },
  device: {
    borderRadius: 42,
    padding: 10,
    backgroundColor: '#1C1D20',
    shadowColor: '#15171A',
    shadowOpacity: 0.28,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
  },
  notch: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    width: 108,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#0E0F11',
    zIndex: 2,
  },
  screen: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.background,
    paddingTop: 20,
  },
});
