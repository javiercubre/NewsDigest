# Google Sheets Setup Guide - Step by Step

Follow these steps exactly to set up email collection with Google Sheets.

## Part 1: Create Google Sheet (2 minutes)

1. **Go to Google Sheets:**
   - Open https://sheets.google.com
   - Click "+ Blank" to create new sheet

2. **Name your sheet:**
   - Click "Untitled spreadsheet"
   - Rename to: `NewsDigest Signups`

3. **Add headers:**
   - In cell A1, type: `Email`
   - In cell B1, type: `Source`
   - In cell C1, type: `Timestamp`

4. **Get your Sheet ID:**
   - Look at the URL: `https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit`
   - Copy the long string between `/d/` and `/edit`
   - Example: `1abc123XYZ...` (about 44 characters)
   - **Save this somewhere!** You'll need it later.

---

## Part 2: Create Google Service Account (5 minutes)

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console:**
   - Open https://console.cloud.google.com
   - Sign in with your Google account

2. **Create new project:**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: `NewsDigest`
   - Click "Create"
   - Wait for the project to be created (usually 10-30 seconds)

3. **Select your project:**
   - Click the project dropdown again
   - Select "NewsDigest"

### Step 2: Enable Google Sheets API

1. **Open API Library:**
   - Click "≡" menu (top left)
   - Hover over "APIs & Services"
   - Click "Library"

2. **Find Google Sheets API:**
   - In the search box, type: `Google Sheets API`
   - Click on "Google Sheets API"

3. **Enable the API:**
   - Click the blue "Enable" button
   - Wait for it to enable (about 5 seconds)

### Step 3: Create Service Account

1. **Go to Service Accounts:**
   - Click "≡" menu
   - Hover over "APIs & Services"
   - Click "Credentials"

2. **Create Service Account:**
   - Click "+ Create Credentials" at the top
   - Select "Service Account"

3. **Fill in details:**
   - Service account name: `newsdigest-emailcollector`
   - Service account ID: (auto-filled)
   - Click "Create and Continue"

4. **Skip permissions:**
   - Don't select any role
   - Click "Continue"

5. **Skip user access:**
   - Leave empty
   - Click "Done"

### Step 4: Create Service Account Key

1. **Find your service account:**
   - You should see it in the list
   - Click on the service account email (looks like: newsdigest-emailcollector@...)

2. **Create key:**
   - Click "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON"
   - Click "Create"

3. **Download key:**
   - A JSON file will download automatically
   - **IMPORTANT:** Save this file securely!
   - Name it something like: `newsdigest-service-account.json`

---

## Part 3: Share Sheet with Service Account (1 minute)

1. **Open your service account JSON file:**
   - Find the file you just downloaded
   - Open it with a text editor
   - Find the `"client_email"` field
   - Copy the email address (looks like: newsdigest-emailcollector@newsdigest-123456.iam.gserviceaccount.com)

2. **Go back to your Google Sheet:**
   - Open your "NewsDigest Signups" sheet

3. **Share the sheet:**
   - Click the "Share" button (top right)
   - Paste the service account email
   - Make sure role is set to "Editor"
   - **Uncheck** "Notify people" (it's a bot, not a person)
   - Click "Share"

---

## Part 4: Extract Values for Vercel (2 minutes)

You need three values from your service account JSON file:

### 1. GOOGLE_SERVICE_ACCOUNT_EMAIL

Open your JSON file and find:
```json
{
  "client_email": "newsdigest-emailcollector@newsdigest-123456.iam.gserviceaccount.com"
}
```

Copy the email address.

### 2. GOOGLE_PRIVATE_KEY

Find this in your JSON file:
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
}
```

**IMPORTANT:** Copy the ENTIRE value including the quotes.
It should look like:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh...(many characters)...\n-----END PRIVATE KEY-----\n
```

**Note:** The `\n` characters are important! Don't remove them.

### 3. GOOGLE_SHEET_ID

This is the ID you copied from your Google Sheet URL in Part 1.
Example: `1abc123XYZ-def456GHI_jkl789MNO`

---

## Part 5: Deploy to Vercel (3 minutes)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy

```bash
cd landing
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- What's your project's name? **newsdigest-landing**
- In which directory is your code? **./  (just press Enter)**
- Want to modify settings? **N**

Wait for deployment to complete (usually 30-60 seconds).

You'll get a URL like: `https://newsdigest-landing-abc123.vercel.app`

### Set Environment Variables

1. **Go to Vercel Dashboard:**
   - Open https://vercel.com/dashboard
   - Click on your project: `newsdigest-landing`

2. **Go to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in the left menu

3. **Add first variable:**
   - Key: `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - Value: (paste your service account email)
   - Environments: Check all three (Production, Preview, Development)
   - Click "Save"

4. **Add second variable:**
   - Key: `GOOGLE_PRIVATE_KEY`
   - Value: (paste your entire private key)
   - Environments: Check all three
   - Click "Save"

5. **Add third variable:**
   - Key: `GOOGLE_SHEET_ID`
   - Value: (paste your sheet ID)
   - Environments: Check all three
   - Click "Save"

### Redeploy

```bash
vercel --prod
```

Wait for deployment (30-60 seconds).

---

## Part 6: Test It! (1 minute)

1. **Visit your site:**
   - Go to your production URL: `https://newsdigest-landing.vercel.app`

2. **Submit a test email:**
   - Enter your email in the form
   - Click "Começar Grátis"
   - You should see: "✓ Obrigado! Vai receber o primeiro digest em breve."

3. **Check your Google Sheet:**
   - Refresh your sheet
   - You should see a new row with:
     - Your email
     - Source: "signup-form"
     - Timestamp

4. **If it worked:**
   - 🎉 Congratulations! You're live!
   - Share your URL and start collecting emails

5. **If it didn't work:**
   - Check the Vercel logs: `vercel logs`
   - Common issues:
     - Private key format (make sure `\n` are included)
     - Sheet not shared with service account
     - Wrong Sheet ID

---

## Troubleshooting

### Error: "Failed to save email"

**Check Vercel logs:**
```bash
vercel logs --follow
```

**Common causes:**

1. **Sheet not shared:**
   - Go to your Google Sheet
   - Check if service account email has access
   - Make sure it's "Editor" not "Viewer"

2. **Wrong Sheet ID:**
   - Double-check the Sheet ID
   - It should be 44 characters
   - No spaces or extra characters

3. **Private key format:**
   - The private key MUST include `\n` characters
   - Copy it exactly as it appears in the JSON
   - Don't remove the quotes when copying

### Error: "Cannot find module 'googleapis'"

```bash
cd landing
npm install googleapis
vercel --prod
```

### Form doesn't submit

**Check browser console:**
- Right-click → Inspect
- Go to Console tab
- Try submitting the form
- Look for errors

**Most likely cause:** API endpoint not found

**Solution:** Make sure you deployed with:
```bash
vercel --prod
```

Not just `vercel` (which deploys to preview).

---

## Security Notes

### Keep your service account JSON file safe!

- ❌ Never commit it to Git
- ❌ Never share it publicly
- ❌ Never upload it to your website
- ✅ Store it securely on your computer
- ✅ Back it up somewhere safe

### If you accidentally expose your key:

1. Go to Google Cloud Console
2. Go to Service Accounts
3. Delete the old key
4. Create a new key
5. Update Vercel environment variables
6. Redeploy

---

## What's Next?

### You're now collecting emails! 🎉

**Next steps:**

1. **Share your landing page:**
   - Post on social media
   - Share in communities
   - Tell friends and family

2. **Monitor signups:**
   - Check your Google Sheet daily
   - Watch for trends

3. **Follow up with signups:**
   - Send a welcome email
   - Ask for feedback
   - Offer early access deals

4. **When you hit 10 signups:**
   - Email them about premium features
   - Ask if they'd pay €5-10/month
   - Get your first paying customer!

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Google Sheets API:** https://developers.google.com/sheets/api
- **Create an issue:** https://github.com/javiercubre/NewsDigest/issues

Good luck! 🚀
