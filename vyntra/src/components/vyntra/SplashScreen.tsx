import React, { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [shrinking, setShrinking] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShrinking(true), 1500);
    const t2 = setTimeout(() => onComplete(), 2000); // 2s duration as requested
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-vyntra-bg flex flex-col items-center justify-center transition-opacity duration-500 ${shrinking ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center animate-scaleUp">
        {/* Soft glowing effect */}
        <div className="absolute inset-0 bg-vyntra-primary/20 blur-[80px] rounded-full scale-150 animate-pulse"></div>
        <div className="absolute inset-0 bg-vyntra-secondary/10 blur-[60px] rounded-full scale-125 animate-[pulse_3s_ease-in-out_infinite]"></div>
        
        {/* Animated logo pulse and scale */}
        <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 mb-8 drop-shadow-[0_0_25px_rgba(108,92,231,0.5)]">
          <img 
            src="/logo.png" 
            alt="Vyntra Logo" 
            className="w-full h-full object-contain animate-[pulse_2s_ease-in-out_infinite]" 
          />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.2em] text-white mb-3 text-gradient relative z-10">VYNTRA</h1>
        
        <p className="text-vyntra-text-sec tracking-widest text-[10px] sm:text-xs font-medium uppercase opacity-80 relative z-10">
          The Future of Human Connection
        </p>

        {/* Circular loading indicator */}
        <div className="mt-16 sm:mt-20 relative flex items-center justify-center z-10">
           <div className="absolute w-12 h-12 rounded-full border-2 border-white/5"></div>
           <div className="absolute w-12 h-12 rounded-full border-t-2 border-vyntra-secondary animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
