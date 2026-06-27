import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-[90px] sm:bottom-6 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 sm:left-auto z-[9999] flex items-center gap-2 bg-vyntra-surface/90 backdrop-blur-lg text-white border border-vyntra-error/30 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,59,48,0.2)]"
        >
          <div className="w-2 h-2 rounded-full bg-vyntra-error animate-pulse" />
          <WifiOff size={16} className="text-vyntra-error" />
          <span className="text-sm font-medium text-vyntra-error">Offline</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
