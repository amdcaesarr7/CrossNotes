# Verified constraints for no-cost feedback alerts

## Firebase

Firebase’s official Cloud Functions guide states that functions can be emulated in any Firebase project but require the Blaze pricing plan for deployment. The official pricing-plan documentation likewise lists Cloud Functions access under Blaze and confirms that Spark projects cannot make new deployments of Cloud Functions.

Implication for CrossNotes: the existing Firestore-triggered Instagram-first/email-fallback function cannot be deployed while `crossnotes-6767` remains on Spark. The app’s existing Firestore feedback flow can remain on its present free quota.

Sources:

1. Firebase, “Get started: write, test, and deploy your first functions” — https://firebase.google.com/docs/functions/get-started
2. Firebase, “Firebase pricing plans” — https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

## Vercel Hobby

Vercel’s official Hobby-plan documentation lists 1,000,000 function invocations and 4 active CPU hours per month at no cost for personal, non-commercial projects. Its email guidance confirms that a Vercel Function can send email through a provider HTTP API; it advises retaining credentials on the server, awaiting each send, and rate-limiting public endpoints. A Vercel Function can be invoked synchronously by the CrossNotes feedback form, which makes an immediate email alert technically feasible without Firebase Functions.

Vercel’s free cron option is not suitable for near-real-time fallback polling: it is limited to one execution per day and can be late by up to 59 minutes.

Implication for CrossNotes: a Vercel API endpoint can provide immediate email notification at submission time if the deployment qualifies as a personal/non-commercial Hobby project, but it cannot provide a reliable automated Instagram notification without a Meta access token, an eligible IGSID, and the platform messaging window. It must include origin/authentication validation and rate limiting to prevent abuse.

Sources:

3. Vercel, “Vercel Hobby Plan” — https://vercel.com/docs/plans/hobby
4. Vercel, “Sending Emails from an application on Vercel” — https://vercel.com/kb/guide/sending-emails-from-an-application-on-vercel
5. Vercel, “Usage & Pricing for Cron Jobs” — https://vercel.com/docs/cron-jobs/usage-and-pricing

## Transactional email providers

For an immediate Vercel-based email endpoint, several providers offer zero-cost allowances:

| Provider | Free allowance | Important limitation |
| --- | --- | --- |
| Resend | 3,000 emails/month, 100/day | Requires API key and a verified sender/domain for professional delivery. |
| Brevo | 300 emails/day | Adds a “Sent with Brevo” badge on the free plan. Its free plan does not include Instagram DMs. |
| MailerSend | 500 emails/month, 100/day | Account approval and one verified sending domain are required. |

Implication for CrossNotes: **Resend plus a protected Vercel endpoint** is the simplest no-cost email route for expected low feedback volume. Brevo is a viable choice if the higher daily allowance matters more than unbranded presentation.

Sources:

6. Resend, “Pricing” — https://resend.com/pricing
7. Brevo, “FAQs - What are the limits of the Free plan?” — https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
8. MailerSend, “Plans, features and limits” — https://www.mailersend.com/help/plans-features-and-limits

## Instagram messaging

Meta’s official Instagram Messaging documentation confirms that an Instagram user must initiate a conversation with the professional account before the app can send a message, and the app has only 24 hours to respond. The recipient identifier is an Instagram-scoped ID supplied through an incoming messaging webhook; a public handle cannot be substituted. The official webhook documentation confirms that messaging events are delivered to a public HTTP endpoint, and that apps must meet permission/access and publishing requirements for full webhook coverage.

Implication for CrossNotes: no free or paid service can lawfully guarantee an Instagram DM for every feedback submission. A no-cost Vercel HTTPS endpoint can host Meta’s verification and inbound-message webhook, capture the eligible recipient IGSID, and send a DM only when the recipient has messaged `@crossnotes.fr` within Meta’s permitted 24-hour response window. Email must remain the reliable primary/fallback notification channel.

Sources:

9. Meta for Developers, “Send Messages” — https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api
10. Meta for Developers, “Webhooks for Instagram Messaging” — https://developers.facebook.com/documentation/business-messaging/instagram-messaging/webhooks
11. Vercel, “Setting Up Webhooks” — https://vercel.com/docs/webhooks

## Gmail through Google Apps Script

Google Apps Script web apps can expose a `doPost` HTTP endpoint and execute as the script owner. Its MailApp service can send email without accessing the Gmail inbox. Google documents a daily quota of 100 recipient emails for consumer Gmail accounts and 1,500 for Google Workspace accounts.

Implication for CrossNotes: the existing `support.crossnotes@gmail.com` account could serve as the sender through a protected Apps Script relay, avoiding an external email provider. However, its public web-app endpoint must be protected with a high-entropy shared secret and request validation; it has fewer delivery diagnostics and lower operational robustness than a dedicated transactional provider. Do not invoke it directly from public browser code because the shared secret would be exposed.

Sources:

12. Google, “Web Apps” — https://developers.google.com/apps-script/guides/web
13. Google, “Quotas for Google Services” — https://developers.google.com/apps-script/guides/services/quotas
14. Google, “Class MailApp” — https://developers.google.com/apps-script/reference/mail/mail-app
