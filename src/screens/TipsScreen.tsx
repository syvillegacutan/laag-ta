import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Country {
  name: string;
  flag: string;
}

interface TipCategory {
  title: string;
  icon: string;
  tips: string[];
}

const COUNTRIES: Country[] = [
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Cambodia', flag: '🇰🇭' },
  { name: 'Taiwan', flag: '🇹🇼' },
  { name: 'Hong Kong', flag: '🇭🇰' },
  { name: 'Myanmar', flag: '🇲🇲' },
  { name: 'Laos', flag: '🇱🇦' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'Dubai (UAE)', flag: '🇦🇪' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'Peru', flag: '🇵🇪' },
];

const CARD_ACCENTS = [
  COLORS.primary,
  '#7c3aed',
  '#0891b2',
  '#16a34a',
  '#d97706',
  '#dc2626',
];

export default function TipsScreen() {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<TipCategory[]>([]);
  const [tipsCountry, setTipsCountry] = useState('');

  const fetchTips = async () => {
    if (!selectedCountry) return;
    setLoading(true);
    setCategories([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await fetch(`${API_URL}/api/tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `Server error ${response.status}`);
      setCategories(data.categories ?? []);
      setTipsCountry(selectedCountry.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not load tips', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Selector bar */}
      <View style={styles.selectorBar}>
        <TouchableOpacity
          style={styles.countryBtn}
          onPress={() => setModalVisible(true)}
        >
          {selectedCountry ? (
            <>
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryName}>{selectedCountry.name}</Text>
            </>
          ) : (
            <>
              <Ionicons name="earth-outline" size={20} color={COLORS.textMuted} />
              <Text style={styles.countryPlaceholder}>Select a country</Text>
            </>
          )}
          <Ionicons name="chevron-down" size={16} color={COLORS.primary} style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.getTipsBtn, (!selectedCountry || loading) && styles.getTipsBtnDisabled]}
          onPress={fetchTips}
          disabled={!selectedCountry || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="bulb" size={17} color="#fff" />
              <Text style={styles.getTipsBtnText}>Get Tips</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Generating tips for {selectedCountry?.name}…
          </Text>
          <Text style={styles.loadingSubtext}>This takes about 5–10 seconds</Text>
        </View>
      ) : categories.length > 0 ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultHeader}>
            {selectedCountry?.flag} Travel Tips — {tipsCountry}
          </Text>
          {categories.map((cat, idx) => (
            <View
              key={cat.title}
              style={[styles.card, { borderLeftColor: CARD_ACCENTS[idx % CARD_ACCENTS.length] }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{cat.icon}</Text>
                <Text style={styles.cardTitle}>{cat.title}</Text>
              </View>
              {cat.tips.map((tip, ti) => (
                <View key={ti} style={styles.tipRow}>
                  <View style={[styles.tipBullet, { backgroundColor: CARD_ACCENTS[idx % CARD_ACCENTS.length] }]} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.disclaimerText}>AI-generated tips. Always verify with official sources.</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🌏</Text>
          <Text style={styles.emptyTitle}>Pick a destination</Text>
          <Text style={styles.emptyText}>
            Select a country above and tap Get Tips for food, customs, safety, transport tips, and more.
          </Text>
        </View>
      )}

      {/* Country picker modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.name === item.name && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setModalVisible(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  {selectedCountry?.name === item.name && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  selectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  countryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  countryFlag: { fontSize: 22 },
  countryName: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  countryPlaceholder: { flex: 1, fontSize: 15, color: COLORS.textMuted },
  chevron: { marginLeft: 'auto' },
  getTipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  getTipsBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  getTipsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  resultHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  tipText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 4,
  },
  disclaimerText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  loadingText: { fontSize: 16, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  loadingSubtext: { fontSize: 13, color: COLORS.textMuted },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  countryItemSelected: { backgroundColor: COLORS.primaryBg },
  countryItemFlag: { fontSize: 26 },
  countryItemName: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.text },
});
