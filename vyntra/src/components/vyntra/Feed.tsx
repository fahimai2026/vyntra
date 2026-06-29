import { Image as ImageIcon, Smile, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePosts } from "../../hooks/usePosts";
import { useAuth } from "../../hooks/useAuth";
import React, { useState } from "react";
import { PostCard } from "./PostCard";
import { useFollows } from "../../hooks/useFollows";
import { FeedSkeleton } from "./Skeletons";
import { LiveFeed } from "./LiveFeed";

export function Feed() {
  const { posts, loading, likePost, deletePost } = usePosts();
  const { user, loginWithEmail, signupWithEmail } = useAuth();
  const { following } = useFollows();
  const [activeTab, setActiveTab] = useState("forYou");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name || "Vyntra User");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    }
  };

  let displayedPosts = activeTab === "following" ? posts.filter(p => following.includes(p.authorId)) : posts;
  
  if (user?.contentPreferences?.hiddenWords && user.contentPreferences.hiddenWords.length > 0) {
    const hiddenWordsLower = user.contentPreferences.hiddenWords.map(w => w.toLowerCase());
    displayedPosts = displayedPosts.filter(p => {
       const contentLower = (p.content || "").toLowerCase();
       return !hiddenWordsLower.some(hw => contentLower.includes(hw));
    });
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto w-full custom-scrollbar relative bg-vyntra-bg/80 backdrop-blur-md">
      
      {/* Top Navigation */}
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex gap-0 px-4 pt-2 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2 p-2 px-0 w-full mb-0">
            Home
          </h2>
        </div>
        <div className="flex w-full overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab("forYou")}
            className={`flex-1 text-center py-4 font-bold relative transition-colors whitespace-nowrap px-4 ${activeTab === 'forYou' ? 'text-white' : 'text-vyntra-text-sec hover:bg-white/5 hover:text-white'}`}
          >
            For You
            {activeTab === 'forYou' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-vyntra-primary rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab("following")}
            className={`flex-1 text-center py-4 font-bold relative transition-colors whitespace-nowrap px-4 ${activeTab === 'following' ? 'text-white' : 'text-vyntra-text-sec hover:bg-white/5 hover:text-white'}`}
          >
            Following
            {activeTab === 'following' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-vyntra-primary rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab("live")}
            className={`flex-1 text-center py-4 font-bold relative transition-colors whitespace-nowrap px-4 ${activeTab === 'live' ? 'text-white' : 'text-vyntra-text-sec hover:bg-white/5 hover:text-white'}`}
          >
            Live Feed
            {activeTab === 'live' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-vyntra-primary rounded-full"></div>}
          </button>
        </div>
      </div>

      {!user && (
        <div className="p-8 border-b border-white/5 w-full flex flex-col items-center justify-center text-center">
          
          <div className="w-full max-w-xs mb-8">
            <h2 className="text-xl font-bold text-white mb-6">
              {isLoginMode ? "Sign in to Vyntra" : "Create an account"}
            </h2>

            <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
              {!isLoginMode && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vyntra-primary transition-colors"
                  required
                />
              )}
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vyntra-primary transition-colors"
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-vyntra-primary transition-colors"
                required
              />
              {authError && <div className="text-vyntra-error text-sm text-left">{authError}</div>}
              <button 
                type="submit" 
                className="w-full bg-vyntra-primary hover:bg-vyntra-primary/90 text-white rounded-xl px-4 py-3 font-bold transition-colors mt-2"
              >
                {isLoginMode ? "Sign In" : "Sign Up"}
              </button>
            </form>
            <div className="mt-4 text-vyntra-text-sec text-sm">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-vyntra-primary hover:underline font-medium"
              >
                {isLoginMode ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="pb-24 flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
          {activeTab === "live" ? (
            <LiveFeed />
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
              <AnimatePresence initial={false}>
                {displayedPosts.length > 0 ? displayedPosts.map((post) => (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PostCard post={post} onLike={(postId, reaction) => likePost(postId, user.uid, reaction)} onDelete={deletePost} />
                  </motion.div>
                )) : (
                  !loading && (
                     <div className="p-10 text-center text-vyntra-text-sec">
                       {activeTab === "following" ? "You are not following anyone with posts yet." : "No posts to show."}
                     </div>
                  )
                )}
              </AnimatePresence>
              {loading && <FeedSkeleton />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
