# CrossNotes Gmail Relay

This Google Apps Script relay lets the Vercel feedback-alert endpoint send message alerts through `support.crossnotes@gmail.com` without a paid Firebase Function or an email-provider domain.

## Secure setup

Create a standalone Google Apps Script project while signed in as `support.crossnotes@gmail.com`, replace its default file with `Code.gs`, and set these **Script Properties** before deployment:

| Property | Value |
| --- | --- |
| `RELAY_SECRET` | A long random value known only to the Vercel production environment and this script. |
| `ALLOWED_RECIPIENT` | `caesar.anwarr91@gmail.com` |

Deploy the script through **Deploy → New deployment → Web app**. Configure it to execute as **Me** and grant access only at the minimum level that allows the Vercel server to invoke the endpoint. The script never belongs in frontend code, and its URL or secret must not be embedded in the client application.

Copy the `/exec` web-app URL into the Vercel environment variable `GMAIL_RELAY_URL`, and copy the identical random value into `GMAIL_RELAY_SECRET`. The Vercel endpoint sends only to the fixed `ALLOWED_RECIPIENT`; the relay rejects all other recipients.

## Authorization

The first deployment will request permission to send email through the Gmail account. This is expected: the relay uses Apps Script `MailApp` to send the feedback notification. Review the authorization prompt before allowing it. The Google account’s documented consumer quota is 100 email recipients per day; check the Google Apps Script quota documentation if usage rises.

## Behavior

The relay validates a shared secret, allows only the designated recipient, enforces modest subject/body limits, checks remaining Gmail quota, and returns a JSON result to Vercel. The Vercel endpoint records `notification.delivery = "email"` in the related Firestore feedback record only after the relay accepts the send.
