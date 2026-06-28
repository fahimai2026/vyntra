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
  deleteDoc
} from 'firebase/firestore';
import { VyntraUser } from './useAuth';
import { trackEvent } from '../utils/analytics';

export interface CommentData {
  id: string;
  authorId: string;
  content: string;
  createdAt: number;
  author?: VyntraUser;
  reactions?: Record<string, string>; // userId -> emoji
  parentId?: string | null; // For replies
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentData[];

      const hydrated = await Promise.all(msgs.map(async (c) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', c.authorId));
          return {
            ...c,
            author: userDoc.exists() ? (userDoc.data() as VyntraUser) : undefined
          };
        } catch(e) { return c; }
      }));

      setComments(hydrated);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const addComment = async (authorId: string, content: string, parentId?: string) => {
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorId,
        content,
        createdAt: Date.now(),
        reactions: {},
        parentId: parentId || null
      });

      // Increment comment count on post
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      // Track securely in GA4
      trackEvent('comment_added', { postId, authorId });

      // Generate notifications for post author in real-time
      try {
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          if (postData.authorId && postData.authorId !== authorId) {
            const commenterSnap = await getDoc(doc(db, 'users', authorId));
            const commenter = commenterSnap.exists() ? commenterSnap.data() : null;

            await addDoc(collection(db, "notifications"), {
              userId: postData.authorId,
              senderId: authorId,
              senderName: commenter?.name || "Vyntra User",
              senderAvatar: commenter?.avatar || "",
              type: "comment",
              postId: postId,
              postContent: content,
              read: false,
              createdAt: Date.now()
            });
          }
        }
      } catch (notifErr) {
        console.error("Failed to generate comment notification:", notifErr);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const reactToComment = async (commentId: string, userId: string, emoji: string) => {
    try {
      const ref = doc(db, 'posts', postId, 'comments', commentId);
      const cDoc = await getDoc(ref);
      if (cDoc.exists()) {
        const data = cDoc.data();
        const reactions = data.reactions || {};
        
        if (reactions[userId] === emoji) {
          // toggle off
          delete reactions[userId];
        } else {
          reactions[userId] = emoji;
        }
        
        await updateDoc(ref, { reactions });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return { comments, loading, addComment, reactToComment };
}
