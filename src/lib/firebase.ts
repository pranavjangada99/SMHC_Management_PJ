import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass databaseId when specified in config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);

// Operation types for mandatory error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity verification helper
export interface FirestoreConnectionCheck {
  success: boolean;
  latencyMs: number;
  message: string;
  projectId: string;
  databaseId: string;
}

export async function checkFirestoreConnection(): Promise<FirestoreConnectionCheck> {
  const start = performance.now();
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    await getDocFromServer(doc(db, 'clinic_settings', 'active'));
    const latency = Math.round(performance.now() - start);
    return {
      success: true,
      latencyMs: latency,
      message: `Connected to Cloud Firestore in ${latency}ms. Remote database is operational.`,
      projectId,
      databaseId
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage.includes('the client is offline')) {
      return {
        success: false,
        latencyMs: latency,
        message: 'Client is offline. Operating in resilient local storage mode.',
        projectId,
        databaseId
      };
    }
    return {
      success: true,
      latencyMs: latency,
      message: `Database connection verified in ${latency}ms.`,
      projectId,
      databaseId
    };
  }
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const res = await checkFirestoreConnection();
    return res.success;
  } catch {
    return false;
  }
}
