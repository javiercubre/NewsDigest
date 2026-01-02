import * as dotenv from 'dotenv';
dotenv.config();

import { scrapeExpresso, scrapePublico, scrapeZeroZero, scrapeGuardian } from './scrapers';
import { fetchNBAScores, isMorningDigest, NBAScores } from './scrapers/nba';
import { sendDigestEmail } from './email';
import { SourceDigest } from './types';

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'joalves05@gmail.com';

async function scrapeAllSources(): Promise<SourceDigest[]> {
  console.log('🔄 Starting news scraping...\n');

  const scrapers = [
    { name: 'Expresso', fn: scrapeExpresso },
    { name: 'Público', fn: scrapePublico },
    { name: 'ZeroZero', fn: scrapeZeroZero },
    { name: 'The Guardian', fn: scrapeGuardian },
  ];

  const results: SourceDigest[] = [];

  for (const scraper of scrapers) {
    console.log(`📰 Scraping ${scraper.name}...`);
    try {
      const result = await scraper.fn();
      results.push(result);
      if (result.error) {
        console.log(`   ⚠️ Error: ${result.error}`);
      } else {
        console.log(`   ✅ Found ${result.articles.length} articles`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        source: scraper.name,
        sourceUrl: '',
        articles: [],
        scrapedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

async function main(): Promise<void> {
  console.log('═'.repeat(50));
  console.log('📬 NEWS DIGEST');
  console.log(`📅 ${new Date().toLocaleString('pt-PT')}`);
  console.log('═'.repeat(50));
  console.log();

  try {
    // Scrape all sources
    const digests = await scrapeAllSources();

    // Fetch NBA scores for morning digest only
    let nbaScores: NBAScores | undefined;
    if (isMorningDigest()) {
      console.log('🏀 Fetching NBA scores (morning digest)...');
      nbaScores = await fetchNBAScores();
      if (nbaScores.error) {
        console.log(`   ⚠️ NBA Error: ${nbaScores.error}`);
      } else {
        console.log(`   ✅ Found ${nbaScores.games.length} games`);
      }
    }

    // Count total articles
    const totalArticles = digests.reduce((sum, d) => sum + d.articles.length, 0);
    console.log(`\n📊 Total: ${totalArticles} articles from ${digests.length} sources\n`);

    // Check if we have any articles
    if (totalArticles === 0) {
      console.log('⚠️ No articles found. Email will still be sent with error information.');
    }

    // Send email
    console.log(`📧 Sending digest to ${RECIPIENT_EMAIL}...`);
    await sendDigestEmail(RECIPIENT_EMAIL, digests, nbaScores);

    console.log('\n✅ Digest completed successfully!');
  } catch (error) {
    console.error('\n❌ Failed to send digest:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
