import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

export interface SecurityLog {
  id: string;
  action: 'BLOCKED' | 'ALLOWED' | 'FLAGGED';
  threat_type: string;
  confidence: number;
  user_id: string;
  reason: string;
  timestamp: number;
  source: string;
}

export function useSecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SecurityLog[];
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
       console.error("Error fetching security logs:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { logs, loading };
}
