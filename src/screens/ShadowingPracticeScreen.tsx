import { useState, useRef, useEffect, useCallback } from 'react';
import { Sentence, SentenceProgress, StepType, SelfCheckRating } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from '../components/YouTubePlayer';
import { SpeechWordCheck } from '../components/SpeechWordCheck';
import {
  Play,
  Pause,
  Repeat,
  Mic,
  Square,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Headphones,
  CheckCircle,
  RotateCcw,
  List,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ShadowingPracticeScreenProps {
  sentence: Sentence;
  sentenceIndex: number;
  totalSentences: number;
  progress: SentenceProgress;
  onUpdateProgress: (updated: SentenceProgress) => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  onOpenList: () => void;
  onFinishPractice: () => void;
}

export function ShadowingPracticeScreen({
  sentence,
  sentenceIndex,
  totalSentences,
  progress,
  onUpdateProgress,
  onNextSentence,
  onPrevSentence,
  onOpenList,
  onFinishPractice,
}: ShadowingPracticeScreenProps) {
  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Practice state
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [hideText, setHideText] = useState(true); // default true for Step 1
  const [hideKorean, setHideKorean] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioUrlRef = useRef<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update text visibility when step changes (per PRD specifications)
  const handleSelectStep = (step: StepType) => {
    setCurrentStep(step);
    if (step === 3) {
      setHideText(false); // Step 3: Read & Shadow shows text
    } else {
      setHideText(true); // Step 1, 2, 4 hide text
    }
  };

  // Reset audio & stop timers when sentence changes
  useEffect(() => {
    setIsPlayingVideo(false);
    setIsRecording(false);
    setIsPlayingRecordedAudio(false);
    setRecordingCountdown(null);

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    // Reset recording in-memory for this new sentence
    setHasRecordedAudio(false);
    recordedAudioUrlRef.current = null;

    // Reset step to 1 or keep current step
    handleSelectStep(1);
  }, [sentence.id]);

  // Handle segment video play/pause
  const togglePlaySegment = () => {
    if (isPlayingVideo) {
      playerRef.current?.pause();
      setIsPlayingVideo(false);
    } else {
      playerRef.current?.setSpeed(playbackSpeed);
      playerRef.current?.playSegment(
        sentence.start,
        sentence.end,
        isLooping,
        () => setIsPlayingVideo(false)
      );
      setIsPlayingVideo(true);

      // Increment play count
      onUpdateProgress({
        ...progress,
        plays: (progress.plays || 0) + 1,
      });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    playerRef.current?.setSpeed(speed);
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (isPlayingVideo) {
      playerRef.current?.playSegment(
        sentence.start,
        sentence.end,
        nextLoop,
        () => setIsPlayingVideo(false)
      );
    }
  };

  // Start simultaneous Recording + Clip Playback
  const startRecording = async () => {
    setMicDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        if (recordedAudioUrlRef.current) {
          URL.revokeObjectURL(recordedAudioUrlRef.current);
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        recordedAudioUrlRef.current = audioUrl;
        setHasRecordedAudio(true);
        setIsRecording(false);
        setRecordingCountdown(null);

        // Turn off stream tracks to free microphone
        stream.getTracks().forEach((track) => track.stop());

        // Update progress:
        // Status becomes "practiced" after one recording and "done" after a recording in Step 4.
        const newRecordings = (progress.recordings || 0) + 1;
        const newStatus = currentStep === 4 ? 'done' : progress.status === 'done' ? 'done' : 'practiced';

        onUpdateProgress({
          ...progress,
          recordings: newRecordings,
          status: newStatus,
        });
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Play sentence segment once (ignoring loop while recording)
      playerRef.current?.setSpeed(playbackSpeed);
      playerRef.current?.playSegment(sentence.start, sentence.end, false, () => {
        // When sentence reaches end, wait 1.0 second then stop recorder
        if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 1000);
      });
      setIsPlayingVideo(true);
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      setMicDenied(true);
      setIsRecording(false);
    }
  };

  const stopRecordingManually = () => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    playerRef.current?.pause();
    setIsPlayingVideo(false);
    setIsRecording(false);
  };

  // Play user voice recording
  const playRecordedVoice = () => {
    if (!recordedAudioUrlRef.current) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(recordedAudioUrlRef.current);
    audioElementRef.current = audio;

    audio.onplay = () => setIsPlayingRecordedAudio(true);
    audio.onended = () => setIsPlayingRecordedAudio(false);
    audio.onerror = () => setIsPlayingRecordedAudio(false);

    audio.play().catch((e) => {
      console.warn('Recorded audio play failed:', e);
      setIsPlayingRecordedAudio(false);
    });
  };

  // Replay original clip
  const playOriginalClip = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingRecordedAudio(false);
    }
    playerRef.current?.setSpeed(1.0);
    playerRef.current?.playSegment(sentence.start, sentence.end, false, () => {
      setIsPlayingVideo(false);
    });
    setIsPlayingVideo(true);
  };

  // Self check question handler
  const handleSelfCheckChange = (questionIndex: 0 | 1 | 2, rating: SelfCheckRating) => {
    const newSelfCheck = [...progress.selfCheck] as [
      SelfCheckRating,
      SelfCheckRating,
      SelfCheckRating
    ];
    newSelfCheck[questionIndex] = rating;
    onUpdateProgress({
      ...progress,
      selfCheck: newSelfCheck,
    });
  };

  // Render sentence text with stress words
  const renderSentenceWords = () => {
    const words = sentence.text.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9']/g, '');
      const isStress = sentence.stress.some((s) => s.toLowerCase() === cleanWord);

      return (
        <span
          key={index}
          className={
            isStress
              ? 'font-extrabold text-blue-700 underline decoration-blue-400 decoration-3 underline-offset-4'
              : 'font-semibold text-slate-900'
          }
        >
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col space-y-4 pb-12">
      {/* Top Header: List button & Sentence counter */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onOpenList}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <List className="w-4 h-4 text-slate-500" />
          <span>List / 목록</span>
        </button>

        {/* Sentence Counter ◀ Sentence X / Y ▶ */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-xs">
          <button
            type="button"
            onClick={onPrevSentence}
            disabled={sentenceIndex === 0}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"
            aria-label="Previous sentence"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Sentence {sentenceIndex + 1} / {totalSentences}
          </span>
          <button
            type="button"
            onClick={onNextSentence}
            disabled={sentenceIndex === totalSentences - 1}
            className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"
            aria-label="Next sentence"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Player (16:9) with mandatory credit line */}
      <YouTubePlayer
        ref={playerRef}
        onPlayStateChange={(playing) => setIsPlayingVideo(playing)}
      />

      {/* Sentence Script Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 relative text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {sentence.speaker}
            </span>
            <span className="text-[11px] text-slate-400">
              {sentence.start.toFixed(1)}s – {sentence.end.toFixed(1)}s
            </span>
          </div>

          <button
            type="button"
            onClick={() => setHideText(!hideText)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-1 rounded-lg"
          >
            {hideText ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{hideText ? 'Show Text / 문장 보기' : 'Hide Text / 숨기기'}</span>
          </button>
        </div>

        {/* English Sentence Display: At least 22px body */}
        <div className="min-h-[64px] flex items-center">
          {hideText ? (
            <div className="w-full text-center py-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-medium">
              [Text hidden for shadowing / 듣기 집중 모드]
              <div className="text-[11px] text-slate-400 mt-0.5">
                Tap 'Show Text' above if you need help!
              </div>
            </div>
          ) : (
            <div className="text-[22px] sm:text-2xl leading-relaxed tracking-tight text-slate-900">
              {renderSentenceWords()}
            </div>
          )}
        </div>

        {/* Korean Translation */}
        {!hideKorean && (
          <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>{sentence.korean}</span>
            <button
              type="button"
              onClick={() => setHideKorean(true)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Hide translation
            </button>
          </div>
        )}
        {hideKorean && (
          <button
            type="button"
            onClick={() => setHideKorean(false)}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
          >
            Show Korean translation / 한국어 뜻 보기
          </button>
        )}
      </div>

      {/* Control Row: ▶ Play, 🔁 Loop, Speed 0.5× / 0.75× / 1.0× */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Play/Pause Segment Button (48px+ tall) */}
          <button
            type="button"
            onClick={togglePlaySegment}
            className={`min-h-[48px] px-3 py-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
              isPlayingVideo
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm">
              {isPlayingVideo ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlayingVideo ? 'Pause' : 'Play'}</span>
            </div>
            <span className="text-[10px] font-normal opacity-90">
              {isPlayingVideo ? '일시정지' : '구간 재생'}
            </span>
          </button>

          {/* Loop Segment Toggle (repeats with 1.5s pause) */}
          <button
            type="button"
            onClick={toggleLoop}
            className={`min-h-[48px] px-2 py-2 rounded-xl font-semibold text-xs flex flex-col items-center justify-center transition-all cursor-pointer border ${
              isLooping
                ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs">
              <Repeat className={`w-4 h-4 ${isLooping ? 'text-purple-700' : 'text-slate-500'}`} />
              <span>Loop {isLooping ? 'ON' : 'OFF'}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal">반복 (1.5초 간격)</span>
          </button>

          {/* Speed Buttons Segmented Control */}
          <div className="min-h-[48px] p-1 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200/80">
            {[0.5, 0.75, 1.0].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedChange(speed)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  playbackSpeed === speed
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Step Guide Tabs in Order */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            4-Step Shadowing Guide / 4단계 쉐도잉
          </span>
          <span className="text-[11px] text-slate-500">Step {currentStep} of 4</span>
        </div>

        {/* 4 Step Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { step: 1 as StepType, labelEn: '1. Listen', labelKo: '듣기' },
            { step: 2 as StepType, labelEn: '2. Mumble', labelKo: '중얼' },
            { step: 3 as StepType, labelEn: '3. Read', labelKo: '보고' },
            { step: 4 as StepType, labelEn: '4. Shadow', labelKo: '쉐도잉' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => handleSelectStep(item.step)}
              className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                currentStep === item.step
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
              }`}
            >
              <span className="text-xs">{item.labelEn}</span>
              <span className="text-[10px] opacity-80">{item.labelKo}</span>
            </button>
          ))}
        </div>

        {/* Step Instructions (English + Korean) */}
        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
          {currentStep === 1 && (
            <div>
              <div className="font-semibold text-blue-900">
                Step 1: Listen — text hidden, just listen 2–3 times.
              </div>
              <div className="text-slate-600">
                귀로만 2~3회 들으며 원어민의 리듬과 억양을 파악하세요.
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <div className="font-semibold text-blue-900">
                Step 2: Mumble — text hidden, quietly follow the sound.
              </div>
              <div className="text-slate-600">
                대사를 보지 않고 소리를 들으며 입술로 작게 웅얼웅얼 따라해 보세요.
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <div className="font-semibold text-blue-900">
                Step 3: Read & Shadow — text shown, speak together with the video.
              </div>
              <div className="text-slate-600">
                문장을 보면서 배우의 목소리와 정확히 동시에 말해보세요!
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div>
              <div className="font-semibold text-blue-900">
                Step 4: Shadow — text hidden, speak together with the video.
              </div>
              <div className="text-slate-600">
                문장을 가린 채 완전한 쉐도잉으로 배우와 싱크로율 100%에 도전하세요!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Voice Recording & Playback / 녹음 및 확인
          </span>
          {progress.recordings > 0 && (
            <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
              Recorded {progress.recordings} times
            </span>
          )}
        </div>

        {/* Mic Permission Denied Message */}
        {micDenied && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Mic is off. You can still listen and shadow out loud.</div>
              <div className="text-[11px] mt-0.5 text-amber-700">
                마이크 권한이 꺼져 있습니다. 목소리를 내어 쉐도잉 연습을 계속하실 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* Big Record Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="w-full min-h-[50px] px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md active:scale-[0.99] transition-all flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="flex items-center gap-2 text-sm">
              <Mic className="w-4 h-4" />
              <span>Record Sentence & Shadow</span>
            </div>
            <span className="text-[10px] font-normal text-purple-100">
              녹음 시작 (영상과 동시에 녹음되며, 문장 끝 1초 후 자동 종료)
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecordingManually}
            className="w-full min-h-[50px] px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md animate-pulse flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="flex items-center gap-2 text-sm">
              <Square className="w-4 h-4 fill-white" />
              <span>Recording Voice & Playing Clip...</span>
            </div>
            <span className="text-[10px] font-normal text-red-100">
              탭하여 수동 정지 (또는 문장 끝 1초 후 자동 정지)
            </span>
          </button>
        )}

        {/* Audio comparison playback: My Voice and Original */}
        {hasRecordedAudio && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={playRecordedVoice}
              className={`min-h-[46px] px-3 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-all cursor-pointer ${
                isPlayingRecordedAudio
                  ? 'bg-purple-100 border-purple-400 text-purple-900'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                <span>▶ My Voice</span>
              </div>
              <span className="text-[10px] text-purple-600 font-normal">내 목소리 듣기</span>
            </button>

            <button
              type="button"
              onClick={playOriginalClip}
              className="min-h-[46px] px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 flex flex-col items-center justify-center transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs">
                <Play className="w-3.5 h-3.5 fill-blue-700 text-blue-700" />
                <span>▶ Original</span>
              </div>
              <span className="text-[10px] text-blue-600 font-normal">원문 다시 듣기</span>
            </button>
          </div>
        )}
      </div>

      {/* Web Speech API Word Check (Optional feature) */}
      <SpeechWordCheck targetSentence={sentence.text} />

      {/* Self-Check Area (after recording or anytime): 3 questions with 😀 / 🙂 / 😐 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Self-Check / 자기 점검
          </span>
          <span className="text-[11px] text-slate-400">
            😀 Good · 🙂 OK · 😐 Needs practice
          </span>
        </div>

        {/* Question 1: Speed */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
          <div className="text-xs font-semibold text-slate-800">
            1. Did I keep up with the speed?
            <span className="block text-[11px] font-normal text-slate-500">
              배우의 말하기 속도를 잘 따라갔나요?
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { value: 'good', emoji: '😀', label: 'Good' },
                { value: 'ok', emoji: '🙂', label: 'OK' },
                { value: 'hard', emoji: '😐', label: 'Hard' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelfCheckChange(0, opt.value)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                  progress.selfCheck[0] === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Stress words */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
          <div className="text-xs font-semibold text-slate-800">
            2. Did I stress the bold words?
            <span className="block text-[11px] font-normal text-slate-500">
              강조 단어(굵은 글씨)에 힘을 주어 발음했나요?
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { value: 'good', emoji: '😀', label: 'Good' },
                { value: 'ok', emoji: '🙂', label: 'OK' },
                { value: 'hard', emoji: '😐', label: 'Hard' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelfCheckChange(1, opt.value)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                  progress.selfCheck[1] === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question 3: Intonation */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
          <div className="text-xs font-semibold text-slate-800">
            3. Did my voice go up and down like the actor?
            <span className="block text-[11px] font-normal text-slate-500">
              배우처럼 억양의 높낮이와 감정을 살렸나요?
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { value: 'good', emoji: '😀', label: 'Good' },
                { value: 'ok', emoji: '🙂', label: 'OK' },
                { value: 'hard', emoji: '😐', label: 'Hard' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelfCheckChange(2, opt.value)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                  progress.selfCheck[2] === opt.value
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="space-y-2 pt-2">
        {sentenceIndex < totalSentences - 1 ? (
          <button
            type="button"
            onClick={onNextSentence}
            className="w-full min-h-[48px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Sentence</span>
            <span className="text-xs font-normal text-blue-100">/ 다음 문장 ({sentenceIndex + 2}/{totalSentences})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinishPractice}
            className="w-full min-h-[50px] px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Finish Practice / 연습 완료하기</span>
          </button>
        )}
      </div>
    </div>
  );
}
