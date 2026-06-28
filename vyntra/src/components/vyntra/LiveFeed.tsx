import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RefreshCw, 
  ExternalLink, 
  ThumbsUp, 
  MessageSquare, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  ArrowUp,
  Newspaper,
  Flame,
  Globe
} from "lucide-react";

export interface FeedItem {
  source: "NEWS" | "REDDIT" | "AI" | "RSS";
  title: string;
  content: string;
  image: string | null;
  url: string;
  author: string;
  time: string; // ISO String
  likes: number;
  comments: number;
}

export function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState(45);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Parse timeago string from ISO
  const getRelativeTime = (isoString: string) => {
    try {
      const ms = Date.parse(isoString);
      if (isNaN(ms)) return "Recently";
      const secs = Math.floor((Date.now() - ms) / 1000);
      if (secs < 30) return "Just now";
      if (secs < 60) return `${secs}s ago`;
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Recently";
    }
  };

  // Fetch from our unified backend proxy endpoint
  const fetchFeed = async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/feed");
      if (!response.ok) {
        throw new Error("Temporary backend sync query error. Retrying soon...");
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format.");
      }
      const data: FeedItem[] = await response.json();
      setItems(data || []);
      // Reset visible items count back to default on full manual refresh
      if (isManual) {
        setVisibleCount(10);
      }
    } catch (err: any) {
      setError(err.message || "Failed to synchronise fresh feeds. Local cache preserved.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setNextRefreshTime(45); // Reset cooldown
    }
  };

  // Initial Fetch & Auto-Refresh interval every 45 seconds
  useEffect(() => {
    fetchFeed();

    // Poll endpoint every 45 seconds for incremental real-time refreshes
    const timer = setInterval(() => {
      fetchFeed();
    }, 45000);

    // Visual countdown clock for next refresh
    const countdown = setInterval(() => {
      setNextRefreshTime((prev) => (prev > 1 ? prev - 1 : 45));
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(countdown);
    };
  }, []);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && items.length > 0) {
          setVisibleCount((prev) => Math.min(prev + 10, items.length));
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [items]);

  // Monitor top scroll to show ScrollToTop floaters
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop > 600) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Custom visual labels for source badges
  const renderSourceBadge = (source: string) => {
    switch (source) {
      case "NEWS":
        return (
          <span className="px-2.5 py-0.5 text-[10px] tracking-wider font-extrabold uppercase rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center gap-1 shadow-sm shrink-0">
            <Newspaper size={10} className="stroke-[2.5]" />
            NEWS API
          </span>
        );
      case "REDDIT":
        return (
          <span className="px-2.5 py-0.5 text-[10px] tracking-wider font-extrabold uppercase rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 flex items-center gap-1 shadow-sm shrink-0">
            <Flame size={10} className="stroke-[2.5]" />
            REDDIT
          </span>
        );
      case "RSS":
        return (
          <span className="px-2.5 py-0.5 text-[10px] tracking-wider font-extrabold uppercase rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1 shadow-sm shrink-0">
            <Globe size={10} className="stroke-[2.5]" />
            RSS WEB
          </span>
        );
      case "AI":
        return (
          <span className="px-2.5 py-0.5 text-[10px] tracking-wider font-extrabold uppercase rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center gap-1 shadow-sm shrink-0">
            <Sparkles size={10} className="animate-pulse fill-purple-400" />
            AI FEED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 flex flex-col h-full overflow-y-auto w-full custom-scrollbar relative bg-vyntra-bg"
    >
      {/* Real-time Sub Status Header */}
      <div className="bg-white/[0.02] border-b border-white/5 py-2.5 px-4 flex items-center justify-between text-xs font-mono text-vyntra-text-sec shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-white/90">LIVE SYNCHRONISER ACTIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Sync cooldown: {nextRefreshTime}s</span>
          <button 
            id="manual-pull-refresh-btn"
            onClick={() => fetchFeed(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 active:bg-white/20 transition-all font-bold text-white border border-white/15"
          >
            <RefreshCw size={12} className={`shrink-0 ${refreshing || loading ? "animate-spin" : ""}`} />
            PULL REFRESH
          </button>
        </div>
      </div>

      {/* Error alert wrapper */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-300 rounded-xl flex items-start gap-2.5 shrink-0">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <span className="font-semibold text-white">Live Stream Notice: </span>
            {error}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-4 pb-24 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="popLayout">
          {loading && items.length === 0 ? (
            /* Loading glow skeletons */
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10"></div>
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-28 bg-white/10 rounded"></div>
                      <div className="h-2.5 w-16 bg-white/5 rounded"></div>
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-white/10 rounded-full"></div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-full bg-white/10 rounded"></div>
                  <div className="h-4 w-11/12 bg-white/10 rounded"></div>
                  <div className="h-3.5 w-3/4 bg-white/5 rounded mt-1"></div>
                </div>
                <div className="w-full h-40 bg-white/5 rounded-xl"></div>
                <div className="flex gap-4 pt-2">
                  <div className="h-3 w-12 bg-white/10 rounded"></div>
                  <div className="h-3 w-12 bg-white/10 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            items.slice(0, visibleCount).map((item, idx) => (
              <motion.div
                key={item.url + idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.4) }}
                className="bg-white/[0.02] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 transition-all duration-300 shadow-xl relative group overflow-hidden"
              >
                {/* Source glow lines */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-vyntra-primary via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Card Header information */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Circle avatar badge containing first letter of source */}
                    <div className="w-10 h-10 flex-shrink-0 rounded-full border border-white/10 bg-white/5 flex items-center justify-center font-bold text-sm text-vyntra-primary shadow-inner">
                      {item.author ? item.author.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-[15px] hover:underline cursor-pointer truncate">
                          {item.author || "Global Publisher"}
                        </span>
                      </div>
                      <span className="text-xs text-vyntra-text-sec block mt-0.5 font-mono">
                        {getRelativeTime(item.time)}
                      </span>
                    </div>
                  </div>
                  {renderSourceBadge(item.source)}
                </div>

                {/* Card Title & Content body */}
                <div className="flex flex-col gap-2 min-w-0">
                  <h3 className="font-extrabold text-[16px] sm:text-[18px] text-white leading-snug tracking-tight text-left">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed text-left whitespace-pre-wrap font-sans break-words break-all">
                    {item.content}
                  </p>
                </div>

                {/* Cover visual thumbnail if present */}
                {item.image && (
                  <div className="w-full relative overflow-hidden rounded-xl border border-white/5 aspect-video sm:max-h-64 bg-black/40 shadow-inner">
                    <img 
                      src={item.image} 
                      alt="Thumbnail feed source"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 brightness-90 hover:brightness-100"
                      onError={(e) => {
                        // Safe fallback image block
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Post Footer Interactive Stats */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-1 text-vyntra-text-sec text-xs font-semibold">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5">
                      <ThumbsUp size={14} className="text-vyntra-primary" />
                      <span>{item.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/5">
                      <MessageSquare size={14} className="text-vyntra-accent" />
                      <span>{item.comments}</span>
                    </button>
                  </div>
                  
                  {item.url && item.url !== "#" && (
                    <a 
                      id={`feed-original-link-${idx}`}
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-bold text-vyntra-primary hover:text-white hover:underline transition-all"
                    >
                      READ ORIGINAL
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Sentinel element to trigger client side infinite scroll pagination */}
        <div ref={sentinelRef} id="infinite-scroll-sentinel" className="h-10 w-full flex items-center justify-center py-4">
          {items.length > visibleCount && (
            <div className="flex items-center gap-2 text-xs font-mono text-vyntra-text-sec">
              <span className="w-1.5 h-1.5 rounded-full bg-vyntra-primary animate-ping"></span>
              LOADING OLDER STORIES...
            </div>
          )}
        </div>
      </div>

      {/* Floating Scroll to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 p-3 rounded-full bg-vyntra-primary hover:bg-vyntra-primary/90 text-white shadow-2xl border border-white/10 z-40 cursor-pointer"
          >
            <ArrowUp size={18} className="stroke-[3]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
