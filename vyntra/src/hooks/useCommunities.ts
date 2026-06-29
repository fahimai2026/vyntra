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
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';

export interface CommunityData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  membersCount: number;
  members: string[]; // User IDs
  createdAt: number;
}

export function useCommunities() {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Order by membersCount desc for trending communities
    const q = query(collection(db, 'communities'), orderBy('membersCount', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityData[];
      
      setCommunities(commsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching communities:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createCommunity = async (name: string, description: string, creatorId: string) => {
    if (!creatorId) return null;
    
    try {
      const commData = {
        name,
        description,
        creatorId,
        membersCount: 1,
        members: [creatorId],
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'communities'), commData);
      return docRef.id;
    } catch (e) {
      console.error("Error creating community: ", e);
      return null;
    }
  };

  const joinCommunity = async (communityId: string, userId: string) => {
    if (!userId) return;
    try {
      const commRef = doc(db, 'communities', communityId);
      const commDoc = await getDoc(commRef);
      if (commDoc.exists()) {
        const data = commDoc.data();
        const members = data.members || [];
        
        if (members.includes(userId)) {
          // Leave
          await updateDoc(commRef, {
            members: arrayRemove(userId),
            membersCount: Math.max(0, (data.membersCount || 0) - 1)
          });
        } else {
          // Join
          await updateDoc(commRef, {
            members: arrayUnion(userId),
            membersCount: increment(1)
          });
        }
      }
    } catch (e) {
      console.error("Error toggling community membership:", e);
    }
  };

  return { communities, loading, createCommunity, joinCommunity };
}
