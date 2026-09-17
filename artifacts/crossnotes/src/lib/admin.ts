import type { User } from 'firebase/auth';

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

async function adminRequest<T>(user: User, action: string, data?: Record<string, unknown>) {
  const token = await user.getIdToken();
  const response = await fetch('/api/admin-users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...data }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Admin request failed.');
  return payload as T;
}

export async function listManagedUsers(user: User) {
  const result = await adminRequest<{ users: ManagedUser[] }>(user, 'list');
  return result.users;
}

export async function setManagedUserDisabled(user: User, uid: string, disabled: boolean) {
  await adminRequest<{ success: boolean }>(user, 'set-disabled', { uid, disabled });
}

export async function sendReleaseEmail(user: User, title: string, message: string) {
  return adminRequest<ReleaseEmailResult>(user, 'send-release', { title, message });
}
