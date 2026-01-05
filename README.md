# News Digest

Automated news digest that scrapes headlines from Portuguese and international news sources and delivers them to your inbox 4 times a day.

## Sources

- **Expresso** (Portugal) - https://expresso.pt
- **Público** (Portugal) - https://www.publico.pt
- **Observador** (Portugal) - https://observador.pt
- **ZeroZero** (Sports) - https://www.zerozero.pt
- **The Guardian** (International) - https://www.theguardian.com

Each article includes a preview/summary when available for better context.

## Schedule

The digest runs automatically via GitHub Actions at:

| Time (Portugal) | Description |
|-----------------|-------------|
| 7:00 AM | Morning digest |
| 12:00 PM | Midday digest |
| 6:00 PM | Evening digest |
| 10:00 PM | Night digest |

## Features

- **Multi-source aggregation**: Scrapes headlines from 5 news sources
- **Article previews**: Includes summaries/excerpts when available for better context
- **Top Headlines section**: Priority-ranked articles from all sources
- **NBA scores**: Morning digest includes yesterday's NBA games with player stats
- **Portuguese player spotlight**: Tracks Neemias Queta's performance
- **Priority algorithm**: Articles ranked by position, headline size, and metadata
- **HTML & plain text**: Beautiful HTML emails with plain text fallback

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/news-digest.git
cd news-digest
npm install
```

### 2. Configure email (Gmail)

To use Gmail as your SMTP provider, you need to create an **App Password**:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** (under 2-Step Verification)
4. Create a new app password for "Mail"
5. Copy the 16-character password

### 3. Set up environment variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
RECIPIENT_EMAIL=joalves05@gmail.com
```

### 4. Configure GitHub Secrets

For the automated workflow, add these secrets to your GitHub repository:

Go to **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `RECIPIENT_EMAIL` | `joalves05@gmail.com` |

### 5. Test locally

```bash
npm run build
npm start
```

## Development

```bash
npm run dev    # Run with ts-node (no build required)
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## Project Structure

```
news-digest/
├── src/
│   ├── scrapers/
│   │   ├── expresso.ts    # Expresso scraper
│   │   ├── publico.ts     # Público scraper
│   │   ├── observador.ts  # Observador scraper
│   │   ├── zerozero.ts    # ZeroZero scraper
│   │   ├── guardian.ts    # The Guardian scraper
│   │   ├── nba.ts         # NBA scores (morning digest)
│   │   └── index.ts       # Scraper exports
│   ├── email.ts           # Email sending + HTML template
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Text sanitization & priority
│   └── index.ts           # Main entry point
├── .github/
│   └── workflows/
│       └── digest.yml     # GitHub Actions workflow
├── package.json
├── tsconfig.json
└── README.md
```

## Manual Trigger

You can manually trigger the digest from GitHub:

1. Go to **Actions** tab
2. Select **News Digest** workflow
3. Click **Run workflow**

## Troubleshooting

### Email not sending

- Verify your Gmail App Password is correct
- Ensure 2-Step Verification is enabled on your Google account
- Check that less secure app access is not required (App Passwords bypass this)

### Scraper returning no articles

- Some websites may block automated requests
- Check if the website structure has changed
- Try running locally to see detailed error messages

### GitHub Actions not running

- Ensure the workflow file is in `.github/workflows/`
- Check that the repository has Actions enabled
- Verify secrets are correctly configured

## License

MIT
