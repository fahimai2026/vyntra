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
  const { user, loginWithGoogle, loginWithApple, loginWithEmail, signupWithEmail } = useAuth();
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
          
          <div className="w-full max-w-xs">
            <div className="relative flex items-center mb-8 mt-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-vyntra-text-sec text-sm">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Join the conversation</h2>
            <p className="text-vyntra-text-sec mb-6">Sign in to engage with the community, share your thoughts, and connect with others.</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={loginWithGoogle} className="w-full bg-white text-vyntra-bg hover:bg-gray-200 px-6 py-3 rounded-full font-bold transition-colors flex items-center justify-center gap-2">
                 <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                 Continue with Google
              </button>
              <button 
                className="w-full bg-white text-vyntra-bg hover:bg-gray-200 px-6 py-3 rounded-full font-bold transition-colors flex items-center justify-center gap-2" 
                onClick={loginWithApple}
              >
                 <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.26.45 3.09.45.71 0 1.81-.46 3.28-.46 1.86.08 3.19.8 4.02 2.1-3.62 2.04-2.89 6.22-1.01 7.15-.36 1.25-.97 2.45-1.38 3.73zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.36 2.41-2.01 4.38-3.74 4.25z"/></svg>
                 Continue with Apple
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
