# CrossNotes Feedback Notifications

`notifyFeedbackSubmitted` runs when a new document is created in Firestore's `feedback` collection. It attempts an Instagram direct message first and falls back to email if Instagram delivery is unavailable or rejected.

> The function deliberately does **not** accept, store, or use an Instagram password. It uses the official server-side Instagram Messaging API and Firebase-managed secrets.

## Before deployment

1. Configure `@crossnotes.fr` as an Instagram professional account in a Meta developer app.
2. Give the Meta app the `instagram_business_manage_messages` permission and configure the `messages` webhook.
3. Send a first message from the exact target account at `https://www.instagram.com/caesar.anwar/` to `@crossnotes.fr`. Meta only permits automated responses within its allowed conversation window, and the webhook supplies the required Instagram-scoped recipient ID.
4. Create a Resend account and verify the email sender domain used by `NOTIFICATION_EMAIL_FROM`.
5. Install the Firebase CLI and log in with an account that can deploy to `crossnotes-6767`.

## Configure secrets

Run each command from the repository root. Enter values interactively; do not commit them to the repository.

```bash
firebase functions:secrets:set META_INSTAGRAM_ACCESS_TOKEN
firebase functions:secrets:set META_INSTAGRAM_ACCOUNT_ID
firebase functions:secrets:set META_RECIPIENT_IGSID
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set NOTIFICATION_EMAIL_TO
firebase functions:secrets:set NOTIFICATION_EMAIL_FROM
```

Use `functions/.env.example` as the field reference. `META_RECIPIENT_IGSID` is **not** the Instagram username; it is the Instagram-scoped ID received through the official Meta messaging webhook after the recipient starts a conversation.

## Deploy

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:notifyFeedbackSubmitted
```

## Delivery behavior

| Outcome | Firestore notification state |
|---|---|
| Instagram message sent | `instagram` |
| Instagram unavailable; email sent | `email_fallback` |
| Both channels fail | `failed` |

The function writes that state to the created feedback document under `notification`. It does not rerun for later status or note updates.
