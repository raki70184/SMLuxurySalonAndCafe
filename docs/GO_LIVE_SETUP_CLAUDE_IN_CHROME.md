# Go-live setup: contact-form emails + conversion tracking

Paste the prompt below into **Claude in Chrome** (the browser extension), with
Chrome signed in to the Google account that owns the contact-form Apps Script,
GA4 and Google Ads, and to Netlify. Run the parts in order. Part A must be done
before Part B. Part D is done a day later, once the site has had real visits.

Steps Claude must leave to you (it will stop and ask):
- Google's **"Review permissions → Allow"** screen when the script first sends
  email (granting OAuth access is always yours to click).
- Any sign-in, password or 2-step code.

---

## Prompt to paste into Claude in Chrome

```text
You are helping me take the SM Luxe Salon website changes live. Do the parts in
order, show me a short report after each part, and stop for me whenever Google
or Netlify asks for a sign-in, a password, a code, or a permissions/consent
screen. Do not change anything not listed here.

PART A: Update the contact-form Google Apps Script (turns on emails)
1. Open https://script.google.com/home and find the project whose web-app
   deployment URL contains:
   AKfycbwMSPa8M4nAcsJiYEI_TguIDAcvGZfMulBH01E-1FEBZo9i47ziV8p5R69uqUM_2_j7
   (check each likely project via Deploy → Manage deployments). If it is
   bound to a Google Sheet, note the sheet's name for me.
2. Before changing anything, copy the CURRENT code into a new file in the same
   project called backup_<today's date>.gs, so we can roll back.
   Then rename any function doPost in that backup to doPost_backup, so there
   are not two doPost functions.
3. Open this raw file in a new tab:
   https://raw.githubusercontent.com/raki70184/SMLuxurySalonAndCafe/main/docs/apps-script/contact-form.gs
   Select all (Cmd+A) and copy (Cmd+C). In the Apps Script editor open the
   main code file (usually Code.gs), select all, and paste (Cmd+V). Do not type
   the code by hand: the editor auto-inserts brackets and would corrupt it.
   Save (Cmd+S). Confirm there are no red errors.
4. Deploy → Manage deployments → click the pencil (edit) on the EXISTING
   web-app deployment → Version: "New version" → Description
   "Email salon + customer, lead source" → Deploy.
   Do NOT create a new deployment: the website uses the existing URL.
   "Execute as" must stay "Me", "Who has access" must stay "Anyone".
5. If Google shows "Authorization required / Review permissions", STOP and let
   me click Allow myself. Tell me when you're waiting.
6. Report: project name, which sheet it writes to, the deployment's version
   number, and that the /exec URL is unchanged.

PART B: Publish the website on Netlify
1. Open https://app.netlify.com and open the site for smluxesalon.com.
2. Go to Deploys. The newest production deploy from branch main (commit
   message starts "SM Luxe site: daily 11-9 hours…") should be "Ready".
   If it is still building, wait and re-check. If it failed, show me the
   error and stop.
3. Auto-publishing is locked on this site, so open that deploy and click
   "Publish deploy". Confirm it now shows as Published.
4. Do NOT unlock auto-publishing or change any other setting.

PART C: Check the live site
1. Open https://smluxesalon.com/contact?utm_source=claude_check&utm_medium=test&utm_campaign=golive_check
2. Confirm the Contact page and the footer both say:
   "All days … 11:00 AM - 9:00 PM" (and nothing says 10:00 AM).
3. Ask me before submitting the form. When I say yes, fill it with:
   Name "Rakesh Test", Phone <ask me>, Email <ask me>,
   a date two days from today, Comment "Go-live test, please ignore".
   Click "Schedule Your Visit". Confirm the green "Thank you, Rakesh!" message
   shows and lists Call / WhatsApp / Instagram DM / Live chat / Email.
4. Open Gmail for smluxesalon@gmail.com (if I'm signed in to it in this
   browser) and confirm an email "New visit request: Rakesh Test …" arrived with
   a "Came from: claude_check / test / golive_check" row. Open the Google Sheet
   from Part A and confirm a new row with source columns filled.
5. Report anything that did not match.

PART D: GA4 key events + Google Ads conversions (do this a day after Part C)
1. Open https://analytics.google.com, property with Measurement ID
   G-TFRP5FTFV7 (SM Luxe Salon). Reports → Realtime: confirm it shows visits.
2. Admin → Data display → Events. For each of generate_lead, click_to_call,
   whatsapp_click: turn on "Mark as key event". If an event isn't listed yet,
   tell me (it appears after its first real hit) and skip it.
3. Admin → Product links → Google Ads links: tell me whether the SM Luxe Google
   Ads account is linked. If it is NOT linked, stop and ask me before linking.
4. Open https://ads.google.com for the SM Luxe account.
   Admin → Account settings → Auto-tagging: tell me if it's on. If off, ask me
   before turning it on.
   Goals → Conversions → Summary → "+ New conversion action" → Import →
   Google Analytics 4 properties → Web → select generate_lead, click_to_call,
   whatsapp_click → Import and continue → Done.
   Do not change bids, budgets, or campaign settings.
5. Report the three conversion actions and their status
   (it's normal for them to show "Inactive / no recent conversions" for a day).

PART E: Google Business Profile hours
1. Open https://business.google.com (or search "SM Luxe Salon" while signed in
   and use "Edit profile"). Hours → set Monday–Sunday 11:00 AM – 9:00 PM.
   Show me the change before saving, then save when I say yes.
```

---

## Rollback

- **Emails/script broken:** Apps Script → Deploy → Manage deployments → edit
  the existing deployment → pick the previous version → Deploy. The website keeps
  working (it posts to the same URL).
- **Site broken:** Netlify → Deploys → open the previous published deploy →
  "Publish deploy".
