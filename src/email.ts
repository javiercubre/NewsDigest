import nodemailer from 'nodemailer';
import { Article, SourceDigest } from './types';
import { escapeHtml } from './utils';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  };
}

/**
 * Extract top headlines from all sources based on priority score
 */
function getTopHeadlines(digests: SourceDigest[], count: number = 5): Article[] {
  const allArticles: Article[] = [];

  for (const digest of digests) {
    for (const article of digest.articles) {
      allArticles.push({
        ...article,
        source: digest.source,
      });
    }
  }

  // Sort by priority (descending) and take top N
  return allArticles
    .sort((a, b) => b.priority - a.priority)
    .slice(0, count);
}

function formatDigestHTML(digests: SourceDigest[]): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const topHeadlines = getTopHeadlines(digests, 5);

  let html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1a1a1a;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header .date {
      color: #666;
      font-size: 14px;
    }
    .top-headlines {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 35px;
      color: white;
    }
    .top-headlines h2 {
      margin: 0 0 20px 0;
      font-size: 22px;
      color: #ffd700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .top-headline-item {
      padding: 15px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .top-headline-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .top-headline-item h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }
    .top-headline-item h3 a {
      color: #ffffff;
      text-decoration: none;
    }
    .top-headline-item h3 a:hover {
      color: #ffd700;
      text-decoration: underline;
    }
    .top-headline-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }
    .top-headline-source {
      background-color: rgba(255,215,0,0.2);
      color: #ffd700;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 500;
    }
    .top-headline-summary {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      margin-top: 8px;
    }
    .priority-badge {
      background-color: rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.9);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
    }
    .source-section {
      margin-bottom: 35px;
    }
    .source-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .source-header h2 {
      margin: 0;
      font-size: 20px;
      color: #2c3e50;
    }
    .source-header a {
      color: #3498db;
      text-decoration: none;
      font-size: 14px;
      margin-left: 10px;
    }
    .source-header a:hover {
      text-decoration: underline;
    }
    .article {
      margin-bottom: 15px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .article:last-child {
      border-bottom: none;
    }
    .article-title {
      margin: 0 0 5px 0;
      font-size: 16px;
    }
    .article-title a {
      color: #1a1a1a;
      text-decoration: none;
    }
    .article-title a:hover {
      color: #3498db;
      text-decoration: underline;
    }
    .article-summary {
      color: #666;
      font-size: 14px;
      margin: 5px 0 0 0;
    }
    .article-category {
      display: inline-block;
      background-color: #e8f4fc;
      color: #2980b9;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 5px;
    }
    .error {
      color: #e74c3c;
      font-style: italic;
      padding: 10px;
      background-color: #fdf2f2;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #999;
      font-size: 12px;
    }
    .no-articles {
      color: #999;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 News Digest</h1>
      <p class="date">${formattedDate} às ${formattedTime}</p>
    </div>
`;

  // Top Headlines Section
  if (topHeadlines.length > 0) {
    html += `
    <div class="top-headlines">
      <h2>⭐ Top Headlines</h2>
`;
    for (const article of topHeadlines) {
      html += `
      <div class="top-headline-item">
        <h3><a href="${escapeHtml(article.url)}" target="_blank">${escapeHtml(article.title)}</a></h3>
        <div class="top-headline-meta">
          <span class="top-headline-source">${escapeHtml(article.source || '')}</span>
          <span class="priority-badge">Priority: ${article.priority}/10</span>
        </div>
`;
      if (article.summary) {
        html += `        <p class="top-headline-summary">${escapeHtml(article.summary)}</p>\n`;
      }
      html += `      </div>\n`;
    }
    html += `    </div>\n`;
  }

  // Individual source sections
  for (const digest of digests) {
    html += `
    <div class="source-section">
      <div class="source-header">
        <h2>${escapeHtml(digest.source)}</h2>
        <a href="${escapeHtml(digest.sourceUrl)}" target="_blank">Ver site →</a>
      </div>
`;

    if (digest.error) {
      html += `      <p class="error">⚠️ Erro ao carregar: ${escapeHtml(digest.error)}</p>\n`;
    } else if (digest.articles.length === 0) {
      html += `      <p class="no-articles">Nenhum artigo encontrado</p>\n`;
    } else {
      for (const article of digest.articles) {
        html += `
      <div class="article">
        <h3 class="article-title">
          <a href="${escapeHtml(article.url)}" target="_blank">${escapeHtml(article.title)}</a>
        </h3>
`;
        if (article.summary) {
          html += `        <p class="article-summary">${escapeHtml(article.summary)}</p>\n`;
        }
        if (article.category) {
          html += `        <span class="article-category">${escapeHtml(article.category)}</span>\n`;
        }
        html += `      </div>\n`;
      }
    }

    html += `    </div>\n`;
  }

  html += `
    <div class="footer">
      <p>Este digest é gerado automaticamente 4 vezes por dia.</p>
      <p>Fontes: Expresso, Público, ZeroZero, The New York Times</p>
    </div>
  </div>
</body>
</html>
`;

  return html;
}

function formatDigestText(digests: SourceDigest[]): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const topHeadlines = getTopHeadlines(digests, 5);

  let text = `📰 NEWS DIGEST\n`;
  text += `${formattedDate} às ${formattedTime}\n`;
  text += `${'='.repeat(50)}\n\n`;

  // Top Headlines
  if (topHeadlines.length > 0) {
    text += `⭐ TOP HEADLINES\n`;
    text += `${'─'.repeat(40)}\n`;
    for (const article of topHeadlines) {
      text += `\n★ ${article.title}\n`;
      text += `  [${article.source}] Priority: ${article.priority}/10\n`;
      text += `  ${article.url}\n`;
    }
    text += `\n${'='.repeat(50)}\n`;
  }

  for (const digest of digests) {
    text += `\n▶ ${digest.source.toUpperCase()}\n`;
    text += `${'-'.repeat(40)}\n`;

    if (digest.error) {
      text += `⚠️ Erro: ${digest.error}\n`;
    } else if (digest.articles.length === 0) {
      text += `Nenhum artigo encontrado\n`;
    } else {
      for (const article of digest.articles) {
        text += `\n• ${article.title}\n`;
        text += `  ${article.url}\n`;
        if (article.summary) {
          text += `  ${article.summary}\n`;
        }
      }
    }
    text += `\n`;
  }

  text += `\n${'='.repeat(50)}\n`;
  text += `Este digest é gerado automaticamente 4 vezes por dia.\n`;

  return text;
}

export async function sendDigestEmail(
  recipientEmail: string,
  digests: SourceDigest[]
): Promise<void> {
  const config = getEmailConfig();

  if (!config.user || !config.pass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const now = new Date();
  const timeOfDay = getTimeOfDay(now.getHours());
  const dateStr = now.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
  });

  const topHeadlines = getTopHeadlines(digests, 1);
  const topStory = topHeadlines[0]?.title || 'Your news digest is ready';
  const subject = `📰 ${timeOfDay} (${dateStr}): ${topStory.slice(0, 60)}${topStory.length > 60 ? '...' : ''}`;

  const mailOptions = {
    from: `"News Digest" <${config.user}>`,
    to: recipientEmail,
    subject,
    text: formatDigestText(digests),
    html: formatDigestHTML(digests),
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Digest sent to ${recipientEmail}`);
}

function getTimeOfDay(hour: number): string {
  if (hour >= 6 && hour < 12) return 'Manhã';
  if (hour >= 12 && hour < 14) return 'Meio-dia';
  if (hour >= 14 && hour < 19) return 'Tarde';
  return 'Noite';
}
