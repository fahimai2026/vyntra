import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigation } from "../../contexts/NavigationContext";
import { usePosts, PostData } from "../../hooks/usePosts";
import { useAuth } from "../../hooks/useAuth";
import { PostCard } from "./PostCard";
import { CommentsSection } from "./CommentsSection";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export function SinglePostView() {
  const { activePostId, setActiveTab } = useNavigation();
  const { user } = useAuth();
  const { likePost, deletePost } = usePosts();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!activePostId) return;
      setLoading(true);
      try {
        const postRef = doc(db, "posts", activePostId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() } as PostData;
          // Hydrate author
          const authorRef = doc(db, "users", postData.authorId);
          const authorDoc = await getDoc(authorRef);
          if (authorDoc.exists()) {
            postData.author = authorDoc.data() as any;
          }
          setPost(postData);
        }
      } catch (error) {
        console.error("Error fetching post", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [activePostId]);

  return (
    <div className="flex-1 flex flex-col h-full bg-vyntra-bg overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-md border-b border-white/5 py-3 px-4 flex items-center gap-6">
        <button 
          onClick={() => {
            setActiveTab("feed");
            window.history.replaceState({}, '', '/');
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <h2 className="text-xl font-bold">Post</h2>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center">
          <div className="w-8 h-8 border-2 border-vyntra-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : post ? (
        <div className="pt-2 flex flex-col h-full">
          <PostCard 
            post={post} 
            onLike={(postId, reaction) => user && likePost(postId, user.uid, reaction)} 
            onDelete={deletePost} 
          />
          <CommentsSection postId={post.id} />
        </div>
      ) : (
        <div className="p-10 text-center text-vyntra-text-sec">
          Post not found or has been deleted.
        </div>
      )}
    </div>
  );
}
