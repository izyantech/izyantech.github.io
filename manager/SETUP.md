# Izyan Tech Manager — Setup guide

App link: **https://izyantech.github.io/manager/**
(Ye link website pe kahin nahi dikhta. Sirf tumhare liye hai.)

Website `/site/` pe hai aur Manager `/manager/` pe. Dono ka scope alag hai, isliye dono alag apps ki tarah install hote hain.

## 1) Phone pe app lagao (2 minute)

1. Phone pe upar wala link kholo.
2. Apna naam aur 4 ya 6 digit ka PIN set karo.
3. **More → Business details & UPI** mein UPI ID, address aur email bhar do. Invoice pe QR isi UPI ID se banta hai.
4. Install karo:
   - **Android (Chrome):** ⋮ menu → **Install app / Add to Home screen**
   - **iPhone (Safari):** Share → **Add to Home Screen**

Iske baad app bina Sheet ke bhi poora chalta hai. Data phone mein save rehta hai.

## 2) Google Sheet sync (laptop pe aasaan, 15 minute, ek baar)

1. **sheets.google.com** pe nayi blank sheet banao. Naam: **Izyan Tech Manager**. Kisi ke saath share mat karna.
2. Sheet mein **Extensions → Apps Script** kholo. Wahan ka code hata do, phir is repo ki `manager/apps-script/Code.gs` ka poora code paste karke **Save (💾)** dabao.
3. Function list mein **`setupSheet`** chuno aur **Run ▶** dabao.
   - Google permission maangega: **Review permissions → apna account → Advanced → Go to project (unsafe) → Allow**.
   - Ye warning isliye aati hai kyunki script tumhari apni hai aur Google ne use verify nahi kiya. Ye normal hai.
   - Sheet mein ye tabs apne aap ban jaayenge: Clients, Orders, Payments, Invoices, Settings.
4. **Secret key set karo:** ⚙️ **Project Settings → Script properties → Add script property**
   - Property: `SECRET_KEY`
   - Value: kam se kam 20 character ka lamba random password (apna banao).
   - **Save** dabao. Ye key kahin safe likh lo, WhatsApp ya screenshot mein mat bhejna.
5. **Deploy → New deployment →** ⚙️ **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** dabao, phir jo **Web app URL** mile (`/exec` pe khatam hota hai) use copy karo.
6. App mein **More → Google Sheet sync** kholo, URL aur secret key daalo, aur **Save & sync** dabao.
7. Laptop ya doosre phone pe bhi app kholo, wahan bhi apna PIN banao, aur yahi URL + key daalo. Saara data aa jaayega.

> "Anyone" ka matlab ye nahi ki koi bhi data dekh sakta hai. Har request mein secret key check hoti hai, aur galat key wali request reject ho jaati hai.

**Code.gs badla ho toh:** Apps Script mein naya code paste karo, phir **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. URL wahi rahega.

## Roz ka kaam

- **Naya order:** neeche **＋ New** → client → package (Digital Shop + Billing chunoge toh combo ₹1,000 off apne aap lagega) → Full ya EMI → Save.
- **EMI (0% interest):** advance chahe toh daalo (0 = poora EMI), 1 se 14 mahine. Kishtein agle mahine ki **1 tarikh** se shuru hoti hain. Aakhri kisht round-off adjust kar leti hai.
- **Payment mila:** order kholo → **₹ Payment add karo**. Payment sabse purani baaki kisht mein pehle judta hai. Save ke baad **Receipt bhejo** dabao.
- **Invoice:** order → **🧾 Invoice PDF**. Phone pe seedha WhatsApp share khulta hai. Laptop pe PDF download hota hai aur WhatsApp chat khulti hai, wahan PDF attach kar do.
- **Har mahine 1 tarikh:** Home pe "Reminders" list mein har client ke saamne **Remind** dabao. Message pehle se likha hota hai, WhatsApp mein bas **Send** karna hai. Bheje hue reminders pe "Sent" dikhta hai.
- **Support:** order ko **Live** karoge toh 1 saal free support ki date apne aap lagti hai. Khatam hone se 30 din pehle Home pe renewal reminder aata hai.
- **Backup:** More → Backup file (Sheet sync ke alawa ek extra safety).

## Dhyan rakhne wali baatein

- WhatsApp message apne aap nahi jaata. Har message pe ek baar **Send** dabana padta hai. Auto-send ke liye Meta ka paid WhatsApp Business API chahiye.
- PIN bhool gaye toh: browser mein is site ka data clear karke dobara setup karo, aur Sheet sync se data wapas aa jaayega. Isliye Sheet sync zaroor lagao.
