import React, { useEffect, useState } from 'react';

const VyntraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img src="/logo.png" alt="Vyntra Logo" className={className} />
);

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [shrinking, setShrinking] = useState(false);
  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => setShrinking(true), 1500);
    const t2 = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 2000); // 2s duration as requested
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${shrinking ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center">
        {/* Soft glowing effect */}
        <div className="absolute inset-0 bg-zinc-800/20 blur-[80px] rounded-full scale-150 animate-pulse"></div>
        
        {/* Animated logo pulse and scale */}
        <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 mb-8 text-white">
          <VyntraLogo className="w-full h-full animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3 relative z-10">Vyntra</h1>
        
        <p className="text-zinc-500 tracking-widest text-[10px] sm:text-xs font-semibold uppercase opacity-80 relative z-10">
          Happening now
        </p>

        {/* Circular loading indicator */}
        <div className="mt-16 sm:mt-20 relative flex items-center justify-center z-10">
           <div className="absolute w-10 h-10 rounded-full border border-white/5"></div>
           <div className="absolute w-10 h-10 rounded-full border-t border-white animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
