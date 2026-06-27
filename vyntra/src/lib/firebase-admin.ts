import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const adminApp = getApps().length ? getApps()[0] : initializeApp({
  projectId: firebaseConfig.projectId,
});

export const dbAdmin = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
export const adminAuth = getAuth(adminApp);
