import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', tabBarIcon: ({ color }) => <Ionicons name="bag-handle" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: 'Services', tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
