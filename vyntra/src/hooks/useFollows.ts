import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where,
  onSnapshot, 
  addDoc, 
  doc, 
  deleteDoc,
  getDocs,
  updateDoc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { trackEvent } from '../utils/analytics';

export function useFollows() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFollowing([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const followingIds = snapshot.docs.map(doc => doc.data().followingId);
      setFollowing(followingIds);
      setLoading(false);
    }, (error) => {
       console.error("Error fetching follows:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const followUser = async (targetUserId: string) => {
    if (!user) return;
    try {
      // Check if already following
      const q = query(collection(db, 'follows'), where('followerId', '==', user.uid), where('followingId', '==', targetUserId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) return; // Already following

      // Add to follows collection
      await addDoc(collection(db, 'follows'), {
        followerId: user.uid,
        followingId: targetUserId,
        createdAt: Date.now()
      });

      // Update current user following count
      const currentUserRef = doc(db, 'users', user.uid);
      await updateDoc(currentUserRef, { followingCount: increment(1) });

      // Identify if target user is in DB, if so increment their followers
      const targetUserRef = doc(db, 'users', targetUserId);
      try {
        await updateDoc(targetUserRef, { followersCount: increment(1) });
      } catch (e) {
        // Target user might be a hardcoded dummy ID, ignore if not found
      }

      // Track securely in GA4
      trackEvent('user_followed', { followerId: user.uid, followingId: targetUserId });

      // Send follower notifications inside Firestore
      try {
        await addDoc(collection(db, "notifications"), {
          userId: targetUserId,
          senderId: user.uid,
          senderName: user.name || "Vyntra User",
          senderAvatar: user.avatar || "",
          type: "follow",
          read: false,
          createdAt: Date.now()
        });
      } catch (notifErr) {
        console.error("Failed to generate follow notification:", notifErr);
      }
    } catch (e) {
      console.error("Error following user: ", e);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'follows'), where('followerId', '==', user.uid), where('followingId', '==', targetUserId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return; // Not following

      const followDocId = snapshot.docs[0].id;
      await deleteDoc(doc(db, 'follows', followDocId));

      const currentUserRef = doc(db, 'users', user.uid);
      await updateDoc(currentUserRef, { followingCount: increment(-1) });

      const targetUserRef = doc(db, 'users', targetUserId);
      try {
        await updateDoc(targetUserRef, { followersCount: increment(-1) });
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error("Error unfollowing user: ", e);
    }
  };
  
  return { following, loading, followUser, unfollowUser };
}
