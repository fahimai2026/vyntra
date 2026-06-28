import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useComments, CommentData } from "../../hooks/useComments";
import { ProgressiveImage } from "./ProgressiveImage";
import { Heart, Send, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigation } from "../../contexts/NavigationContext";

const REACTIONS = [
  { id: 'like', label: 'Like', icon: '👍' },
  { id: 'love', label: 'Love', icon: '❤️' },
  { id: 'care', label: 'Care', icon: '🥰' },
  { id: 'haha', label: 'Haha', icon: '😆' },
  { id: 'wow', label: 'Wow', icon: '😲' },
  { id: 'sad', label: 'Sad', icon: '😢' },
  { id: 'angry', label: 'Angry', icon: '😡' },
];

export const CommentsSection = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const { comments, loading, addComment, reactToComment } = useComments(postId);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    addComment(user.uid, commentText, replyingTo || undefined);
    setCommentText("");
    setReplyingTo(null);
  };

  const parentComments = comments.filter(c => !c.parentId);
  const repliesTo = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="flex flex-col border-t border-white/5 pb-20">
      <div className="p-4 border-b border-white/5">
        <h3 className="font-bold text-lg mb-4">Comments</h3>
        
        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-3">
             <ProgressiveImage 
                src={user.avatar || 'https://via.placeholder.com/150'} 
                className="w-10 h-10 rounded-full shrink-0" 
                imgClassName="rounded-full"
              />
              <div className="flex-1 flex flex-col gap-2">
                {replyingTo && (
                  <div className="text-xs text-vyntra-primary flex items-center justify-between">
                    <span>Replying to comment...</span>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-vyntra-text-sec hover:text-white">Cancel</button>
                  </div>
                )}
                <div className="flex gap-2 items-center bg-vyntra-surface rounded-full border border-white/10 p-1 pl-4">
                  <input 
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-vyntra-text-sec"
                  />
                  <button 
                    type="submit" 
                    disabled={!commentText.trim()}
                    className="w-8 h-8 rounded-full bg-vyntra-primary flex items-center justify-center text-white shrink-0 disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
          </form>
        ) : (
          <div className="text-center text-sm text-vyntra-text-sec py-4">
            Sign in to join the conversation.
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {loading ? (
           <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-vyntra-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : parentComments.length === 0 ? (
           <div className="p-10 text-center text-vyntra-text-sec">No comments yet.</div>
        ) : (
           parentComments.map(c => (
             <CommentThread 
               key={c.id} 
               comment={c} 
               replies={repliesTo(c.id)} 
               onReply={() => setReplyingTo(c.id)} 
               reactToComment={reactToComment}
               user={user}
             />
           ))
        )}
      </div>
    </div>
  );
};

const CommentThread = ({ comment, replies, onReply, reactToComment, user }: any) => {
  return (
    <div className="flex flex-col border-b border-white/5 last:border-none p-4">
      <CommentCard comment={comment} onReply={onReply} reactToComment={reactToComment} user={user} />
      
      {replies.length > 0 && (
        <div className="ml-10 mt-3 flex flex-col gap-3 relative before:absolute before:-left-5 before:top-0 before:bottom-0 before:w-px before:bg-white/10">
          {replies.map((reply: any) => (
            <div key={reply.id} className="relative">
              <div className="absolute -left-5 top-4 w-4 h-px bg-white/10"></div>
              <CommentCard comment={reply} onReply={onReply} reactToComment={reactToComment} user={user} isReply />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CommentCard = ({ comment, onReply, reactToComment, user, isReply = false }: any) => {
  const { navigateProfile } = useNavigation();
  const [showReactions, setShowReactions] = useState(false);
  
  const userReactionId = user ? comment.reactions?.[user.uid] : null;
  const userReaction = userReactionId ? REACTIONS.find(r => r.id === userReactionId) : null;
  
  const handleReact = (reactionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return alert("Log in to react");
    reactToComment(comment.id, user.uid, reactionId);
    setShowReactions(false);
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `now`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="flex gap-3">
      <div className="shrink-0 cursor-pointer" onClick={() => navigateProfile(comment.author?.uid || comment.authorId)}>
        <ProgressiveImage 
          src={comment.author?.avatar || 'https://via.placeholder.com/150'} 
          className="w-8 h-8 rounded-full" 
          imgClassName="rounded-full"
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="bg-vyntra-surface border border-white/5 rounded-2xl rounded-tl-sm px-4 py-2 w-fit max-w-full">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-[14px] text-white hover:underline cursor-pointer truncate" onClick={() => navigateProfile(comment.author?.uid || comment.authorId)}>
              {comment.author?.name || 'Unknown'}
            </span>
          </div>
          <p className="text-[14px] text-white break-words">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 mt-1 px-2 relative">
          <span className="text-[12px] text-vyntra-text-sec">{getRelativeTime(comment.createdAt)}</span>
          
          <div className="relative flex items-center" onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
            <button className="text-[12px] font-bold text-vyntra-text-sec hover:text-white transition-colors flex items-center gap-1" onClick={(e) => handleReact('like', e)}>
              {userReaction ? <span className="text-[14px] leading-none">{userReaction.icon}</span> : 'Like'}
            </button>
            <AnimatePresence>
                {showReactions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-1 bg-[#111827] border border-white/10 rounded-full p-1 shadow-xl flex items-center z-50 whitespace-nowrap"
                  >
                    {REACTIONS.map(reaction => (
                      <button 
                        key={reaction.id}
                        className="text-lg hover:scale-125 transition-transform px-1"
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
          
          <button className="text-[12px] font-bold text-vyntra-text-sec hover:text-white transition-colors" onClick={onReply}>
            Reply
          </button>
          
          {Object.keys(comment.reactions || {}).length > 0 && (
            <div className="ml-auto flex items-center bg-vyntra-surface border border-white/10 rounded-full px-1.5 py-0.5 shadow-sm">
              <span className="text-[12px] leading-none flex gap-[2px]">
                {Array.from(new Set(Object.values(comment.reactions || {}))).slice(0, 3).map((emoji: any, i) => (
                   <span key={i}>{emoji}</span>
                ))}
              </span>
              <span className="text-[11px] text-vyntra-text-sec ml-1 font-medium">{Object.keys(comment.reactions || {}).length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
