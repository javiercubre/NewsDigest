# Quick Start - Deploy in 10 Minutes ⏱️

Follow these 5 simple steps to get your landing page live with email collection.

---

## ✅ Prerequisites (2 minutes)

Make sure you have:
- [ ] Google account (Gmail)
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)

If you don't have Node.js: Download from https://nodejs.org

---

## 📋 Step 1: Install Dependencies (1 minute)

```bash
cd landing
npm install
```

You should see:
```
✓ googleapis installed
✓ Package installed successfully
```

---

## 📊 Step 2: Create Google Sheet (2 minutes)

### A. Create the sheet

1. Go to https://sheets.google.com
2. Click **"+ Blank"**
3. Rename to: **"NewsDigest Signups"**
4. Add headers in row 1:
   - A1: `Email`
   - B1: `Source`
   - C1: `Timestamp`

### B. Get your Sheet ID

Look at the URL:
```
https://docs.google.com/spreadsheets/d/[COPY_THIS_LONG_STRING]/edit
```

Example:
```
https://docs.google.com/spreadsheets/d/1abc123XYZ-def456GHI_jkl789MNO/edit
                                    ↑_________________________↑
                                          This is your ID
```

**Save this ID somewhere!** You'll need it later.

---

## 🔑 Step 3: Create Service Account (5 minutes)

### A. Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click project dropdown (top) → **"New Project"**
3. Name: `NewsDigest` → **Create**
4. Wait 10 seconds, then select your project

### B. Enable Google Sheets API

1. Click **☰** menu → **APIs & Services** → **Library**
2. Search: `Google Sheets API`
3. Click **Enable**

### C. Create Service Account

1. Click **☰** → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Name: `newsdigest-emailcollector` → **Create and Continue**
4. Skip permissions → **Continue** → **Done**

### D. Create Key

1. Click on your service account (in the list)
2. **Keys** tab → **Add Key** → **Create new key**
3. Choose **JSON** → **Create**
4. A file downloads → **Save it securely!**

### E. Extract Credentials

```bash
# From the landing directory
node extract-credentials.js ~/Downloads/newsdigest-service-account-*.json
```

This will display the three values you need. **Keep this terminal open!**

### F. Share Sheet with Service Account

1. Open the service account JSON file
2. Find and copy the `client_email` (looks like: `newsdigest-emailcollector@...`)
3. Go back to your Google Sheet
4. Click **Share** button
5. Paste the service account email
6. Set role: **Editor**
7. **Uncheck** "Notify people"
8. Click **Share**

---

## 🚀 Step 4: Deploy to Vercel (2 minutes)

### A. Install Vercel CLI

```bash
npm install -g vercel
```

### B. Deploy

```bash
vercel
```

Answer the prompts:
```
? Set up and deploy? [Y/n] Y
? Which scope? [Your account]
? Link to existing project? [y/N] N
? What's your project's name? newsdigest-landing
? In which directory is your code? ./
? Want to modify settings? [y/N] N
```

Wait for deployment... You'll get a URL like:
```
✅ Preview: https://newsdigest-landing-abc123.vercel.app
```

### C. Set Environment Variables

1. Go to https://vercel.com/dashboard
2. Click your project: **newsdigest-landing**
3. **Settings** → **Environment Variables**

Add these three variables (use values from your `extract-credentials.js` output):

**Variable 1:**
- Key: `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- Value: `newsdigest-emailcollector@newsdigest-123456.iam.gserviceaccount.com`
- Environment: ✓ Production ✓ Preview ✓ Development
- **Save**

**Variable 2:**
- Key: `GOOGLE_PRIVATE_KEY`
- Value: `-----BEGIN PRIVATE KEY-----\nMII...` (entire key from script output)
- Environment: ✓ Production ✓ Preview ✓ Development
- **Save**

**Variable 3:**
- Key: `GOOGLE_SHEET_ID`
- Value: Your Sheet ID from Step 2
- Environment: ✓ Production ✓ Preview ✓ Development
- **Save**

### D. Deploy to Production

```bash
vercel --prod
```

You'll get your production URL:
```
✅ Production: https://newsdigest-landing.vercel.app
```

---

## 🧪 Step 5: Test It! (1 minute)

1. **Visit your site:**
   ```
   https://newsdigest-landing.vercel.app
   ```

2. **Enter your email** in the signup form

3. **Click "Começar Grátis"**

4. **You should see:**
   ```
   ✓ Obrigado! Vai receber o primeiro digest em breve.
   ```

5. **Check your Google Sheet:**
   - Refresh the page
   - You should see your email in row 2!

---

## 🎉 Success!

If you see your email in the Google Sheet, **congratulations!** You're live!

### What's next?

1. **Share your link:**
   - Social media
   - Friends and family
   - Portuguese communities

2. **Monitor signups:**
   - Check your Google Sheet
   - Watch for new emails

3. **Get to 10 signups:**
   - Then ask if they'd pay
   - Get your first customer!

---

## ❌ Troubleshooting

### "Failed to save email"

**Check Vercel logs:**
```bash
vercel logs
```

**Common fixes:**

1. **Sheet not shared:**
   - Go to your Google Sheet → Share
   - Make sure service account email has Editor access

2. **Wrong private key format:**
   - Must include `\n` characters
   - Copy exactly from extract-credentials.js output

3. **Wrong Sheet ID:**
   - Double-check the ID from your sheet URL
   - No extra spaces or characters

### "Cannot find module 'googleapis'"

```bash
cd landing
npm install googleapis
vercel --prod
```

### Form doesn't submit

1. Open browser console (Right-click → Inspect → Console)
2. Try submitting again
3. Look for error messages
4. Most likely: Wrong API endpoint

**Fix:** Make sure you deployed to production:
```bash
vercel --prod
```

---

## 📞 Need Help?

1. **Re-read this guide** - Most issues are in steps 3E-3F
2. **Check GOOGLE_SHEETS_SETUP.md** - Detailed guide
3. **Run extract-credentials.js** - Validates your setup
4. **Check Vercel logs** - `vercel logs`
5. **Open an issue** - https://github.com/javiercubre/NewsDigest/issues

---

## ⏱️ Time Tracker

- [ ] Step 1: Install dependencies (1 min)
- [ ] Step 2: Create Google Sheet (2 min)
- [ ] Step 3: Create Service Account (5 min)
- [ ] Step 4: Deploy to Vercel (2 min)
- [ ] Step 5: Test (1 min)

**Total: ~10 minutes** ⏱️

---

## 🔐 Security Checklist

- [ ] Service account JSON file is NOT in Git
- [ ] Service account JSON file is backed up securely
- [ ] Google Sheet is only shared with service account
- [ ] Environment variables are set in Vercel (not in code)
- [ ] `.gitignore` includes `*.json` and `.env`

---

Good luck! 🚀

**First goal:** Get 10 email signups this week!
