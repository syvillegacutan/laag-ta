import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { speakText, stopSpeaking } from '../utils/speak';
import { COLORS } from '../constants/colors';
import { usePhrasebook } from '../hooks/usePhrasebook';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'Filipino', name: 'Filipino', flag: '🇵🇭' },
  { code: 'Japanese', name: 'Japanese', flag: '🇯🇵' },
  { code: 'Korean', name: 'Korean', flag: '🇰🇷' },
  { code: 'Mandarin Chinese', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'Thai', name: 'Thai', flag: '🇹🇭' },
  { code: 'Vietnamese', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'Indonesian', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'Spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'French', name: 'French', flag: '🇫🇷' },
  { code: 'German', name: 'German', flag: '🇩🇪' },
  { code: 'Arabic', name: 'Arabic', flag: '🇸🇦' },
  { code: 'Hindi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'Portuguese', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'Italian', name: 'Italian', flag: '🇮🇹' },
];

interface TranslationResult {
  translation: string;
  romanization: string | null;
}

export default function TranslateScreen() {
  const [inputText, setInputText] = useState('');
  const [fromLang, setFromLang] = useState(LANGUAGES[0]);
  const [toLang, setToLang] = useState(LANGUAGES[2]);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [langModalTarget, setLangModalTarget] = useState<'from' | 'to'>('from');
  const [speaking, setSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { save } = usePhrasebook();

  const openLangPicker = (target: 'from' | 'to') => {
    setLangModalTarget(target);
    setLangModalVisible(true);
  };

  const selectLanguage = (lang: Language) => {
    if (langModalTarget === 'from') setFromLang(lang);
    else setToLang(lang);
    setLangModalVisible(false);
  };

  const swapLanguages = () => {
    const tmp = fromLang;
    setFromLang(toLang);
    setToLang(tmp);
    if (result) {
      setInputText(result.translation);
      setResult(null);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const translate = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          fromLanguage: fromLang.code,
          toLanguage: toLang.code,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data: TranslationResult = await response.json();
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Translation failed', 'Could not connect to the translation server. Check your API URL in settings.');
    } finally {
      setLoading(false);
    }
  }, [inputText, fromLang, toLang]);

  const speak = useCallback(async () => {
    if (!result) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
    const done = () => { setSpeaking(false); pulseAnim.stopAnimation(); pulseAnim.setValue(1); };
    speakText(result.translation, toLang.code, done, done);
  }, [result, speaking, toLang, pulseAnim]);

  const copyToClipboard = useCallback(async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result.translation);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Translation copied to clipboard.');
  }, [result]);

  const saveToPhrasebook = useCallback(async () => {
    if (!result || !inputText.trim()) return;
    await save({
      original: inputText.trim(),
      translation: result.translation,
      romanization: result.romanization,
      fromLanguage: fromLang.name,
      toLanguage: toLang.name,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved!', 'Phrase added to your phrasebook.');
  }, [result, inputText, fromLang, toLang, save]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      return recording.getURI() ?? null;
    } catch (_) {
      return null;
    }
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    const uri = await stopRecording();
    if (!uri) return;
    setIsTranscribing(true);
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response = await fetch(`${API_URL}/api/stt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mediaType: 'audio/m4a' }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      const data = await response.json() as { transcription?: string };
      if (data.transcription) {
        setInputText(data.transcription);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Alert.alert('Transcription failed', 'Could not understand audio. Please type your text instead.');
    } finally {
      setIsTranscribing(false);
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
  }, [stopRecording]);

  const handleMicPress = useCallback(async () => {
    if (isRecording) {
      await stopAndTranscribe();
      return;
    }

    if (isTranscribing) return;

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Microphone Access Required',
        'Please allow microphone access in your device Settings to use voice input.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      recordingTimerRef.current = setTimeout(() => {
        stopAndTranscribe();
      }, 10000);
    } catch {
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
      setIsRecording(false);
    }
  }, [isRecording, isTranscribing, stopAndTranscribe]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Language selector row */}
        <View style={styles.langRow}>
          <TouchableOpacity style={styles.langBtn} onPress={() => openLangPicker('from')}>
            <Text style={styles.langFlag}>{fromLang.flag}</Text>
            <Text style={styles.langName}>{fromLang.name}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
            <Ionicons name="swap-horizontal" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.langBtn} onPress={() => openLangPicker('to')}>
            <Text style={styles.langFlag}>{toLang.flag}</Text>
            <Text style={styles.langName}>{toLang.name}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Input area */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Type something to translate..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            value={inputText}
            onChangeText={setInputText}
            maxLength={500}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{inputText.length}/500</Text>
            <View style={styles.inputActions}>
              {inputText.length > 0 && (
                <TouchableOpacity onPress={() => setInputText('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.micBtn, isRecording && styles.micBtnActive, isTranscribing && styles.micBtnTranscribing]}
                onPress={handleMicPress}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={16}
                    color={isRecording ? '#fff' : COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Translate button */}
        <TouchableOpacity
          style={[styles.translateBtn, (!inputText.trim() || loading) && styles.translateBtnDisabled]}
          onPress={translate}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="language" size={20} color="#fff" />
              <Text style={styles.translateBtnText}>Translate</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result card */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>{toLang.flag} {toLang.name}</Text>
            </View>

            <Text style={styles.resultText}>{result.translation}</Text>

            {result.romanization && (
              <Text style={styles.romanization}>{result.romanization}</Text>
            )}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.actionBtn, speaking && styles.actionBtnActive]}
                  onPress={speak}
                >
                  <Ionicons name={speaking ? 'stop-circle' : 'volume-high'} size={18} color={speaking ? '#fff' : COLORS.primary} />
                  <Text style={[styles.actionBtnText, speaking && styles.actionBtnTextActive]}>
                    {speaking ? 'Stop' : 'Listen'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity style={styles.actionBtn} onPress={copyToClipboard}>
                <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={saveToPhrasebook}>
                <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language picker modal */}
      <Modal visible={langModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {langModalTarget === 'from' ? 'Source' : 'Target'} Language
              </Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    (langModalTarget === 'from' ? fromLang : toLang).code === item.code && styles.langItemSelected,
                  ]}
                  onPress={() => selectLanguage(item)}
                >
                  <Text style={styles.langItemFlag}>{item.flag}</Text>
                  <Text style={styles.langItemName}>{item.name}</Text>
                  {(langModalTarget === 'from' ? fromLang : toLang).code === item.code && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  langFlag: { fontSize: 22 },
  langName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
  },
  textInput: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  charCount: { fontSize: 12, color: COLORS.textMuted },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  micBtnActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  micBtnTranscribing: {
    opacity: 0.6,
  },
  translateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  translateBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  translateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  resultHeader: {
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  resultText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: 6,
  },
  romanization: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  actionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionBtnTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  langItemSelected: {
    backgroundColor: COLORS.primaryBg,
  },
  langItemFlag: { fontSize: 24 },
  langItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
});
