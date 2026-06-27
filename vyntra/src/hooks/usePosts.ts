import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  increment,
  getDoc,
  serverTimestamp,
  arrayRemove,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { VyntraUser } from './useAuth';
import { trackEvent } from '../utils/analytics';

export interface PostData {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  createdAt: number;
  author?: VyntraUser; // hydrated on client
  likedBy?: string[];
  reactions?: Record<string, string>;
}

export function usePosts() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostData[];

      // Hydrate authors (basic implementation, ideally use a cache or batch)
      const hydratedPosts = await Promise.all(postsData.map(async (post) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', post.authorId));
          return {
            ...post,
            author: userDoc.exists() ? (userDoc.data() as VyntraUser) : undefined
          };
        } catch(e) { return post; }
      }));

      setPosts(hydratedPosts);
      setLoading(false);
    }, (error) => {
       console.error("Error fetching posts:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createPost = async (authorId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    try {
    const postData: any = {
      authorId,
      content,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      createdAt: Date.now(), // Standard timestamp
      likedBy: []
    };
    
    if (mediaUrl) postData.mediaUrl = mediaUrl;
    if (mediaType) postData.mediaType = mediaType;
    
    let createdDocId: string | null = null;
    try {
      const docRef = await addDoc(collection(db, 'posts'), postData);
      createdDocId = docRef.id;
      // Securely log post creation event to GA4
      trackEvent('post_created', { authorId });
    } catch (e) {
      console.error("Error adding document: ", e);
      return;
    }

    // Run Vyntra Guardian safety check in background (24/7 Monitor Simulation)
    (async () => {
      try {
        const checkRes = await fetch('/api/gemini/guardian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content || mediaUrl, userId: authorId })
        });
        
        if (checkRes.ok) {
          const decision = await checkRes.json();
          
          await addDoc(collection(db, 'security_logs'), {
             ...decision,
             timestamp: Date.now(),
             source: 'post'
          });

          if (decision.action === 'BLOCKED' && createdDocId) {
            await deleteDoc(doc(db, 'posts', createdDocId));
            alert(`🛡️ Vyntra Guardian deleted your post: ${decision.reason}`);
          }
        }
      } catch (checkErr) {
        console.error("Guardian AI check failed:", checkErr);
      }
    })();
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const likePost = async (postId: string, userId: string, reactionId?: string) => {
    if (!userId) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const likedBy = postData.likedBy || [];
        
        if (reactionId) {
           // It's a specific reaction
           const reactions = postData.reactions || {};
           const wasLiked = likedBy.includes(userId);
           
           if (reactions[userId] === reactionId) {
             delete reactions[userId];
             let updates: any = { reactions };
             if (wasLiked) {
               updates.likedBy = arrayRemove(userId);
               updates.likesCount = Math.max(0, (postData.likesCount || 0) - 1);
             }
             await updateDoc(postRef, updates);
           } else {
             reactions[userId] = reactionId;
             let updates: any = { reactions };
             if (!wasLiked) {
               updates.likedBy = arrayUnion(userId);
               updates.likesCount = increment(1);
             }
             await updateDoc(postRef, updates);
           }
           return;
        }

        // Normal like processing
        if (likedBy.includes(userId)) {
          // Unlike
          await updateDoc(postRef, {
            likedBy: arrayRemove(userId),
            likesCount: Math.max(0, (postData.likesCount || 0) - 1)
          });
        } else {
          // Like
          await updateDoc(postRef, {
            likedBy: arrayUnion(userId),
            likesCount: increment(1)
          });

          // Track securely in GA4
          trackEvent('post_liked', { postId, userId });

          // Send real-time notification inside Firestore
          try {
            if (postData.authorId && postData.authorId !== userId) {
              const likerSnap = await getDoc(doc(db, 'users', userId));
              const liker = likerSnap.exists() ? likerSnap.data() : null;

              await addDoc(collection(db, "notifications"), {
                userId: postData.authorId,
                senderId: userId,
                senderName: liker?.name || "Vyntra User",
                senderAvatar: liker?.avatar || "",
                type: "like",
                postId: postId,
                postContent: postData.content || "",
                read: false,
                createdAt: Date.now()
              });
            }
          } catch (notifErr) {
            console.error("Failed to generate like notification:", notifErr);
          }
        }
      }
    } catch(e) {
      console.error('Error toggling like', e);
    }
  };
  
  const deletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (e) {
      console.error('Error deleting post:', e);
    }
  };
  
  return { posts, loading, createPost, likePost, deletePost };
}
