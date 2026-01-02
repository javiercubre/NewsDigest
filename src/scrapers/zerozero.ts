import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';

const SOURCE_URL = 'https://www.zerozero.pt';

export async function scrapeZeroZero(): Promise<SourceDigest> {
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

    // ZeroZero news items
    $('.news, .noticia, [class*="news"], article, .box_news, .item').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h1, h2, h3, h4, .title, [class*="title"], .headline').first();

      let title = $title.text().trim() || $link.text().trim();
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        if (!url.startsWith('http')) {
          return;
        }
        if (!articles.find(a => a.title === title)) {
          articles.push({
            title,
            url,
            category: 'Desporto',
          });
        }
      }
    });

    // Look for news links specifically
    $('a[href*="/noticias/"], a[href*="/noticia/"]').each((_, element) => {
      const $el = $(element);
      const title = $el.text().trim();
      let url = $el.attr('href') || '';

      if (title && url && title.length > 15 && !articles.find(a => a.title === title)) {
        if (url.startsWith('/')) {
          url = SOURCE_URL + url;
        }
        articles.push({
          title,
          url,
          category: 'Desporto',
        });
      }
    });

    return {
      source: 'ZeroZero',
      sourceUrl: SOURCE_URL,
      articles: articles.slice(0, 15),
      scrapedAt: new Date(),
    };
  } catch (error) {
    return {
      source: 'ZeroZero',
      sourceUrl: SOURCE_URL,
      articles: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
