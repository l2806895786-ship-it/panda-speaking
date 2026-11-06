import { Sentence, SentenceProgress, MOVIE_INFO } from '../types';
import {
  Trophy,
  RotateCcw,
  List,
  Sparkles,
  ArrowRight,
  Smile,
  Meh,
  CheckCircle2,
  Film,
  Home,
} from 'lucide-react';

interface FinishScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onPracticeAgain: (sentenceId: number) => void;
  onReviewAll: () => void;
  onGoHome: () => void;
}

export function FinishScreen({
  sentences,
  progressMap,
  onPracticeAgain,
  onReviewAll,
  onGoHome,
}: FinishScreenProps) {
  // Aggregate stats
  let totalRecordings = 0;
  let completedCount = 0;
  let practicedCount = 0;

  const hardSentences: Sentence[] = [];

  sentences.forEach((s) => {
    const prog = progressMap[s.id];
    if (prog) {
      totalRecordings += prog.recordings || 0;
      if (prog.status === 'done') {
        completedCount++;
      } else if (prog.status === 'practiced') {
        practicedCount++;
      }

      // Check if any self check is marked 'hard' ('😐')
      if (prog.selfCheck.some((val) => val === 'hard')) {
        hardSentences.push(s);
      }
    }
  });

  return (
    <div className="flex flex-col space-y-6 pb-12 text-center">
      {/* Celebration Header */}
      <div className="pt-4 space-y-2">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center shadow-lg transform -rotate-3">
          <Trophy className="w-9 h-9" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Great Job!
        </h1>
        <p className="text-base font-bold text-blue-600">
          오늘의 쉐도잉 세션을 멋지게 마쳤습니다!
        </p>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Listening and repeating with native movie speech builds real confidence and rhythm.
        </p>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-blue-600">
            {completedCount + practicedCount} / {sentences.length}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 mt-0.5">Practiced</span>
          <span className="text-[10px] text-slate-400">연습 문장</span>
        </div>

        <div className="flex flex-col items-center border-x border-slate-100 px-2">
          <span className="text-2xl font-black text-purple-600">
            {totalRecordings}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 mt-0.5">Recordings</span>
          <span className="text-[10px] text-slate-400">총 녹음 횟수</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-amber-500">
            {completedCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 mt-0.5">Mastered ★</span>
          <span className="text-[10px] text-slate-400">Step 4 완료</span>
        </div>
      </div>

      {/* Needs Practice Section (sentences marked 😐) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Meh className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Sentences to Polish / 다시 연습해볼 문장
            </h3>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {hardSentences.length} items
          </span>
        </div>

        {hardSentences.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 space-y-1">
            <div className="text-emerald-600 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>All sentences were practiced smoothly!</span>
            </div>
            <p className="text-[11px] text-slate-400">
              자체 점검에서 😐로 체크된 문장이 없습니다. 훌륭합니다!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500">
              You marked 😐 on speed, stress, or intonation for these lines:
            </p>
            {hardSentences.map((s, idx) => (
              <div
                key={s.id}
                className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-slate-700">#{s.id}</span>
                    <span className="font-semibold text-blue-700">{s.speaker}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {s.text}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.korean}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPracticeAgain(s.id)}
                  className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Practice again</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={onReviewAll}
          className="w-full min-h-[50px] px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md active:scale-[0.99] transition-all flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again / 처음부터 다시 연습</span>
          </div>
          <span className="text-[10px] text-blue-100 font-normal">
            첫 번째 문장부터 다시 시작하기
          </span>
        </button>

        <button
          type="button"
          onClick={onGoHome}
          className="w-full min-h-[48px] px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-2xl shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>Return to Home / 처음으로 돌아가기</span>
        </button>
      </div>

      {/* Required Credit Line at bottom of finish screen */}
      <div className="pt-4 border-t border-slate-200 text-center">
        <p className="text-[13px] leading-snug text-slate-500 font-medium">
          {MOVIE_INFO.creditLine}
        </p>
      </div>
    </div>
  );
}
