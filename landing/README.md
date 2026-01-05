# NewsDigest Landing Page

Landing page to validate demand and collect email signups.

## Quick Deploy Options

### Option 1: Vercel (Recommended - 5 minutes)

**Fastest way to get live:**

1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. From `/landing` directory: `vercel`
4. Done! Your landing page is live

**To collect emails:**
- Use Google Sheets integration (see below)
- Or use form services like Tally, Typeform, Google Forms

### Option 2: Netlify (5 minutes)

1. Create account at [netlify.com](https://netlify.com)
2. Drag & drop the `/landing` folder
3. Done!

### Option 3: GitHub Pages (Free, 5 minutes)

1. Create new repo: `newsdigest-landing`
2. Upload `index.html` to root
3. Enable GitHub Pages in Settings → Pages
4. Live at: `https://username.github.io/newsdigest-landing`

## Email Collection Setup

### Quick Setup: Google Forms (No code!)

**Easiest option - 2 minutes:**

1. Create a Google Form at [forms.google.com](https://forms.google.com)
2. Add one question: "Email Address" (short answer)
3. Get the form link
4. In `index.html`, update the form action:

```html
<form action="YOUR_GOOGLE_FORM_LINK" method="GET" target="_blank">
  <input type="email" name="entry.YOUR_ENTRY_ID" required>
  <button type="submit">Começar Grátis</button>
</form>
```

**Pro tip:** Use a form embed service like [Tally.so](https://tally.so) for better UX.

### Advanced Setup: Google Sheets API

**For serverless email collection:**

1. **Create Google Sheet:**
   - Create new sheet: "NewsDigest Signups"
   - Columns: Email | Source | Timestamp

2. **Create Service Account:**
   ```bash
   # Go to Google Cloud Console
   # Create project → Enable Sheets API
   # Create Service Account → Download JSON key
   ```

3. **Share Sheet:**
   - Share your sheet with the service account email
   - Give it Editor permissions

4. **Deploy to Vercel:**
   ```bash
   cd landing
   npm init -y
   npm install googleapis
   vercel
   ```

5. **Set Environment Variables in Vercel:**
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
   GOOGLE_SHEET_ID=1abc...xyz
   ```

6. **Update index.html** to call your API:
   ```javascript
   fetch('/api/signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, source: 'hero' })
   });
   ```

### Alternative: Airtable (No coding needed!)

1. Create free [Airtable](https://airtable.com) account
2. Create base: "NewsDigest Signups"
3. Get API key from [airtable.com/account](https://airtable.com/account)
4. Use their form embed or API

## Customization

### Update Content

Edit `index.html`:
- Line 48: Change hero title
- Line 138: Update features
- Line 249: Modify pricing
- Line 336: Adjust FAQ

### Change Colors

Update CSS variables at line 12:
```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Add Analytics

Add before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Next Steps After Launch

### Week 1: Validate Demand
- [ ] Share in 5 Portuguese Facebook groups
- [ ] Post on Reddit r/portugal and r/nba
- [ ] Tweet about it with #PortugalNews #NBA
- [ ] Message Portuguese influencers/bloggers
- [ ] Goal: 100 email signups

### Week 2: Get First Paying Users
- [ ] Email all signups with early access offer
- [ ] Offer 50% lifetime discount to first 50 users
- [ ] Create Stripe payment links
- [ ] Goal: 10 paying beta users ($50-100 revenue)

### Week 3: Build MVP Features
- [ ] Set up user authentication (Supabase/Clerk)
- [ ] Build basic dashboard for preferences
- [ ] Implement Stripe subscriptions
- [ ] Deploy to beta users

### Week 4: Growth
- [ ] Collect testimonials from beta users
- [ ] Create referral program
- [ ] Start content marketing (blog posts)
- [ ] Goal: $500 MRR

## Testing Checklist

Before launching:
- [ ] Test email signup on desktop
- [ ] Test email signup on mobile
- [ ] Check all links work
- [ ] Test in Chrome, Safari, Firefox
- [ ] Spell check all content
- [ ] Add privacy policy link
- [ ] Add terms of service link
- [ ] Set up error tracking (Sentry)

## Marketing Copy Ideas

### Social Media Posts

**Twitter/X:**
```
Tired of doomscrolling for Portuguese news?

Get @NewsDigest - curated headlines from Expresso, Público & Observador + NBA scores, 4x daily to your inbox.

Perfect for Portuguese abroad 🇵🇹

Try free: [LINK]
```

**Reddit r/portugal:**
```
[Projeto] Criei um digest de notícias portuguesas + NBA para a comunidade

Hey pessoal! Sou português no estrangeiro e estava farto de perder tempo a procurar notícias.

Criei o NewsDigest - recebe as melhores notícias do Expresso, Público e Observador + resultados da NBA, 4x por dia no email.

É grátis e open source. Feedback?

[LINK]
```

### Email Outreach Template

```
Subject: Criámos algo para a comunidade portuguesa 🇵🇹

Olá [Name],

Sou o [Your Name] e criei o NewsDigest especialmente para portugueses no estrangeiro (como eu).

O problema: Perder tempo a verificar 5 sites diferentes para estar informado.

A solução: Um email 4x por dia com:
- Melhores notícias de PT (Expresso, Público, Observador)
- Resultados NBA completos
- Desporto português (ZeroZero)

Acha que a vossa comunidade [X] gostaria? Posso oferecer acesso premium grátis.

Abraço,
[Your Name]
```

## Budget Breakdown

### Free Tier (First 100 users):
- Vercel hosting: €0
- Google Forms: €0
- Domain (optional): €10/year
- **Total: €10/year**

### Paid Tier (100-1000 users):
- Vercel Pro: €20/month
- Supabase Pro: €25/month
- Postmark (email): €10/month
- Domain: €10/year
- **Total: ~€55/month**

## Success Metrics

### Week 1:
- 100 email signups
- 20% open rate on welcome email

### Month 1:
- 500 email signups
- 10 paying users ($50-100 revenue)
- <5% churn rate

### Month 3:
- 2000 email signups
- 100 paying users ($500-1000 MRR)
- 2-3 testimonials

### Month 6:
- 5000+ email signups
- 300+ paying users ($2500-3000 MRR)
- Featured in Portuguese media

## Support

Questions? Open an issue or email: your-email@example.com

## License

MIT - Feel free to use this for your own projects!
