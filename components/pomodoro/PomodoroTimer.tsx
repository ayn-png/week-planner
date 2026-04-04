'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, X, Minus, GripHorizontal,
  Music, Volume2, VolumeX, SkipBack, SkipForward, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useDraggablePosition } from '@/hooks/useDraggablePosition';
import { FOCUS_TRACKS } from '@/lib/music/tracks';
import { usePlannerStore } from '@/store/plannerStore';
import { Flame } from 'lucide-react';

type Mode = 'focus' | 'short' | 'long';

// ── Settings helpers ────────────────────────────────────────────────────────

const SETTINGS_KEY = 'wp-pomodoro-settings';

interface PomodoroSettings {
  focusMinutes: number;
  shortMinutes: number;
  longMinutes: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
};

function loadSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
    return {
      focusMinutes: Number(parsed.focusMinutes) || DEFAULT_SETTINGS.focusMinutes,
      shortMinutes: Number(parsed.shortMinutes) || DEFAULT_SETTINGS.shortMinutes,
      longMinutes: Number(parsed.longMinutes) || DEFAULT_SETTINGS.longMinutes,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: PomodoroSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

// ── Visual constants ────────────────────────────────────────────────────────

const MODE_COLORS: Record<Mode, { label: string; color: string; ring: string }> = {
  focus: { label: 'Focus',       color: '#ef4444', ring: '#ef444433' },
  short: { label: 'Short Break', color: '#22c55e', ring: '#22c55e33' },
  long:  { label: 'Long Break',  color: '#3b82f6', ring: '#3b82f633' },
};

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ── Component ───────────────────────────────────────────────────────────────

export function PomodoroTimer({ onClose }: { onClose: () => void }) {
  // ── Settings state (user-configurable durations) ────────────────────────
  const [settings, setSettings] = useState<PomodoroSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  // Persist settings to localStorage on every change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function updateSetting(key: keyof PomodoroSettings, raw: string) {
    const val = Math.max(1, Math.min(120, parseInt(raw, 10) || 1));
    setSettings((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });
  }

  // Derive minutes for each mode from settings
  function modeMinutes(m: Mode): number {
    if (m === 'focus') return settings.focusMinutes;
    if (m === 'short') return settings.shortMinutes;
    return settings.longMinutes;
  }

  // ── Timer state ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(settings.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { flowSessions, incrementFlowSessions } = usePlannerStore();

  // ── Refs for stale-closure-safe timer callbacks ──────────────────────────
  const modeRef = useRef<Mode>(mode);
  const isRunningRef = useRef<boolean>(isRunning);
  const sessionCountRef = useRef<number>(sessionCount);
  const musicEnabledRef = useRef<boolean>(true);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);

  // ── Music state ─────────────────────────────────────────────────────────
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { musicEnabledRef.current = musicEnabled; }, [musicEnabled]);

  const { position, dragHandleProps } = useDraggablePosition({
    storageKey: 'pomodoro-position',
    defaultPosition: {
      x: Math.max(0, (typeof window !== 'undefined' ? window.innerWidth : 800) - 320),
      y: 80,
    },
  });

  const totalSeconds = modeMinutes(mode) * 60;
  const progress = secondsLeft / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const cfg = MODE_COLORS[mode];
  const currentTrack = FOCUS_TRACKS[trackIndex];

  // ── Audio volume sync ────────────────────────────────────────────────────
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
    setTimeout(() => {
      // Read current values via refs to avoid stale closure
      if (audioRef.current && isRunningRef.current && modeRef.current === 'focus' && musicEnabledRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }, 50);
  }

  function prevTrack() {
    const prev = (trackIndex - 1 + FOCUS_TRACKS.length) % FOCUS_TRACKS.length;
    setTrackIndex(prev);
    setTimeout(() => {
      if (audioRef.current && isRunningRef.current && modeRef.current === 'focus' && musicEnabledRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }, 50);
  }

  function nextTrack() {
    const next = (trackIndex + 1) % FOCUS_TRACKS.length;
    setTrackIndex(next);
    setTimeout(() => {
      if (audioRef.current && isRunningRef.current && modeRef.current === 'focus' && musicEnabledRef.current) {
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

  // ── Timer logic ──────────────────────────────────────────────────────────

  const switchMode = useCallback((newMode: Mode, overrideSettings?: PomodoroSettings) => {
    const mins = overrideSettings ? (
      newMode === 'focus' ? overrideSettings.focusMinutes
      : newMode === 'short' ? overrideSettings.shortMinutes
      : overrideSettings.longMinutes
    ) : modeMinutes(newMode);
    setMode(newMode);
    setSecondsLeft(mins * 60);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const completeSession = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Read current mode and session count via refs — no stale closure
    const currentMode = modeRef.current;
    const currentSessionCount = sessionCountRef.current;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Week Planner', {
        body: currentMode === 'focus'
          ? '🎉 Focus session done! Time for a break.'
          : '💪 Break over — back to focus!',
        icon: '/icons/icon-192.png',
      });
    }

    if (currentMode === 'focus') {
      const newCount = currentSessionCount + 1;
      setSessionCount(newCount);
      incrementFlowSessions();
      switchMode(newCount % 4 === 0 ? 'long' : 'short');
    } else {
      switchMode('focus');
    }
  }, [switchMode, incrementFlowSessions]);

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

  // When settings change, reset the current mode's timer to the new duration
  // only if the timer is not running
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(modeMinutes(mode) * 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

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
    setSecondsLeft(modeMinutes(mode) * 60);
  }

  // ── Session dots — always 4 dots, fill based on sessionCount % 4
  //    Special case: if sessionCount > 0 and sessionCount % 4 === 0, all 4 are filled
  //    to visually confirm a full set is complete before they reset.
  const filledDots = sessionCount === 0
    ? 0
    : sessionCount % 4 === 0
      ? 4
      : sessionCount % 4;

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
                aria-label="Toggle music player"
              >
                <Music className="h-3 w-3" />
              </button>
              <button
                onClick={() => setMinimized((m) => !m)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                aria-label={minimized ? 'Expand timer' : 'Minimize timer'}
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground"
                aria-label="Close Pomodoro timer"
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
                  aria-label={isRunning ? 'Pause timer' : 'Start timer'}
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
                  {(Object.keys(MODE_COLORS) as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className="flex-1 rounded-md py-1 text-[10px] font-medium transition-all"
                      style={{
                        backgroundColor: mode === m ? MODE_COLORS[m].ring : 'transparent',
                        color: mode === m ? MODE_COLORS[m].color : 'hsl(var(--muted-foreground))',
                        border: `1px solid ${mode === m ? MODE_COLORS[m].color + '44' : 'transparent'}`,
                      }}
                    >
                      {MODE_COLORS[m].label}
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
                    aria-label="Reset timer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.button>

                  <motion.button
                    onClick={handlePlayPause}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-3.5 rounded-full shadow-lg transition-colors"
                    style={{ backgroundColor: cfg.color }}
                    aria-label={isRunning ? 'Pause timer' : 'Start timer'}
                  >
                    {isRunning
                      ? <Pause className="h-5 w-5 text-white" />
                      : <Play className="h-5 w-5 text-white" />
                    }
                  </motion.button>

                  <div className="w-8 h-8" />
                </div>

                {/* Session dots — always 4 dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{ scale: i < filledDots ? 1 : 0.6 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                      className="rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: i < filledDots ? cfg.color : 'hsl(var(--muted))',
                      }}
                    />
                  ))}
                  {sessionCount > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1">{sessionCount} done</span>
                  )}
                </div>

                {/* ── Settings panel ─────────────────────────────────────── */}
                <div className="w-full border-t border-border/40 pt-2">
                  <button
                    onClick={() => setShowSettings((s) => !s)}
                    className="w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5"
                    aria-expanded={showSettings}
                    aria-label="Toggle duration settings"
                  >
                    <span className="font-medium">Duration settings</span>
                    {showSettings
                      ? <ChevronUp className="h-3 w-3" />
                      : <ChevronDown className="h-3 w-3" />
                    }
                  </button>

                  <AnimatePresence initial={false}>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 space-y-2">
                          {(
                            [
                              { key: 'focusMinutes' as const, label: 'Focus' },
                              { key: 'shortMinutes' as const, label: 'Short break' },
                              { key: 'longMinutes' as const, label: 'Long break' },
                            ] as const
                          ).map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <label className="text-[11px] text-muted-foreground flex-1">{label}</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={120}
                                  value={settings[key]}
                                  onChange={(e) => updateSetting(key, e.target.value)}
                                  className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-center focus:outline-none focus:ring-1 focus:ring-ring"
                                  aria-label={`${label} duration in minutes`}
                                />
                                <span className="text-[10px] text-muted-foreground">min</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                              aria-label="Previous track"
                            >
                              <SkipBack className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={toggleMusicPlay}
                              className="p-2 rounded-full transition-colors"
                              style={{ backgroundColor: cfg.ring }}
                              aria-label={isAudioPlaying ? 'Pause music' : 'Play music'}
                            >
                              {isAudioPlaying
                                ? <Pause className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                                : <Play className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                              }
                            </button>

                            <button
                              onClick={nextTrack}
                              className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label="Next track"
                            >
                              <SkipForward className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Volume */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsMuted((m) => !m)}
                              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                              aria-label={isMuted ? 'Unmute' : 'Mute'}
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
                              aria-label="Volume"
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
