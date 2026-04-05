'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return; // Already installed

    if (isIOS()) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close iOS sheet on outside click
  useEffect(() => {
    if (!showIOSSheet) return;
    function onClickOutside(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setShowIOSSheet(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showIOSSheet]);

  const handleClick = async () => {
    if (isIOS()) {
      setShowIOSSheet((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            aria-label="Install app"
            className="flex h-9 w-9 min-h-[44px] min-w-[44px] md:h-7 md:w-7 md:min-h-0 md:min-w-0 items-center justify-center rounded-md hover:bg-muted transition-colors text-primary"
          >
            <Download className="h-3.5 w-3.5" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>Install app</TooltipContent>
      </Tooltip>

      {/* iOS instructions popover */}
      <AnimatePresence>
        {showIOSSheet && (
          <motion.div
            ref={sheetRef}
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-[200] w-64 rounded-2xl border border-border/50 bg-card shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Install on iPhone / iPad</p>
              <button
                onClick={() => setShowIOSSheet(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Share className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap the <span className="font-medium text-foreground">Share</span> button in Safari
                </p>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-3.5 w-3.5 text-green-400" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap <span className="font-medium text-foreground">Add to Home Screen</span>
                </p>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Download className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap <span className="font-medium text-foreground">Add</span> — done!
                </p>
              </li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
