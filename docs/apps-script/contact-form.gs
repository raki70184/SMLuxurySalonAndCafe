/**
 * SM Luxe Salon: "Schedule Your Visit" form handler (Google Apps Script).
 *
 * The website's contact form (src/components/ContactForm/ContactForm.tsx) POSTs
 * multipart form data here: name, phone, email, schedule, message, page.
 *
 * What it does on every submission:
 *   1. Appends a row to the bound Google Sheet (same as before; columns are
 *      matched by header name, so the existing sheet keeps working).
 *   2. Emails the salon (SALON_EMAIL) with the visit request.  ← was missing
 *   3. Emails the customer a confirmation with how to change the booking.
 *   4. Returns JSON with CORS-friendly ContentService output.
 *
 * Lead source columns (sent by src/lib/tracking.ts): source, gclid, gbraid,
 * wbraid, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
 * landing_page, referrer, first_seen. Missing headers are added to the sheet
 * automatically, so old rows keep their columns and new ones gain these.
 *
 * Install: open the existing script (Extensions → Apps Script from the sheet,
 * or script.google.com), replace its code with this file, Save, then
 * Deploy → Manage deployments → ✏️ edit the EXISTING deployment → Version:
 * "New version" → Deploy. Editing the existing deployment keeps the /exec URL
 * the website already uses. Approve the "send email as you" permission prompt.
 */

var SALON_EMAIL = 'smluxesalon@gmail.com';
var SALON_NAME = 'SM Luxe Salon';
var SALON_PHONE = '+91 93472 38248';
var SALON_WHATSAPP = 'https://wa.me/919347238248';
var SALON_INSTAGRAM = 'https://instagram.com/sm.luxe_';
var SALON_WEBSITE = 'https://smluxesalon.com';
var SALON_HOURS = 'Open all days, 11:00 AM – 9:00 PM';
var SALON_ADDRESS = 'Jain Balaji BigTown Mall, Shop No 304, 3rd Floor, Safilguda, Malkajgiri, Hyderabad 500047';
var SHEET_NAME = '';
var BASE_HEADERS = ['Date', 'name', 'phone', 'email', 'schedule', 'message', 'page', 'source'];
var SOURCE_FIELDS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_term', 'utm_content', 'landing_page', 'referrer', 'first_seen']; // '' = first sheet of the bound spreadsheet

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var p = (e && e.parameter) || {};
    var data = {
      name: clean(p.name, 100),
      phone: clean(p.phone, 20),
      email: clean(p.email, 200),
      schedule: clean(p.schedule, 60),
      message: clean(p.message, 2000),
      page: clean(p.page, 500),
      source: clean(p.source, 200) || 'Direct / organic',
    };
    SOURCE_FIELDS.forEach(function (k) { data[k] = clean(p[k], 300); });

    appendRow(data, p);

    // Salon notification: reply-to is the customer so "Reply" reaches them.
    MailApp.sendEmail({
      to: SALON_EMAIL,
      replyTo: isEmail(data.email) ? data.email : SALON_EMAIL,
      name: SALON_NAME + ' Website',
      subject: (/^Google Ads/.test(data.source) ? '[Google Ads] ' : '') +
        'New visit request: ' + (data.name || 'Website visitor') +
        (data.schedule ? ' for ' + data.schedule : ''),
      htmlBody: salonEmailHtml(data),
    });

    // Customer confirmation.
    if (isEmail(data.email)) {
      MailApp.sendEmail({
        to: data.email,
        replyTo: SALON_EMAIL,
        name: SALON_NAME,
        subject: 'We received your visit request at ' + SALON_NAME,
        htmlBody: customerEmailHtml(data),
      });
    }

    return json({ result: 'success' });
  } catch (err) {
    console.error(err);
    return json({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function appendRow(data, raw) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return; // standalone script with no sheet: email-only
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  var lastCol = sheet.getLastColumn();
  var headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  if (!headers.length || headers.every(function (h) { return !h; })) headers = [];
  var have = headers.map(function (h) { return String(h).trim().toLowerCase(); });
  BASE_HEADERS.concat(SOURCE_FIELDS).forEach(function (h) {
    if (have.indexOf(h.toLowerCase()) === -1) { headers.push(h); have.push(h.toLowerCase()); }
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var row = headers.map(function (h) {
    var key = String(h).trim();
    var lower = key.toLowerCase();
    if (lower === 'date' || lower === 'timestamp') return new Date();
    if (data.hasOwnProperty(lower)) return data[lower];
    return raw[key] !== undefined ? raw[key] : '';
  });
  sheet.appendRow(row);
}

function salonEmailHtml(d) {
  var rows = [
    ['Name', d.name], ['Phone', d.phone], ['Email', d.email],
    ['Preferred date', d.schedule || 'Not chosen'], ['Comment', d.message || '—'],
    ['Came from', d.source],
  ].concat(d.utm_campaign ? [['Campaign', d.utm_campaign]] : [])
   .concat(d.utm_term ? [['Search keyword', d.utm_term]] : [])
   .concat(d.landing_page ? [['Landing page', d.landing_page]] : []).map(function (r) {
    return '<tr><td style="padding:6px 12px;color:#666">' + r[0] +
      '</td><td style="padding:6px 12px"><b>' + esc(r[1]) + '</b></td></tr>';
  }).join('');
  var phoneDigits = String(d.phone || '').replace(/\D/g, '');
  var wa = phoneDigits.length === 10 ? 'https://wa.me/91' + phoneDigits : '';
  return '<div style="font-family:Arial,sans-serif;font-size:14px">' +
    '<p>New <b>Schedule Your Visit</b> request from the website.</p>' +
    '<table style="border-collapse:collapse">' + rows + '</table>' +
    '<p>Please call or WhatsApp the customer to confirm the slot.' +
    (wa ? ' <a href="' + wa + '">WhatsApp ' + esc(d.name || 'customer') + '</a>' : '') +
    '</p><p style="color:#999;font-size:12px">Sent from ' + esc(d.page || SALON_WEBSITE) + '</p></div>';
}

function customerEmailHtml(d) {
  var first = String(d.name || '').split(/\s+/)[0];
  return '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">' +
    '<p>Hi ' + esc(first || 'there') + ',</p>' +
    '<p>Thank you for choosing <b>' + SALON_NAME + '</b>. We have received your visit request' +
    (d.schedule ? ' for <b>' + esc(d.schedule) + '</b>' : '') + '.</p>' +
    '<p>Our team will call or WhatsApp you on <b>' + esc(d.phone) +
    '</b> shortly to confirm your time slot.</p>' +
    '<p><b>Need to change the date, time or service?</b> Reach us any way you like:</p>' +
    '<ul>' +
    '<li>Call: <a href="tel:+919347238248">' + SALON_PHONE + '</a></li>' +
    '<li>WhatsApp: <a href="' + SALON_WHATSAPP + '">message us on WhatsApp</a></li>' +
    '<li>Instagram DM: <a href="' + SALON_INSTAGRAM + '">@sm.luxe_</a></li>' +
    '<li>Live chat on our website: <a href="' + SALON_WEBSITE + '">smluxesalon.com</a></li>' +
    '<li>Or simply reply to this email.</li>' +
    '</ul>' +
    '<p>' + SALON_HOURS + '<br>' + SALON_ADDRESS + '</p>' +
    '<p>See you soon!<br>Team ' + SALON_NAME + '</p></div>';
}

function clean(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ''); }
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
