export {};

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          width?: string | number;
          height?: string | number;
          playerVars?: {
            autoplay?: 0 | 1;
            cc_load_policy?: 0 | 1;
            controls?: 0 | 1;
            disablekb?: 0 | 1;
            enablejsapi?: 0 | 1;
            end?: number;
            fs?: 0 | 1;
            modestbranding?: 0 | 1;
            origin?: string;
            playsinline?: 0 | 1;
            rel?: 0 | 1;
            start?: number;
          };
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }

  interface YTPlayerInstance {
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    getPlayerState: () => number;
    setPlaybackRate: (suggestedRate: number) => void;
    getPlaybackRate: () => number;
    getAvailablePlaybackRates: () => number[];
    destroy: () => void;
  }
}
