import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';
import { sanitizeText, calculatePriority } from '../utils';

const SOURCE_URL = 'https://www.theguardian.com/international';
const SOURCE_NAME = 'The Guardian';

export async function scrapeGuardian(): Promise<SourceDigest> {
  const articles: Article[] = [];

  try {
    const response = await axios.get(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Charset': 'utf-8',
      },
      timeout: 15000,
      responseType: 'text',
      responseEncoding: 'utf8',
    });

    const $ = cheerio.load(response.data);

    let position = 0;

    // Main headlines (h1) - these are the top stories
    $('h1 a, a h1').each((_, element) => {
      const $el = $(element);
      const $link = $el.is('a') ? $el : $el.closest('a');
      const $heading = $el.is('a') ? $el.find('h1').first() : $el;

      let title = sanitizeText($heading.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = 'https://www.theguardian.com' + url;
        if (!url.startsWith('http')) return;
        if (!articles.find(a => a.title === title)) {
          const hasImage = $link.closest('article, [class*="card"]').find('img').length > 0;
          articles.push({
            title,
            url,
            priority: calculatePriority(position, true, hasImage, title.length, false),
            isHeadline: true,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // Guardian uses various card/container patterns
    $('[data-link-name*="article"], [class*="fc-item"], [class*="card"], article').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h2, h3, h4, [class*="headline"], span[class*="title"]').first();

      let title = sanitizeText($title.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = 'https://www.theguardian.com' + url;
        if (!url.startsWith('http')) return;
        if (!articles.find(a => a.title === title)) {
          const summary = sanitizeText($el.find('[class*="standfirst"], [class*="trail"], [class*="description"]').text());
          const hasImage = $el.find('img').length > 0;
          const isH2 = $title.is('h2');

          articles.push({
            title,
            url,
            summary: summary || undefined,
            category: sanitizeText($el.find('[class*="kicker"], [class*="section"]').text()) || undefined,
            priority: calculatePriority(position, isH2, hasImage, title.length, !!summary),
            isHeadline: isH2,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // Fallback: look for article links
    $('a[href*="/2024/"], a[href*="/2025/"], a[href*="/2026/"]').each((_, element) => {
      const $el = $(element);
      const $heading = $el.find('h2, h3, h4, span').first();
      const title = sanitizeText($heading.text() || $el.text());
      let url = $el.attr('href') || '';

      if (title && url && title.length > 15 && !articles.find(a => a.title === title)) {
        if (url.startsWith('/')) url = 'https://www.theguardian.com' + url;
        // Filter out non-article URLs
        if (url.includes('/live/') || url.includes('/video/') || url.includes('/gallery/')) return;
        articles.push({
          title,
          url,
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
