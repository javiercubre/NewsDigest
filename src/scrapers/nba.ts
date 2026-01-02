import axios from 'axios';
import * as cheerio from 'cheerio';
import { sanitizeText } from '../utils';

export interface NBAGame {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away';
  topPlayer: string;
  topPlayerStats: string;
}

export interface NBAScores {
  games: NBAGame[];
  date: string;
  error?: string;
}

/**
 * Fetch NBA scores from ESPN
 */
export async function fetchNBAScores(): Promise<NBAScores> {
  const games: NBAGame[] = [];

  try {
    // ESPN NBA scoreboard
    const response = await axios.get('https://www.espn.com/nba/scoreboard/_/date/' + getYesterdayDate(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // ESPN uses ScoreboardScoreCell components
    $('.ScoreboardScoreCell, .Scoreboard, [class*="scoreboard"]').each((_, element) => {
      const $el = $(element);

      // Try to extract team names and scores
      const teams = $el.find('[class*="TeamName"], .ScoreCell__TeamName, [class*="team-name"]');
      const scores = $el.find('[class*="ScoreCell__Score"], .ScoreCell__Score, [class*="score"]');

      if (teams.length >= 2 && scores.length >= 2) {
        const awayTeam = sanitizeText($(teams[0]).text());
        const homeTeam = sanitizeText($(teams[1]).text());
        const awayScore = parseInt($(scores[0]).text()) || 0;
        const homeScore = parseInt($(scores[1]).text()) || 0;

        if (awayTeam && homeTeam && (awayScore > 0 || homeScore > 0)) {
          // Check if game is complete
          const gameStatus = $el.find('[class*="status"], [class*="GameStatus"]').text().toLowerCase();
          if (gameStatus.includes('final') || !gameStatus.includes('pm') && !gameStatus.includes('am')) {
            const winner = homeScore > awayScore ? 'home' : 'away';

            // Try to get top player info
            const topPlayerEl = $el.find('[class*="GameLeader"], [class*="leader"]').first();
            const topPlayer = sanitizeText(topPlayerEl.find('[class*="name"], [class*="athlete"]').text()) || 'N/A';
            const topPlayerStats = sanitizeText(topPlayerEl.find('[class*="stat"], [class*="points"]').text()) || '';

            games.push({
              homeTeam,
              awayTeam,
              homeScore,
              awayScore,
              winner,
              topPlayer,
              topPlayerStats,
            });
          }
        }
      }
    });

    // Fallback: Try to parse from JSON data embedded in page
    if (games.length === 0) {
      const scriptTags = $('script').toArray();
      for (const script of scriptTags) {
        const content = $(script).html() || '';
        if (content.includes('espn.score') || content.includes('scoreboardData')) {
          try {
            // Extract JSON data
            const jsonMatch = content.match(/\{[\s\S]*"events"[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              if (data.events) {
                for (const event of data.events) {
                  if (event.competitions?.[0]?.competitors) {
                    const competitors = event.competitions[0].competitors;
                    const home = competitors.find((c: any) => c.homeAway === 'home');
                    const away = competitors.find((c: any) => c.homeAway === 'away');

                    if (home && away) {
                      const homeScore = parseInt(home.score) || 0;
                      const awayScore = parseInt(away.score) || 0;

                      // Get top performer
                      let topPlayer = 'N/A';
                      let topPlayerStats = '';
                      if (event.competitions[0].leaders?.[0]?.leaders?.[0]) {
                        const leader = event.competitions[0].leaders[0].leaders[0];
                        topPlayer = leader.athlete?.displayName || 'N/A';
                        topPlayerStats = leader.displayValue || '';
                      }

                      games.push({
                        homeTeam: home.team?.abbreviation || home.team?.name || 'HOME',
                        awayTeam: away.team?.abbreviation || away.team?.name || 'AWAY',
                        homeScore,
                        awayScore,
                        winner: homeScore > awayScore ? 'home' : 'away',
                        topPlayer,
                        topPlayerStats,
                      });
                    }
                  }
                }
              }
            }
          } catch {
            // JSON parsing failed, continue
          }
        }
      }
    }

    return {
      games,
      date: getFormattedYesterday(),
    };
  } catch (error) {
    return {
      games: [],
      date: getFormattedYesterday(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getFormattedYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if current time is morning (for digest scheduling)
 */
export function isMorningDigest(): boolean {
  const hour = new Date().getUTCHours();
  // Morning digest runs at 6:00 UTC (7:00 AM Portugal)
  return hour >= 5 && hour < 8;
}
