import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const MAX_EMAILS_PER_RUN = 100;
const MAX_TITLE_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 2000;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function adminEmails() {
  return new Set(text(process.env.ADMIN_EMAILS).split(',').map((email) => email.toLowerCase()).filter(Boolean));
}

function firebaseAuth() {
  const rawServiceAccount = text(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!rawServiceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
  const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(rawServiceAccount)) });
  return getAuth(app);
}

async function requireAdmin(request) {
  const authorization = text(request.headers.authorization);
  if (!authorization.startsWith('Bearer ')) throw new Error('Authentication is required.');
  const decoded = await firebaseAuth().verifyIdToken(authorization.slice(7));
  const email = text(decoded.email).toLowerCase();
  if (!email || !adminEmails().has(email)) throw new Error('Admin access is required.');
}

async function allUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

function serializeUser(user) {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    disabled: user.disabled,
    createdAt: user.metadata.creationTime ?? null,
    lastSignInAt: user.metadata.lastSignInTime ?? null,
  };
}

async function sendThroughRelay(recipient, subject, message) {
  const relayUrl = text(process.env.GMAIL_RELAY_URL);
  const relaySecret = text(process.env.GMAIL_RELAY_SECRET);
  if (!relayUrl || !relaySecret) throw new Error('Gmail relay settings are incomplete.');
  const relayResponse = await fetch(relayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: relaySecret, to: recipient, subject, text: message }),
  });
  const rawBody = await relayResponse.text();
  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new Error(`Gmail relay returned a non-JSON response (HTTP ${relayResponse.status}). Check that GMAIL_RELAY_URL is the deployed /exec URL.`);
  }
  if (!relayResponse.ok || payload.ok !== true) {
    throw new Error(typeof payload.error === 'string' ? payload.error : `Gmail relay rejected the message (HTTP ${relayResponse.status}).`);
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    await requireAdmin(request);
    const action = text(request.body?.action);
    const auth = firebaseAuth();

    if (action === 'list') {
      const users = (await allUsers(auth)).map(serializeUser).sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));
      response.status(200).json({ users });
      return;
    }

    if (action === 'set-disabled') {
      const uid = text(request.body?.uid);
      const disabled = request.body?.disabled;
      if (!uid || typeof disabled !== 'boolean') {
        response.status(400).json({ error: 'A user ID and disabled state are required.' });
        return;
      }
      await auth.updateUser(uid, { disabled });
      response.status(200).json({ success: true });
      return;
    }

    if (action === 'send-release') {
      const title = text(request.body?.title);
      const message = text(request.body?.message);
      if (!title || !message || title.length > MAX_TITLE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
        response.status(400).json({ error: 'A valid title and message are required.' });
        return;
      }

      const rawRecipients = Array.isArray(request.body?.recipients) ? request.body.recipients : null;
      const recipients = [...new Set((rawRecipients ?? (await allUsers(auth))
        .filter((user) => user.email && !user.disabled)
        .map((user) => user.email)
        .slice(0, MAX_EMAILS_PER_RUN))
        .map((value) => text(value))
        .filter(Boolean))];

      if (recipients.length === 0) {
        response.status(200).json({ recipientCount: 0, sentCount: 0, failedCount: 0 });
        return;
      }

      const BATCH_SIZE = 8;
      let sentCount = 0;
      let failedCount = 0;
      const failures = [];
      for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
        const batch = recipients.slice(index, index + BATCH_SIZE);
        for (const recipient of batch) {
          try {
            await sendThroughRelay(
              recipient,
              `[CrossNotes] ${title}`,
              `${title}\n\n${message}\n\nYou are receiving this because you have a registered CrossNotes account.`,
            );
            sentCount += 1;
          } catch (error) {
            failedCount += 1;
            const reason = error instanceof Error ? error.message : 'Unknown error';
            failures.push(reason);
            console.error('Release email delivery failed.', { recipient, error: reason, batchIndex: index });
          }
        }
      }
      const uniqueFailures = [...new Set(failures)];
      response.status(200).json({
        recipientCount: recipients.length,
        sentCount,
        failedCount,
        error: uniqueFailures.length > 0
          ? `Some messages failed: ${uniqueFailures.slice(0, 3).join(' | ')}`
          : undefined,
      });
      return;
    }

    response.status(400).json({ error: 'Unknown admin action.' });
  } catch (error) {
    console.error('Admin API request failed.', error instanceof Error ? error.message : 'Unknown error');
    response.status(403).json({ error: error instanceof Error ? error.message : 'Admin request failed.' });
  }
}
