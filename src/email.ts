import nodemailer from 'nodemailer';
import { Article, SourceDigest } from './types';
import { escapeHtml } from './utils';
import { NBAScores, PlayerOfTheNight, FeaturedPlayerStats } from './scrapers/nba';

// Source logos - using Google's reliable favicon service
const SOURCE_LOGOS: Record<string, { url: string; emoji: string }> = {
  'Expresso': {
    url: 'https://www.google.com/s2/favicons?domain=expresso.pt&sz=64',
    emoji: '📰',
  },
  'Público': {
    url: 'https://www.google.com/s2/favicons?domain=publico.pt&sz=64',
    emoji: '📰',
  },
  'Observador': {
    url: 'https://www.google.com/s2/favicons?domain=observador.pt&sz=64',
    emoji: '📰',
  },
  'ZeroZero': {
    url: 'https://www.google.com/s2/favicons?domain=zerozero.pt&sz=64',
    emoji: '⚽',
  },
  'The Guardian': {
    url: 'https://www.google.com/s2/favicons?domain=theguardian.com&sz=64',
    emoji: '🗞️',
  },
};

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
 * Extract top headlines from all sources
 * Ensures at least 2 headlines per source for balanced representation
 */
function getTopHeadlines(digests: SourceDigest[], minPerSource: number = 2): Article[] {
  const topHeadlines: Article[] = [];

  // Get top N articles from each source
  for (const digest of digests) {
    if (digest.articles.length === 0) continue;

    // Sort articles by priority and take top minPerSource
    const sortedArticles = [...digest.articles]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, minPerSource);

    for (const article of sortedArticles) {
      topHeadlines.push({
        ...article,
        source: digest.source,
      });
    }
  }

  // Sort all collected headlines by priority
  return topHeadlines.sort((a, b) => b.priority - a.priority);
}

function formatDigestHTML(digests: SourceDigest[], nbaScores?: NBAScores): string {
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

  const topHeadlines = getTopHeadlines(digests, 2); // 2 per source
  const totalArticles = digests.reduce((acc, d) => acc + d.articles.length, 0);
  const sourcesCount = digests.filter(d => d.articles.length > 0).length;

  let html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>NewsDigest - O seu resumo diário de notícias</title>
  <style type="text/css">
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a2e !important; }
      .email-container { background-color: #16213e !important; box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important; }
      .content-area { background-color: #16213e !important; }
      .headline-card { background-color: #1a1a2e !important; border-color: #2d3748 !important; }
      .headline-title { color: #e2e8f0 !important; }
      .article-link { color: #e2e8f0 !important; }
      .article-summary { color: #94a3b8 !important; }
      .section-title { color: #e2e8f0 !important; }
      .source-tag { background-color: #2d3748 !important; }
      .game-card { background-color: #1a1a2e !important; border-color: #2d3748 !important; }
      .error-box { background-color: #7f1d1d !important; border-color: #991b1b !important; }
      .error-text { color: #fca5a5 !important; }
      .no-articles-box { background-color: #1a1a2e !important; border-color: #2d3748 !important; }
      .no-articles-text { color: #94a3b8 !important; }
      .article-border { border-color: #2d3748 !important; }
      .footer-bg { background-color: #16213e !important; border-color: #2d3748 !important; }
      .footer-text { color: #94a3b8 !important; }
      .category-badge { background-color: #2d3748 !important; color: #cbd5e1 !important; }
      .divider-line { border-color: #2d3748 !important; }
      .priority-badge-bg { background-color: #2d3748 !important; }
    }
    /* Prevent auto-darkening of specific elements */
    [data-ogsc] .email-container { background-color: #ffffff !important; }
    [data-ogsc] .content-area { background-color: #ffffff !important; }
  </style>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body class="email-body" style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; background-color: #f0f2f5;">

  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-container" style="max-width: 680px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Premium Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 40px 30px 30px 30px; text-align: center;">
                    <!-- Logo/Brand -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); width: 56px; height: 56px; border-radius: 14px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 28px; line-height: 56px;">📰</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 20px 0 8px 0; letter-spacing: -0.5px;">NewsDigest</h1>
                    <p style="color: #a0aec0; font-size: 15px; margin: 0 0 20px 0; font-weight: 400;">As notícias que importam, curadas para si</p>

                    <!-- Date Badge -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 8px 20px;">
                          <span style="color: #e2e8f0; font-size: 14px;">${formattedDate} • ${formattedTime}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Stats Bar -->
                <tr>
                  <td style="background: rgba(0,0,0,0.2); padding: 16px 30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="text-align: center;">
                          <span style="color: #e94560; font-size: 24px; font-weight: 700; display: block;">${totalArticles}</span>
                          <span style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Artigos</span>
                        </td>
                        <td width="34%" style="text-align: center; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1);">
                          <span style="color: #e94560; font-size: 24px; font-weight: 700; display: block;">${sourcesCount}</span>
                          <span style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Fontes</span>
                        </td>
                        <td width="33%" style="text-align: center;">
                          <span style="color: #e94560; font-size: 24px; font-weight: 700; display: block;">${topHeadlines.length}</span>
                          <span style="color: #a0aec0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Destaques</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td class="content-area" style="padding: 0 30px 30px 30px; background-color: #ffffff;">`;

  // Top Headlines Section
  if (topHeadlines.length > 0) {
    html += `
              <!-- Top Headlines Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td>
                    <!-- Section Header -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); width: 4px; border-radius: 2px;">&nbsp;</td>
                              <td style="padding-left: 12px;">
                                <span style="font-size: 11px; font-weight: 600; color: #e94560; text-transform: uppercase; letter-spacing: 1.5px;">Em Destaque</span>
                                <h2 class="section-title" style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #1a1a2e;">Principais Notícias</h2>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
`;
    for (const article of topHeadlines) {
      const sourceLogo = SOURCE_LOGOS[article.source || ''];
      const sourceEmoji = sourceLogo?.emoji || '📰';
      const priorityColor = article.priority >= 8 ? '#e94560' : article.priority >= 6 ? '#f39c12' : '#3498db';

      html += `
                    <!-- Headline Card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td class="headline-card" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 4px solid ${priorityColor}; padding: 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <!-- Source Tag -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                  <tr>
                                    <td class="source-tag" style="background: #1a1a2e; border-radius: 6px; padding: 4px 12px;">
                                      <span style="color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${sourceEmoji} ${escapeHtml(article.source || '')}</span>
                                    </td>
                                    <td style="padding-left: 10px;">
                                      <span class="priority-badge-bg" style="background: #f1f5f9; color: ${priorityColor}; font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid ${priorityColor};">★ ${article.priority}/10</span>
                                    </td>
                                  </tr>
                                </table>
                                <!-- Title -->
                                <a href="${escapeHtml(article.url)}" target="_blank" class="headline-title" style="color: #1a1a2e; text-decoration: none; font-size: 17px; font-weight: 600; line-height: 1.4; display: block;">${escapeHtml(article.title)}</a>
`;
      if (article.summary) {
        html += `                                <p class="article-summary" style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">${escapeHtml(article.summary)}</p>\n`;
      }
      html += `
                                <!-- Read More Link -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                                  <tr>
                                    <td>
                                      <a href="${escapeHtml(article.url)}" target="_blank" style="color: #e94560; font-size: 13px; font-weight: 600; text-decoration: none;">Ler artigo →</a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
`;
    }
    html += `                  </td>
                </tr>
              </table>
`;
  }

  // NBA Scores Section (morning digest only)
  if (nbaScores && nbaScores.games.length > 0) {
    html += `
              <!-- NBA Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 35px;">
                <tr>
                  <td>
                    <!-- Section Header -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); width: 4px; border-radius: 2px;">&nbsp;</td>
                              <td style="padding-left: 12px;">
                                <span style="font-size: 11px; font-weight: 600; color: #f97316; text-transform: uppercase; letter-spacing: 1.5px;">NBA</span>
                                <h2 class="section-title" style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #1a1a2e;">Resultados - ${escapeHtml(nbaScores.date)}</h2>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
`;

    // Player of the Night
    if (nbaScores.playerOfTheNight) {
      const potn = nbaScores.playerOfTheNight;
      html += `
                    <!-- Player of the Night -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 16px; padding: 24px; text-align: center;">
                          <span style="display: inline-block; background: rgba(0,0,0,0.15); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">⭐ Jogador da Noite</span>
                          <h3 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #1a1a2e;">${escapeHtml(potn.name)}</h3>
                          <p style="margin: 0 0 16px 0; font-size: 14px; color: #78350f;">${escapeHtml(potn.team)} • ${escapeHtml(potn.matchup)}</p>
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td style="background: rgba(0,0,0,0.1); border-radius: 8px; padding: 12px 20px;">
                                <span style="font-size: 18px; font-weight: 700; color: #1a1a2e;">${potn.points} PTS</span>
                                <span style="color: #78350f; margin: 0 8px;">|</span>
                                <span style="font-size: 18px; font-weight: 700; color: #1a1a2e;">${potn.rebounds} REB</span>
                                <span style="color: #78350f; margin: 0 8px;">|</span>
                                <span style="font-size: 18px; font-weight: 700; color: #1a1a2e;">${potn.assists} AST</span>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 12px 0 0 0; font-size: 12px; color: #92400e;">Game Score: <strong>${potn.gameScore}</strong></p>
                        </td>
                      </tr>
                    </table>
`;
    }

    // Neemias Queta (Portuguese player spotlight)
    if (nbaScores.neemiasQueta) {
      const nq = nbaScores.neemiasQueta;
      html += `
                    <!-- Portuguese Spotlight -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #006600 0%, #008800 100%); border-radius: 12px; padding: 18px 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50" style="vertical-align: top;">
                                <span style="font-size: 36px;">🇵🇹</span>
                              </td>
                              <td style="padding-left: 12px;">
                                <span style="display: block; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Destaque Português</span>
                                <span style="display: block; font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">${escapeHtml(nq.name)}</span>
                                <span style="display: block; font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 10px;">${escapeHtml(nq.team)} • ${escapeHtml(nq.matchup)}</span>
                                ${nq.didPlay
                                  ? `<span style="display: block; font-size: 14px; font-weight: 600; color: #ffffff;">${nq.minutes} MIN | ${nq.points} PTS | ${nq.rebounds} REB | ${nq.assists} AST</span>`
                                  : `<span style="display: block; font-size: 14px; color: rgba(255,255,255,0.6); font-style: italic;">Não jogou</span>`
                                }
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
`;
    }

    // Games
    for (const game of nbaScores.games) {
      const awayWon = game.winner === 'away';
      const homeWon = game.winner === 'home';
      html += `
                    <!-- Game Card -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                      <tr>
                        <td class="game-card" style="background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px;">
                          <!-- Score -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="45%" style="text-align: right;">
                                <span style="font-size: 15px; font-weight: ${awayWon ? '700' : '500'}; color: ${awayWon ? '#1a1a2e' : '#64748b'};">${escapeHtml(game.awayTeam)}</span>
                              </td>
                              <td width="10%" style="text-align: center;">
                                <span style="font-size: 18px; font-weight: 700; color: #1a1a2e; background: ${awayWon ? '#e94560' : '#e2e8f0'}; color: ${awayWon ? '#fff' : '#1a1a2e'}; padding: 4px 8px; border-radius: 4px; margin-right: 4px;">${game.awayScore}</span>
                                <span style="color: #94a3b8; font-size: 12px;">-</span>
                                <span style="font-size: 18px; font-weight: 700; background: ${homeWon ? '#e94560' : '#e2e8f0'}; color: ${homeWon ? '#fff' : '#1a1a2e'}; padding: 4px 8px; border-radius: 4px; margin-left: 4px;">${game.homeScore}</span>
                              </td>
                              <td width="45%" style="text-align: left;">
                                <span style="font-size: 15px; font-weight: ${homeWon ? '700' : '500'}; color: ${homeWon ? '#1a1a2e' : '#64748b'};">${escapeHtml(game.homeTeam)}</span>
                              </td>
                            </tr>
                          </table>
                          <!-- Top Performers -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                            <tr>
                              <td style="font-size: 12px; color: #64748b;">
                                <strong style="color: #1a1a2e;">MVP:</strong> ${escapeHtml(game.awayTopGameScore.name)} (${escapeHtml(game.awayTopGameScore.value)}) vs ${escapeHtml(game.homeTopGameScore.name)} (${escapeHtml(game.homeTopGameScore.value)})
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
`;
    }
    html += `                  </td>
                </tr>
              </table>
`;
  }

  // Individual source sections
  const sourceColors: Record<string, string> = {
    'Expresso': '#c70000',
    'Público': '#1a1a1a',
    'Observador': '#e31937',
    'ZeroZero': '#00a651',
    'The Guardian': '#052962',
  };

  for (const digest of digests) {
    const logo = SOURCE_LOGOS[digest.source];
    const sourceColor = sourceColors[digest.source] || '#1a1a2e';
    const sourceEmoji = logo?.emoji || '📰';

    html += `
              <!-- ${digest.source} Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 35px;">
                <tr>
                  <td>
                    <!-- Source Header -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background: ${sourceColor}; width: 4px; border-radius: 2px;">&nbsp;</td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="vertical-align: middle;">
                                      <span style="font-size: 20px; margin-right: 8px;">${sourceEmoji}</span>
                                    </td>
                                    <td style="vertical-align: middle;">
                                      <h2 class="section-title" style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">${escapeHtml(digest.source)}</h2>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="text-align: right; vertical-align: middle;">
                                <a href="${escapeHtml(digest.sourceUrl)}" target="_blank" style="color: ${sourceColor}; font-size: 13px; font-weight: 500; text-decoration: none;">Ver fonte →</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
`;

    if (digest.error) {
      html += `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="error-box" style="background: #fef2f2; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
                          <span class="error-text" style="color: #b91c1c; font-size: 14px;">⚠️ Erro ao carregar: ${escapeHtml(digest.error)}</span>
                        </td>
                      </tr>
                    </table>
`;
    } else if (digest.articles.length === 0) {
      html += `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="no-articles-box" style="background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; text-align: center;">
                          <span class="no-articles-text" style="color: #64748b; font-size: 14px; font-style: italic;">Nenhum artigo encontrado</span>
                        </td>
                      </tr>
                    </table>
`;
    } else {
      html += `
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
`;
      for (let i = 0; i < digest.articles.length; i++) {
        const article = digest.articles[i];
        const isLast = i === digest.articles.length - 1;
        html += `
                      <tr>
                        <td class="${!isLast ? 'article-border' : ''}" style="padding: 14px 0; ${!isLast ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
                          <a href="${escapeHtml(article.url)}" target="_blank" class="article-link" style="color: #1a1a2e; text-decoration: none; font-size: 15px; font-weight: 500; line-height: 1.4; display: block;">${escapeHtml(article.title)}</a>
`;
        if (article.summary) {
          html += `                          <p class="article-summary" style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 6px 0 0 0;">${escapeHtml(article.summary)}</p>\n`;
        }
        if (article.category) {
          html += `                          <span class="category-badge" style="display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 4px; margin-top: 8px;">${escapeHtml(article.category)}</span>\n`;
        }
        html += `                        </td>
                      </tr>
`;
      }
      html += `                    </table>
`;
    }

    html += `                  </td>
                </tr>
              </table>
`;
  }

  // Footer
  const sourceNames = digests.map(d => d.source).join(' • ');
  html += `
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="divider-line" style="border-top: 1px solid #e2e8f0; height: 1px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-bg" style="padding: 30px; background: #ffffff; border-top: 1px solid #e2e8f0;">
              <!-- Share CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p class="section-title" style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #1a1a2e;">Gostou deste digest?</p>
                    <p class="footer-text" style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">Partilhe com amigos e colegas que também querem estar informados.</p>
                  </td>
                </tr>
              </table>

              <!-- Source Attribution -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <span class="footer-text" style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Fontes</span>
                    <p class="footer-text" style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">${escapeHtml(sourceNames)}</p>
                  </td>
                </tr>
              </table>

              <!-- Brand Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%); width: 32px; height: 32px; border-radius: 8px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 16px; line-height: 32px;">📰</span>
                        </td>
                      </tr>
                    </table>
                    <p class="section-title" style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">NewsDigest</p>
                    <p class="footer-text" style="margin: 0; font-size: 12px; color: #94a3b8;">As notícias que importam, 3x por dia</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Copyright -->
          <tr>
            <td style="background: #1a1a2e; padding: 16px 30px; text-align: center;">
              <p class="footer-text" style="margin: 0; font-size: 11px; color: #64748b;">© ${new Date().getFullYear()} NewsDigest. Feito com ❤️ em Portugal.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return html;
}

function formatDigestText(digests: SourceDigest[], nbaScores?: NBAScores): string {
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

  const topHeadlines = getTopHeadlines(digests, 2); // 2 per source
  const totalArticles = digests.reduce((acc, d) => acc + d.articles.length, 0);
  const sourcesCount = digests.filter(d => d.articles.length > 0).length;

  let text = `\n`;
  text += `╔══════════════════════════════════════════════════╗\n`;
  text += `║           📰 NEWSDIGEST                          ║\n`;
  text += `║     As notícias que importam, curadas para si    ║\n`;
  text += `╚══════════════════════════════════════════════════╝\n\n`;
  text += `📅 ${formattedDate} às ${formattedTime}\n`;
  text += `📊 ${totalArticles} artigos | ${sourcesCount} fontes | ${topHeadlines.length} destaques\n`;
  text += `${'─'.repeat(50)}\n\n`;

  // Top Headlines
  if (topHeadlines.length > 0) {
    text += `┌──────────────────────────────────────────────────┐\n`;
    text += `│  ⭐ PRINCIPAIS NOTÍCIAS                          │\n`;
    text += `└──────────────────────────────────────────────────┘\n`;
    for (const article of topHeadlines) {
      text += `\n  ★ ${article.title}\n`;
      text += `    └─ [${article.source}] Prioridade: ${article.priority}/10\n`;
      text += `    └─ ${article.url}\n`;
      if (article.summary) {
        text += `    └─ ${article.summary}\n`;
      }
    }
    text += `\n${'─'.repeat(50)}\n`;
  }

  // NBA Scores (morning digest only)
  if (nbaScores && nbaScores.games.length > 0) {
    text += `\n┌──────────────────────────────────────────────────┐\n`;
    text += `│  🏀 NBA RESULTADOS - ${nbaScores.date.padEnd(25)}│\n`;
    text += `└──────────────────────────────────────────────────┘\n`;

    // Player of the Night
    if (nbaScores.playerOfTheNight) {
      const potn = nbaScores.playerOfTheNight;
      text += `\n  ⭐ JOGADOR DA NOITE\n`;
      text += `  ━━━━━━━━━━━━━━━━━━━\n`;
      text += `  ${potn.name} (${potn.team})\n`;
      text += `  ${potn.matchup}\n`;
      text += `  📊 ${potn.points} PTS | ${potn.rebounds} REB | ${potn.assists} AST\n`;
      text += `  Game Score: ${potn.gameScore}\n`;
    }

    // Neemias Queta (Portuguese player spotlight)
    if (nbaScores.neemiasQueta) {
      const nq = nbaScores.neemiasQueta;
      text += `\n  🇵🇹 DESTAQUE PORTUGUÊS\n`;
      text += `  ━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `  ${nq.name} (${nq.team})\n`;
      text += `  ${nq.matchup}\n`;
      if (nq.didPlay) {
        text += `  📊 ${nq.minutes} MIN | ${nq.points} PTS | ${nq.rebounds} REB | ${nq.assists} AST\n`;
      } else {
        text += `  Não jogou\n`;
      }
    }

    text += `\n  JOGOS:\n`;
    for (const game of nbaScores.games) {
      const winner = game.winner === 'home' ? game.homeTeam : game.awayTeam;
      text += `\n  ${game.awayTeam} ${game.awayScore} @ ${game.homeTeam} ${game.homeScore}`;
      text += ` (V: ${winner})\n`;
      text += `    MVP: ${game.awayTopGameScore.name} (${game.awayTopGameScore.value}) vs ${game.homeTopGameScore.name} (${game.homeTopGameScore.value})\n`;
    }
    text += `\n${'─'.repeat(50)}\n`;
  }

  for (const digest of digests) {
    const sourceEmoji = SOURCE_LOGOS[digest.source]?.emoji || '📰';
    text += `\n┌──────────────────────────────────────────────────┐\n`;
    text += `│  ${sourceEmoji} ${digest.source.toUpperCase().padEnd(43)}│\n`;
    text += `└──────────────────────────────────────────────────┘\n`;

    if (digest.error) {
      text += `  ⚠️ Erro: ${digest.error}\n`;
    } else if (digest.articles.length === 0) {
      text += `  Nenhum artigo encontrado\n`;
    } else {
      for (const article of digest.articles) {
        text += `\n  • ${article.title}\n`;
        text += `    ${article.url}\n`;
        if (article.summary) {
          text += `    ${article.summary}\n`;
        }
      }
    }
    text += `\n`;
  }

  const sourceNames = digests.map(d => d.source).join(' • ');
  text += `\n${'─'.repeat(50)}\n\n`;
  text += `┌──────────────────────────────────────────────────┐\n`;
  text += `│  💡 Gostou deste digest?                        │\n`;
  text += `│  Partilhe com amigos e colegas!                 │\n`;
  text += `└──────────────────────────────────────────────────┘\n\n`;
  text += `📰 NewsDigest - As notícias que importam, 3x por dia\n`;
  text += `📡 Fontes: ${sourceNames}\n`;
  text += `© ${new Date().getFullYear()} NewsDigest. Feito com ❤️ em Portugal.\n`;

  return text;
}

export async function sendDigestEmail(
  recipientEmail: string,
  digests: SourceDigest[],
  nbaScores?: NBAScores
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

  const topHeadlines = getTopHeadlines(digests, 1); // Just need top 1 for subject
  const topStory = topHeadlines[0]?.title || 'Your news digest is ready';
  const subject = `📰 ${timeOfDay} (${dateStr}): ${topStory.slice(0, 60)}${topStory.length > 60 ? '...' : ''}`;

  const mailOptions = {
    from: `"News Digest" <${config.user}>`,
    to: recipientEmail,
    subject,
    text: formatDigestText(digests, nbaScores),
    html: formatDigestHTML(digests, nbaScores),
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
