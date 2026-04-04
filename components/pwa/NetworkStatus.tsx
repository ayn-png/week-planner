'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[300] flex justify-center pt-2 px-4 pointer-events-none"
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shadow-lg border ${
              isOnline
                ? 'bg-green-950/90 border-green-800/50 text-green-300'
                : 'bg-destructive/90 border-destructive/50 text-white'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                Back online — syncing…
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                You&apos;re offline — changes will sync when reconnected
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
