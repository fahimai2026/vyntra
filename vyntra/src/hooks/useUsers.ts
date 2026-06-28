import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  verified?: boolean;
  isVerified?: boolean;
  followersCount: number;
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch users ordered by followersCount descending
    const q = query(
      collection(db, 'users'),
      orderBy('followersCount', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading };
}
