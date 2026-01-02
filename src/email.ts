import nodemailer from 'nodemailer';
import { SourceDigest } from './types';

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

  for (const digest of digests) {
    html += `
    <div class="source-section">
      <div class="source-header">
        <h2>${digest.source}</h2>
        <a href="${digest.sourceUrl}" target="_blank">Ver site →</a>
      </div>
`;

    if (digest.error) {
      html += `      <p class="error">⚠️ Erro ao carregar: ${digest.error}</p>\n`;
    } else if (digest.articles.length === 0) {
      html += `      <p class="no-articles">Nenhum artigo encontrado</p>\n`;
    } else {
      for (const article of digest.articles) {
        html += `
      <div class="article">
        <h3 class="article-title">
          <a href="${article.url}" target="_blank">${article.title}</a>
        </h3>
`;
        if (article.summary) {
          html += `        <p class="article-summary">${article.summary}</p>\n`;
        }
        if (article.category) {
          html += `        <span class="article-category">${article.category}</span>\n`;
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

  let text = `📰 NEWS DIGEST\n`;
  text += `${formattedDate} às ${formattedTime}\n`;
  text += `${'='.repeat(50)}\n\n`;

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

  const subject = `📰 News Digest - ${timeOfDay} (${dateStr})`;

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
