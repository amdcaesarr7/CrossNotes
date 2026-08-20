# No-Cost Alert Options for CrossNotes Feedback

## Decision summary

The existing feedback form, real-time Firestore sync, admin desk, and analytics can remain exactly as they are on Firebase’s no-cost Spark plan. The blocked component is only the Firestore-triggered notification function: Firebase permits local emulation on any plan, but requires the Blaze plan to deploy Cloud Functions.[1] The practical no-cost replacement is to move **submission-time notification delivery** to the already Vercel-hosted CrossNotes app, while keeping Firestore as the feedback system of record.

> **Important Instagram constraint:** An automated Instagram alert cannot be guaranteed for every feedback item on any plan. Meta requires the recipient to message `@crossnotes.fr` first, exposes the recipient’s IGSID only through the inbound webhook, and permits the app to respond for 24 hours after that message.[2] This is a platform rule, not a Firebase limitation.

| Option | What it delivers | Ongoing cost | Main conditions | Fit for CrossNotes |
| --- | --- | ---: | --- | --- |
| **A. Vercel endpoint + Resend Free** | Immediate email for every valid feedback submission; Instagram only if Meta’s 24-hour eligibility exists | $0 within free allowances | Resend key, a verified sender, Vercel server-side environment variables, request validation and rate limit | **Best overall** |
| **B. Vercel endpoint + Apps Script/Gmail relay** | Immediate email from `support.crossnotes@gmail.com`; optional Meta DM under the same 24-hour rule | $0 within Gmail quota | Protected Apps Script endpoint; service account owner authorization; server-side secret | **Best if you want the existing Gmail address** |
| **C. Vercel endpoint + Brevo Free** | Immediate email, with a higher daily free limit | $0 within free allowance | Brevo API key and sender verification; branded free-plan messages | Good alternative if volume grows |
| **D. Email-only immediate notification** | Reliable email, no automatic Instagram dependency | $0 | Choose A, B, or C | **Safest simple route** |
| **E. Vercel daily poll** | A daily digest only | $0 | Cannot be real-time; Hobby cron runs at most once/day | Not recommended for alerts |
| **F. Wait for Firebase upgrade** | Original Firestore-triggered DM-first design | Not no-cost plan; usage may remain within free quotas after upgrade | Billing account and secrets | Defer until affordable |

## Option A — Vercel endpoint with Resend Free

CrossNotes can add a protected Vercel serverless endpoint, for example `/api/feedback-alert`. The existing feedback submit flow would call this endpoint **after** successfully writing the feedback record to Firestore. The server—not the browser—would hold the Resend API key, format the alert, and send it to `caesar.anwarr91@gmail.com`. The endpoint would reject unauthenticated or malformed requests and rate-limit submissions to prevent quota abuse.

Vercel’s Hobby tier currently includes one million function invocations and four active CPU hours per month for personal, non-commercial projects.[3] Vercel explicitly recommends email providers’ HTTP APIs rather than SMTP in serverless functions, and says provider credentials must remain server-side.[4] Resend’s Free plan currently allows 3,000 emails per month, capped at 100 per day.[5]

This route can also host the Meta webhook at `/api/instagram-webhook`. If `@caesar.anwar` messages `@crossnotes.fr`, the webhook can record the IGSID and allow a DM attempt only while Meta’s response window remains open. If there is no eligible conversation—or Meta rejects the message—the endpoint sends email instead. This preserves the user’s DM-first preference where Meta permits it, without promising a delivery Meta forbids.[2]

| Strengths | Limitations |
| --- | --- |
| Immediate alert, good delivery diagnostics, clean HTTP architecture | Requires a Resend account, API key, and verified sender identity |
| No Firebase billing upgrade | Cannot ensure Instagram delivery outside Meta’s 24-hour window |
| Uses the existing Vercel deployment path | Vercel Hobby is intended for personal/non-commercial use |

## Option B — Vercel endpoint with the existing Gmail account

A Google Apps Script web app can receive a server-to-server request from the Vercel endpoint and send email through `MailApp` as `support.crossnotes@gmail.com`. Google documents that a web app can process POST requests through `doPost`, and Apps Script can execute as the deployer.[6] A consumer Gmail account may send up to 100 recipient emails per day through Apps Script; a Workspace account has a substantially higher documented quota.[7]

This is the only no-cost route that naturally sends from the existing Gmail account without buying or verifying a custom email domain. The weak point is operational: the Apps Script URL cannot safely be called from browser code, since that would expose its shared secret. The Vercel endpoint must be the only caller, and it must authenticate each request. Apps Script also offers less provider-side delivery visibility than a transactional-email service.

| Strengths | Limitations |
| --- | --- |
| Uses `support.crossnotes@gmail.com` directly | Requires an additional relay and careful shared-secret handling |
| No separate email-provider subscription | Fewer delivery logs and lower resilience than a transactional provider |
| Sufficient for a small feedback volume | Same Meta eligibility limitation for Instagram |

## Option C — Vercel endpoint with Brevo Free

Brevo’s no-cost plan allows 300 email sends per day but places a Brevo badge on messages, and it does not include Instagram DMs.[8] It is useful if feedback volume could exceed Resend’s 100-email daily cap and the branding is acceptable. It still uses exactly the same Vercel endpoint design and still requires a server-side API key and sender validation.

## What should not be used

A browser-only solution is not safe: it would disclose the email or Meta credential to every visitor. A Vercel Hobby cron job is also unsuitable for feedback alerts, because it can run only once daily and has imprecise timing on the free plan.[9] Finally, no solution should scrape Instagram or automate the Instagram website with a password; the official Meta API is the appropriate path and still imposes the conversation window.[2]

## Recommendation

Choose **Option A: Vercel endpoint + Resend Free**, with **email as the guaranteed alert channel** and **Instagram as a conditional second channel** when an eligible `@crossnotes.fr` conversation exists. It is the cleanest architecture, works at feedback-submission time, preserves your existing app, and avoids Firebase billing.

If using the `support.crossnotes@gmail.com` sender is more important than email-provider diagnostics, choose **Option B** instead. I would not recommend polling, browser-based credentials, or treating Instagram as the primary guaranteed alert channel.

## Required next inputs

The implementation can be completed after you choose **A** or **B**. For A, create a free Resend account, verify an approved sender, and securely add the generated API key to Vercel’s production environment settings. For B, authorize a Google Apps Script web app under `support.crossnotes@gmail.com`; its deployed endpoint will be protected behind a server-held secret. In both cases, the Meta token and webhook configuration can be added later to enable conditional Instagram delivery.

## References

[1]: https://firebase.google.com/docs/functions/get-started "Firebase — Get started: write, test, and deploy your first functions"
[2]: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api "Meta for Developers — Send Messages"
[3]: https://vercel.com/docs/plans/hobby "Vercel — Hobby Plan"
[4]: https://vercel.com/kb/guide/sending-emails-from-an-application-on-vercel "Vercel — Sending Emails from an application on Vercel"
[5]: https://resend.com/pricing "Resend — Pricing"
[6]: https://developers.google.com/apps-script/guides/web "Google — Apps Script Web Apps"
[7]: https://developers.google.com/apps-script/guides/services/quotas "Google — Apps Script quotas"
[8]: https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan "Brevo — Free plan limits"
[9]: https://vercel.com/docs/cron-jobs/usage-and-pricing "Vercel — Cron Jobs usage and pricing"
