import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { useAuth } from './useAuth';

export interface Chat {
  id: string;
  users: string[]; // array of uids
  updatedAt: any;
  lastMessage?: string;
  isGroup?: boolean;
  name?: string;
  avatar?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: any;
  attachment?: {
    type: 'image' | 'audio' | 'video' | 'file';
    data: string;
  };
}

export function useMessages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Real-time listener for chats involving the current user
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'chats'),
      where('users', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(chatsData);
    }, (error) => {
      console.error("Error fetching chats:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time listener for messages in the selected chat
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', selectedChatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgsData);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  const sendMessage = async (chatId: string, text: string, attachment?: { type: 'image' | 'video' | 'file' | 'audio'; data: string }) => {
    if (!user?.uid || !chatId) return;

    try {
      const msgData: any = {
        chatId,
        senderId: user.uid,
        text,
        timestamp: serverTimestamp(),
      };
      if (attachment) {
         msgData.attachment = attachment;
      }

      let createdMsgId: string | null = null;
      try {
         const docRef = await addDoc(collection(db, 'messages'), msgData);
         createdMsgId = docRef.id;

         // Update chat's last message
         await setDoc(doc(db, 'chats', chatId), {
           updatedAt: serverTimestamp(),
           lastMessage: attachment ? `Sent an attachment` : text
         }, { merge: true });
      } catch (e) {
         console.error("Error adding message doc: ", e);
         return;
      }

      // Run Vyntra Guardian safety check in background (24/7 Monitor Simulation)
      (async () => {
        try {
          const checkRes = await fetch('/api/gemini/guardian', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text || attachment?.data, userId: user.uid })
          });
          if (checkRes.ok) {
            const contentType = checkRes.headers.get("content-type");
            const decision = contentType && contentType.includes("application/json") ? await checkRes.json() : {};
            
            await addDoc(collection(db, 'security_logs'), {
               ...decision,
               timestamp: Date.now(),
               source: 'message'
            });

            if (decision.action === 'BLOCKED' && createdMsgId) {
              const { deleteDoc, doc: fstoreDoc } = await import('firebase/firestore');
              await deleteDoc(fstoreDoc(db, 'messages', createdMsgId));
              alert(`🛡️ Vyntra Guardian deleted your message: ${decision.reason}`);
            }
          }
        } catch (checkErr) {
          console.error("Guardian AI check failed:", checkErr);
        }
      })();

    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  const createChat = async (otherUid: string) => {
    if (!user?.uid) return null;
    
    // Check if chat already exists
    const q1 = query(collection(db, 'chats'), where('users', '==', [user.uid, otherUid]));
    const q2 = query(collection(db, 'chats'), where('users', '==', [otherUid, user.uid]));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    if (!snap1.empty) return snap1.docs[0].id;
    if (!snap2.empty) return snap2.docs[0].id;

    // Create new
    const docRef = await addDoc(collection(db, 'chats'), {
      users: [user.uid, otherUid],
      updatedAt: serverTimestamp(),
      lastMessage: "No messages yet",
      isGroup: false
    });
    
    return docRef.id;
  };

  return { chats, messages, selectedChatId, setSelectedChatId, sendMessage, createChat };
}
