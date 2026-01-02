import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';

const SOURCE_URL = 'https://expresso.pt';

export async function scrapeExpresso(): Promise<SourceDigest> {
  const articles: Article[] = [];

  try {
    const response = await axios.get(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Main headlines
    $('article, .article, [class*="article"], [class*="headline"], [class*="news-item"]').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h1, h2, h3, h4, [class*="title"]').first();

      let title = $title.text().trim() || $link.text().trim();
      let url = $link.attr('href') || '';

      if (title && url) {
        // Make URL absolute if relative
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }

        // Avoid duplicates
        if (!articles.find(a => a.title === title) && title.length > 10) {
          articles.push({
            title,
            url,
            category: $el.find('[class*="category"], [class*="section"]').text().trim() || undefined,
          });
        }
      }
    });

    // Also try to get headlines from links with heading tags
    $('a h1, a h2, a h3, h1 a, h2 a, h3 a').each((_, element) => {
      const $el = $(element);
      const $link = $el.is('a') ? $el : $el.closest('a');
      const $heading = $el.is('a') ? $el.find('h1, h2, h3').first() : $el;

      let title = $heading.text().trim() || $link.text().trim();
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        if (!articles.find(a => a.title === title)) {
          articles.push({ title, url });
        }
      }
    });

    return {
      source: 'Expresso',
      sourceUrl: SOURCE_URL,
      articles: articles.slice(0, 15), // Top 15 articles
      scrapedAt: new Date(),
    };
  } catch (error) {
    return {
      source: 'Expresso',
      sourceUrl: SOURCE_URL,
      articles: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
