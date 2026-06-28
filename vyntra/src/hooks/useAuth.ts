import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface VyntraUser {
  uid: string;
  email: string;
  name: string;
  handle: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  location?: string;
  website?: string;
  otherSocial?: string;
  followersCount: number;
  followingCount: number;
  verified: boolean;
  isVerified?: boolean;
  createdAt: number;
  contentPreferences?: {
    topics?: string[];
    hiddenWords?: string[];
  };
  isPrivate?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
}

export function useAuth() {
  const [user, setUser] = useState<VyntraUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result on mount
    getRedirectResult(auth).catch((error) => {
      console.error("Error from redirect login:", error);
    });

    let unsubscribeUserDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        let isCreatingUser = false;

        // Setup real-time listener for user document immediately
        const { onSnapshot } = await import('firebase/firestore');
        unsubscribeUserDoc = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as VyntraUser;
            setUser(userData);
            
            // Sync to local SQL database quietly
            fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
            }).catch(syncErr => console.warn("Failed silent Postgres sync on snapshot:", syncErr));
          } else {
             // Create new user profile if we haven't already
             if (!isCreatingUser) {
                isCreatingUser = true;
                const newUser: VyntraUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: firebaseUser.displayName || 'Vyntra User',
                  handle: '@' + (firebaseUser.email?.split('@')[0] || firebaseUser.uid.substring(0, 8)),
                  avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=6C5CE7&color=fff`,
                  bio: "New to Vyntra",
                  followersCount: 0,
                  followingCount: 0,
                  verified: false,
                  createdAt: Date.now()
                };
                try {
                  await setDoc(userRef, newUser);
                } catch (error: any) {
                  console.warn("Error creating user doc on auth", error);
                }
             }

             // Fallback
             const fallbackUser: VyntraUser = {
                 uid: firebaseUser.uid,
                 email: firebaseUser.email || '',
                 name: firebaseUser.displayName || 'Vyntra User',
                 handle: '@' + (firebaseUser.email?.split('@')[0] || firebaseUser.uid.substring(0, 8)),
                 avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=6C5CE7&color=fff`,
                 bio: "New to Vyntra",
                 followersCount: 0,
                 followingCount: 0,
                 verified: false,
                 createdAt: Date.now()
             };
             setUser(fallbackUser);

             // Sync to local SQL database quietly
             fetch('/api/users/sync', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(fallbackUser)
             }).catch(syncErr => console.warn("Failed silent Postgres sync on fallback:", syncErr));
          }
          setLoading(false);
        }, (err) => {
          console.error("Error listening to user document", err);
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Error signing in with Google via popup:', error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        console.log("Popup blocked or closed, falling back to redirect...");
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string, handleStr?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user doc immediately with the name
      const userRef = doc(db, 'users', userCredential.user.uid);
      
      const defaultHandle = handleStr || email.split('@')[0] || userCredential.user.uid.substring(0, 8);
      
      const newUser: VyntraUser = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        handle: defaultHandle.startsWith('@') ? defaultHandle : '@' + defaultHandle,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6C5CE7&color=fff`,
        bio: "New to Vyntra",
        followersCount: 0,
        followingCount: 0,
        verified: false,
        createdAt: Date.now()
      };
      await setDoc(userRef, newUser);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const updateUserBio = async (newBio: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { bio: newBio }, { merge: true });
      setUser({ ...user, bio: newBio });
    } catch (error) {
      console.error('Error updating bio', error);
      throw error;
    }
  };

  const updateUserProfile = async (name: string, bio: string, avatarUrl?: string, location?: string, website?: string, otherSocial?: string, coverImageUrl?: string) => {
    if (!user) return;
    try {
      const updates: Partial<VyntraUser> = { name, bio, location, website, otherSocial };
      if (avatarUrl) updates.avatar = avatarUrl;
      if (coverImageUrl) updates.coverImage = coverImageUrl;
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating profile', error);
      throw error;
    }
  };

  const updateUserPreferences = async (preferences: Partial<VyntraUser>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, preferences, { merge: true });
      setUser({ ...user, ...preferences });
    } catch (error) {
      console.error('Error updating preferences', error);
      throw error;
    }
  };

  return { user, loading, signInWithGoogle, logout, loginWithEmail, signupWithEmail, updateUserBio, updateUserProfile, updateUserPreferences };
}
