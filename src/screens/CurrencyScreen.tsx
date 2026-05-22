import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { CURRENCIES, CURRENCY_LIST, type CurrencyCode } from '../constants/currencies';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const RATES_CACHE_KEY = '@laagta_rates';
const RATES_TIMESTAMP_KEY = '@laagta_rates_ts';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export default function CurrencyScreen() {
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('PHP');
  const [amount, setAmount] = useState('1000');
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = await AsyncStorage.getItem(RATES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as ExchangeRates;
        setRates(parsed);
        const ts = await AsyncStorage.getItem(RATES_TIMESTAMP_KEY);
        if (ts) setLastUpdated(new Date(parseInt(ts)));
      }
    }
    await fetchRates();
  }, []);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rates`);
      if (!response.ok) throw new Error('Server error');
      const data: ExchangeRates = await response.json();
      setRates(data);
      const now = Date.now();
      setLastUpdated(new Date(now));
      await AsyncStorage.setItem(RATES_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(RATES_TIMESTAMP_KEY, now.toString());
    } catch {
      if (!rates) {
        Alert.alert('Could not fetch rates', 'Check your backend connection. Showing cached rates if available.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rates]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRates();
  }, [fetchRates]);

  const convertAmount = useCallback((targetCode: string): string => {
    if (!rates || !amount || isNaN(parseFloat(amount))) return '—';
    const numAmount = parseFloat(amount);
    const usdAmount = numAmount / (rates.rates[baseCurrency] ?? 1);
    const converted = usdAmount * (rates.rates[targetCode] ?? 1);
    const info = CURRENCIES[targetCode as CurrencyCode];
    if (!info) return converted.toFixed(2);
    return converted.toLocaleString('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    });
  }, [rates, amount, baseCurrency]);

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastUpdated.toLocaleDateString();
  };

  const renderRate = ({ item }: { item: typeof CURRENCY_LIST[0] }) => {
    const isBase = item.code === baseCurrency;
    const converted = convertAmount(item.code);
    return (
      <View style={[styles.rateRow, isBase && styles.rateRowBase]}>
        <Text style={styles.rateFlag}>{item.flag}</Text>
        <View style={styles.rateInfo}>
          <Text style={[styles.rateCode, isBase && styles.rateCodeBase]}>{item.code}</Text>
          <Text style={styles.rateName}>{item.name}</Text>
        </View>
        <Text style={[styles.rateAmount, isBase && styles.rateAmountBase]}>
          {item.symbol}{converted}
        </Text>
        {isBase && (
          <View style={styles.baseBadge}>
            <Text style={styles.baseBadgeText}>BASE</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Input card */}
      <View style={styles.inputCard}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setPickerVisible(true)}
          >
            <Text style={styles.currencySelectorFlag}>{CURRENCIES[baseCurrency].flag}</Text>
            <Text style={styles.currencySelectorCode}>{baseCurrency}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Amount"
            placeholderTextColor={COLORS.textMuted}
            maxLength={12}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.lastUpdated}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} /> Updated {formatLastUpdated()}
          </Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchRates(); }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={14} color={COLORS.primary} />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Rates list */}
      <FlatList
        data={CURRENCY_LIST}
        keyExtractor={item => item.code}
        renderItem={renderRate}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.listHeader}>Live Exchange Rates</Text>
        }
      />

      {/* Currency picker modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Base Currency</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCY_LIST}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, baseCurrency === item.code && styles.pickerItemSelected]}
                  onPress={() => {
                    setBaseCurrency(item.code);
                    setPickerVisible(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={styles.pickerItemFlag}>{item.flag}</Text>
                  <View style={styles.pickerItemInfo}>
                    <Text style={styles.pickerItemCode}>{item.code}</Text>
                    <Text style={styles.pickerItemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.pickerItemSymbol}>{item.symbol}</Text>
                  {baseCurrency === item.code && (
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
  inputCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  currencySelectorFlag: { fontSize: 22 },
  currencySelectorCode: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  amountInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: { fontSize: 12, color: COLORS.textMuted },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    minWidth: 80,
    justifyContent: 'center',
  },
  refreshBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  listContent: { paddingBottom: 30 },
  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  rateRowBase: {
    backgroundColor: COLORS.primaryBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  rateFlag: { fontSize: 28 },
  rateInfo: { flex: 1 },
  rateCode: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  rateCodeBase: { color: COLORS.primary },
  rateName: { fontSize: 12, color: COLORS.textSecondary },
  rateAmount: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  rateAmountBase: { color: COLORS.primary },
  baseBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  baseBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerItemSelected: { backgroundColor: COLORS.primaryBg },
  pickerItemFlag: { fontSize: 26 },
  pickerItemInfo: { flex: 1 },
  pickerItemCode: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  pickerItemName: { fontSize: 12, color: COLORS.textSecondary },
  pickerItemSymbol: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginRight: 6 },
});
