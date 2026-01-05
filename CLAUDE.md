# CLAUDE.md - AI Assistant Guide for NewsDigest

This document provides comprehensive guidance for AI assistants (like Claude) working on the NewsDigest codebase.

## Project Overview

NewsDigest is an automated news aggregation service that scrapes headlines from multiple Portuguese and international news sources and delivers them via email 3 times daily. The application runs on a scheduled basis via GitHub Actions and sends beautifully formatted HTML email digests.

**Key Features:**
- Multi-source news scraping (Expresso, Público, Observador, ZeroZero, The Guardian)
- NBA scores integration with Player of the Night and Portuguese player (Neemias Queta) tracking
- Article previews/summaries for all sources
- Priority-based article ranking with game score formula for NBA
- Automated email delivery with HTML/text formats
- GitHub Actions scheduling (6 AM, 12 PM, 6 PM Portugal time)
- Landing page for product validation and email signup collection

## Codebase Structure

```
NewsDigest/
├── src/
│   ├── scrapers/
│   │   ├── expresso.ts      # Expresso (PT news) scraper
│   │   ├── publico.ts       # Público (PT news) scraper
│   │   ├── observador.ts    # Observador (PT news) scraper
│   │   ├── zerozero.ts      # ZeroZero (Sports) scraper
│   │   ├── guardian.ts      # The Guardian (International) scraper
│   │   ├── nba.ts           # NBA scores via ESPN API with Player of Night
│   │   └── index.ts         # Scraper exports
│   ├── email.ts             # Email formatting & sending logic
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # Text sanitization & priority calculation
│   └── index.ts             # Main entry point & orchestration
├── landing/                 # Landing page for product validation
│   ├── index.html           # Main landing page (Portuguese)
│   ├── api/signup.js        # Vercel serverless function for signups
│   ├── vercel.json          # Vercel deployment configuration
│   ├── package.json         # Landing page dependencies
│   ├── GOOGLE_SHEETS_SETUP.md   # Guide for Google Sheets integration
│   ├── QUICK_START.md       # Quick deployment guide
│   └── DEPLOY_NOW.md        # Step-by-step deploy instructions
├── .github/
│   └── workflows/
│       └── digest.yml       # GitHub Actions workflow (3x daily schedule)
├── dist/                    # Compiled JavaScript (git-ignored)
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment variable template
└── README.md                # User documentation
```

## Key Technologies & Dependencies

### Runtime Dependencies
- **axios** (^1.6.0) - HTTP client for web scraping and API calls
- **cheerio** (^1.0.0-rc.12) - jQuery-like HTML parsing for web scraping
- **nodemailer** (^6.9.7) - Email sending via SMTP
- **dotenv** (^16.3.1) - Environment variable management

### Development Dependencies
- **TypeScript** (^5.3.0) - Static typing
- **ts-node** (^10.9.2) - Development execution without compilation
- **@types/node**, **@types/nodemailer** - Type definitions

### Build Configuration
- **Target:** ES2020
- **Module:** CommonJS
- **Output:** `dist/` directory
- **Source maps:** Enabled for debugging
- **Strict mode:** Enabled

## Core Concepts & Architecture

### 1. Data Flow

```
GitHub Actions (cron) → index.ts → Scrapers (parallel) → Email Formatter → Nodemailer → Recipient
                                    ↓
                                  NBA API (morning only)
```

### 2. Type System

**Article Interface** (`src/types.ts:1-10`)
```typescript
interface Article {
  title: string;           // Article headline
  url: string;             // Full URL to article
  summary?: string;        // Optional excerpt/description
  category?: string;       // Section/category
  imageUrl?: string;       // Featured image (not currently used)
  priority: number;        // 1-10 importance score
  isHeadline: boolean;     // Was it a main headline?
  source?: string;         // Source name (added for top headlines)
}
```

**SourceDigest Interface** (`src/types.ts:12-18`)
```typescript
interface SourceDigest {
  source: string;          // Display name (e.g., "Expresso")
  sourceUrl: string;       // Homepage URL
  articles: Article[];     // Scraped articles
  scrapedAt: Date;         // Timestamp
  error?: string;          // Error message if scraping failed
}
```

### 3. Priority Calculation Algorithm

Articles are ranked 1-10 based on signals (`src/utils.ts:91-119`):

```typescript
calculatePriority(position, isMainHeadline, hasImage, titleLength, hasSummary)
```

**Scoring factors:**
- **Position:** First article +3, second +2, next 3 +1
- **Main headline (h1/h2):** +2
- **Has image:** +1
- **Title length 40-120 chars:** +1 (optimal length)
- **Has summary:** +1

### 4. Email Generation

Two formats generated (`src/email.ts`):
- **HTML:** Styled template with CSS (inline styles for email compatibility)
- **Plain text:** Fallback for non-HTML email clients

**Email subject format:**
```
📰 {TimeOfDay} ({DD/MM}): {TopHeadline...}
```

**Sections:**
1. Top Headlines (2 per source, sorted by priority, with summaries)
2. NBA Scores (morning digest only):
   - Player of the Night (highest game score across all games)
   - Portuguese Spotlight (Neemias Queta stats when he plays)
   - Game scores with team leaders (PTS, REB, AST, STL, BLK, Game Score)
3. Individual source sections (all articles with previews/summaries)

### 5. NBA Integration Details

The NBA module (`src/scrapers/nba.ts`) provides comprehensive game data:

**Game Score Formula:**
```typescript
GameScore = PTS + 0.4*REB + 0.7*AST + 2*STL + 2*BLK
```

**Player of the Night:** Best performer across all games based on game score

**Featured Player Tracking:** Automatic tracking of Neemias Queta (Portuguese NBA player)

**Team Leaders:** For each game, displays:
- Top scorer, rebounder, assists leader
- Steals and blocks leaders (from box scores)
- Best overall performer (highest game score)

**Data Flow:**
```
ESPN Scoreboard API → Game summaries
ESPN Box Score API → Detailed player stats → Calculate game scores → Find Player of Night
```

## Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Development mode (no compilation)
npm run dev

# Build TypeScript
npm run build

# Run compiled version
npm start

# Full build + run
npm run digest
```

### Testing Changes

1. Create `.env` from `.env.example`
2. Add Gmail App Password (not regular password!)
3. Run `npm run dev` to test locally
4. Check console output for scraping results
5. Verify email delivery

### Testing NBA Scores

NBA scores only appear in morning digest (6 AM UTC). To test:

```bash
FORCE_NBA=true npm run dev
```

Or via GitHub Actions: Manually trigger workflow with `force_nba: true`

### Deployment

**Email Digest (GitHub Actions):**
- Push to main branch
- Workflow runs on schedule (3 times daily: 6 AM, 12 PM, 6 PM Portugal time)
- No manual deployment needed

**Landing Page (Vercel):**
- Located in `/landing` directory
- Deployed separately to Vercel
- Collects email signups via Google Sheets integration
- See `landing/DEPLOY_NOW.md` for setup instructions

## Code Conventions & Patterns

### 1. Error Handling

**Scraper pattern:**
```typescript
export async function scrapeSource(): Promise<SourceDigest> {
  try {
    // Scraping logic
    return { source, sourceUrl, articles, scrapedAt };
  } catch (error) {
    // ALWAYS return SourceDigest with error field, never throw
    return {
      source,
      sourceUrl,
      articles: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Important:** Scrapers must NOT throw exceptions. Return empty articles array with error message.

### 2. Text Sanitization

**ALWAYS sanitize scraped text** (`src/utils.ts:5-71`):

```typescript
import { sanitizeText, escapeHtml } from './utils';

// For scraping (decode HTML entities, normalize)
const title = sanitizeText($element.text());

// For email output (prevent XSS)
html += `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`;
```

**Why:**
- Portuguese news sites use special characters (ç, á, ã, etc.)
- HTML entities need decoding (`&amp;` → `&`)
- Smart quotes/dashes normalized to ASCII
- Prevents email rendering issues

### 3. HTTP Request Headers

**Standard headers for scrapers:**
```typescript
const response = await axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    'Accept-Charset': 'utf-8',
  },
  timeout: 15000,
  responseType: 'text',
  responseEncoding: 'utf8',
});
```

**Rationale:** Some sites block requests without proper User-Agent. Portuguese sites need UTF-8 encoding.

### 4. Duplicate Detection

Always check for duplicate articles:
```typescript
if (!articles.find(a => a.title === title)) {
  articles.push({ title, url, ... });
}
```

### 5. URL Normalization

Handle relative URLs:
```typescript
if (url.startsWith('/')) url = SOURCE_URL + url;
```

### 6. Article Limits

Return maximum 15 articles per source:
```typescript
return {
  source,
  sourceUrl,
  articles: articles.slice(0, 15),
  scrapedAt: new Date(),
};
```

## Scraper Implementation Guide

### Adding a New Scraper

1. **Create new file:** `src/scrapers/newsource.ts`

2. **Use this template:**

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';
import { sanitizeText, calculatePriority } from '../utils';

const SOURCE_URL = 'https://example.com';
const SOURCE_NAME = 'Example News';

export async function scrapeExample(): Promise<SourceDigest> {
  const articles: Article[] = [];

  try {
    const response = await axios.get(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
      responseType: 'text',
      responseEncoding: 'utf8',
    });

    const $ = cheerio.load(response.data);
    let position = 0;

    // Find articles - adjust selectors for target site
    $('article, .article-item').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h2, h3').first();

      let title = sanitizeText($title.text());
      let url = $link.attr('href') || '';

      // Validation
      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = SOURCE_URL + url;

        if (!articles.find(a => a.title === title)) {
          const hasImage = $el.find('img').length > 0;
          const summary = sanitizeText($el.find('.summary, .excerpt').text());

          articles.push({
            title,
            url,
            summary: summary || undefined,
            priority: calculatePriority(position, position < 3, hasImage, title.length, !!summary),
            isHeadline: position < 3,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    return {
      source: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      articles: articles.slice(0, 15),
      scrapedAt: new Date(),
    };
  } catch (error) {
    return {
      source: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      articles: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

3. **Export from index:** `src/scrapers/index.ts`
```typescript
export { scrapeExample } from './example';
```

4. **Add to main orchestration:** `src/index.ts`
```typescript
import { scrapeExample } from './scrapers';

const scrapers = [
  { name: 'Expresso', fn: scrapeExpresso },
  { name: 'Público', fn: scrapePublico },
  { name: 'Observador', fn: scrapeObservador },
  { name: 'ZeroZero', fn: scrapeZeroZero },
  { name: 'The Guardian', fn: scrapeGuardian },
  { name: 'Example News', fn: scrapeExample },  // Add new scraper here
];
```

5. **Add source logo in email.ts:**
```typescript
const SOURCE_LOGOS: Record<string, { url: string; emoji: string }> = {
  // ... existing sources
  'Example News': {
    url: 'https://www.google.com/s2/favicons?domain=example.com&sz=64',
    emoji: '📰',
  },
};
```

### Scraper Debugging Tips

1. **Check selector in browser DevTools:** Right-click headline → Inspect
2. **Test cheerio selectors:** `console.log($('h2').length)` to verify matches
3. **Log raw HTML:** `console.log(response.data.substring(0, 1000))`
4. **Check encoding:** Look for garbled Portuguese characters
5. **Verify timeout:** Some sites are slow, may need `timeout: 20000`

## Environment Variables

**Required for email functionality:**

```env
SMTP_HOST=smtp.gmail.com           # SMTP server
SMTP_PORT=587                      # Usually 587 for TLS
SMTP_SECURE=false                  # true for port 465, false for 587
SMTP_USER=your-email@gmail.com     # Gmail address
SMTP_PASS=app-password             # 16-char Gmail App Password (NOT regular password!)
RECIPIENT_EMAIL=recipient@email.com # Who receives the digest
```

**Optional:**

```env
FORCE_NBA=true                     # Force NBA scores in non-morning digests (testing only)
```

### Getting Gmail App Password

1. Go to Google Account Security: https://myaccount.google.com/security
2. Enable 2-Step Verification (required)
3. Go to "App passwords" under 2-Step Verification
4. Generate password for "Mail"
5. Copy 16-character password (no spaces)

## Common Tasks for AI Assistants

### Task 1: Fix a Broken Scraper

**Symptoms:** No articles returned, or error in email

**Diagnosis steps:**
1. Check if website structure changed: `curl -A "Mozilla/5.0" https://site.com | grep -i "h1\|h2"`
2. Read scraper file: `src/scrapers/[source].ts`
3. Test locally: `npm run dev`
4. Check console output for specific errors

**Common fixes:**
- Update cheerio selectors (website redesign)
- Add missing User-Agent header
- Handle new URL patterns
- Update encoding handling

**Example fix commit:**
```
Fix Expresso scraper: update selectors for new layout

- Changed article selector from '.article' to '[class*="article"]'
- Updated headline selector from 'h2' to 'h1, h2'
- Added fallback for relative URLs
```

### Task 2: Add New Feature

**Before implementing:**
1. Check if it affects email template (`src/email.ts`)
2. Consider TypeScript types (`src/types.ts`)
3. Test with existing data flow
4. Ensure it works with GitHub Actions (environment variables, timing)

**Common features:**
- Add new scraper (see "Scraper Implementation Guide" above)
- Add new article metadata (update `Article` interface first)
- Change email styling (update CSS in `formatDigestHTML()`)
- Adjust scheduling (edit `.github/workflows/digest.yml`)

### Task 3: Improve Priority Algorithm

**Location:** `src/utils.ts:91-119`

**Current algorithm:**
```typescript
priority = 5 (base)
  + position bonus (0-3)
  + main headline (2)
  + has image (1)
  + optimal title length (1)
  + has summary (1)
= 1-10 (capped)
```

**When modifying:**
- Test with actual scraped data
- Ensure priority stays 1-10
- Consider balance across different sources
- Check "Top Headlines" section in email

### Task 4: Debug Email Issues

**Not receiving emails:**
1. Check environment variables in GitHub Secrets
2. Verify Gmail App Password (not regular password)
3. Check GitHub Actions logs for errors
4. Test locally with `.env` file

**Email formatting broken:**
1. Check HTML entities are escaped (`escapeHtml()`)
2. Verify CSS inline styles (email clients ignore `<style>` tags)
3. Test both HTML and plain text versions
4. Check for undefined values in template

**Wrong articles in "Top Headlines":**
1. Check priority calculation in scrapers
2. Verify `getTopHeadlines()` logic (`src/email.ts:28-50`)
3. Ensure minimum 2 per source constraint is working

### Task 5: Update TypeScript Configuration

**Current config:** `tsconfig.json`
- Target: ES2020 (modern features, Node 14+ compatible)
- Module: CommonJS (Node.js standard)
- Strict: true (maximum type safety)

**When changing:**
- Test compilation: `npm run build`
- Check dist/ output
- Verify imports still work (CommonJS vs ESM)
- Test in GitHub Actions environment

## Important Constraints & Guidelines

### 1. DO NOT Break These Rules

- **Never throw errors in scrapers** - Always return `SourceDigest` with error field
- **Always sanitize text** - Use `sanitizeText()` for scraped content, `escapeHtml()` for email output
- **Never commit `.env`** - It's git-ignored for security
- **Don't skip duplicate detection** - Prevents duplicate articles in digest
- **Always limit articles** - Max 15 per source to prevent email bloat
- **Never use regular Gmail password** - Must be App Password for SMTP

### 2. Performance Considerations

- Scrapers run in **series** (not parallel) to avoid rate limiting
- Total execution time: ~30-60 seconds for all sources
- Axios timeout: 15 seconds per source
- GitHub Actions timeout: Default (no custom limit)

### 3. Production Environment

- **Node version:** 20 (specified in `.github/workflows/digest.yml`)
- **No environment file** - Uses GitHub Secrets
- **No user input** - Fully automated
- **No logs stored** - Only GitHub Actions logs (limited retention)

### 4. Security Considerations

- **Email injection:** All user content escaped with `escapeHtml()`
- **XSS prevention:** No user-generated HTML, only scraped text
- **Secrets:** Never log SMTP credentials
- **HTTPS:** All scrapers use HTTPS URLs
- **Dependencies:** Keep updated for security patches

### 5. Testing Limitations

- **Cannot test scheduled runs locally** - Must use `workflow_dispatch` or wait for cron
- **NBA scores require specific timing** - Use `FORCE_NBA=true` for testing
- **Email testing requires real SMTP** - No mock available
- **Scraping depends on live sites** - May break if sites are down

## Git Workflow

### Branch Naming

Use descriptive branches:
```bash
git checkout -b fix/expresso-scraper
git checkout -b feature/add-bbc-news
git checkout -b docs/update-readme
```

### Commit Messages

Follow conventional commits:
```
feat: Add BBC News scraper
fix: Update Guardian selectors for new layout
docs: Add scraper implementation guide
refactor: Extract common scraping utilities
test: Add manual testing instructions
```

### Pull Request Checklist

Before submitting PR:
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Tested locally with `npm run dev`
- [ ] Email received and formatted correctly
- [ ] No sensitive data in commit (`.env`, passwords)
- [ ] Updated README if user-facing changes
- [ ] All scrapers returning articles (or documented why not)

## Troubleshooting Guide

### "No articles found" for specific source

1. Check if website is accessible: `curl -I https://site.com`
2. Verify selectors: Open site in browser, inspect headline elements
3. Check for rate limiting: Try again in a few minutes
4. Look for anti-bot measures: May need to update User-Agent or add headers

### TypeScript compilation errors

1. Check import paths (relative paths, `.ts` extension)
2. Verify types are exported from `src/types.ts`
3. Run `npm install` to ensure dependencies installed
4. Check `tsconfig.json` hasn't been corrupted

### GitHub Actions workflow fails

1. Check workflow logs in Actions tab
2. Verify all secrets are set correctly
3. Ensure Node version matches local (20)
4. Check if npm dependencies can be installed (network issues)

### Email not formatted correctly

1. Test HTML rendering in browser (save email as .html)
2. Check for missing `escapeHtml()` calls
3. Verify CSS is inline (email clients strip `<style>` tags)
4. Test plain text version for fallback

### Portuguese characters garbled

1. Ensure `sanitizeText()` is being used
2. Check axios `responseEncoding: 'utf8'`
3. Verify `Accept-Charset: utf-8` header
4. Test with specific Portuguese chars: `àáâãçéêíóôõú`

## Version History & Recent Changes

**January 2026 Updates:**
- **Observador scraper** (`src/scrapers/observador.ts`) - Added Portuguese news source Observador.pt
- **Article previews/summaries** - All scrapers now extract article summaries when available
- **Player of the Night** - NBA integration now calculates best performer using game score formula
- **Neemias Queta tracking** - Automatic Portuguese player spotlight in NBA section
- **Top game score per team** - Shows best performer for each team in every game
- **Steals & blocks leaders** - From box score API for detailed defensive stats
- **Landing page** (`/landing`) - Product validation page with email signup
- **Google Sheets integration** - Landing page stores signups in Google Sheets
- **Vercel deployment** - Landing page deployed on Vercel with serverless functions
- **Source logos** - Using Google favicon service for reliable source icons
- **Schedule update** - Changed from 4x to 3x daily (6 AM, 12 PM, 6 PM Portugal)
- **UI/UX improvements** - Accessibility fixes for landing page

**Previous improvements:**
- **NBA scores integration** (`src/scrapers/nba.ts`) - Uses ESPN JSON API
- **Top Headlines section** - Shows 2 best articles per source based on priority
- **Guardian support** - International news coverage
- **Priority algorithm** - Refined article ranking system
- **Better error handling** - Graceful degradation if scrapers fail

**Known issues:**
- Some Portuguese sites may block automated requests intermittently
- NBA stats may be incomplete for games without full box scores
- Email client compatibility varies (tested with Gmail, Outlook)
- Observador.pt occasionally changes their HTML structure

## Additional Resources

- **Cheerio documentation:** https://cheerio.js.org/
- **Axios documentation:** https://axios-http.com/
- **Nodemailer documentation:** https://nodemailer.com/
- **GitHub Actions cron syntax:** https://crontab.guru/
- **HTML email best practices:** https://www.campaignmonitor.com/css/

## Questions & Support

When you need clarification:

1. **Check existing code first** - Patterns are consistent across scrapers
2. **Read this document** - Most common tasks are documented
3. **Test locally** - `npm run dev` gives immediate feedback
4. **Check GitHub Actions logs** - Production errors logged there
5. **Ask specific questions** - Include file paths, line numbers, error messages

## Landing Page Development

The landing page (`/landing`) is a separate Vercel-deployed site for product validation:

### Structure
- **index.html** - Single-page marketing site in Portuguese
- **api/signup.js** - Serverless function for email collection
- **vercel.json** - Routes and deployment config

### Features
- Email signup forms (hero + footer)
- Source suggestion form (users can request new sources)
- Pricing tiers display (Free, Premium €9/mo, Lifetime €99)
- FAQ section
- Responsive design
- Accessibility features (ARIA labels, focus states)

### Deployment
1. Deploy to Vercel: `cd landing && vercel`
2. Set environment variables in Vercel dashboard:
   - `GOOGLE_SHEETS_PRIVATE_KEY` - Service account key
   - `GOOGLE_SHEETS_CLIENT_EMAIL` - Service account email
   - `GOOGLE_SHEETS_SPREADSHEET_ID` - Target spreadsheet ID
3. See `landing/GOOGLE_SHEETS_SETUP.md` for detailed setup

### Testing Landing Page Locally
```bash
cd landing
npx serve .  # Serves index.html on localhost:3000
```

---

**Last updated:** January 5, 2026
**Maintained for:** Claude and other AI assistants working on this codebase
