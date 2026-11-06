export type SelfCheckRating = 'good' | 'ok' | 'hard' | null;

export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating];
  status: 'new' | 'practiced' | 'done';
}

export type StepType = 1 | 2 | 3 | 4;

export type AppScreen = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export const MOVIE_INFO = {
  titleEn: 'Kung Fu Panda 4',
  titleKo: '쿵푸 팬더 4',
  year: '2024',
  director: 'Mike Mitchell',
  screenplay: 'Jonathan Aibel and Glenn Berger',
  production: 'DreamWorks Animation',
  distribution: 'Universal Pictures',
  sceneDescription: 'Scene where the protagonist meets a villain',
  youtubeTitle: 'The FUNNIEST Scenes from KUNG FU PANDA 4 🌀 4K',
  youtubeChannel: 'Boxoffice ANIMATION ☆ Movie Scenes',
  youtubeUrl: 'https://youtu.be/QZlOZtdJA50?si=htVfNqdyRtzdOEtT',
  videoId: 'QZlOZtdJA50',
  startSeconds: 190,
  endSeconds: 245,
  madeBy: '이가낙',
  creditLine:
    'Clip: Kung Fu Panda 4 (2024), Universal Pictures / DreamWorks Animation · via YouTube · For educational use only',
};
