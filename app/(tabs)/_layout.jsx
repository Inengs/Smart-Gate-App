import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="LicensePlateScreen"
        options={{
          title: 'License Plates',
          tabBarIcon: ({ color }) => (
            Platform.OS === 'ios' ?
              <IconSymbol size={28} name="car.fill" color={color} /> :
              <MaterialCommunityIcons name="car-multiple" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="LogsScreen"
        options={{
          title: 'Activity Logs',
          tabBarIcon: ({ color }) => (
            Platform.OS === 'ios' ?
              <IconSymbol size={28} name="list.bullet" color={color} /> :
              <MaterialCommunityIcons name="clipboard-list" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            Platform.OS === 'ios' ?
              <IconSymbol size={28} name="gear" color={color} /> :
              <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}