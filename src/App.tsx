import { useState, useEffect, useMemo } from 'react';
import {
  Sentence,
  SentenceProgress,
  AppScreen,
  MOVIE_INFO,
} from './types';
import {
  loadSentences,
  saveSentences,
  loadAllProgress,
  saveSentenceProgress,
  getOrCreateProgress,
  resetSentencesToDefault,
} from './utils/storage';
import { StartScreen } from './screens/StartScreen';
import { SentenceListScreen } from './screens/SentenceListScreen';
import { ShadowingPracticeScreen } from './screens/ShadowingPracticeScreen';
import { EditSentencesScreen } from './screens/EditSentencesScreen';
import { FinishScreen } from './screens/FinishScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('start');
  const [sentences, setSentences] = useState<Sentence[]>(() => loadSentences());
  const [progressMap, setProgressMap] = useState<Record<number, SentenceProgress>>(() =>
    loadAllProgress()
  );
  const [activeSentenceId, setActiveSentenceId] = useState<number>(() => {
    const list = loadSentences();
    return list.length > 0 ? list[0].id : 1;
  });

  // Keep progressMap synced with loaded sentences
  useEffect(() => {
    const freshProgress = loadAllProgress();
    setProgressMap(freshProgress);
  }, [currentScreen]);

  // Current active sentence object
  const activeSentenceIndex = useMemo(() => {
    const idx = sentences.findIndex((s) => s.id === activeSentenceId);
    return idx !== -1 ? idx : 0;
  }, [sentences, activeSentenceId]);

  const activeSentence = useMemo(() => {
    if (sentences.length === 0) return null;
    return sentences[activeSentenceIndex] || sentences[0];
  }, [sentences, activeSentenceIndex]);

  const activeProgress = useMemo(() => {
    if (!activeSentence) {
      return {
        id: 0,
        plays: 0,
        recordings: 0,
        selfCheck: [null, null, null] as [null, null, null],
        status: 'new' as const,
      };
    }
    return getOrCreateProgress(activeSentence.id);
  }, [activeSentence]);

  // Progress update handler
  const handleUpdateProgress = (updated: SentenceProgress) => {
    saveSentenceProgress(updated);
    setProgressMap((prev) => ({
      ...prev,
      [updated.id]: updated,
    }));
  };

  // Sentences update handler
  const handleSaveSentences = (newSentences: Sentence[]) => {
    setSentences(newSentences);
    saveSentences(newSentences);
    if (newSentences.length > 0) {
      if (!newSentences.some((s) => s.id === activeSentenceId)) {
        setActiveSentenceId(newSentences[0].id);
      }
    }
  };

  // Reset to initial sentences
  const handleResetDefault = () => {
    if (window.confirm('Reset sentences to default Kung Fu Panda 4 lines? / 기본 문장으로 되돌리시겠습니까?')) {
      const def = resetSentencesToDefault();
      setSentences(def);
      if (def.length > 0) setActiveSentenceId(def[0].id);
    }
  };

  // Navigation handlers
  const handleStartPractice = () => {
    if (sentences.length === 0) {
      setCurrentScreen('edit');
      return;
    }
    setActiveSentenceId(sentences[0].id);
    setCurrentScreen('practice');
  };

  const handleSelectSentence = (sentenceId: number) => {
    setActiveSentenceId(sentenceId);
    setCurrentScreen('practice');
  };

  const handleNextSentence = () => {
    if (activeSentenceIndex < sentences.length - 1) {
      setActiveSentenceId(sentences[activeSentenceIndex + 1].id);
    } else {
      setCurrentScreen('finish');
    }
  };

  const handlePrevSentence = () => {
    if (activeSentenceIndex > 0) {
      setActiveSentenceId(sentences[activeSentenceIndex - 1].id);
    }
  };

  const handlePracticeAgainFromFinish = (sentenceId: number) => {
    setActiveSentenceId(sentenceId);
    setCurrentScreen('practice');
  };

  const handleReviewAllFromFinish = () => {
    if (sentences.length > 0) {
      setActiveSentenceId(sentences[0].id);
      setCurrentScreen('practice');
    } else {
      setCurrentScreen('start');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 480px Centered Mobile Frame */}
      <main className="w-full max-w-[480px] min-h-screen bg-slate-50 flex flex-col shadow-xl border-x border-slate-200 px-4 py-3 relative">
        {/* Render current active screen */}
        {currentScreen === 'start' && (
          <StartScreen
            onStartPractice={handleStartPractice}
            onOpenList={() => setCurrentScreen('list')}
            onOpenEdit={() => setCurrentScreen('edit')}
            sentenceCount={sentences.length}
          />
        )}

        {currentScreen === 'list' && (
          <SentenceListScreen
            sentences={sentences}
            progressMap={progressMap}
            onSelectSentence={handleSelectSentence}
            onBackToHome={() => setCurrentScreen('start')}
            onOpenEdit={() => setCurrentScreen('edit')}
          />
        )}

        {currentScreen === 'practice' && (
          <>
            {activeSentence ? (
              <ShadowingPracticeScreen
                sentence={activeSentence}
                sentenceIndex={activeSentenceIndex}
                totalSentences={sentences.length}
                progress={activeProgress}
                onUpdateProgress={handleUpdateProgress}
                onNextSentence={handleNextSentence}
                onPrevSentence={handlePrevSentence}
                onOpenList={() => setCurrentScreen('list')}
                onFinishPractice={() => setCurrentScreen('finish')}
              />
            ) : (
              <div className="py-12 text-center space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  No sentences found.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('edit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                  Add Sentences
                </button>
              </div>
            )}
          </>
        )}

        {currentScreen === 'edit' && (
          <EditSentencesScreen
            sentences={sentences}
            onSaveSentences={handleSaveSentences}
            onBack={() => setCurrentScreen(sentences.length > 0 ? 'practice' : 'start')}
            onResetDefault={handleResetDefault}
          />
        )}

        {currentScreen === 'finish' && (
          <FinishScreen
            sentences={sentences}
            progressMap={progressMap}
            onPracticeAgain={handlePracticeAgainFromFinish}
            onReviewAll={handleReviewAllFromFinish}
            onGoHome={() => setCurrentScreen('start')}
          />
        )}
      </main>
    </div>
  );
}
