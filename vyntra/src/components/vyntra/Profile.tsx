import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, VyntraUser } from "../../hooks/useAuth";
import { usePosts } from "../../hooks/usePosts";
import { useFollows } from "../../hooks/useFollows";
import { VerifiedBadge } from "./VerifiedBadge";
import { PostCard } from "./PostCard";
import { EditProfileModal } from "./EditProfileModal";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigation } from "../../contexts/NavigationContext";

import { ConnectionsModal } from "./ConnectionsModal";

export function ProfileView() {
  const { user: authUser, updateUserBio } = useAuth();
  const { posts, likePost, deletePost } = usePosts();
  const { following, followUser, unfollowUser } = useFollows();
  const { profileUserId, setActiveTab, navigateProfile } = useNavigation();
  const [tab, setTab] = useState("posts");
  const [profileUser, setProfileUser] = useState<VyntraUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [connectionsModal, setConnectionsModal] = useState<{isOpen: boolean, type: "followers" | "following"}>({ isOpen: false, type: "followers" });

  const isOwnProfile = !profileUserId || profileUserId === authUser?.uid;
  const user = isOwnProfile ? authUser : profileUser;
  
  const isFollowing = user ? following.includes(user.uid) : false;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const fetchUser = async () => {
      if (isOwnProfile) {
        setProfileUser(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const userRef = doc(db, 'users', profileUserId!);
        
        // Use real-time snapshot for profile viewing so numbers update live
        unsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
             setProfileUser(docSnap.data() as VyntraUser);
          } else {
             setProfileUser(null);
          }
          setLoading(false);
        });

      } catch (e) {
        console.error("Error fetching user profile", e);
        setLoading(false);
      }
    };

    fetchUser();
    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [profileUserId, isOwnProfile]);

  const userPosts = posts.filter(p => p.authorId === user?.uid);

  if (loading && !isOwnProfile) {
    return <div className="flex-1 h-full flex items-center justify-center bg-vyntra-bg/80 text-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-vyntra-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <div className="flex-1 h-full flex items-center justify-center bg-vyntra-bg/80 text-white flex-col gap-4">
      User not found
    </div>;
  }

  return (
    <div className="flex-1 h-full overflow-y-auto w-full custom-scrollbar relative bg-vyntra-bg/80 backdrop-blur-md">
      
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10 flex items-center gap-6 px-4 py-2">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur" onClick={() => setActiveTab('feed')}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-1 text-white">
            {user.name} 
            <VerifiedBadge size={16} followers={user.followersCount} legacyVerified={user.verified} isVerified={user.isVerified || user.verified} />
          </h2>
          <span className="text-sm text-vyntra-text-sec">{userPosts.length} Posts</span>
        </div>
      </div>

      {/* Cover Profile & Hero */}
      <div className="relative">
        <div className="h-48 md:h-[250px] w-full bg-gradient-to-tr from-vyntra-primary via-[#0B0F19] to-vyntra-accent relative overflow-hidden flex items-center justify-center">
            {user.coverImage ? (
              <img src={user.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover z-0" />
            ) : (
              <Camera className="text-white/30" size={32} />
            )}
        </div>

        {/* Profile Info */}
        <div className="px-4 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-20 mb-3">
            <div className="relative rounded-full p-1 bg-vyntra-bg z-10 shrink-0">
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover shadow-xl bg-vyntra-bg"
              />
            </div>
            
            {/* Buttons (Edit for self, Follow for others) */}
            <div className="flex flex-col items-end gap-1 mb-2 z-20">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-1.5 font-bold text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors mb-2"
                  >
                    Edit profile
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    if (!authUser) {
                      alert("Please login to follow");
                      return;
                    }
                    if (isFollowing) {
                      unfollowUser(user.uid);
                    } else {
                      followUser(user.uid);
                    }
                  }}
                  className={`px-4 py-1.5 font-bold rounded-full transition-colors mb-2 border ${
                    isFollowing 
                    ? "border-white/30 text-white hover:bg-white/10 hover:border-vyntra-error hover:text-vyntra-error hover:after:content-['Unfollow'] after:content-['Following']"
                    : "bg-white text-vyntra-bg border-white/30 hover:bg-gray-200 after:content-['Follow']"
                  }`}
                >
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 mb-4 relative z-10">
            <h1 className="text-[22px] font-extrabold leading-tight flex items-center gap-1.5 text-white">
              {user.name}
              <VerifiedBadge size={20} className="ml-1" followers={user.followersCount} legacyVerified={user.verified} isVerified={user.isVerified || user.verified} />
            </h1>
            <div className="text-[15px] text-vyntra-text-sec mb-3">
              {user.handle}
            </div>
            
            <div className="group relative">
              <p className="text-[15px] text-white leading-snug mb-3 whitespace-pre-wrap">
                {user.bio}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-vyntra-text-sec mb-3">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {user.location}
                </span>
              )}
              {user.website && (
                <span className="flex items-center gap-1">
                  <LinkIcon size={16} /> <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-vyntra-primary hover:underline">{user.website.replace(/^https?:\/\//, '')}</a>
                </span>
              )}
              {user.otherSocial && (
                <span className="flex items-center gap-1">
                  <LinkIcon size={16} /> <a href={user.otherSocial.startsWith('http') ? user.otherSocial : `https://${user.otherSocial}`} target="_blank" rel="noopener noreferrer" className="text-vyntra-primary hover:underline">{user.otherSocial.replace(/^https?:\/\//, '')}</a>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={16} /> Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Vyntra'}
              </span>
            </div>

            <div className="flex gap-4 text-[15px]">
              <div className="hover:underline cursor-pointer" onClick={() => setConnectionsModal({ isOpen: true, type: 'following' })}>
                <span className="font-bold text-white">{user.followingCount}</span> <span className="text-vyntra-text-sec">Following</span>
              </div>
              <div className="hover:underline cursor-pointer" onClick={() => setConnectionsModal({ isOpen: true, type: 'followers' })}>
                <span className="font-bold text-white">{user.followersCount.toLocaleString()}</span> <span className="text-vyntra-text-sec">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConnectionsModal 
        isOpen={connectionsModal.isOpen} 
        onClose={() => setConnectionsModal({ ...connectionsModal, isOpen: false })} 
        userId={user.uid} 
        type={connectionsModal.type} 
      />

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto custom-scrollbar border-b border-white/5 mt-2">
          {["posts", "replies", "media", "likes"].map((t) => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-center py-4 font-medium transition-colors whitespace-nowrap px-4 relative ${tab === t ? 'text-white font-bold' : 'text-vyntra-text-sec hover:bg-white/5 hover:text-white'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {tab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-vyntra-primary rounded-full"></div>}
            </button>
          ))}
      </div>

       <div className="pb-24">
          {tab === "posts" && (
            userPosts.length > 0 ? (
              userPosts.map(post => <PostCard key={post.id} post={post} onLike={(postId, reaction) => user && likePost(postId, user.uid, reaction)} onDelete={deletePost} />)
            ) : (
              <div className="p-10 text-center text-vyntra-text-sec">
                No posts yet.
              </div>
            )
          )}
          {tab !== "posts" && (
            <div className="p-10 text-center flex flex-col items-center text-vyntra-text-sec">
              <div className="text-4xl mb-4">🚧</div>
              <div>This section ({tab}) is currently under development.</div>
            </div>
          )}
       </div>
    </div>
  );
}
