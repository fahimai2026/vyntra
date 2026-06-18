import React from 'react';

export function FeedSkeleton() {
  return (
    <div className="flex flex-col">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border-b border-white/5 bg-transparent">
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/5 animate-shimmer shrink-0"></div>
            <div className="flex-1 py-1">
              <div className="w-32 h-4 bg-white/5 rounded mb-2 animate-shimmer"></div>
              <div className="w-20 h-3 bg-white/5 rounded animate-shimmer"></div>
            </div>
          </div>
          <div className="w-full h-4 bg-white/5 rounded mb-2 animate-shimmer"></div>
          <div className="w-11/12 h-4 bg-white/5 rounded mb-2 animate-shimmer"></div>
          <div className="w-4/6 h-4 bg-white/5 rounded mb-4 animate-shimmer"></div>
          
          <div className="w-full h-64 sm:h-80 bg-white/5 rounded-2xl animate-shimmer mb-4"></div>
          
          <div className="flex justify-between items-center w-full max-w-[425px]">
             <div className="w-8 h-8 rounded-full bg-white/5 animate-shimmer"></div>
             <div className="w-8 h-8 rounded-full bg-white/5 animate-shimmer"></div>
             <div className="w-8 h-8 rounded-full bg-white/5 animate-shimmer"></div>
             <div className="w-8 h-8 rounded-full bg-white/5 animate-shimmer"></div>
             <div className="w-8 h-8 rounded-full bg-white/5 animate-shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 p-4 flex flex-col gap-6 w-full">
      <div className="flex justify-start">
        <div className="flex gap-2 items-end w-full max-w-[85%] sm:max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-white/5 shrink-0 animate-shimmer"></div>
          <div className="w-full h-12 bg-white/5 rounded-2xl rounded-tl-sm animate-shimmer"></div>
        </div>
      </div>
      <div className="flex justify-end w-full">
        <div className="w-full max-w-[85%] sm:max-w-[70%] h-16 bg-vyntra-primary/10 rounded-2xl rounded-tr-sm animate-shimmer ml-auto"></div>
      </div>
      <div className="flex justify-start">
        <div className="flex gap-2 items-end w-full max-w-[85%] sm:max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-white/5 shrink-0 animate-shimmer"></div>
          <div className="w-3/4 h-12 bg-white/5 rounded-2xl rounded-tl-sm animate-shimmer"></div>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="flex gap-2 items-end w-full max-w-[85%] sm:max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-white/5 shrink-0 animate-shimmer"></div>
          <div className="w-1/2 h-10 bg-white/5 rounded-2xl rounded-tl-sm animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}
