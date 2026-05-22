import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@laagta_phrasebook';

export interface SavedPhrase {
  id: string;
  original: string;
  translation: string;
  romanization: string | null;
  fromLanguage: string;
  toLanguage: string;
  savedAt: number;
}

export function usePhrasebook() {
  const [saved, setSaved] = useState<SavedPhrase[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      // ignore storage errors
    }
  }, []);

  const save = useCallback(async (phrase: Omit<SavedPhrase, 'id' | 'savedAt'>) => {
    const entry: SavedPhrase = {
      ...phrase,
      id: Date.now().toString(),
      savedAt: Date.now(),
    };
    const next = [entry, ...saved].slice(0, 200);
    setSaved(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return entry;
  }, [saved]);

  const remove = useCallback(async (id: string) => {
    const next = saved.filter(p => p.id !== id);
    setSaved(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [saved]);

  const clear = useCallback(async () => {
    setSaved([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { saved, load, save, remove, clear };
}
