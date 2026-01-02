import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';

const SOURCE_URL = 'https://www.publico.pt';

export async function scrapePublico(): Promise<SourceDigest> {
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

    // Público uses various article containers
    $('article, .card, [class*="headline"], [class*="story"], [class*="article"]').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h1, h2, h3, h4, .headline, [class*="title"]').first();

      let title = $title.text().trim() || $link.text().trim();
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        if (!url.startsWith('http')) {
          return; // Skip invalid URLs
        }
        if (!articles.find(a => a.title === title)) {
          const summary = $el.find('.lead, .summary, .excerpt, [class*="lead"]').text().trim();
          articles.push({
            title,
            url,
            summary: summary || undefined,
            category: $el.find('[class*="section"], [class*="category"]').text().trim() || undefined,
          });
        }
      }
    });

    // Fallback: look for headline links
    $('a[href*="/noticia/"], a[href*="/opiniao/"], a[href*="/local/"]').each((_, element) => {
      const $el = $(element);
      const title = $el.text().trim();
      let url = $el.attr('href') || '';

      if (title && url && title.length > 15 && !articles.find(a => a.title === title)) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        articles.push({ title, url });
      }
    });

    return {
      source: 'Público',
      sourceUrl: SOURCE_URL,
      articles: articles.slice(0, 15),
      scrapedAt: new Date(),
    };
  } catch (error) {
    return {
      source: 'Público',
      sourceUrl: SOURCE_URL,
      articles: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
