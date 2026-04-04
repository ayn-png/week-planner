'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';

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
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DURATION) return;

    if (isIOS()) {
      // iOS: no install event — show manual instructions after a short delay
      const timer = setTimeout(() => setShowIOSInstructions(true), 3000);
      return () => clearTimeout(timer);
    }

    // Chrome/Edge/Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowBanner(false);
    setShowIOSInstructions(false);
    setDeferredPrompt(null);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    dismiss();
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Chrome/Android/Desktop install banner */}
      <AnimatePresence>
        {showBanner && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-[200] max-w-sm mx-auto"
          >
            <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Install Week Planner</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add to your home screen for quick access and offline use.
                    </p>
                  </div>
                  <button
                    onClick={dismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={dismiss}
                    className="flex-1 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Install
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari instructions */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-[200] max-w-sm mx-auto"
          >
            <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold">Install on iPhone / iPad</p>
                  <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ol className="space-y-2.5">
                  <li className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Share className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tap the <span className="font-medium text-foreground">Share</span> button in Safari's toolbar
                    </p>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-3.5 w-3.5 text-green-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scroll down and tap <span className="font-medium text-foreground">Add to Home Screen</span>
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
