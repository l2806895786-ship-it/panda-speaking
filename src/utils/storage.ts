import { Sentence, SentenceProgress } from '../types';
import { INITIAL_SENTENCES } from '../data/initialSentences';

const SENTENCES_STORAGE_KEY = 'scene_shadow_panda_sentences_v1';
const PROGRESS_STORAGE_KEY = 'scene_shadow_panda_progress_v1';

let memorySentences: Sentence[] = [...INITIAL_SENTENCES];
let memoryProgress: Record<number, SentenceProgress> = {};

export function loadSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(SENTENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memorySentences = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('localStorage error loading sentences, using memory store:', err);
  }
  return memorySentences;
}

export function saveSentences(sentences: Sentence[]): void {
  memorySentences = sentences;
  try {
    localStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(sentences));
  } catch (err) {
    console.warn('localStorage error saving sentences:', err);
  }
}

export function loadAllProgress(): Record<number, SentenceProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryProgress = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('localStorage error loading progress:', err);
  }
  return memoryProgress;
}

export function saveSentenceProgress(progress: SentenceProgress): void {
  const all = loadAllProgress();
  all[progress.id] = progress;
  memoryProgress = all;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn('localStorage error saving progress:', err);
  }
}

export function getOrCreateProgress(id: number): SentenceProgress {
  const all = loadAllProgress();
  if (all[id]) {
    return all[id];
  }
  const defaultProg: SentenceProgress = {
    id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
  all[id] = defaultProg;
  saveSentenceProgress(defaultProg);
  return defaultProg;
}

export function resetProgressToEmpty(): void {
  memoryProgress = {};
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch (err) {
    console.warn('localStorage error clearing progress:', err);
  }
}

export function resetSentencesToDefault(): Sentence[] {
  saveSentences(INITIAL_SENTENCES);
  return [...INITIAL_SENTENCES];
}
