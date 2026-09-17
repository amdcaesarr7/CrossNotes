import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface ManagedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export interface ReleaseEmailResult {
  recipientCount: number;
  sentCount: number;
  failedCount: number;
}

const configuredAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export function isConfiguredAdmin(email: string | null | undefined) {
  return Boolean(email && configuredAdminEmails.includes(email.toLowerCase()));
}

function requireFunctions() {
  if (!functions) throw new Error('Firebase is not configured.');
  return functions;
}

export async function listManagedUsers() {
  const callable = httpsCallable<void, { users: ManagedUser[] }>(requireFunctions(), 'adminListUsers');
  const result = await callable();
  return result.data.users;
}

export async function setManagedUserDisabled(uid: string, disabled: boolean) {
  const callable = httpsCallable<{ uid: string; disabled: boolean }, { success: boolean }>(
    requireFunctions(),
    'adminSetUserDisabled',
  );
  await callable({ uid, disabled });
}

export async function sendReleaseEmail(title: string, message: string) {
  const callable = httpsCallable<
    { title: string; message: string },
    ReleaseEmailResult
  >(requireFunctions(), 'adminSendReleaseEmail');
  const result = await callable({ title, message });
  return result.data;
}
