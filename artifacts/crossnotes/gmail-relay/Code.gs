/**
 * CrossNotes Gmail Relay
 *
 * Deploy this Apps Script as a web app that executes as support.crossnotes@gmail.com.
 * Store RELAY_SECRET and ALLOWED_RECIPIENT in Script Properties before deployment.
 */

const MAX_SUBJECT_LENGTH = 180;
const MAX_BODY_LENGTH = 10000;

function doGet() {
  return jsonResponse({ ok: true, service: 'crossnotes-gmail-relay' });
}

function doPost(event) {
  try {
    const payload = JSON.parse(event && event.postData && event.postData.contents || '{}');
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = String(properties.getProperty('RELAY_SECRET') || '');
    const allowedRecipient = String(properties.getProperty('ALLOWED_RECIPIENT') || '').trim().toLowerCase();
    const suppliedSecret = String(payload.secret || '');
    const recipient = String(payload.to || '').trim().toLowerCase();
    const subject = String(payload.subject || '').trim();
    const text = String(payload.text || '').trim();

    if (!expectedSecret || !allowedRecipient) {
      throw new Error('Relay configuration is incomplete.');
    }
    if (!safeEquals(suppliedSecret, expectedSecret)) {
      return jsonResponse({ ok: false, error: 'Unauthorized relay request.' });
    }
    if (recipient !== allowedRecipient) {
      return jsonResponse({ ok: false, error: 'Recipient is not permitted.' });
    }
    if (!subject || !text || subject.length > MAX_SUBJECT_LENGTH || text.length > MAX_BODY_LENGTH) {
      return jsonResponse({ ok: false, error: 'Invalid email payload.' });
    }
    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse({ ok: false, error: 'Gmail relay daily quota is exhausted.' });
    }

    const messageId = MailApp.sendEmail({
      to: recipient,
      subject,
      body: text,
      name: 'CrossNotes Support',
      replyTo: 'support.crossnotes@gmail.com',
    });

    return jsonResponse({ ok: true, messageId: String(messageId || '') });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: 'Gmail relay delivery failed.' });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeEquals(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
