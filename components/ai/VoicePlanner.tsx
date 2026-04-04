'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePlannerContext } from '@/context/PlannerContext';
import { DAY_LABELS } from '@/types/planner';
import type { DayOfWeek, PlannerBlock } from '@/types/planner';
import { findAvailableSlot } from '@/lib/services/schedulingService';
import { v4 as uuidv4 } from 'uuid';

// Resolve SpeechRecognition across browsers
type SpeechRecognitionCtor = new () => SpeechRecognition;
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition
    : null;

function minutesToLabel(m: number) {
  const h = Math.floor(m / 60) % 12 || 12;
  const min = m % 60;
  const ampm = m < 12 * 60 ? 'AM' : 'PM';
  return `${h}:${min.toString().padStart(2, '0')} ${ampm}`;
}

type PanelState = 'idle' | 'listening' | 'confirming' | 'unsupported';

export function VoicePlanner() {
  const { state, dispatch } = usePlannerContext();
  const [panelState, setPanelState] = useState<PanelState>(
    SpeechRecognitionAPI ? 'idle' : 'unsupported'
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [proposedSlot, setProposedSlot] = useState<{ day: DayOfWeek; startTime: number; endTime: number } | null>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  // Set default category when categories load
  useEffect(() => {
    if (state.categories.length > 0 && !selectedCategory) {
      const workCat = state.categories.find((c) => c.label.toLowerCase() === 'work') ?? state.categories[0];
      setSelectedCategory(workCat.id);
    }
  }, [state.categories, selectedCategory]);

  // Build and attach recognition
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => setPanelState('listening');

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript.trim();
      setTranscript(text);

      // Find best available slot
      const slot = findAvailableSlot(state.blocks, 60);
      const todayIndex = (new Date().getDay() + 6) % 7;
      const day = (slot?.day ?? DAY_LABELS[todayIndex] ?? 'Mon') as DayOfWeek;
      const start = slot?.startTime ?? 9 * 60;
      setProposedSlot({ day, startTime: start, endTime: start + 60 });
      setPanelState('confirming');
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      setPanelState('idle');
      const msg =
        event.error === 'not-allowed'
          ? 'Microphone access denied. Please allow mic access in browser settings.'
          : event.error === 'no-speech'
          ? 'No speech detected. Try again.'
          : 'Could not understand. Please try again.';
      toast.error(msg);
    };

    rec.onend = () => {
      if (panelState === 'listening') setPanelState('idle');
    };

    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.blocks]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setProposedSlot(null);
    try {
      recognitionRef.current.start();
    } catch {
      // already started — ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setPanelState('idle');
  }, []);

  const confirmAdd = useCallback(() => {
    if (!transcript || !proposedSlot) return;
    const cat = state.categories.find((c) => c.id === selectedCategory) ?? state.categories[0];
    if (!cat) return;

    const block: PlannerBlock = {
      id: uuidv4(),
      title: transcript,
      category: cat.id,
      color: cat.color,
      day: proposedSlot.day,
      startTime: proposedSlot.startTime,
      endTime: proposedSlot.endTime,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_BLOCK', block });
    toast.success(`Added "${transcript}" on ${proposedSlot.day}`);
    setTranscript('');
    setProposedSlot(null);
    setPanelState('idle');
    setPanelOpen(false);
  }, [transcript, proposedSlot, selectedCategory, state.categories, dispatch]);

  const cancelConfirm = useCallback(() => {
    setTranscript('');
    setProposedSlot(null);
    setPanelState('idle');
  }, []);

  // Don't render if browser doesn't support it
  if (panelState === 'unsupported') return null;

  const selectedCat = state.categories.find((c) => c.id === selectedCategory);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Expanded panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-72 rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Voice Add</p>
                  <p className="text-[10px] text-muted-foreground">Speak to add a block</p>
                </div>
              </div>
              <button
                onClick={() => { setPanelOpen(false); stopListening(); cancelConfirm(); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close voice panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Idle state */}
              {panelState === 'idle' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Press the mic and say what you want to add — e.g. <em>&quot;Morning workout&quot;</em> or <em>&quot;Team meeting&quot;</em>
                  </p>

                  {/* Category selector */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Category</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {state.categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            selectedCategory === cat.id
                              ? 'border-primary/60 bg-primary/10 text-foreground'
                              : 'border-border/30 bg-muted/30 text-muted-foreground hover:border-border/60 hover:text-foreground'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start listening */}
                  <button
                    onClick={startListening}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Mic className="h-4 w-4" />
                    Start Listening
                  </button>
                </div>
              )}

              {/* Listening state */}
              {panelState === 'listening' && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="absolute h-16 w-16 rounded-full bg-destructive/20"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      className="absolute h-12 w-12 rounded-full bg-destructive/30"
                    />
                    <div className="relative h-10 w-10 rounded-full bg-destructive flex items-center justify-center shadow-lg">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Listening…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Speak clearly into your mic</p>
                  </div>
                  <button
                    onClick={stopListening}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <MicOff className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}

              {/* Confirming state */}
              {panelState === 'confirming' && proposedSlot && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-muted/50 border border-border/30 p-3 space-y-2.5">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Block title</p>
                      <input
                        type="text"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-border/40 focus:border-primary/60 pb-0.5 transition-colors"
                      />
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Category</p>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full appearance-none bg-transparent text-xs pr-5 focus:outline-none cursor-pointer"
                        >
                          {state.categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-0.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Scheduled</p>
                      <p className="text-xs text-foreground">
                        {proposedSlot.day} · {minutesToLabel(proposedSlot.startTime)} – {minutesToLabel(proposedSlot.endTime)}
                      </p>
                    </div>

                    {selectedCat && (
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedCat.color }} />
                        <span className="text-[11px] text-muted-foreground">{selectedCat.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={cancelConfirm}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-border/70 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                      Discard
                    </button>
                    <button
                      onClick={confirmAdd}
                      disabled={!transcript.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Add Block
                    </button>
                  </div>

                  <button
                    onClick={() => { cancelConfirm(); startListening(); }}
                    className="w-full text-center text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    ↺ Try again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setPanelOpen((o) => !o)}
            className={`relative h-12 w-12 rounded-full shadow-lg border flex items-center justify-center transition-colors ${
              panelState === 'listening'
                ? 'bg-destructive border-destructive text-white'
                : panelOpen
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border/50 text-primary hover:border-primary/50'
            }`}
            aria-label="Voice Add — speak to create a calendar block"
          >
            {panelState === 'listening' ? (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <MicOff className="h-5 w-5" />
              </motion.div>
            ) : (
              <Mic className="h-5 w-5" />
            )}

            {/* Pulse ring when listening */}
            {panelState === 'listening' && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-destructive"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left">Voice Add — speak to create a block</TooltipContent>
      </Tooltip>
    </div>
  );
}
