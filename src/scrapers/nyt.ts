import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';

const SOURCE_URL = 'https://www.nytimes.com';

export async function scrapeNYT(): Promise<SourceDigest> {
  const articles: Article[] = [];

  try {
    const response = await axios.get(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // NYT uses story-wrapper and other patterns
    $('[class*="story"], article, [data-testid="block-link"]').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h1, h2, h3, h4, [class*="headline"], p[class*="heading"]').first();

      let title = $title.text().trim() || $link.text().trim();
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        if (!url.startsWith('http')) {
          return;
        }
        // Filter out non-article URLs
        if (url.includes('/interactive/') || url.includes('/video/')) {
          return;
        }
        if (!articles.find(a => a.title === title)) {
          const summary = $el.find('[class*="summary"], [class*="description"]').text().trim();
          articles.push({
            title,
            url,
            summary: summary || undefined,
            category: $el.find('[class*="section"], [data-testid="section"]').text().trim() || undefined,
          });
        }
      }
    });

    // Fallback: look for headline links
    $('a[href*="/2024/"], a[href*="/2025/"], a[href*="/2026/"]').each((_, element) => {
      const $el = $(element);
      const $heading = $el.find('h1, h2, h3, h4').first();
      const title = $heading.text().trim() || $el.text().trim();
      let url = $el.attr('href') || '';

      if (title && url && title.length > 15 && !articles.find(a => a.title === title)) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        if (url.includes('/interactive/') || url.includes('/video/')) {
          return;
        }
        articles.push({ title, url });
      }
    });

    return {
      source: 'The New York Times',
      sourceUrl: SOURCE_URL,
      articles: articles.slice(0, 15),
      scrapedAt: new Date(),
    };
  } catch (error) {
    return {
      source: 'The New York Times',
      sourceUrl: SOURCE_URL,
      articles: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
