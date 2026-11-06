import { ExternalLink, ShieldCheck } from 'lucide-react';
import { MOVIE_INFO } from '../types';

export function EducationalNotice() {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const rangeText = `${formatTime(MOVIE_INFO.startSeconds)} – ${formatTime(
    MOVIE_INFO.endSeconds
  )} (${MOVIE_INFO.startSeconds}s – ${MOVIE_INFO.endSeconds}s)`;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left text-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Educational Use & Source / 교육용 고지 및 출처
        </h3>
      </div>

      {/* Notice Text English + Korean */}
      <div className="space-y-2 mb-4 text-xs leading-relaxed text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">Educational use only / 교육 목적 전용</span>
          <p className="mt-0.5">
            This app was made only for non-commercial English learning in the university course AI
            and English Language Education (ENG3088, Sungkyunkwan University). The film clip is used
            only to practice listening and speaking (shadowing). It is not sold, shared for profit,
            downloaded, or edited. All rights to the film belong to its copyright holders.
          </p>
        </div>
        <div className="pt-1.5 border-t border-slate-200/60">
          <p>
            이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 비영리 영어 학습 목적으로만
            제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적
            배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.
          </p>
        </div>
      </div>

      {/* Source Details Grid */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Movie Title / 영화 제목:</span>
            <span className="font-medium text-slate-900">
              {MOVIE_INFO.titleEn} ({MOVIE_INFO.titleKo})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Release Year / 개봉 연도:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.year}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Director / 감독:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.director}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Screenplay / 각본:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.screenplay}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Production / 제작:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.production}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Distribution / 배급:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.distribution}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Scene / 장면 설명:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.sceneDescription}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">YouTube Title / 영상 제목:</span>
            <span className="font-medium text-slate-900 line-clamp-1">
              {MOVIE_INFO.youtubeTitle}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Channel / 채널명:</span>
            <span className="font-medium text-slate-900">{MOVIE_INFO.youtubeChannel}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Practice Range / 학습 구간:</span>
            <span className="font-medium text-blue-700">{rangeText}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-slate-400">Made by / 제작자:</span>
            <span className="font-medium text-purple-700">{MOVIE_INFO.madeBy}</span>
          </div>

          <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">Original Video URL:</span>
            <a
              href={MOVIE_INFO.youtubeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
