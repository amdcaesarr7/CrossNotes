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
  clientId: string;
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
const FEEDBACK_EVENT = 'crossnotes-feedback-changed';

function isFeedbackKind(value: unknown): value is FeedbackKind {
  return value === 'idea' || value === 'bug' || value === 'encouragement';
}

function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return value === 'new' || value === 'in_review' || value === 'planned' || value === 'resolved' || value === 'archived';
}

function makeClientId() {
  return `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFeedback(item: Partial<FeedbackItem> & { id?: string }): FeedbackItem {
  const clientId = typeof item.clientId === 'string' && item.clientId ? item.clientId : item.id ?? makeClientId();
  return {
    id: item.id ?? clientId,
    clientId,
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

function sortFeedback(items: FeedbackItem[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mergeFeedback(remoteItems: FeedbackItem[], localItems: FeedbackItem[]) {
  const remoteClientIds = new Set(remoteItems.map((item) => item.clientId));
  return sortFeedback([...remoteItems, ...localItems.filter((item) => !remoteClientIds.has(item.clientId))]);
}

export function readLocalFeedback(): FeedbackItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return sortFeedback(raw.map((item) => normalizeFeedback(item)));
  } catch {
    return [];
  }
}

function writeLocalFeedback(items: FeedbackItem[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.map(({ source: _source, ...item }) => item).slice(0, 100)),
    );
    window.dispatchEvent(new Event(FEEDBACK_EVENT));
  } catch {
    // Local storage is only a resilience layer; its failure must not interrupt a submission.
  }
}

function replaceLocalItem(item: FeedbackItem) {
  const localItems = readLocalFeedback();
  const exists = localItems.some((entry) => entry.clientId === item.clientId);
  writeLocalFeedback(
    exists
      ? localItems.map((entry) => entry.clientId === item.clientId ? item : entry)
      : [item, ...localItems],
  );
}

export async function submitFeedback(submission: FeedbackSubmission): Promise<FeedbackItem> {
  const now = new Date().toISOString();
  const clientId = makeClientId();
  const queuedItem = normalizeFeedback({
    id: clientId,
    clientId,
    kind: submission.kind,
    message: submission.message.trim(),
    userId: submission.userId ?? 'guest',
    userName: submission.userName ?? 'Guest scholar',
    status: 'new',
    adminNote: '',
    createdAt: now,
    source: 'local',
  });

  // The item is visible to the desk immediately on this device, then upgraded to its Firestore ID after sync.
  replaceLocalItem(queuedItem);
  if (!db) return queuedItem;

  try {
    const remote = await addDoc(collection(db, 'feedback'), {
      clientId: queuedItem.clientId,
      kind: queuedItem.kind,
      message: queuedItem.message,
      userId: queuedItem.userId,
      userName: queuedItem.userName,
      status: queuedItem.status,
      adminNote: queuedItem.adminNote,
      createdAtClient: queuedItem.createdAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const syncedItem = { ...queuedItem, id: remote.id, source: 'firestore' as const };
    replaceLocalItem(syncedItem);
    return syncedItem;
  } catch {
    // The queue remains visible locally and can still be reviewed from this browser.
    return queuedItem;
  }
}

export function useFeedbackItems() {
  const [items, setItems] = useState<FeedbackItem[]>(() => readLocalFeedback());
  const [loading, setLoading] = useState(Boolean(db));
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const refreshFromLocal = () => {
      setItems((currentItems) => {
        const remoteItems = currentItems.filter((item) => item.source === 'firestore');
        return mergeFeedback(remoteItems, readLocalFeedback());
      });
    };

    window.addEventListener(FEEDBACK_EVENT, refreshFromLocal);
    window.addEventListener('storage', refreshFromLocal);

    if (!db) {
      setLoading(false);
      return () => {
        window.removeEventListener(FEEDBACK_EVENT, refreshFromLocal);
        window.removeEventListener('storage', refreshFromLocal);
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
        setItems(mergeFeedback(remoteItems, readLocalFeedback()));
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
      window.removeEventListener(FEEDBACK_EVENT, refreshFromLocal);
      window.removeEventListener('storage', refreshFromLocal);
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
  replaceLocalItem(updated);

  if (item.source === 'local' || !db) return updated;

  await updateDoc(doc(db, 'feedback', item.id), {
    status: patch.status,
    adminNote: patch.adminNote,
    updatedAtClient: updatedAt,
    updatedAt: serverTimestamp(),
  });

  return updated;
}
