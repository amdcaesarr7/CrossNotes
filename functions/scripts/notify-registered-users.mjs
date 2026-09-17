import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const maxRecipients = 100;
const title = process.env.RELEASE_TITLE?.trim() || 'CrossNotes has a new update';
const message = process.env.RELEASE_MESSAGE?.trim() || 'CrossNotes was updated. Come see what is new!';
const relayUrl = process.env.GMAIL_RELAY_URL?.trim();
const relaySecret = process.env.GMAIL_RELAY_SECRET?.trim();
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

if (!relayUrl || !relaySecret || !serviceAccountJson) {
  throw new Error('Required notification secrets are not configured.');
}

const app = getApps()[0] ?? initializeApp({
  credential: cert(JSON.parse(serviceAccountJson)),
});
const auth = getAuth(app);

async function listUsers() {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

async function sendEmail(recipient) {
  const response = await fetch(relayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: relaySecret,
      to: recipient,
      subject: `[CrossNotes] ${title}`,
      text: `${title}\n\n${message}\n\nYou are receiving this because you have a registered CrossNotes account.`,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok !== true) throw new Error('Gmail relay rejected the message.');
}

const recipients = (await listUsers())
  .filter((user) => user.email && !user.disabled)
  .map((user) => user.email)
  .slice(0, maxRecipients);

if (recipients.length === 0) {
  console.log('No registered users with email addresses; no email sent.');
  process.exit(0);
}

let sent = 0;
let failed = 0;
for (const recipient of recipients) {
  try {
    await sendEmail(recipient);
    sent += 1;
  } catch (error) {
    failed += 1;
    console.error(`Delivery failed for ${recipient}:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

console.log(`Release email result: sent ${sent} of ${recipients.length}; failed ${failed}.`);
if (failed > 0) process.exitCode = 1;
