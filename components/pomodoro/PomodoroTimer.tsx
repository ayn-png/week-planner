'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, X, Minus, GripHorizontal, Music, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { useDraggablePosition } from '@/hooks/useDraggablePosition';
import { FOCUS_TRACKS } from '@/lib/music/tracks';
import { usePlannerStore } from '@/store/plannerStore';
import { Flame } from 'lucide-react';

type Mode = 'focus' | 'short' | 'long';

const MODES: Record<Mode, { label: string; minutes: number; color: string; ring: string }> = {
  focus: { label: 'Focus',       minutes: 25, color: '#ef4444', ring: '#ef444433' },
  short: { label: 'Short Break', minutes: 5,  color: '#22c55e', ring: '#22c55e33' },
  long:  { label: 'Long Break',  minutes: 15, color: '#3b82f6', ring: '#3b82f633' },
};

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroTimer({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { flowSessions, incrementFlowSessions } = usePlannerStore();

  // ── Music state ────────────────────────────────────────────────────────────
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { position, dragHandleProps } = useDraggablePosition({
    storageKey: 'pomodoro-position',
    defaultPosition: { x: Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 280), y: 80 },
  });

  const totalSeconds = MODES[mode].minutes * 60;
  const progress = secondsLeft / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const cfg = MODES[mode];
  const currentTrack = FOCUS_TRACKS[trackIndex];

  // ── Audio setup ────────────────────────────────────────────────────────────

  // Keep audio volume in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Auto-play/pause when running state or mode changes
  useEffect(() => {
    if (!audioRef.current || !musicEnabled) return;
    if (isRunning && mode === 'focus') {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play().catch(() => {});
      setIsAudioPlaying(true);
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, musicEnabled]);

  function handleTrackEnd() {
    const next = (trackIndex + 1) % FOCUS_TRACKS.length;
    setTrackIndex(next);
    // Audio src will update and we need to play it
    setTimeout(() => {
      if (audioRef.current && isRunning && mode === 'focus' && musicEnabled) {
        audioRef.current.play().catch(() => {});
      }
    }, 50);
  }

  function prevTrack() {
    const prev = (trackIndex - 1 + FOCUS_TRACKS.length) % FOCUS_TRACKS.length;
    setTrackIndex(prev);
    setTimeout(() => {
      if (audioRef.current && isRunning && mode === 'focus' && musicEnabled) {
        audioRef.current.play().catch(() => {});
      }
    }, 50);
  }

  function nextTrack() {
    const next = (trackIndex + 1) % FOCUS_TRACKS.length;
    setTrackIndex(next);
    setTimeout(() => {
      if (audioRef.current && isRunning && mode === 'focus' && musicEnabled) {
        audioRef.current.play().catch(() => {});
      }
    }, 50);
  }

  function toggleMusicPlay() {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play().catch(() => {});
      setIsAudioPlaying(true);
    }
  }

  // ── Timer logic ────────────────────────────────────────────────────────────

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setSecondsLeft(MODES[newMode].minutes * 60);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const completeSession = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Week Planner', {
        body: mode === 'focus' ? '🎉 Focus session done! Time for a break.' : '💪 Break over — back to focus!',
        icon: '/icons/icon-192.png',
      });
    }

    if (mode === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      incrementFlowSessions();
      switchMode(newCount % 4 === 0 ? 'long' : 'short');
    } else {
      switchMode('focus');
    }
  }, [mode, sessionCount, switchMode, incrementFlowSessions]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { completeSession(); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, completeSession]);

  function requestNotificationPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function handlePlayPause() {
    requestNotificationPermission();
    setIsRunning((r) => !r);
  }

  function handleReset() {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(MODES[mode].minutes * 60);
  }

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnd}
        preload="none"
      />

      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9999 }}
        className="select-none"
      >
        <div
          className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden"
          style={{ width: 252 }}
        >
          {/* Drag handle */}
          <div
            {...dragHandleProps}
            className="flex items-center justify-between px-3 py-2 bg-muted/40 cursor-grab active:cursor-grabbing border-b border-border/40"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Pomodoro</span>
              {flowSessions > 0 && (
                <div className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[10px] font-bold">
                  <Flame className="h-3 w-3" />
                  {flowSessions}
                </div>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowMusic((m) => !m)}
                className={`p-1 rounded hover:bg-muted transition-colors ${showMusic ? 'text-primary' : 'text-muted-foreground'}`}
                title="Toggle music player"
              >
                <Music className="h-3 w-3" />
              </button>
              <button
                onClick={() => setMinimized((m) => !m)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {minimized ? (
              <motion.div
                key="mini"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="text-lg font-mono font-bold tracking-tight" style={{ color: cfg.color }}>
                  {mm}:{ss}
                </span>
                <button
                  onClick={handlePlayPause}
                  className="p-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: cfg.ring }}
                >
                  {isRunning
                    ? <Pause className="h-3 w-3" style={{ color: cfg.color }} />
                    : <Play className="h-3 w-3" style={{ color: cfg.color }} />
                  }
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 flex flex-col items-center gap-3"
              >
                {/* Mode tabs */}
                <div className="flex gap-1 w-full">
                  {(Object.keys(MODES) as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className="flex-1 rounded-md py-1 text-[10px] font-medium transition-all"
                      style={{
                        backgroundColor: mode === m ? MODES[m].ring : 'transparent',
                        color: mode === m ? MODES[m].color : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${mode === m ? MODES[m].color + '44' : 'transparent'}`,
                      }}
                    >
                      {MODES[m].label}
                    </button>
                  ))}
                </div>

                {/* Ring + countdown */}
                <div className="relative flex items-center justify-center">
                  <svg width="120" height="120" className="-rotate-90">
                    <circle cx="60" cy="60" r={RADIUS} fill="none" stroke={cfg.ring} strokeWidth="6" />
                    <motion.circle
                      cx="60" cy="60" r={RADIUS}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 0.5, ease: 'linear' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold leading-none" style={{ color: cfg.color }}>
                      {mm}:{ss}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{cfg.label}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    onClick={handlePlayPause}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-3.5 rounded-full shadow-lg transition-colors"
                    style={{ backgroundColor: cfg.color }}
                  >
                    {isRunning
                      ? <Pause className="h-5 w-5 text-white" />
                      : <Play className="h-5 w-5 text-white" />
                    }
                  </motion.button>

                  <div className="w-8 h-8" />
                </div>

                {/* Session dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{ scale: i < (sessionCount % 4 || (sessionCount > 0 && sessionCount % 4 === 0 ? 4 : 0)) ? 1 : 0.6 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                      className="rounded-full"
                      style={{
                        width: 8, height: 8,
                        backgroundColor: i < (sessionCount % 4 || (sessionCount > 0 && sessionCount % 4 === 0 ? 4 : 0))
                          ? cfg.color : 'hsl(var(--muted))',
                      }}
                    />
                  ))}
                  {sessionCount > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">{sessionCount} done</span>
                  )}
                </div>

                {/* ── Music Player ──────────────────────────────────────────── */}
                <AnimatePresence>
                  {showMusic && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full border-t border-border/40 pt-3 space-y-2.5 overflow-hidden"
                    >
                      {/* Enable toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">Focus Music</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <span className="text-[11px] text-muted-foreground">{musicEnabled ? 'On' : 'Off'}</span>
                          <div
                            onClick={() => setMusicEnabled((e) => !e)}
                            className={`relative w-7 h-4 rounded-full transition-colors cursor-pointer ${musicEnabled ? 'bg-primary' : 'bg-muted'}`}
                          >
                            <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${musicEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                          </div>
                        </label>
                      </div>

                      {musicEnabled && (
                        <>
                          {/* Track info */}
                          <div className="text-center">
                            <p className="text-[11px] font-medium truncate">{currentTrack.title}</p>
                            <p className="text-[10px] text-muted-foreground">{currentTrack.mood} · {trackIndex + 1}/{FOCUS_TRACKS.length}</p>
                          </div>

                          {/* Playback controls */}
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={prevTrack}
                              className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <SkipBack className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={toggleMusicPlay}
                              className="p-2 rounded-full transition-colors"
                              style={{ backgroundColor: cfg.ring }}
                            >
                              {isAudioPlaying
                                ? <Pause className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                                : <Play className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                              }
                            </button>

                            <button
                              onClick={nextTrack}
                              className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <SkipForward className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Volume */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsMuted((m) => !m)}
                              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                            >
                              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </button>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={isMuted ? 0 : volume}
                              onChange={(e) => {
                                setVolume(parseFloat(e.target.value));
                                setIsMuted(false);
                              }}
                              className="flex-1 h-1 accent-primary cursor-pointer"
                            />
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
