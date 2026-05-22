import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function AirplaneSVG({ size = 36, color = '#ff6b2b' }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: [{ rotate: '-45deg' }] }}
    >
      <Path
        fill={color}
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
    </Svg>
  );
}

interface SettingsRow {
  icon: string;
  label: string;
  onPress: () => void;
}

export default function AboutScreen() {
  const openPrivacyPolicy = () => {
    Linking.openURL('https://laagta.app/privacy').catch(() =>
      Alert.alert('Privacy Policy', 'Visit https://laagta.app/privacy')
    );
  };

  const openTerms = () => {
    Linking.openURL('https://laagta.app/terms').catch(() =>
      Alert.alert('Terms of Service', 'Visit https://laagta.app/terms')
    );
  };

  const rateApp = () => {
    const iosUrl = 'https://apps.apple.com/app/laag-ta/id000000000';
    const androidUrl = 'https://play.google.com/store/apps/details?id=com.syvillegacutan.laagta';
    const url = Platform.OS === 'ios' ? iosUrl : androidUrl;
    Linking.openURL(url).catch(() =>
      Alert.alert('Rate Laag Ta!', 'We\'d love your feedback! Please find us on the App Store or Google Play.')
    );
  };

  const contactSupport = () => {
    Linking.openURL('mailto:hello@laagta.app?subject=Laag%20Ta!%20Support').catch(() =>
      Alert.alert('Contact Support', 'Email us at hello@laagta.app')
    );
  };

  const settingsRows: SettingsRow[] = [
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: openPrivacyPolicy },
    { icon: 'document-text-outline', label: 'Terms of Service', onPress: openTerms },
    { icon: 'star-outline', label: 'Rate the App', onPress: rateApp },
    { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', onPress: contactSupport },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logo section */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Laag Ta!</Text>
          <View style={styles.planeWrapper}>
            <AirplaneSVG size={36} color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.tagline}>Dali, adventure awaits!</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
        </View>
      </View>

      {/* Settings rows */}
      <View style={styles.settingsSection}>
        {settingsRows.map((row, index) => (
          <TouchableOpacity
            key={row.label}
            style={[
              styles.settingsRow,
              index === 0 && styles.settingsRowFirst,
              index === settingsRows.length - 1 && styles.settingsRowLast,
            ]}
            onPress={row.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingsIconBox}>
              <Ionicons name={row.icon as any} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingsLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Developer card */}
      <View style={styles.devCard}>
        <View style={styles.devCardHeader}>
          <View style={styles.devAvatarRing}>
            <AirplaneSVG size={28} color="#fff" />
          </View>
          <View style={styles.devInfo}>
            <Text style={styles.devName}>Syville Gacutan</Text>
            <Text style={styles.devRole}>Designer and developer</Text>
            <Text style={styles.devLocation}>📍 Cagayan de Oro, Philippines</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✦ Solo built</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🌴 CDO Philippines</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>💬 Bisaya kaayo!</Text>
          </View>
        </View>

        <Text style={styles.devNote}>
          "Gihimo nako ni para sa atong mga maghilaagay!"
        </Text>
        <Text style={styles.devNoteEn}>
          (Made this for all of us who love to explore! 🌏)
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ in Cagayan de Oro, Philippines
        </Text>
        <Text style={styles.footerCopy}>
          © 2024 Syville Gacutan. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  logoSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  planeWrapper: {
    marginTop: -6,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  versionBadge: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  settingsSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 14,
  },
  settingsRowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  settingsRowLast: { borderBottomWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  settingsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },

  devCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  devCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  devAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  devInfo: { flex: 1 },
  devName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  devRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 3,
  },
  devLocation: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  devNote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  devNoteEn: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },

  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerCopy: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
