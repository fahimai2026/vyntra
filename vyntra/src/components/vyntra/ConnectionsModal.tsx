import React, { useEffect, useState } from "react";
import { User, X } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { VyntraUser } from "../../hooks/useAuth";
import { VerifiedBadge } from "./VerifiedBadge";
import { useNavigation } from "../../contexts/NavigationContext";

export function ConnectionsModal({
  isOpen,
  onClose,
  userId,
  type, // "followers" or "following"
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}) {
  const [users, setUsers] = useState<VyntraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigateProfile } = useNavigation();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchConnections = async () => {
      setLoading(true);
      try {
        let q;
        if (type === "followers") {
          q = query(collection(db, "follows"), where("followingId", "==", userId));
        } else {
          q = query(collection(db, "follows"), where("followerId", "==", userId));
        }

        const snapshot = await getDocs(q);
        const userIds = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as { followerId: string; followingId: string };
          return type === "followers" ? data.followerId : data.followingId;
        });

        if (userIds.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        const fetchedUsers: VyntraUser[] = [];
        // Since we can't 'in' query more than 10, we'll just fetch sequentially for simplicity
        for (const id of userIds) {
          const userRef = doc(db, "users", id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            fetchedUsers.push(userSnap.data() as VyntraUser);
          }
        }
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching connections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#1A1F2C] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-fadeIn" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-bold text-lg capitalize">{type}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-vyntra-text-sec hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 rounded-full border-t-2 border-vyntra-primary animate-spin"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="flex flex-col gap-1">
              {users.map((u) => (
                <div 
                  key={u.uid} 
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                  onClick={() => {
                    onClose();
                    navigateProfile(u.uid);
                  }}
                >
                  <img src={u.avatar} className="w-12 h-12 rounded-full flex-shrink-0" alt="avatar" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-[15px] truncate flex items-center gap-1">
                      <span className="truncate text-white">{u.name}</span>
                      <VerifiedBadge size={14} followers={u.followersCount} legacyVerified={u.verified} isVerified={u.isVerified || u.verified} className="flex-shrink-0" />
                    </span>
                    <span className="text-vyntra-text-sec text-[14px] truncate">{u.handle}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-vyntra-text-sec text-center">
              <User size={48} className="mb-4 opacity-20" />
              <p className="text-[15px]">No {type} yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
