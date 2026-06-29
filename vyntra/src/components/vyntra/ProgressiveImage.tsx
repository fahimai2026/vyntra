import React, { useState } from 'react';

export function ProgressiveImage({ src, alt, className = "", imgClassName = "" }: { src: string, alt?: string, className?: string, imgClassName?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      {!loaded && (
         <div className="absolute inset-0 bg-white/5 animate-shimmer z-10"></div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'} ${imgClassName}`}
      />
    </div>
  );
}
