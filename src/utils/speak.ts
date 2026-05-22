import { Audio } from 'expo-av';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Short royalty-free beep for audio-session diagnostics
const BEEP_URL = 'https://www.soundjay.com/buttons/sounds/beep-07.mp3';

// Map full language names (used by TranslateScreen) to BCP-47 codes
const LANG_NAME_TO_CODE: Record<string, string> = {
  english: 'en',
  filipino: 'fil',
  japanese: 'ja',
  korean: 'ko',
  'mandarin chinese': 'zh-CN',
  thai: 'th',
  vietnamese: 'vi',
  indonesian: 'id',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  arabic: 'ar',
  hindi: 'hi',
  portuguese: 'pt',
  italian: 'it',
};

export function normalizeLangCode(code: string): string {
  return LANG_NAME_TO_CODE[code.toLowerCase()] ?? code;
}

let currentSound: Audio.Sound | null = null;

async function configureAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

async function playUri(
  uri: string,
  onDone?: () => void,
  onError?: () => void,
): Promise<void> {
  await stopSpeaking();
  await configureAudio();

  let sound: Audio.Sound;
  try {
    ({ sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 },
    ));
  } catch {
    onError?.();
    return;
  }

  currentSound = sound;

  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) {
      if ((status as { error?: string }).error) {
        sound.unloadAsync();
        if (currentSound === sound) currentSound = null;
        onError?.();
      }
      return;
    }
    if (status.didJustFinish) {
      sound.unloadAsync();
      if (currentSound === sound) currentSound = null;
      onDone?.();
    }
  });
}

export async function stopSpeaking(): Promise<void> {
  if (currentSound) {
    const s = currentSound;
    currentSound = null;
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {
      // already unloaded
    }
  }
}

// Play a short beep to confirm expo-av audio session is working
export async function testBeep(): Promise<void> {
  await playUri(BEEP_URL);
}

export async function speakText(
  text: string,
  langCode: string,
  onDone?: () => void,
  onError?: () => void,
): Promise<void> {
  const lang = normalizeLangCode(langCode);
  const uri = `${API_URL}/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
  await playUri(uri, onDone, onError);
}
