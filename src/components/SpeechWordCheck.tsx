import { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle, RotateCcw } from 'lucide-react';

interface SpeechWordCheckProps {
  targetSentence: string;
}

export function SpeechWordCheck({ targetSentence }: SpeechWordCheckProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  // Reset when sentence changes
  useEffect(() => {
    setSpokenText('');
    setHasResult(false);
    setErrorMsg(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, [targetSentence]);

  if (!isSupported) {
    return null;
  }

  const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

  const targetWords = targetSentence
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const spokenWordsClean = spokenText
    .split(/\s+/)
    .map(cleanWord)
    .filter(Boolean);

  // Match words sequentially or set-based
  const matchedIndices = new Set<number>();
  let spokenIndex = 0;

  targetWords.forEach((word, idx) => {
    const cleaned = cleanWord(word);
    if (!cleaned) return;

    // Check if spoken text contains this word around the expected position
    const foundIdx = spokenWordsClean.indexOf(cleaned, Math.max(0, spokenIndex - 2));
    if (foundIdx !== -1) {
      matchedIndices.add(idx);
      spokenIndex = foundIdx + 1;
    }
  });

  const matchedCount = matchedIndices.size;
  const totalCount = targetWords.length;

  const startListening = () => {
    setErrorMsg(null);
    setSpokenText('');
    setHasResult(false);

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        setHasResult(true);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone in browser.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('No speech detected. Tap again and speak clearly!');
        } else {
          setErrorMsg('Could not recognize speech. Try again!');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setErrorMsg('Speech recognition could not start.');
      setIsListening(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">
          Word Check / 단어 인식 검사
        </span>
        {!isListening && (
          <button
            type="button"
            onClick={startListening}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Check My Words</span>
            <span className="text-[10px] opacity-80">/ 확인</span>
          </button>
        )}
      </div>

      {isListening && (
        <div className="flex items-center gap-2 py-2 text-xs text-blue-600 font-medium animate-pulse">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <span>Listening to your pronunciation... Speak now!</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-1">
          {errorMsg}
        </div>
      )}

      {hasResult && (
        <div className="mt-2 space-y-2">
          {/* Word coloring */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm leading-relaxed flex flex-wrap gap-1.5">
            {targetWords.map((word, idx) => {
              const isMatch = matchedIndices.has(idx);
              return (
                <span
                  key={idx}
                  className={`px-1 py-0.5 rounded font-medium transition-colors ${
                    isMatch
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-slate-400 underline decoration-slate-300 decoration-2 underline-offset-4'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="font-medium text-emerald-700">
              You said {matchedCount} of {totalCount} words. Keep going!
            </span>
            <button
              type="button"
              onClick={startListening}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
