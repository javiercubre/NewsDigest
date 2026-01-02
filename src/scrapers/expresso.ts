import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';
import { sanitizeText, calculatePriority } from '../utils';

const SOURCE_URL = 'https://expresso.pt';
const SOURCE_NAME = 'Expresso';

export async function scrapeExpresso(): Promise<SourceDigest> {
  const articles: Article[] = [];

  try {
    const response = await axios.get(SOURCE_URL, {
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

    const $ = cheerio.load(response.data);

    // Track position for priority calculation
    let position = 0;

    // Main headlines - look for h1 first (most important)
    $('h1 a, a h1').each((_, element) => {
      const $el = $(element);
      const $link = $el.is('a') ? $el : $el.closest('a');
      const $heading = $el.is('a') ? $el.find('h1').first() : $el;

      let title = sanitizeText($heading.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        if (!articles.find(a => a.title === title)) {
          const hasImage = $link.closest('article, [class*="article"]').find('img').length > 0;
          articles.push({
            title,
            url,
            category: sanitizeText($link.closest('article').find('[class*="category"], [class*="section"]').text()) || undefined,
            priority: calculatePriority(position, true, hasImage, title.length, false),
            isHeadline: true,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // Secondary headlines - h2, h3
    $('article, .article, [class*="article"], [class*="headline"], [class*="news-item"]').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h2, h3, h4, [class*="title"]').first();

      let title = sanitizeText($title.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        if (!articles.find(a => a.title === title)) {
          const hasImage = $el.find('img').length > 0;
          const summary = sanitizeText($el.find('[class*="lead"], [class*="summary"], [class*="excerpt"]').text());
          const isH2 = $title.is('h2');

          articles.push({
            title,
            url,
            summary: summary || undefined,
            category: sanitizeText($el.find('[class*="category"], [class*="section"]').text()) || undefined,
            priority: calculatePriority(position, isH2, hasImage, title.length, !!summary),
            isHeadline: isH2,
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
