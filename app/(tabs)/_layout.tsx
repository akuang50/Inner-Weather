import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../../src/theme';

function TabMark({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.primary : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 12,
          color: focused ? colors.white : colors.muted,
        }}
      >
        {glyph}
      </Text>
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: focused ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
        fontSize: 11,
        color: focused ? colors.primary : colors.muted,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabMark glyph="●" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="talk"
        options={{
          title: 'Talk',
          tabBarIcon: ({ focused }) => <TabMark glyph="◎" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Talk" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ focused }) => <TabMark glyph="＋" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Track" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="replay"
        options={{
          title: 'Replay',
          tabBarIcon: ({ focused }) => <TabMark glyph="▸" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Replay" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
