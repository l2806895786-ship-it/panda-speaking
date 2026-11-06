import { Play, List, Settings, Film, Sparkles, Volume2, Mic, Headphones } from 'lucide-react';
import { EducationalNotice } from '../components/EducationalNotice';
import { MOVIE_INFO } from '../types';

interface StartScreenProps {
  onStartPractice: () => void;
  onOpenList: () => void;
  onOpenEdit: () => void;
  sentenceCount: number;
}

export function StartScreen({
  onStartPractice,
  onOpenList,
  onOpenEdit,
  sentenceCount,
}: StartScreenProps) {
  return (
    <div className="flex flex-col space-y-6 pb-8">
      {/* Hero Brand Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-semibold text-blue-700 mb-3">
          <Film className="w-3.5 h-3.5" />
          <span>Kung Fu Panda 4 · Movie Shadowing</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Scene Shadow: Panda Speaking
        </h1>
        <p className="text-sm sm:text-base font-semibold text-blue-600 mt-1">
          Listen. Copy. Speak at the same time.
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          듣고, 따라하고, 동시에 말하는 고교 1학년 영어 쉐도잉
        </p>
      </div>

      {/* Movie Clip Feature Card */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between text-xs text-blue-200 font-medium">
            <span>{MOVIE_INFO.titleEn} ({MOVIE_INFO.titleKo})</span>
            <span>{MOVIE_INFO.year}</span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {MOVIE_INFO.sceneDescription}
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              "The characters use simple, emotional, and lively expressions. This app improves speaking skills in a fun, safe way."
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100/80">
            <span>{sentenceCount} Practice Sentences (3:10 – 4:05)</span>
            <span>CEFR B1–B2 · 10–15 min</span>
          </div>
        </div>
        {/* Subtle decorative background glow */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* What is shadowing? Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">
            What is Shadowing? / 쉐도잉이란?
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Shadowing means listening to a native actor and repeating the sentence almost at the same time, copying rhythm, stress, and emotion.
        </p>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-900">1. Listen closely / 귀로 듣기: </span>
              <span className="text-slate-600">Focus on the character's intonation and rhythm.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-900">2. Speak together / 입으로 따라하기: </span>
              <span className="text-slate-600">Whisper first, then speak aloud at the exact same pace.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-900">3. Record & Check / 녹음하고 확인: </span>
              <span className="text-slate-600">Compare your voice with the movie actor.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-1">
        {/* Big Start Practice Button */}
        <button
          type="button"
          onClick={onStartPractice}
          className="w-full min-h-[52px] px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="flex items-center gap-2 text-base">
            <Play className="w-5 h-5 fill-white" />
            <span>Start Practice</span>
          </div>
          <span className="text-xs font-normal text-blue-100 mt-0.5">연습 시작</span>
        </button>

        {/* Secondary Button: Sentence List */}
        <button
          type="button"
          onClick={onOpenList}
          className="w-full min-h-[48px] px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-2xl shadow-sm active:scale-[0.99] transition-all flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sm text-slate-800">
            <List className="w-4 h-4 text-slate-500" />
            <span>View Sentence List ({sentenceCount})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-500">문장 목록 보기</span>
        </button>

        {/* Small Link: Edit Sentences */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 py-1 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      </div>

      {/* Mandatory Educational Use & Source Card */}
      <EducationalNotice />
    </div>
  );
}
