import { Sparkles, MessageSquare, Repeat2, Heart, Share, BarChart2, Bookmark, MoreHorizontal, Trash2, EyeOff, Pencil, Flag, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VerifiedBadge } from "./VerifiedBadge";
import { PostData } from "../../hooks/usePosts";
import { useAuth } from "../../hooks/useAuth";
import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import { ProgressiveImage } from "./ProgressiveImage";

interface PostCardProps {
  post: PostData;
  onLike: (postId: string, reaction?: string) => Promise<void> | void;
  onDelete?: (postId: string) => Promise<void> | void;
}

const REACTIONS = [
  { id: 'like', label: 'Like', icon: '👍' },
  { id: 'love', label: 'Love', icon: '❤️' },
  { id: 'care', label: 'Care', icon: '🥰' },
  { id: 'haha', label: 'Haha', icon: '😆' },
  { id: 'wow', label: 'Wow', icon: '😲' },
  { id: 'sad', label: 'Sad', icon: '😢' },
  { id: 'angry', label: 'Angry', icon: '😡' },
];

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onDelete }) => {
  const { user } = useAuth();
  const { navigateProfile, navigateToPost, setActiveTab } = useNavigation();
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  const userReactionId = user ? post.reactions?.[user.uid] : null;
  const userReaction = userReactionId ? REACTIONS.find(r => r.id === userReactionId) : null;
  
  const hasLiked = user && (post.likedBy?.includes(user.uid) || !!userReactionId);
  const isAuthor = user && post.authorId === user.uid;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `Just now`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const date = new Date(timestamp);
    const now = new Date();
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderContent = (text: string) => {
    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#')) return <span key={i} className="text-vyntra-primary hover:underline cursor-pointer">{word}</span>;
      if (word.startsWith('@')) return <span key={i} className="text-vyntra-accent hover:underline cursor-pointer">{word}</span>;
      return word;
    });
  };

  const currentLikeIcon = userReaction?.icon || (hasLiked 
    ? <Heart size={18} className="fill-vyntra-error" /> 
    : <Heart size={18} />);

  const requireAuth = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to perform this action.");
      return;
    }
    action();
  };

  const handleReact = (reactionId: string, e: React.MouseEvent) => {
    requireAuth(e, () => {
      setShowReactions(false);
      onLike(post.id, reactionId);
    });
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.author?.uid) {
      navigateProfile(post.author.uid);
    } else if (post.authorId) {
      navigateProfile(post.authorId);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, borderTopColor: 'transparent' }}
      animate={{ opacity: 1 }}
      className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer w-full flex flex-col group border-b border-white/5"
      onClick={() => navigateToPost && navigateToPost(post.id)}
    >
      <div className="flex gap-3 w-full">
        <div className="flex flex-col items-center shrink-0" onClick={handleProfileClick}>
          <ProgressiveImage 
            src={post.author?.avatar || 'https://via.placeholder.com/150'} 
            className="w-10 h-10 rounded-full border border-white/5 shrink-0" 
            imgClassName="rounded-full"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white hover:underline truncate text-[15px]" onClick={handleProfileClick}>{post.author?.name || 'Unknown User'}</span>
              <VerifiedBadge size={14} className="flex-shrink-0" followers={post.author?.followersCount || 0} legacyVerified={post.author?.verified || false} isVerified={post.author?.isVerified || post.author?.verified || false} />
              <span className="text-[14px] text-vyntra-text-sec truncate" onClick={handleProfileClick}>{post.author?.handle || `@user_${post.authorId.substring(0,5)}`}</span>
              <span className="text-[14px] text-vyntra-text-sec shrink-0">·</span>
              <span className="text-[14px] text-vyntra-text-sec hover:underline shrink-0">{getRelativeTime(post.createdAt)}</span>
            </div>
            
            <div className="relative" ref={optionsRef}>
              <button 
                className="text-vyntra-text-sec hover:text-vyntra-primary p-1.5 rounded-full hover:bg-vyntra-primary/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100" 
                onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
              >
                 <MoreHorizontal size={18} />
              </button>
              
              <AnimatePresence>
                {showOptions && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-[#151820] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                  >
                    {isAuthor ? (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowOptions(false); alert("Edit feature coming soon!"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <Pencil size={16} /> Edit Post
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowOptions(false); const link = `${window.location.origin}/?post=${post.id}`; navigator.clipboard.writeText(link); alert("Link copied!"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <LinkIcon size={16} /> Copy Link
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowOptions(false); alert("Post hidden!"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <EyeOff size={16} /> Hide Post
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowOptions(false); if(onDelete) onDelete(post.id); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-vyntra-error hover:bg-vyntra-error/10 transition-colors text-left font-medium"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowOptions(false); const link = `${window.location.origin}/?post=${post.id}`; navigator.clipboard.writeText(link); alert("Link copied!"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <LinkIcon size={16} /> Copy Link
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowOptions(false); alert("Post reported!"); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-vyntra-text-sec hover:bg-white/5 transition-colors text-left"
                        >
                          <Flag size={16} /> Report Post
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-[15px] leading-[1.4] text-white whitespace-pre-wrap break-words">
            {renderContent(post.content)}
          </p>

          {post.mediaUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 max-h-[500px] relative">
              {post.mediaType === 'video' ? (
                <>
                  <div className="absolute inset-0 bg-white/5 animate-shimmer z-0"></div>
                  <video src={post.mediaUrl} controls className="w-full h-full object-cover bg-black relative z-10" />
                </>
              ) : (
                <ProgressiveImage src={post.mediaUrl} className="w-full h-full max-h-[500px]" imgClassName="rounded-2xl" />
              )}
            </div>
          )}

          <div className="mt-3 mb-1 flex items-center justify-between w-full max-w-[425px]">
            <button onClick={(e) => requireAuth(e, () => navigateToPost(post.id))} className="flex items-center gap-1.5 text-vyntra-text-sec hover:text-vyntra-primary transition-colors group/btn">
              <div className="p-2 rounded-full group-hover/btn:bg-vyntra-primary/10 transition-colors">
                <MessageSquare size={18} />
              </div>
              <span className="text-[13px]">{post.commentsCount || 0}</span>
            </button>
            <button onClick={(e) => requireAuth(e, () => navigateToPost(post.id))} className="flex items-center gap-1.5 text-vyntra-text-sec hover:text-vyntra-success transition-colors group/btn">
              <div className="p-2 rounded-full group-hover/btn:bg-vyntra-success/10 transition-colors">
                <Repeat2 size={18} />
              </div>
              <span className="text-[13px]">{post.repostsCount || 0}</span>
            </button>
            
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              <button 
                onClick={(e) => handleReact('like', e)}
                className={`flex items-center gap-1.5 transition-colors group/btn ${hasLiked ? 'text-vyntra-error' : 'text-vyntra-text-sec hover:text-vyntra-error'}`}
              >
                <div className="p-2 rounded-full group-hover/btn:bg-vyntra-error/10 transition-colors">
                  {typeof currentLikeIcon === "string" ? <span className="text-[16px]">{currentLikeIcon}</span> : currentLikeIcon}
                </div>
                <span className="text-[13px]">{post.likesCount || 0}</span>
              </button>

              <AnimatePresence>
                {showReactions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-2 bg-[#111827] border border-white/10 rounded-full p-1.5 shadow-2xl flex items-center gap-1 z-50 origin-bottom-left whitespace-nowrap"
                  >
                    {REACTIONS.map(reaction => (
                      <button 
                        key={reaction.id}
                        className="text-2xl hover:scale-125 transition-transform origin-bottom px-1"
                        onClick={(e) => handleReact(reaction.id, e)}
                        title={reaction.label}
                      >
                        {reaction.icon}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={(e) => requireAuth(e, () => setActiveTab('analytics'))} className="flex items-center gap-1.5 text-vyntra-text-sec hover:text-vyntra-primary transition-colors group/btn">
              <div className="p-2 rounded-full group-hover/btn:bg-vyntra-primary/10 transition-colors">
                <BarChart2 size={18} />
              </div>
              <span className="text-[13px]">0</span>
            </button>
            <div className="flex gap-1">
              <button onClick={(e) => requireAuth(e, () => setActiveTab('bookmarks'))} className="flex items-center gap-2 text-vyntra-text-sec hover:text-vyntra-primary transition-colors group/btn tooltip hidden sm:block">
                <div className="p-2 rounded-full group-hover/btn:bg-vyntra-primary/10 transition-colors">
                  <Bookmark size={18} />
                </div>
              </button>
              <button onClick={(e) => { e.stopPropagation(); const link = `${window.location.origin}/?post=${post.id}`; navigator.clipboard.writeText(link); alert("Link copied!"); }} className="flex items-center gap-2 text-vyntra-text-sec hover:text-vyntra-primary transition-colors group/btn tooltip hidden sm:block">
                <div className="p-2 rounded-full group-hover/btn:bg-vyntra-primary/10 transition-colors">
                  <Share size={18} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
