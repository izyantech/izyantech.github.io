# Izyan Tech Manager — Setup guide

App link: **https://izyantech.github.io/manager/**
(This link is not shown anywhere on the website. It is for your use only.)

The website lives at `/site/` and the Manager at `/manager/`. Each has its own scope, so they install as two separate apps.

## 1) Install the app on your phone (2 minutes)

1. Open the link above on your phone.
2. Enter your name and set a 4 or 6 digit PIN.
3. Go to **More → Business details & UPI** and fill in your UPI ID, address and email. The payment QR on invoices uses this UPI ID.
4. Install it:
   - **Android (Chrome):** ⋮ menu → **Install app / Add to Home screen**
   - **iPhone (Safari):** Share → **Add to Home Screen**

The app works fully without the Sheet. Data is saved on the device.

## 2) Google Sheet sync (easiest on a laptop, 15 minutes, one time)

1. Create a new blank sheet at **sheets.google.com** named **Izyan Tech Manager**. Do not share it with anyone.
2. In the sheet, open **Extensions → Apps Script**. Delete the code there, paste the full code from `manager/apps-script/Code.gs` and click **Save (💾)**.
3. Pick **`setupSheet`** in the function list and click **Run ▶**.
   - Google will ask for permission: **Review permissions → your account → Advanced → Go to project (unsafe) → Allow**.
   - The warning appears because the script is your own and has not been verified by Google. This is normal.
   - The tabs Clients, Orders, Payments, Invoices and Settings are created automatically.
4. **Set the secret key:** ⚙️ **Project Settings → Script properties → Add script property**
   - Property: `SECRET_KEY`
   - Value: a long random password of at least 20 characters (make your own).
   - Click **Save**. Keep this key somewhere safe; do not send it on WhatsApp or in a screenshot.
5. **Deploy → New deployment →** ⚙️ **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (it ends with `/exec`).
6. In the app, open **More → Google Sheet sync**, paste the URL and the secret key, and tap **Save & sync**.
7. On your laptop or another phone, open the app, set a PIN there too, and enter the same URL and key. All data will come across.

> "Anyone" does not mean anyone can see your data. Every request is checked against the secret key, and requests with a wrong key are rejected.

**If Code.gs changes later:** paste the new code into Apps Script, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same.

## Day to day

- **New order:** tap **＋ New** → client → package (choosing a Digital Shop and a Billing App applies the ₹1,000 combo discount automatically) → Full payment or EMI → Save.
- **EMI (0% interest):** add an advance if you want (0 = full amount on EMI), 1 to 14 months. Instalments start on the **1st** of the next month. The last instalment absorbs any rounding difference.
- **Payment received:** open the order → **₹ Add payment**. Payments are applied to the oldest unpaid instalment first. After saving, tap **Send receipt**.
- **Invoice:** order → **🧾 Invoice PDF**. On a phone the WhatsApp share sheet opens directly. On a laptop the PDF downloads and the WhatsApp chat opens so you can attach it.
- **On the 1st of every month:** tap **Remind** next to each client in the Home "Reminders" list. The message is pre-written; just press **Send** in WhatsApp. Reminders you have sent are marked "Sent".
- **Support:** marking an order **Live** sets one year of free support automatically. A renewal reminder appears on Home 30 days before it ends.
- **Backup:** More → Backup file (an extra safety copy on top of Sheet sync).

## Good to know

- WhatsApp messages are not sent automatically. You press **Send** once for each message. Automatic sending needs Meta's paid WhatsApp Business API.
- If you forget your PIN: clear this site's data in the browser and set the app up again. Your data comes back through Sheet sync, which is why connecting the Sheet is important.
