import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article, SourceDigest } from '../types';
import { sanitizeText, calculatePriority } from '../utils';

const SOURCE_URL = 'https://observador.pt';
const SOURCE_NAME = 'Observador';

export async function scrapeObservador(): Promise<SourceDigest> {
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
        if (!url.startsWith('http')) return;
        if (!articles.find(a => a.title === title)) {
          const $article = $link.closest('article, [class*="article"], [class*="post"], [class*="story"]');
          const hasImage = $article.find('img').length > 0;
          const summary = sanitizeText($article.find('[class*="excerpt"], [class*="summary"], [class*="lead"], [class*="description"], p').first().text());

          articles.push({
            title,
            url,
            summary: summary || undefined,
            category: sanitizeText($article.find('[class*="category"], [class*="section"], [class*="tag"]').first().text()) || undefined,
            priority: calculatePriority(position, true, hasImage, title.length, !!summary),
            isHeadline: true,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // Secondary headlines - h2, h3
    $('article, .article, [class*="article"], [class*="post"], [class*="story"], [class*="headline"], [class*="news-item"]').each((_, element) => {
      const $el = $(element);
      const $link = $el.find('a').first();
      const $title = $el.find('h2, h3, h4, [class*="title"], [class*="headline"]').first();

      let title = sanitizeText($title.text() || $link.text());
      let url = $link.attr('href') || '';

      if (title && url && title.length > 10) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        if (!url.startsWith('http')) return;
        if (!articles.find(a => a.title === title)) {
          const hasImage = $el.find('img').length > 0;
          const summary = sanitizeText($el.find('[class*="excerpt"], [class*="summary"], [class*="lead"], [class*="description"], p').first().text());
          const isH2 = $title.is('h2');

          articles.push({
            title,
            url,
            summary: summary || undefined,
            category: sanitizeText($el.find('[class*="category"], [class*="section"], [class*="tag"]').first().text()) || undefined,
            priority: calculatePriority(position, isH2, hasImage, title.length, !!summary),
            isHeadline: isH2,
            source: SOURCE_NAME,
          });
          position++;
        }
      }
    });

    // Fallback: look for article links
    $('a[href*="/noticia/"], a[href*="/artigo/"], a[href*="/opiniao/"]').each((_, element) => {
      const $el = $(element);
      const title = sanitizeText($el.text());
      let url = $el.attr('href') || '';

      if (title && url && title.length > 15 && !articles.find(a => a.title === title)) {
        if (url.startsWith('/')) url = SOURCE_URL + url;
        if (!url.startsWith('http')) return;

        // Try to find summary from parent container
        const $parent = $el.closest('article, [class*="article"], [class*="post"]');
        const summary = sanitizeText($parent.find('[class*="excerpt"], [class*="summary"], p').first().text());

        articles.push({
          title,
          url,
          summary: summary || undefined,
          priority: calculatePriority(position, false, false, title.length, !!summary),
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
