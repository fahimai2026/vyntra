import React from "react";
import { Search, Users, MoreHorizontal, BrainCircuit } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";
import { useFollows } from "../../hooks/useFollows";
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import { useTrending } from "../../hooks/useTrending";
import { useCommunities } from "../../hooks/useCommunities";
import { useUsers } from "../../hooks/useUsers";

export function RightPanel() {
  const { following, followUser, unfollowUser, loading: followsLoading } = useFollows();
  const { user, loading: authLoading } = useAuth();
  const { navigateProfile, setActiveTab } = useNavigation();
  const { trendingTags, loading: trendingLoading } = useTrending();
  const { communities, loading: communitiesLoading, joinCommunity } = useCommunities();
  const { users: allUsers, loading: usersLoading } = useUsers();

  const [showMoreWhoToFollow, setShowMoreWhoToFollow] = useState(false);
  const [showMoreTrending, setShowMoreTrending] = useState(false);
  const [showMoreCommunities, setShowMoreCommunities] = useState(false);

  const isLoading = authLoading || followsLoading || trendingLoading || communitiesLoading || usersLoading;

  const suggestedUsers = allUsers.filter(u => u.id !== user?.uid);

  const visibleUsers = showMoreWhoToFollow ? suggestedUsers : suggestedUsers.slice(0, 3);
  const visibleTags = showMoreTrending ? trendingTags : trendingTags.slice(0, 5);
  const visibleCommunities = showMoreCommunities ? communities : communities.slice(0, 3);

  const handleFollowToggle = (targetId: string) => {
    if (!user) {
      alert("Please login to follow users.");
      return;
    }
    if (following.includes(targetId)) {
      unfollowUser(targetId);
    } else {
      followUser(targetId);
    }
  };

  const handleProfileClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigateProfile(id);
  };

  return (
    <div className="hidden lg:flex flex-col w-[350px] p-4 h-full overflow-y-auto custom-scrollbar flex-shrink-0 border-l border-white/5">
      
      {/* Search Bar */}
      <div className="sticky top-0 bg-vyntra-bg z-10 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vyntra-text-sec" size={20} />
          <input 
            type="text" 
            placeholder="Search Vyntra" 
            className="w-full bg-white/5 border border-transparent rounded-full py-3.5 pl-12 pr-4 text-[15px] focus:outline-none focus:border-vyntra-primary focus:bg-transparent focus:ring-1 focus:ring-vyntra-primary transition-all text-white placeholder-vyntra-text-sec"
          />
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="bg-white/5 rounded-2xl border border-white/5 mb-4 p-4">
            <div className="w-32 h-6 bg-white/10 rounded mb-4 animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="py-3 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
                  <div className="flex flex-col flex-1 gap-2">
                    <div className="w-24 h-4 bg-white/10 rounded"></div>
                    <div className="w-16 h-3 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="w-[85px] h-8 bg-white/10 rounded-full shrink-0"></div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* VYNTRA AI Panel */}
          <div className="bg-gradient-to-br from-[#111827] to-[#1E293B] rounded-2xl border border-white/10 mb-5 overflow-hidden relative group cursor-pointer" onClick={() => setActiveTab('ai')}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-vyntra-secondary/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-vyntra-secondary/20 flex items-center justify-center text-vyntra-secondary">
                  <BrainCircuit size={18} />
                </div>
                <h2 className="font-bold text-[18px]">VYNTRA AI</h2>
              </div>
              <p className="text-[13px] text-vyntra-text-sec mb-3">Ask questions, translate posts, or let AI write your next viral thread.</p>
              <div className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 flex justify-center text-[14px] font-medium transition-colors">
                Ask AI anything...
              </div>
            </div>
          </div>

          {/* Who to Follow */}
          <div className="bg-white/5 rounded-2xl border border-white/5 mb-4">
            <h2 className="font-bold text-[20px] p-4 pb-2">Who to Follow</h2>
            <div className="flex flex-col">
              {visibleUsers.length > 0 ? visibleUsers.map((su) => {
                const isFollowing = following.includes(su.id);
                return (
                  <div key={su.id} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-3 w-full min-w-0" onClick={(e) => handleProfileClick(su.id, e)}>
                      <img src={su.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${su.name}&backgroundColor=000000`} className="w-10 h-10 rounded-full shrink-0" alt="avatar" />
                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        <span className="font-bold text-[15px] leading-tight hover:underline flex items-center gap-1 truncate">
                          <span className="truncate">{su.name}</span>
                          <VerifiedBadge size={14} className="flex-shrink-0" followers={su.followersCount} legacyVerified={su.verified} isVerified={su.isVerified || su.verified} />
                        </span>
                        <span className="text-[14px] text-vyntra-text-sec leading-tight truncate">{su.handle}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFollowToggle(su.id)}
                      className={`border rounded-full px-4 py-1.5 font-bold text-[14px] transition-colors shrink-0 flex items-center justify-center w-[105px] ${
                        isFollowing 
                          ? "border-white/30 text-white hover:bg-white/10 hover:border-vyntra-error hover:text-vyntra-error hover:after:content-['Unfollow'] after:content-['Following']" 
                          : "bg-white text-vyntra-bg hover:bg-gray-200 border-transparent after:content-['Follow']"
                      }`}
                    >
                    </button>
                  </div>
                );
              }) : (
                <div className="px-4 py-4 text-[14px] text-vyntra-text-sec">No suggested users at the moment.</div>
              )}
            </div>
            <button 
              onClick={() => setShowMoreWhoToFollow(!showMoreWhoToFollow)}
              className="p-4 text-vyntra-primary hover:text-vyntra-primary/80 text-[15px] transition-colors w-full text-left rounded-b-2xl hover:bg-white/5"
            >
              {showMoreWhoToFollow ? "Show Less" : "Show More"}
            </button>
          </div>

          {/* Trending Topics */}
          <div className="bg-white/5 rounded-2xl border border-white/5 mb-4">
            <h2 className="font-bold text-[20px] p-4 pb-2">Trending Topics</h2>
            <div className="flex flex-col">
              {visibleTags.length > 0 ? visibleTags.map((item, idx) => (
                <div key={idx} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setActiveTab('explore')}>
                  <div className="flex justify-between items-start">
                    <span className="text-[13px] text-vyntra-text-sec">{item.category}</span>
                    <MoreHorizontal className="text-vyntra-text-sec" size={16} />
                  </div>
                  <div className="font-bold text-[15px] mt-0.5">{item.tag}</div>
                  <div className="text-[13px] text-vyntra-text-sec mt-0.5">{item.postsCount} posts</div>
                </div>
              )) : (
                <div className="px-4 py-4 text-[14px] text-vyntra-text-sec">No active trending topics right now.</div>
              )}
            </div>
            <button 
              onClick={() => setShowMoreTrending(!showMoreTrending)}
              className="p-4 text-vyntra-primary hover:text-vyntra-primary/80 text-[15px] transition-colors w-full text-left rounded-b-2xl hover:bg-white/5"
            >
              {showMoreTrending ? "Show Less" : "Show More"}
            </button>
          </div>

          {/* Suggested Communities */}
          <div className="bg-white/5 rounded-2xl border border-white/5 mb-4">
            <h2 className="font-bold text-[20px] p-4 pb-2">Suggested Communities</h2>
            <div className="flex flex-col">
              {visibleCommunities.length > 0 ? visibleCommunities.map((community: any) => {
                const isJoined = user ? (community.members || []).includes(user.uid) : false;
                return (
                  <div key={community.id} className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between" onClick={() => setActiveTab('communities')}>
                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                      <span className="font-bold text-[15px] leading-tight hover:underline flex items-center gap-1 truncate">
                        {community.name}
                      </span>
                      <span className="text-[13px] text-vyntra-text-sec leading-tight truncate mt-0.5">{community.membersCount || 0} Members</span>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!user) { alert("Please login to join"); return; }
                        joinCommunity(community.id, user.uid); 
                      }}
                      className={`border rounded-full px-4 py-1.5 font-bold text-[14px] transition-colors shrink-0 flex items-center justify-center min-w-[80px] ${
                        isJoined
                          ? "border-white/30 text-white hover:bg-white/10 hover:border-vyntra-error hover:text-vyntra-error hover:after:content-['Leave'] after:content-['Joined']"
                          : "bg-white text-vyntra-bg hover:bg-gray-200 border-transparent after:content-['Join']"
                      }`}
                    >
                    </button>
                  </div>
                );
              }) : (
                <div className="px-4 py-4 text-[14px] text-vyntra-text-sec">No suggested communities yet.</div>
              )}
            </div>
            {communities.length > 3 && (
              <button 
                onClick={() => setShowMoreCommunities(!showMoreCommunities)}
                className="p-4 text-vyntra-primary hover:text-vyntra-primary/80 text-[15px] transition-colors w-full text-left rounded-b-2xl hover:bg-white/5"
              >
                {showMoreCommunities ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Footer Options */}
      <div className="px-4 pb-10 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-vyntra-text-sec mt-auto">
        <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab('legal-terms'); }}>Terms of Service</a>
        <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab('legal-privacy'); }}>Privacy Policy</a>
        <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab('legal-cookie'); }}>Cookie Policy</a>
        <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab('legal-accessibility'); }}>Accessibility</a>
        <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab('legal-ads'); }}>Ads info</a>
        <a href="#" className="flex items-center gap-1 hover:underline" onClick={(e) => { e.preventDefault(); setActiveTab('legal-more'); }}>
          More <MoreHorizontalIcon />
        </a>
        <span>© 2026 Vyntra Corp.</span>
      </div>
    </div>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  );
}

