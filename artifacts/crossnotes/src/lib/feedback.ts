import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type FeedbackKind = 'idea' | 'bug' | 'encouragement';
export type FeedbackStatus = 'new' | 'in_review' | 'planned' | 'resolved' | 'archived';

export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  message: string;
  userId: string;
  userName: string;
  status: FeedbackStatus;
  adminNote: string;
  createdAt: string;
  updatedAt?: string;
  source: 'local' | 'firestore';
}

export interface FeedbackSubmission {
  kind: FeedbackKind;
  message: string;
  userId?: string;
  userName?: string | null;
}

const STORAGE_KEY = 'crossnotes-feedback';

function isFeedbackKind(value: unknown): value is FeedbackKind {
  return value === 'idea' || value === 'bug' || value === 'encouragement';
}

function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return value === 'new' || value === 'in_review' || value === 'planned' || value === 'resolved' || value === 'archived';
}

function normalizeFeedback(item: Partial<FeedbackItem> & { id?: string }): FeedbackItem {
  return {
    id: item.id ?? `feedback-${Date.now()}`,
    kind: isFeedbackKind(item.kind) ? item.kind : 'idea',
    message: typeof item.message === 'string' ? item.message : '',
    userId: typeof item.userId === 'string' ? item.userId : 'guest',
    userName: typeof item.userName === 'string' && item.userName.trim() ? item.userName : 'Guest scholar',
    status: isFeedbackStatus(item.status) ? item.status : 'new',
    adminNote: typeof item.adminNote === 'string' ? item.adminNote : '',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    source: item.source === 'firestore' ? 'firestore' : 'local',
  };
}

export function readLocalFeedback(): FeedbackItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => normalizeFeedback(item))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function writeLocalFeedback(items: FeedbackItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(({ source: _source, ...item }) => item).slice(0, 100)));
    window.dispatchEvent(new Event('crossnotes-feedback-changed'));
  } catch {
    // Storage failures should never interrupt a student's feedback submission.
  }
}

export async function submitFeedback(submission: FeedbackSubmission): Promise<FeedbackItem> {
  const now = new Date().toISOString();
  const localItem = normalizeFeedback({
    id: `feedback-${Date.now()}`,
    kind: submission.kind,
    message: submission.message.trim(),
    userId: submission.userId ?? 'guest',
    userName: submission.userName ?? 'Guest scholar',
    status: 'new',
    adminNote: '',
    createdAt: now,
    source: 'local',
  });

  const localItems = readLocalFeedback();
  writeLocalFeedback([localItem, ...localItems]);

  if (!db) return localItem;

  try {
    const remote = await addDoc(collection(db, 'feedback'), {
      kind: localItem.kind,
      message: localItem.message,
      userId: localItem.userId,
      userName: localItem.userName,
      status: localItem.status,
      adminNote: localItem.adminNote,
      createdAtClient: localItem.createdAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ...localItem, id: remote.id, source: 'firestore' };
  } catch {
    // Firestore might be unavailable or intentionally blocked for guests. The local item remains available to the feedback desk on this device.
    return localItem;
  }
}

export function useFeedbackItems() {
  const [items, setItems] = useState<FeedbackItem[]>(() => readLocalFeedback());
  const [loading, setLoading] = useState(Boolean(db));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const refreshLocalItems = () => {
      if (!db) setItems(readLocalFeedback());
    };
    window.addEventListener('crossnotes-feedback-changed', refreshLocalItems);
    window.addEventListener('storage', refreshLocalItems);

    if (!db) {
      setLoading(false);
      return () => {
        window.removeEventListener('crossnotes-feedback-changed', refreshLocalItems);
        window.removeEventListener('storage', refreshLocalItems);
      };
    }

    setSyncing(true);
    const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAtClient', 'desc'));
    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        const remoteItems = snapshot.docs.map((entry) => normalizeFeedback({
          id: entry.id,
          ...entry.data(),
          createdAt: entry.data().createdAtClient,
          updatedAt: entry.data().updatedAtClient,
          source: 'firestore',
        }));
        setItems(remoteItems);
        setLoading(false);
        setSyncing(false);
      },
      () => {
        setItems(readLocalFeedback());
        setLoading(false);
        setSyncing(false);
      },
    );

    return () => {
      unsubscribe();
      window.removeEventListener('crossnotes-feedback-changed', refreshLocalItems);
      window.removeEventListener('storage', refreshLocalItems);
    };
  }, []);

  return { items, loading, syncing };
}

export async function updateFeedbackItem(
  item: FeedbackItem,
  patch: Pick<FeedbackItem, 'status' | 'adminNote'>,
): Promise<FeedbackItem> {
  const updatedAt = new Date().toISOString();
  const updated = { ...item, ...patch, updatedAt };

  if (item.source === 'local' || !db) {
    const localItems = readLocalFeedback().map((entry) => entry.id === item.id ? updated : entry);
    writeLocalFeedback(localItems);
    return updated;
  }

  await updateDoc(doc(db, 'feedback', item.id), {
    status: patch.status,
    adminNote: patch.adminNote,
    updatedAtClient: updatedAt,
    updatedAt: serverTimestamp(),
  });
  return updated;
}
