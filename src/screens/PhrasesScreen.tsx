import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import {
  PHRASES_DATA,
  CATEGORIES,
  LANGUAGE_LIST,
  type PhraseCategory,
  type Phrase,
} from '../constants/phrases';
import { usePhrasebook, type SavedPhrase } from '../hooks/usePhrasebook';

export default function PhrasesScreen() {
  const [selectedLang, setSelectedLang] = useState(LANGUAGE_LIST[0]);
  const [selectedCategory, setSelectedCategory] = useState<PhraseCategory>('greetings');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { saved, load } = usePhrasebook();

  useEffect(() => { load(); }, [load]);

  const langData = PHRASES_DATA[selectedLang.code];
  const phrases = showSaved ? saved : (langData?.phrases[selectedCategory] ?? []);

  const speakPhrase = async (phrase: Phrase | SavedPhrase) => {
    const text = 'native' in phrase ? phrase.native : phrase.translation;
    const id = phrase.id;
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Speech.speak(text, {
      language: selectedLang.code,
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const renderPhrase = ({ item }: { item: Phrase | SavedPhrase }) => {
    const isNative = 'native' in item;
    const native = isNative ? item.native : (item as SavedPhrase).translation;
    const roman = isNative ? item.romanization : (item as SavedPhrase).romanization;
    const english = isNative ? item.english : (item as SavedPhrase).original;
    const isSpeaking = speakingId === item.id;

    return (
      <View style={styles.phraseCard}>
        <View style={styles.phraseContent}>
          <Text style={styles.phraseEnglish}>{english}</Text>
          <Text style={styles.phraseNative}>{native}</Text>
          {roman ? <Text style={styles.phraseRoman}>{roman}</Text> : null}
          {!isNative && (
            <Text style={styles.phraseLang}>
              {(item as SavedPhrase).fromLanguage} → {(item as SavedPhrase).toLanguage}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.speakBtn, isSpeaking && styles.speakBtnActive]}
          onPress={() => speakPhrase(item)}
        >
          <Ionicons
            name={isSpeaking ? 'stop' : 'volume-medium'}
            size={18}
            color={isSpeaking ? '#fff' : COLORS.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Language selector */}
      <View style={styles.langRow}>
        <Text style={styles.langLabel}>Destination:</Text>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLangModalVisible(true)}
        >
          <Text style={styles.langFlag}>{selectedLang.flag}</Text>
          <Text style={styles.langName}>{selectedLang.name}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.savedBtn, showSaved && styles.savedBtnActive]}
          onPress={() => setShowSaved(s => !s)}
        >
          <Ionicons name="bookmark" size={16} color={showSaved ? '#fff' : COLORS.primary} />
          <Text style={[styles.savedBtnText, showSaved && styles.savedBtnTextActive]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      {!showSaved && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catTab, selectedCategory === cat.key && styles.catTabActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, selectedCategory === cat.key && styles.catLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Phrases list */}
      <FlatList
        data={phrases as (Phrase | SavedPhrase)[]}
        keyExtractor={item => item.id}
        renderItem={renderPhrase}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {showSaved ? 'No saved phrases yet.\nTranslate something and hit Save!' : 'No phrases found.'}
            </Text>
          </View>
        }
      />

      {/* Language modal */}
      <Modal visible={langModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination Language</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGE_LIST}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langItem, selectedLang.code === item.code && styles.langItemSelected]}
                  onPress={() => { setSelectedLang(item); setLangModalVisible(false); }}
                >
                  <Text style={styles.langItemFlag}>{item.flag}</Text>
                  <Text style={styles.langItemName}>{item.name}</Text>
                  {selectedLang.code === item.code && (
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
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 8,
  },
  langLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  langFlag: { fontSize: 20 },
  langName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.primary },
  savedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  savedBtnActive: { backgroundColor: COLORS.primary },
  savedBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  savedBtnTextActive: { color: '#fff' },
  categoryScroll: {
    height: 56,
    backgroundColor: COLORS.surface,
    flexShrink: 0,
  },
  categoryContent: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  catLabelActive: { color: '#fff' },
  listContent: { padding: 14, gap: 10, paddingBottom: 30 },
  phraseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  phraseContent: { flex: 1, gap: 3 },
  phraseEnglish: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  phraseNative: { fontSize: 18, fontWeight: '700', color: COLORS.text, lineHeight: 26 },
  phraseRoman: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
  phraseLang: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  speakBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  speakBtnActive: { backgroundColor: COLORS.primary },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
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
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  langItemSelected: { backgroundColor: COLORS.primaryBg },
  langItemFlag: { fontSize: 24 },
  langItemName: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.text },
});
