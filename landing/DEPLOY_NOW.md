# 🚀 Deploy Your Landing Page in 5 Minutes

## The Absolute Fastest Way (2 minutes)

### Option 1: Netlify Drop (No account needed!)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `index.html` file
3. **Done!** You get a live URL instantly
4. Example: `https://newsdigest-abc123.netlify.app`

**To collect emails:**
- Emails will log to browser console (temporary)
- Add a proper backend later (see below)

---

## The Best Way for MVP (5 minutes)

### Use Tally.so (Free form builder)

**Why Tally?**
- ✅ Free forever
- ✅ No coding needed
- ✅ Beautiful forms
- ✅ Exports to Google Sheets/Notion
- ✅ Email notifications

**Setup:**

1. Go to [tally.so](https://tally.so) and sign up
2. Create new form with one field: "Email"
3. Customize design to match landing page
4. Get embed code

5. **Replace forms in `index.html`** with Tally iframe:

```html
<!-- Replace the signup form at line 128 with: -->
<iframe
  data-tally-src="https://tally.so/embed/YOUR-FORM-ID?alignLeft=1&hideTitle=1&transparentBackground=1"
  width="100%"
  height="300"
  frameborder="0"
  marginheight="0"
  marginwidth="0"
  title="NewsDigest Signup">
</iframe>
```

6. Deploy to Netlify (drag & drop)

**That's it!** Emails go to your Tally dashboard.

---

## The Professional Way (10 minutes)

### Vercel + Google Sheets

**Prerequisites:**
- Google account
- 10 minutes

**Steps:**

### 1. Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new sheet: "NewsDigest Signups"
3. Add headers: `Email` | `Source` | `Timestamp`
4. Note the Sheet ID from URL: `docs.google.com/spreadsheets/d/**[THIS-PART]**/edit`

### 2. Create Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "NewsDigest"
3. Enable Google Sheets API:
   - Click "Enable APIs and Services"
   - Search "Google Sheets API"
   - Click "Enable"

4. Create Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: "newsdigest-emailcollector"
   - Click "Create and Continue"
   - Skip permissions (click "Continue")
   - Click "Done"

5. Create Key:
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON
   - **Save this file!** You'll need it

6. Share Sheet:
   - Open your Google Sheet
   - Click "Share"
   - Paste the service account email (from JSON: `client_email`)
   - Give "Editor" permissions
   - Click "Share"

### 3. Deploy to Vercel

```bash
# From NewsDigest/landing directory
npm install googleapis

# Deploy
npx vercel

# Set environment variables in Vercel dashboard:
# 1. Go to your project → Settings → Environment Variables
# 2. Add these three variables:

GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_SHEET_ID=1abc...xyz

# Redeploy
npx vercel --prod
```

### 4. Update index.html

Replace the form submit handler (line 400) with:

```javascript
async function handleSubmit(e, formId, successId) {
  e.preventDefault();

  const form = document.getElementById(formId);
  const email = form.querySelector('input[type="email"]').value;
  const successMessage = document.getElementById(successId);

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: formId })
    });

    if (response.ok) {
      successMessage.classList.add('show');
      form.reset();
      setTimeout(() => successMessage.classList.remove('show'), 5000);
    } else {
      alert('Erro ao registrar. Tente novamente.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Erro ao registrar. Tente novamente.');
  }
}
```

**Done!** Emails now save to your Google Sheet automatically.

---

## Quick Comparison

| Method | Time | Cost | Best For |
|--------|------|------|----------|
| Netlify Drop | 2 min | Free | Testing design |
| Tally.so | 5 min | Free | MVP validation |
| Vercel + Sheets | 10 min | Free | Production |
| Custom Backend | 1 hour+ | $10+/mo | Scale (1000+ users) |

---

## After You Deploy

### Step 1: Share it! (Day 1)

**Portuguese Communities:**
- Reddit: r/portugal, r/portugueses
- Facebook: "Portugueses pelo Mundo", "Portuguese Expats"
- LinkedIn: Portuguese professional groups
- Twitter/X: Use hashtags #Portugal #PortugalNews

**NBA Communities:**
- Reddit: r/nba, r/fantasybball
- Twitter: NBA fans, especially Lakers/Celtics/Warriors
- Discord: NBA servers

**Template message:**
```
🇵🇹 + 🏀 Criei algo para quem quer estar informado sem perder tempo

NewsDigest: Notícias de Portugal + NBA scores, 4x/dia no email

✓ Expresso, Público, Observador
✓ Resultados NBA completos
✓ Grátis para sempre

[YOUR LINK]

Feedback?
```

### Step 2: Get first 10 signups (Day 1-2)

- Message friends & family
- Post in WhatsApp groups
- Share on LinkedIn
- Ask for feedback (people love giving opinions)

**Goal:** 10 signups in 48 hours

### Step 3: Get first paying customer (Week 1)

Once you have 10+ signups:

1. Email them: "Would you pay €5/month for premium features?"
2. List features: custom schedule, more sources, mobile app
3. Offer 50% lifetime discount: "First 50 users get €99 lifetime instead of €9/month"
4. Create Stripe payment link: [stripe.com/payments/payment-links](https://stripe.com/payments/payment-links)
5. Send link to interested users

**Goal:** 1 paying customer in first week = You have a business!

### Step 4: Build MVP (Week 2-3)

Only build premium features AFTER someone pays:

- User authentication
- Preference dashboard
- Custom scheduling
- Source selection

**Don't build before validating!**

---

## Troubleshooting

### "Form submissions don't work"

**Using Tally.so:** Check embed code is correct

**Using API:**
```bash
# Test your API endpoint
curl -X POST https://your-site.vercel.app/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Should return: {"success":true}
```

### "Google Sheets integration fails"

1. Check service account has access to sheet
2. Verify `GOOGLE_PRIVATE_KEY` has `\n` replaced with actual newlines
3. Make sure Sheet ID is correct
4. Check Vercel logs: `vercel logs`

### "Site looks broken on mobile"

- Clear browser cache
- Test in incognito mode
- Check console for errors (F12)

---

## Cost Calculator

### Free Tier (0-100 users):
- Hosting: Free (Vercel/Netlify)
- Email collection: Free (Tally/Google Sheets)
- Domain: €10/year (optional)
- **Total: €0-10/year**

### Growth (100-1000 users):
- Hosting: Free (still!)
- Database: €0-25/month (Supabase free tier → paid)
- Email sending: €10/month (Postmark)
- Domain: €10/year
- **Total: €10-35/month**

### Scale (1000-10000 users):
- Hosting: €20/month (Vercel Pro)
- Database: €25/month (Supabase Pro)
- Email sending: €50/month (Postmark)
- Domain: €10/year
- **Total: €95/month**

**Revenue at 1000 paying users × €9/month = €9000/month**
**Profit = €8,905/month 💰**

---

## Next Steps

1. ✅ Deploy landing page (you are here)
2. ⏭️ Get 10 signups
3. ⏭️ Get 1 paying customer
4. ⏭️ Build MVP features
5. ⏭️ Scale to €1000 MRR

**Questions?** Open an issue on GitHub or email: your-email@example.com

Good luck! 🚀
