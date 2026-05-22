import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import TranslateScreen from '../screens/TranslateScreen';
import PhrasesScreen from '../screens/PhrasesScreen';
import NearbyScreen from '../screens/NearbyScreen';
import CurrencyScreen from '../screens/CurrencyScreen';
import AboutScreen from '../screens/AboutScreen';
import TipsScreen from '../screens/TipsScreen';
import MapsScreen from '../screens/MapsScreen';

type TabIcon = 'language' | 'chatbubbles-outline' | 'location-outline' | 'cash-outline' | 'information-circle-outline' | 'bulb-outline' | 'map-outline';

const Tab = createBottomTabNavigator();

function HeaderTitle() {
  return (
    <View style={styles.headerTitle}>
      <Text style={styles.headerText}>Laag Ta!</Text>
      <Text style={styles.headerPlane}> ✈</Text>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, TabIcon> = {
            Translate: 'language',
            Phrases: 'chatbubbles-outline',
            Nearby: 'location-outline',
            Currency: 'cash-outline',
            Tips: 'bulb-outline',
            Maps: 'map-outline',
            About: 'information-circle-outline',
          };
          const name = icons[route.name] as TabIcon;
          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
              <Ionicons name={name} size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTintColor: '#fff',
        headerTitleStyle: styles.headerTitleStyle,
        headerTitle: () => <HeaderTitle />,
      })}
    >
      <Tab.Screen name="Translate" component={TranslateScreen} />
      <Tab.Screen name="Phrases" component={PhrasesScreen} />
      <Tab.Screen name="Nearby" component={NearbyScreen} />
      <Tab.Screen name="Currency" component={CurrencyScreen} />
      <Tab.Screen name="Tips" component={TipsScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBarBg,
    borderTopColor: COLORS.tabBarBorder,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    padding: 2,
    borderRadius: 8,
  },
  iconWrapperFocused: {
    backgroundColor: COLORS.primaryBg,
  },
  header: {
    backgroundColor: COLORS.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontWeight: '800',
    fontSize: 18,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerPlane: {
    color: '#fff',
    fontSize: 18,
  },
});
