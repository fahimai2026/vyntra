import { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";

export interface VyntraNotification {
  id: string;
  userId: string; // Target user
  senderId: string; // Initiator
  senderName: string;
  senderAvatar: string;
  type: "like" | "comment" | "follow";
  postId?: string;
  postContent?: string;
  read: boolean;
  createdAt: number;
}

export function useNotifications(currentUserId: string | undefined) {
  const [notifications, setNotifications] = useState<VyntraNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as VyntraNotification[];

      setNotifications(items);
      setUnreadCount(items.filter(item => !item.read).length);
      setLoading(false);

      // Trigger Web Push Simulation Notification for the latest unread if it's new
      if (items.length > 0) {
        const latest = items[0];
        if (!latest.read && latest.createdAt > Date.now() - 5000) {
          triggerBrowserNotification(latest);
        }
      }
    }, (err) => {
      console.error("Error listening to notifications from Firestore:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const triggerBrowserNotification = (notif: VyntraNotification) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      let title = "Vyntra Security Notification";
      let body = "";
      
      if (notif.type === "like") {
        title = "New Like! ❤️";
        body = `${notif.senderName} liked your post: "${notif.postContent || "View details"}"`;
      } else if (notif.type === "comment") {
        title = "New Comment! 💬";
        body = `${notif.senderName} commented: "${notif.postContent || "View details"}"`;
      } else if (notif.type === "follow") {
        title = "New Follower! 👤";
        body = `${notif.senderName} started following you!`;
      }

      new Notification(title, {
        body,
        icon: notif.senderAvatar || "/logo.png",
      });
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return false;
    const status = await Notification.requestPermission();
    return status === "granted";
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => 
      updateDoc(doc(db, "notifications", n.id), { read: true, readAt: Date.now() })
    );
    await Promise.all(promises);
  };

  const markAsRead = async (notifId: string) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true, readAt: Date.now() });
  };

  const sendNotification = async (
    targetUserId: string,
    type: "like" | "comment" | "follow",
    sender: { uid: string; name: string; avatar: string },
    postId?: string,
    postContent?: string
  ) => {
    if (targetUserId === sender.uid) return; // Don't notify self
    try {
      await addDoc(collection(db, "notifications"), {
        userId: targetUserId,
        senderId: sender.uid,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        type,
        postId: postId || "",
        postContent: postContent || "",
        read: false,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error("Error creating real-time push notification doc:", e);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    requestPermission,
    markAllAsRead,
    markAsRead,
    sendNotification
  };
}
