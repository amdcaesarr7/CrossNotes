import { FieldValue } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { defineSecret } from 'firebase-functions/params';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

initializeApp();

const META_INSTAGRAM_ACCESS_TOKEN = defineSecret('META_INSTAGRAM_ACCESS_TOKEN');
const META_INSTAGRAM_ACCOUNT_ID = defineSecret('META_INSTAGRAM_ACCOUNT_ID');
const META_RECIPIENT_IGSID = defineSecret('META_RECIPIENT_IGSID');
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const NOTIFICATION_EMAIL_TO = defineSecret('NOTIFICATION_EMAIL_TO');
const NOTIFICATION_EMAIL_FROM = defineSecret('NOTIFICATION_EMAIL_FROM');

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
