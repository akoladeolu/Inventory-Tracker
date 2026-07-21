import { Tabs } from 'expo-router';
import { LayoutDashboard, ScanLine, Search, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#60a5fa' : '#2563eb', // blue-400 : blue-600
        tabBarInactiveTintColor: isDark ? '#a3a3a3' : '#525252', // neutral-400 : neutral-600
        tabBarStyle: {
          backgroundColor: isDark ? '#0a0a0a' : '#ffffff', // neutral-950 : white
          borderTopColor: isDark ? '#262626' : '#e5e5e5', // neutral-800 : neutral-200
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <ScanLine color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lookup"
        options={{
          title: 'Lookup',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
