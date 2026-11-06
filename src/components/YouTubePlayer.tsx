import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { MOVIE_INFO } from '../types';
import { ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';

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
  currentSegment?: { start: number; end: number };
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
  autoPlaySegment?: { start: number; end: number; loop?: boolean } | null;
}

interface ActiveSegment {
  start: number;
  end: number;
  loop: boolean;
  onEnd?: () => void;
  state: 'seeking' | 'playing';
  requestTimestamp: number;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  (
    { currentSegment, onTimeUpdate, onPlayStateChange, className = '', autoPlaySegment },
    ref
  ) => {
    // Stable ID for the iframe element
    const iframeIdRef = useRef<string>(
      `yt-iframe-${Math.random().toString(36).slice(2, 9)}`
    );
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const playerRef = useRef<YTPlayerInstance | null>(null);

    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [hasEmbedError, setHasEmbedError] = useState(false);
    const [currentTime, setCurrentTime] = useState(
      currentSegment ? currentSegment.start : MOVIE_INFO.startSeconds
    );

    const segmentRef = useRef<ActiveSegment | null>(null);
    const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPlayingRef = useRef(false);

    // Direct postMessage command to the iframe as an instant fallback
    const sendIframeCommand = useCallback((func: string, args: any[] = []) => {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func, args }),
            '*'
          );
        }
      } catch {
        // ignore postMessage error
      }
    }, []);

    // Clear timers
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

    // Monitor playback segment boundaries
    const startSegmentMonitoring = useCallback(() => {
      if (monitorIntervalRef.current) return;

      monitorIntervalRef.current = setInterval(() => {
        const seg = segmentRef.current;
        if (!seg) return;

        let time = currentTime;

        // Try getting official time from YT instance
        if (playerRef.current) {
          try {
            time = playerRef.current.getCurrentTime();
            setCurrentTime(time);
            onTimeUpdate?.(time);
          } catch {
            // fallback to timer calculation
            const elapsed = (Date.now() - seg.requestTimestamp) / 1000;
            time = seg.start + elapsed;
            setCurrentTime(time);
          }
        } else {
          // If YT instance is still binding, estimate by wall clock
          const elapsed = (Date.now() - seg.requestTimestamp) / 1000;
          time = seg.start + elapsed;
          setCurrentTime(time);
        }

        // If currently in seeking phase, do not check end boundary
        if (seg.state === 'seeking') {
          const hasReachedStart = time >= seg.start - 0.4 && time < seg.end;
          const isTimeout = Date.now() - seg.requestTimestamp > 600;

          if (hasReachedStart || isTimeout) {
            seg.state = 'playing';
          } else {
            return;
          }
        }

        // When segment reaches end
        if (time >= seg.end) {
          // Pause playback
          if (playerRef.current) {
            try {
              playerRef.current.pauseVideo();
            } catch {
              sendIframeCommand('pauseVideo');
            }
          } else {
            sendIframeCommand('pauseVideo');
          }

          isPlayingRef.current = false;
          onPlayStateChange?.(false);

          if (seg.loop) {
            // Wait 1.5 seconds for learner to practice shadowing, then repeat
            if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
            loopTimerRef.current = setTimeout(() => {
              if (segmentRef.current && segmentRef.current.loop) {
                segmentRef.current.state = 'seeking';
                segmentRef.current.requestTimestamp = Date.now();

                if (playerRef.current) {
                  try {
                    playerRef.current.seekTo(seg.start, true);
                    playerRef.current.playVideo();
                  } catch {
                    sendIframeCommand('seekTo', [seg.start, true]);
                    sendIframeCommand('playVideo');
                  }
                } else {
                  sendIframeCommand('seekTo', [seg.start, true]);
                  sendIframeCommand('playVideo');
                }

                isPlayingRef.current = true;
                onPlayStateChange?.(true);
              }
            }, 1500);
          } else {
            const callback = seg.onEnd;
            segmentRef.current = null;
            callback?.();
          }
        }
      }, 100);
    }, [currentTime, onPlayStateChange, onTimeUpdate, sendIframeCommand]);

    const playSegment = useCallback(
      (start: number, end: number, loop = false, onEnd?: () => void) => {
        if (loopTimerRef.current) {
          clearTimeout(loopTimerRef.current);
          loopTimerRef.current = null;
        }

        segmentRef.current = {
          start,
          end,
          loop,
          onEnd,
          state: 'seeking',
          requestTimestamp: Date.now(),
        };

        // Execute seek and play through both instance and postMessage fallback
        if (playerRef.current) {
          try {
            playerRef.current.seekTo(start, true);
            playerRef.current.playVideo();
          } catch {
            sendIframeCommand('seekTo', [start, true]);
            sendIframeCommand('playVideo');
          }
        } else {
          sendIframeCommand('seekTo', [start, true]);
          sendIframeCommand('playVideo');
        }

        isPlayingRef.current = true;
        onPlayStateChange?.(true);
        startSegmentMonitoring();
      },
      [onPlayStateChange, sendIframeCommand, startSegmentMonitoring]
    );

    const pause = useCallback(() => {
      clearTimers();
      segmentRef.current = null;
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch {
          sendIframeCommand('pauseVideo');
        }
      } else {
        sendIframeCommand('pauseVideo');
      }
      isPlayingRef.current = false;
      onPlayStateChange?.(false);
    }, [clearTimers, onPlayStateChange, sendIframeCommand]);

    const seekTo = useCallback(
      (seconds: number) => {
        if (playerRef.current) {
          try {
            playerRef.current.seekTo(seconds, true);
          } catch {
            sendIframeCommand('seekTo', [seconds, true]);
          }
        } else {
          sendIframeCommand('seekTo', [seconds, true]);
        }
        setCurrentTime(seconds);
        onTimeUpdate?.(seconds);
      },
      [onTimeUpdate, sendIframeCommand]
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

    const setSpeed = useCallback(
      (speed: number) => {
        if (playerRef.current) {
          try {
            playerRef.current.setPlaybackRate(speed);
          } catch {
            sendIframeCommand('setPlaybackRate', [speed]);
          }
        } else {
          sendIframeCommand('setPlaybackRate', [speed]);
        }
      },
      [sendIframeCommand]
    );

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

    // Pre-cue video when sentence changes
    useEffect(() => {
      if (currentSegment) {
        if (playerRef.current && isPlayerReady) {
          try {
            playerRef.current.seekTo(currentSegment.start, true);
          } catch {
            sendIframeCommand('seekTo', [currentSegment.start, true]);
          }
        } else {
          sendIframeCommand('seekTo', [currentSegment.start, true]);
        }
        setCurrentTime(currentSegment.start);
      }
    }, [currentSegment, isPlayerReady, sendIframeCommand]);

    // Bind YouTube Iframe API to the existing DOM iframe
    useEffect(() => {
      let isMounted = true;

      const bindPlayerToIframe = () => {
        if (!isMounted || !iframeRef.current || !window.YT || !window.YT.Player) {
          return;
        }

        try {
          playerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onReady: () => {
                if (isMounted) {
                  setIsPlayerReady(true);
                  if (currentSegment && playerRef.current) {
                    playerRef.current.seekTo(currentSegment.start, true);
                  }
                }
              },
              onStateChange: (event) => {
                if (!isMounted) return;
                const state = event.data;
                const isNowPlaying = state === window.YT.PlayerState.PLAYING;
                isPlayingRef.current = isNowPlaying;
                onPlayStateChange?.(isNowPlaying);

                if (isNowPlaying) {
                  if (!segmentRef.current && currentSegment) {
                    segmentRef.current = {
                      start: currentSegment.start,
                      end: currentSegment.end,
                      loop: false,
                      state: 'playing',
                      requestTimestamp: Date.now(),
                    };
                  }
                  startSegmentMonitoring();
                } else if (
                  state === window.YT.PlayerState.PAUSED ||
                  state === window.YT.PlayerState.ENDED
                ) {
                  if (!segmentRef.current?.loop) {
                    clearTimers();
                  }
                }
              },
              onError: (event) => {
                console.warn('YouTube Player API Error code:', event.data);
                // 101 or 150 mean embedding restricted
                if (event.data === 101 || event.data === 150) {
                  if (isMounted) setHasEmbedError(true);
                }
              },
            },
          });
        } catch (e) {
          console.warn('Could not bind YT.Player to iframe, falling back to postMessage:', e);
          setIsPlayerReady(true);
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
          bindPlayerToIframe();
        };

        const checkInterval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkInterval);
            bindPlayerToIframe();
          }
        }, 150);

        return () => {
          clearInterval(checkInterval);
          isMounted = false;
          clearTimers();
        };
      } else {
        bindPlayerToIframe();
      }

      return () => {
        isMounted = false;
        clearTimers();
      };
    }, [clearTimers, currentSegment, onPlayStateChange, startSegmentMonitoring]);

    // Handle autoPlaySegment
    useEffect(() => {
      if (autoPlaySegment) {
        playSegment(autoPlaySegment.start, autoPlaySegment.end, autoPlaySegment.loop);
      }
    }, [autoPlaySegment, playSegment]);

    const fallbackUrl = `https://www.youtube.com/watch?v=${MOVIE_INFO.videoId}&t=${MOVIE_INFO.startSeconds}s`;

    // Construct embed URL strictly according to PRD section 4
    const embedSrc = `https://www.youtube.com/embed/${MOVIE_INFO.videoId}?enablejsapi=1&start=${MOVIE_INFO.startSeconds}&end=${MOVIE_INFO.endSeconds}&playsinline=1&rel=0&modestbranding=1&controls=1&cc_load_policy=0`;

    return (
      <div className={`w-full flex flex-col items-center ${className}`}>
        {/* Video Player 16:9 Aspect Ratio Container */}
        <div className="w-full relative aspect-video bg-black rounded-xl overflow-hidden shadow-md border border-slate-200">
          {hasEmbedError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white z-20">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="text-sm font-semibold mb-1">
                This video can't play inside the app.
              </p>
              <p className="text-xs text-slate-300 mb-4 max-w-xs">
                Tap below to open the movie scene on YouTube, and keep practicing shadowing with our audio recorder!
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
            /* The direct iframe element managed cleanly in React */
            <iframe
              ref={iframeRef}
              id={iframeIdRef.current}
              src={embedSrc}
              title={`${MOVIE_INFO.titleEn} - Scene Clip`}
              className="w-full h-full border-0 absolute inset-0 z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>

        {/* Required Credit Line: under video player on every screen (at least 13px) */}
        <div className="w-full mt-1.5 px-1 flex flex-col sm:flex-row items-center justify-between text-center gap-1">
          <p className="text-[13px] leading-snug text-slate-500 font-medium select-none text-left">
            {MOVIE_INFO.creditLine}
          </p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0"
            title="Open original video clip on YouTube"
          >
            <span>YouTube 열기</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
