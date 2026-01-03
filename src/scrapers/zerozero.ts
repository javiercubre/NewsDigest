import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';
import { sanitizeText, calculatePriority } from '../utils';

const SOURCE_URL = 'https://www.zerozero.pt';
const SOURCE_NAME = 'ZeroZero';

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
      responseType: 'arraybuffer',
    });

    // ZeroZero uses ISO-8859-1 encoding
    const decoder = new TextDecoder('iso-8859-1');
    const html = decoder.decode(response.data);
    const $ = cheerio.load(html);

    let position = 0;

    // Main headlines (h1)
    $('h1 a, a h1').each((_, element) => {
      const $el = $(element);
      const $link = $el.is('a') ? $el : $el.closest('a');
      const $heading = $el.is('a') ? $el.find('h1').first() : $el;

      let title = sanitizeText($heading.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        if (!url.startsWith('http')) return;
        if (!articles.find(a => a.title === title)) {
          const hasImage = $link.closest('article, [class*="news"]').find('img').length > 0;
          articles.push({
            title,
            url,
            category: 'Desporto',
            priority: calculatePriority(position, true, hasImage, title.length, false),
            isHeadline: true,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // News items
    $('.news, .noticia, [class*="news"], article, .box_news, .item').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h2, h3, h4, .title, [class*="title"], .headline').first();

      let title = sanitizeText($title.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        if (!url.startsWith('http')) return;
        if (!articles.find(a => a.title === title)) {
          const hasImage = $el.find('img').length > 0;
          const isH2 = $title.is('h2');

          articles.push({
            title,
            url,
            category: 'Desporto',
            priority: calculatePriority(position, isH2, hasImage, title.length, false),
            isHeadline: isH2,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // Look for news links specifically
    $('a[href*="/noticias/"], a[href*="/noticia/"]').each((_, element) => {
      const $el = $(element);
      const title = sanitizeText($el.text());
      let url = $el.attr('href') || '';

      if (title && url && title.length > 15 && !articles.find(a => a.title === title)) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        articles.push({
          title,
          url,
          category: 'Desporto',
          priority: calculatePriority(position, false, false, title.length, false),
          isHeadline: false,
          source: SOURCE_NAME,
        });
        position++;
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
