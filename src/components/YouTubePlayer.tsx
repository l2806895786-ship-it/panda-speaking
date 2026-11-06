import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { MOVIE_INFO } from '../types';
import { ExternalLink, AlertTriangle, Play, RefreshCw } from 'lucide-react';

export interface YouTubePlayerHandle {
  playSegment: (start: number, end: number, loop?: boolean, onEnd?: () => void) => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setSpeed: (speed: number) => void;
  isPlaying: () => boolean;
  isReady: () => boolean;
}

interface YouTubePlayerProps {
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
  autoPlaySegment?: { start: number; end: number; loop?: boolean } | null;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ onTimeUpdate, onPlayStateChange, className = '', autoPlaySegment }, ref) => {
    const containerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).slice(2, 9)}`);
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [hasEmbedError, setHasEmbedError] = useState(false);
    const [currentTime, setCurrentTime] = useState(MOVIE_INFO.startSeconds);

    const segmentRef = useRef<{
      start: number;
      end: number;
      loop: boolean;
      onEnd?: () => void;
    } | null>(null);

    const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPlayingRef = useRef(false);

    // Clear monitoring timers
    const clearTimers = useCallback(() => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    }, []);

    // Check segment boundaries every 100ms
    const startSegmentMonitoring = useCallback(() => {
      if (monitorIntervalRef.current) return;

      monitorIntervalRef.current = setInterval(() => {
        if (!playerRef.current || !segmentRef.current) return;

        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate?.(time);

          const { start, end, loop, onEnd } = segmentRef.current;

          // If current playback reached or passed segment end
          if (time >= end) {
            playerRef.current.pauseVideo();
            isPlayingRef.current = false;
            onPlayStateChange?.(false);

            if (loop) {
              // Wait 1.5 seconds for learner to shadow/speak, then repeat
              if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
              loopTimerRef.current = setTimeout(() => {
                if (segmentRef.current && segmentRef.current.loop && playerRef.current) {
                  playerRef.current.seekTo(start, true);
                  playerRef.current.playVideo();
                  isPlayingRef.current = true;
                  onPlayStateChange?.(true);
                }
              }, 1500);
            } else {
              segmentRef.current = null;
              onEnd?.();
            }
          }
        } catch {
          // ignore transient iframe poll issues
        }
      }, 100);
    }, [onPlayStateChange, onTimeUpdate]);

    const playSegment = useCallback(
      (start: number, end: number, loop = false, onEnd?: () => void) => {
        if (loopTimerRef.current) {
          clearTimeout(loopTimerRef.current);
          loopTimerRef.current = null;
        }

        segmentRef.current = { start, end, loop, onEnd };

        if (!playerRef.current) {
          return;
        }

        try {
          playerRef.current.seekTo(start, true);
          playerRef.current.playVideo();
          isPlayingRef.current = true;
          onPlayStateChange?.(true);
          startSegmentMonitoring();
        } catch (e) {
          console.warn('Error starting segment playback:', e);
        }
      },
      [onPlayStateChange, startSegmentMonitoring]
    );

    const pause = useCallback(() => {
      clearTimers();
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
          isPlayingRef.current = false;
          onPlayStateChange?.(false);
        } catch (e) {
          console.warn('Error pausing player:', e);
        }
      }
    }, [clearTimers, onPlayStateChange]);

    const seekTo = useCallback(
      (seconds: number) => {
        if (playerRef.current) {
          try {
            playerRef.current.seekTo(seconds, true);
            setCurrentTime(seconds);
            onTimeUpdate?.(seconds);
          } catch (e) {
            console.warn('Error seeking player:', e);
          }
        }
      },
      [onTimeUpdate]
    );

    const getCurrentTime = useCallback(() => {
      if (playerRef.current) {
        try {
          return playerRef.current.getCurrentTime();
        } catch {
          return currentTime;
        }
      }
      return currentTime;
    }, [currentTime]);

    const setSpeed = useCallback((speed: number) => {
      if (playerRef.current) {
        try {
          playerRef.current.setPlaybackRate(speed);
        } catch (e) {
          console.warn('Error setting playback rate:', e);
        }
      }
    }, []);

    const isPlaying = useCallback(() => isPlayingRef.current, []);
    const isReady = useCallback(() => isPlayerReady, [isPlayerReady]);

    useImperativeHandle(
      ref,
      () => ({
        playSegment,
        pause,
        seekTo,
        getCurrentTime,
        setSpeed,
        isPlaying,
        isReady,
      }),
      [playSegment, pause, seekTo, getCurrentTime, setSpeed, isPlaying, isReady]
    );

    // Initialize YouTube iframe API
    useEffect(() => {
      let isMounted = true;

      const initPlayer = () => {
        if (!isMounted) return;
        if (!window.YT || !window.YT.Player) return;

        const container = document.getElementById(containerIdRef.current);
        if (!container) return;

        try {
          playerRef.current = new window.YT.Player(containerIdRef.current, {
            videoId: MOVIE_INFO.videoId,
            playerVars: {
              start: MOVIE_INFO.startSeconds,
              end: MOVIE_INFO.endSeconds,
              playsinline: 1,
              rel: 0,
              modestbranding: 1,
              controls: 1,
              cc_load_policy: 0,
              enablejsapi: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                if (isMounted) {
                  setIsPlayerReady(true);
                }
              },
              onStateChange: (event) => {
                if (!isMounted) return;
                const state = event.data;
                const isNowPlaying = state === window.YT.PlayerState.PLAYING;
                isPlayingRef.current = isNowPlaying;
                onPlayStateChange?.(isNowPlaying);

                if (isNowPlaying) {
                  startSegmentMonitoring();
                } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
                  if (!segmentRef.current?.loop) {
                    clearTimers();
                  }
                }
              },
              onError: (event) => {
                console.warn('YouTube Player Error code:', event.data);
                // 101 or 150 = owner does not allow embedding
                if (event.data === 101 || event.data === 150 || event.data === 2) {
                  if (isMounted) {
                    setHasEmbedError(true);
                  }
                }
              },
            },
          });
        } catch (e) {
          console.warn('Failed to construct YT.Player:', e);
          if (isMounted) {
            setHasEmbedError(true);
          }
        }
      };

      if (!window.YT || !window.YT.Player) {
        // Load API script
        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevHandler = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevHandler) prevHandler();
          initPlayer();
        };

        // Fallback polling in case ready event already fired
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYT);
            initPlayer();
          }
        }, 200);

        return () => {
          clearInterval(checkYT);
          isMounted = false;
          clearTimers();
          if (playerRef.current) {
            try {
              playerRef.current.destroy();
            } catch {
              // ignore destroy err
            }
          }
        };
      } else {
        initPlayer();
      }

      return () => {
        isMounted = false;
        clearTimers();
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }
      };
    }, [clearTimers, onPlayStateChange, startSegmentMonitoring]);

    // If autoPlaySegment changes and player is ready
    useEffect(() => {
      if (autoPlaySegment && isPlayerReady) {
        playSegment(autoPlaySegment.start, autoPlaySegment.end, autoPlaySegment.loop);
      }
    }, [autoPlaySegment, isPlayerReady, playSegment]);

    const fallbackUrl = `https://www.youtube.com/watch?v=${MOVIE_INFO.videoId}&t=${MOVIE_INFO.startSeconds}s`;

    return (
      <div className={`w-full flex flex-col items-center ${className}`}>
        {/* Video Player 16:9 Aspect Ratio Container */}
        <div className="w-full relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-200">
          {hasEmbedError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="text-sm font-semibold mb-1">This video can't play inside the app.</p>
              <p className="text-xs text-slate-300 mb-4">
                You can still view the scene directly on YouTube and use our text, mic recording, and self-checks!
              </p>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                <span>Tap to open on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <>
              <div id={containerIdRef.current} className="w-full h-full" />
              {!isPlayerReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white pointer-events-none">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mb-2" />
                  <span className="text-xs text-slate-300">Loading scene player...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Required Credit Line: under video player on every screen (at least 13px) */}
        <div className="w-full mt-1.5 px-1 text-center">
          <p className="text-[13px] leading-snug text-slate-500 font-medium select-none">
            {MOVIE_INFO.creditLine}
          </p>
        </div>
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
