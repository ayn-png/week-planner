'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlannerContext } from '@/context/PlannerContext';
import { DAY_LABELS, DayOfWeek } from '@/types/planner';
import { findAvailableSlot } from '@/lib/services/schedulingService';

// Type definitions for SpeechRecognition API
const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function VoicePlanner() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  const { state, dispatch } = usePlannerContext();

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setError('');
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        // Auto-add a 30 min block to the earliest slot today
        const nextId = crypto.randomUUID();
        const currentBlocks = state.blocks;
        const availableSlot = findAvailableSlot(currentBlocks, 30);
        
        const day = (availableSlot ? availableSlot.day : DAY_LABELS[0] || 'Mon') as DayOfWeek;
        const start = availableSlot ? availableSlot.startTime : 9 * 60;
        
        dispatch({
          type: 'ADD_BLOCK',
          block: {
            id: nextId,
            day: day,
            title: text,
            startTime: start,
            endTime: start + 30, // 30 min default
            category: 'work',
            color: '#3b82f6',
            createdAt: Date.now(),
          }
        });
        
        // After added, stop listening automatically
        setIsListening(false);
        setTimeout(() => setTranscript(''), 3000);
      };

      rec.onerror = (event: any) => {
        setIsListening(false);
        setError(event.error === 'not-allowed' ? 'Mic access denied' : 'Could not understand, try again.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [state.blocks, dispatch]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition?.stop();
    } else {
      if (!recognition) {
        setError("Browser doesn't support Voice API");
        return;
      }
      recognition.start();
    }
  }, [isListening, recognition]);

  if (!SpeechRecognition) return null;

  return (
    <div className="flex items-center gap-3">
      {transcript && (
        <span className="text-sm italic text-muted-foreground animate-pulse">
          "{transcript}"
        </span>
      )}
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
      <Button
        variant={isListening ? "destructive" : "secondary"}
        size="icon"
        className="rounded-full shadow bg-card border border-border"
        onClick={toggleListening}
        title="Quick Voice Add"
      >
        {isListening ? (
           <MicOff className="w-4 h-4" />
        ) : (
           <Mic className="w-4 h-4 text-primary" />
        )}
      </Button>
    </div>
  );
}
