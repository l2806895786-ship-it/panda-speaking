import { useState, useRef } from 'react';
import { Sentence, SentenceProgress } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from '../components/YouTubePlayer';
import { ChevronRight, Eye, EyeOff, Play, Plus, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SentenceListScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onSelectSentence: (sentenceId: number) => void;
  onBackToHome: () => void;
  onOpenEdit: () => void;
}

export function SentenceListScreen({
  sentences,
  progressMap,
  onSelectSentence,
  onBackToHome,
  onOpenEdit,
}: SentenceListScreenProps) {
  const [hideAllText, setHideAllText] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle>(null);

  const getStatusIcon = (sentenceId: number) => {
    const prog = progressMap[sentenceId];
    if (!prog || prog.status === 'new') {
      return (
        <span className="text-slate-400 font-bold text-base" title="Not started">
          ☆
        </span>
      );
    }
    if (prog.status === 'practiced') {
      return (
        <span className="text-blue-500 font-bold text-base" title="Practiced">
          ◐
        </span>
      );
    }
    return (
      <span className="text-amber-500 font-bold text-base" title="Done (Step 4 completed)">
        ★
      </span>
    );
  };

  const getStatusLabel = (sentenceId: number) => {
    const prog = progressMap[sentenceId];
    if (!prog || prog.status === 'new') return 'New / 미완료';
    if (prog.status === 'practiced') return 'Practiced / 연습함';
    return 'Done / 완료';
  };

  return (
    <div className="flex flex-col space-y-4 pb-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home / 처음으로</span>
        </button>

        <button
          type="button"
          onClick={onOpenEdit}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Edit / 편집</span>
        </button>
      </div>

      {/* Video Player at top */}
      <div className="w-full">
        <YouTubePlayer ref={playerRef} />
      </div>

      {/* List Header and Controls */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Practice Sentences ({sentences.length})
          </h2>
          <p className="text-xs text-slate-500">
            Tap a card to start shadowing / 카드를 탭하여 연습
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHideAllText(!hideAllText)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-xs"
        >
          {hideAllText ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{hideAllText ? 'Show All Text' : 'Hide All Text'}</span>
        </button>
      </div>

      {/* Sentences List */}
      {sentences.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <p className="text-xs text-slate-500">
            등록된 연습 문장이 없습니다. 문장 편집 화면에서 추가해 주세요.
          </p>
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sentences / 문장 추가하기</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sentences.map((sentence, index) => {
            const prog = progressMap[sentence.id];
            const isDone = prog?.status === 'done';

            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(sentence.id)}
                className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-blue-300 active:scale-[0.99] flex flex-col space-y-2 ${
                  isDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px]">
                      {sentence.speaker}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {sentence.start.toFixed(1)}s – {sentence.end.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{getStatusIcon(sentence.id)}</span>
                    <span className="text-[11px] text-slate-400">{getStatusLabel(sentence.id)}</span>
                  </div>
                </div>

                {/* Sentence English Text */}
                <div className="text-slate-900 font-medium text-base sm:text-lg leading-snug">
                  {hideAllText ? (
                    <span className="text-slate-400 italic text-sm">
                      [Text hidden for listening practice / 문장 숨김]
                    </span>
                  ) : (
                    sentence.text.split(' ').map((word, wIdx) => {
                      const cleanW = word.toLowerCase().replace(/[^a-z0-9']/g, '');
                      const isStress = sentence.stress.some(
                        (s) => s.toLowerCase() === cleanW
                      );
                      return (
                        <span
                          key={wIdx}
                          className={isStress ? 'font-bold text-blue-700 underline decoration-blue-300' : ''}
                        >
                          {word}{' '}
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Korean Meaning */}
                <div className="text-xs text-slate-500 font-normal">
                  {sentence.korean}
                </div>

                {/* Bottom Row: Quick metadata + Arrow */}
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Plays: {prog?.plays || 0} · Recordings: {prog?.recordings || 0}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-semibold">
                    <span>Practice</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
