declare const process: { env: Record<string, string | undefined> };

type FeedbackKind = 'idea' | 'bug' | 'encouragement';

type AlertFeedback = {
  id?: unknown;
  kind?: unknown;
  message?: unknown;
  userName?: unknown;
  createdAt?: unknown;
};

const MAX_MESSAGE_LENGTH = 600;
const REQUEST_FRESHNESS_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const recentRequests = new Map<string, { startedAt: number; count: number }>();

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isFeedbackKind(value: unknown): value is FeedbackKind {
  return value === 'idea' || value === 'bug' || value === 'encouragement';
}

function allowedOrigin(request: { headers: Record<string, string | string[] | undefined> }): string | null {
  const configuredOrigin = readText(process.env.ALERT_ALLOWED_ORIGIN);
  const origin = readText(request.headers.origin);
  const forwardedHost = readText(request.headers['x-forwarded-host']);
  const host = forwardedHost || readText(request.headers.host);

  if (configuredOrigin) return origin === configuredOrigin ? configuredOrigin : null;
  if (host && origin === `https://${host}`) return origin;
  if (host?.startsWith('localhost') && origin === `http://${host}`) return origin;
  return null;
}

function requestIp(request: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = readText(request.headers['x-forwarded-for']);
  if (forwarded) return forwarded.split(',')[0].trim();
  return readText(request.headers['x-real-ip']) || 'unknown';
}

function withinRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = recentRequests.get(ip);
  const activeWindow = current && now - current.startedAt < RATE_LIMIT_WINDOW_MS;
  const count = activeWindow ? current.count : 0;
  if (count >= RATE_LIMIT_MAX_REQUESTS) return false;

  recentRequests.set(ip, { startedAt: activeWindow ? current.startedAt : now, count: count + 1 });
  return true;
}

function validFeedback(value: AlertFeedback): value is Required<Pick<AlertFeedback, 'kind' | 'message' | 'createdAt'>> & AlertFeedback {
  const message = readText(value.message);
  const submittedAt = new Date(readText(value.createdAt)).getTime();
  return isFeedbackKind(value.kind)
    && message.length > 0
    && message.length <= MAX_MESSAGE_LENGTH
    && Number.isFinite(submittedAt)
    && Math.abs(Date.now() - submittedAt) <= REQUEST_FRESHNESS_MS;
}

function alertText(feedback: AlertFeedback): string {
  const kind = isFeedbackKind(feedback.kind) ? feedback.kind : 'feedback';
  const sender = readText(feedback.userName) || 'A CrossNotes learner';
  const message = readText(feedback.message).slice(0, MAX_MESSAGE_LENGTH);
  return `New CrossNotes ${kind} feedback from ${sender}:\n\n${message}\n\nReview it in the CrossNotes Feedback Desk.`;
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const origin = allowedOrigin(request);
  if (!origin) {
    response.status(403).json({ error: 'This request origin is not allowed.' });
    return;
  }
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');

  const feedback = request.body?.feedback as AlertFeedback | undefined;
  if (!feedback || !validFeedback(feedback)) {
    response.status(400).json({ error: 'A recent, valid feedback item is required.' });
    return;
  }
  if (!withinRateLimit(requestIp(request))) {
    response.status(429).json({ error: 'Too many feedback alerts requested. Please try again shortly.' });
    return;
  }

  const relayUrl = readText(process.env.GMAIL_RELAY_URL);
  const relaySecret = readText(process.env.GMAIL_RELAY_SECRET);
  const emailTo = readText(process.env.NOTIFICATION_EMAIL_TO);
  if (!relayUrl || !relaySecret || !emailTo) {
    console.error('CrossNotes Gmail relay settings are incomplete.');
    response.status(503).json({ error: 'Feedback was saved, but alerts are temporarily unavailable.' });
    return;
  }

  try {
    const relayResponse = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: relaySecret,
        to: emailTo,
        subject: `New CrossNotes ${feedback.kind} feedback`,
        text: alertText(feedback),
      }),
    });
    const relayRawBody = await relayResponse.text();
    let relayBody: { messageId?: string; error?: string } = {};
    try {
      relayBody = JSON.parse(relayRawBody) as { messageId?: string; error?: string };
    } catch {
      // Preserve a generic HTTP error if the relay cannot return a structured response.
    }

    if (!relayResponse.ok || relayBody.error) {
      throw new Error(relayBody.error || `Gmail relay returned HTTP ${relayResponse.status}.`);
    }

    response.status(202).json({ status: 'accepted', delivery: 'email' });
  } catch (error) {
    console.error('CrossNotes feedback email alert failed.', error);
    response.status(502).json({ error: 'Feedback was saved, but the email alert could not be delivered.' });
  }
}
