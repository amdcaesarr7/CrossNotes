import { FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { defineSecret } from 'firebase-functions/params';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

initializeApp();

const META_INSTAGRAM_ACCESS_TOKEN = defineSecret('META_INSTAGRAM_ACCESS_TOKEN');
const META_INSTAGRAM_ACCOUNT_ID = defineSecret('META_INSTAGRAM_ACCOUNT_ID');
const META_RECIPIENT_IGSID = defineSecret('META_RECIPIENT_IGSID');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const NOTIFICATION_EMAIL_TO = defineSecret('NOTIFICATION_EMAIL_TO');
const NOTIFICATION_EMAIL_FROM = defineSecret('NOTIFICATION_EMAIL_FROM');
const ADMIN_EMAILS = defineSecret('ADMIN_EMAILS');

type FeedbackKind = 'idea' | 'bug' | 'encouragement';

interface FeedbackPayload {
  kind?: FeedbackKind;
  message?: string;
  userName?: string;
  createdAtClient?: string;
}

function displayKind(kind: FeedbackKind | undefined) {
  switch (kind) {
    case 'bug':
      return 'Bug report';
    case 'encouragement':
      return 'Encouragement';
    default:
      return 'Idea';
  }
}

function truncate(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function makeNotificationText(feedback: FeedbackPayload, feedbackId: string) {
  const author = feedback.userName?.trim() || 'A CrossNotes learner';
  const kind = displayKind(feedback.kind);
  const message = truncate(feedback.message?.trim() || 'No message supplied.', 550);

  return {
    instagram: `Automated CrossNotes notification: new feedback\n\n${kind} from ${author}:\n“${message}”\n\nReview ID: ${feedbackId}`,
    emailSubject: `[CrossNotes] New ${kind.toLowerCase()} feedback`,
    emailText: `A new CrossNotes feedback item has arrived.\n\nType: ${kind}\nFrom: ${author}\nFeedback ID: ${feedbackId}\n\nMessage:\n${message}\n\nOpen the CrossNotes admin feedback desk to review and manage it.`,
  };
}

async function sendInstagramNotification(text: string) {
  const accountId = META_INSTAGRAM_ACCOUNT_ID.value();
  const recipientId = META_RECIPIENT_IGSID.value();
  const accessToken = META_INSTAGRAM_ACCESS_TOKEN.value();

  if (!accountId || !recipientId || !accessToken) {
    throw new Error('Instagram messaging credentials have not been configured.');
  }

  const response = await fetch(`https://graph.instagram.com/v26.0/${accountId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!response.ok) {
    throw new Error(`Instagram delivery failed with HTTP ${response.status}.`);
  }
}

async function sendFallbackEmail(subject: string, text: string) {
  const apiKey = RESEND_API_KEY.value();
  const to = NOTIFICATION_EMAIL_TO.value();
  const from = NOTIFICATION_EMAIL_FROM.value();

  if (!apiKey || !to || !from) {
    throw new Error('Email fallback credentials have not been configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!response.ok) {
    throw new Error(`Email fallback failed with HTTP ${response.status}.`);
  }
}

/**
 * Runs only when a feedback document is first created. Instagram is attempted
 * first; an email is sent automatically whenever Instagram cannot deliver.
 */
export const notifyFeedbackSubmitted = onDocumentCreated(
  {
    document: 'feedback/{feedbackId}',
    region: 'asia-south1',
    secrets: [
      META_INSTAGRAM_ACCESS_TOKEN,
      META_INSTAGRAM_ACCOUNT_ID,
      META_RECIPIENT_IGSID,
      RESEND_API_KEY,
      NOTIFICATION_EMAIL_TO,
      NOTIFICATION_EMAIL_FROM,
    ],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('Feedback creation event had no document snapshot.');
      return;
    }

    const feedback = snapshot.data() as FeedbackPayload;
    const { instagram, emailSubject, emailText } = makeNotificationText(feedback, event.params.feedbackId);

    try {
      await sendInstagramNotification(instagram);
      await snapshot.ref.set({
        notification: {
          delivery: 'instagram',
          fallbackUsed: false,
          deliveredAt: FieldValue.serverTimestamp(),
        },
      }, { merge: true });
      logger.info('Feedback notification delivered through Instagram.', { feedbackId: event.params.feedbackId });
    } catch (instagramError) {
      logger.warn('Instagram delivery failed; attempting email fallback.', {
        feedbackId: event.params.feedbackId,
        error: instagramError instanceof Error ? instagramError.message : 'Unknown Instagram error',
      });

      try {
        await sendFallbackEmail(emailSubject, emailText);
        await snapshot.ref.set({
          notification: {
            delivery: 'email_fallback',
            fallbackUsed: true,
            deliveredAt: FieldValue.serverTimestamp(),
          },
        }, { merge: true });
        logger.info('Feedback notification delivered through email fallback.', { feedbackId: event.params.feedbackId });
      } catch (emailError) {
        await snapshot.ref.set({
          notification: {
            delivery: 'failed',
            fallbackUsed: true,
            attemptedAt: FieldValue.serverTimestamp(),
          },
        }, { merge: true });
        logger.error('Both feedback notification channels failed.', {
          feedbackId: event.params.feedbackId,
          error: emailError instanceof Error ? emailError.message : 'Unknown email error',
        });
      }
    }
  },
);

function getAdminEmails() {
  return new Set(ADMIN_EMAILS.value().split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function assertAdmin(request: { auth?: { token: Record<string, unknown> } | null }) {
  const email = typeof request.auth?.token.email === 'string' ? request.auth.token.email.toLowerCase() : '';
  if (!request.auth || !email || !getAdminEmails().has(email)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
}

function serializeUser(user: UserRecord) {
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

async function listAllUsers() {
  const users: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const result = await getAuth().listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

export const adminListUsers = onCall(
  { region: 'asia-south1', secrets: [ADMIN_EMAILS] },
  async (request) => {
    assertAdmin(request);
    const users = await listAllUsers();
    return { users: users.map(serializeUser).sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '')) };
  },
);

export const adminSetUserDisabled = onCall(
  { region: 'asia-south1', secrets: [ADMIN_EMAILS] },
  async (request) => {
    assertAdmin(request);
    const uid = typeof request.data?.uid === 'string' ? request.data.uid : '';
    const disabled = request.data?.disabled;
    if (!uid || typeof disabled !== 'boolean') {
      throw new HttpsError('invalid-argument', 'A user ID and disabled state are required.');
    }
    await getAuth().updateUser(uid, { disabled });
    return { success: true };
  },
);

export const adminSendReleaseEmail = onCall(
  {
    region: 'asia-south1',
    secrets: [ADMIN_EMAILS, RESEND_API_KEY, NOTIFICATION_EMAIL_FROM],
  },
  async (request) => {
    assertAdmin(request);
    const title = typeof request.data?.title === 'string' ? request.data.title.trim() : '';
    const message = typeof request.data?.message === 'string' ? request.data.message.trim() : '';
    if (!title || !message || title.length > 160 || message.length > 2000) {
      throw new HttpsError('invalid-argument', 'A valid title and message are required.');
    }

    const recipients = (await listAllUsers())
      .filter((user) => Boolean(user.email) && !user.disabled)
      .map((user) => user.email as string);
    if (recipients.length === 0) {
      logger.info('Release email skipped because no registered users have email addresses.');
      return { recipientCount: 0, sentCount: 0, failedCount: 0 };
    }

    const apiKey = RESEND_API_KEY.value();
    const from = NOTIFICATION_EMAIL_FROM.value();
    if (!apiKey || !from) throw new HttpsError('failed-precondition', 'Email delivery is not configured.');

    let sentCount = 0;
    let failedCount = 0;
    for (const recipient of recipients) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: `[CrossNotes] ${title}`,
          text: `${title}\n\n${message}\n\nYou are receiving this because you have a registered CrossNotes account.`,
        }),
      });
      if (response.ok) sentCount += 1;
      else {
        failedCount += 1;
        logger.warn('Release email failed for recipient.', { recipient, status: response.status });
      }
    }
    return { recipientCount: recipients.length, sentCount, failedCount };
  },
);
