import axios from 'axios';

export interface PlayerStat {
  name: string;
  value: string;
}

export interface NBAGame {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away';
  homeTopScorer: PlayerStat;
  awayTopScorer: PlayerStat;
  homeTopRebounder: PlayerStat;
  awayTopRebounder: PlayerStat;
  homeTopAssists: PlayerStat;
  awayTopAssists: PlayerStat;
}

export interface NBAScores {
  games: NBAGame[];
  date: string;
  error?: string;
}

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  score: string;
  team: {
    abbreviation: string;
    displayName: string;
  };
  leaders?: Array<{
    name: string;
    displayName: string;
    leaders: Array<{
      displayValue: string;
      value?: number;
      athlete: {
        displayName: string;
      };
    }>;
  }>;
}

interface ESPNLeader {
  name: string;
  displayName: string;
  leaders: Array<{
    displayValue: string;
    athlete: {
      displayName: string;
    };
  }>;
}

interface ESPNEvent {
  status: {
    type: {
      completed: boolean;
      description: string;
    };
  };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    leaders?: ESPNLeader[];
  }>;
}

interface ESPNResponse {
  events: ESPNEvent[];
  day: {
    date: string;
  };
}

/**
 * Fetch NBA scores from ESPN API
 */
export async function fetchNBAScores(): Promise<NBAScores> {
  const games: NBAGame[] = [];

  try {
    const dateStr = getYesterdayDate();

    // ESPN's public API endpoint for NBA scoreboard
    const response = await axios.get<ESPNResponse>(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        // Only include completed games
        if (!event.status?.type?.completed) continue;

        const competition = event.competitions?.[0];
        if (!competition?.competitors) continue;

        const home = competition.competitors.find(c => c.homeAway === 'home');
        const away = competition.competitors.find(c => c.homeAway === 'away');

        if (!home || !away) continue;

        const homeScore = parseInt(home.score) || 0;
        const awayScore = parseInt(away.score) || 0;

        // Helper to extract a leader stat from a competitor
        const getLeaderStat = (
          competitor: ESPNCompetitor,
          category: string
        ): { name: string; value: number; displayValue: string } | null => {
          const leader = competitor.leaders?.find(
            l => l.name === category || l.displayName?.toLowerCase() === category
          );
          const stat = leader?.leaders?.[0];
          if (stat) {
            return {
              name: stat.athlete?.displayName || 'Unknown',
              value: parseFloat(stat.value?.toString() || stat.displayValue) || 0,
              displayValue: stat.displayValue,
            };
          }
          return null;
        };

        // Get top scorer for each team
        const homeScorerData = getLeaderStat(home, 'points');
        const awayScorerData = getLeaderStat(away, 'points');

        const homeTopScorer: PlayerStat = homeScorerData
          ? { name: homeScorerData.name, value: `${homeScorerData.displayValue} PTS` }
          : { name: 'N/A', value: '' };

        const awayTopScorer: PlayerStat = awayScorerData
          ? { name: awayScorerData.name, value: `${awayScorerData.displayValue} PTS` }
          : { name: 'N/A', value: '' };

        // Get top rebounder for each team
        const homeRebounderData = getLeaderStat(home, 'rebounds');
        const awayRebounderData = getLeaderStat(away, 'rebounds');

        const homeTopRebounder: PlayerStat = homeRebounderData
          ? { name: homeRebounderData.name, value: `${homeRebounderData.displayValue} REB` }
          : { name: 'N/A', value: '' };

        const awayTopRebounder: PlayerStat = awayRebounderData
          ? { name: awayRebounderData.name, value: `${awayRebounderData.displayValue} REB` }
          : { name: 'N/A', value: '' };

        // Get top assists for each team
        const homeAssistsData = getLeaderStat(home, 'assists');
        const awayAssistsData = getLeaderStat(away, 'assists');

        const homeTopAssists: PlayerStat = homeAssistsData
          ? { name: homeAssistsData.name, value: `${homeAssistsData.displayValue} AST` }
          : { name: 'N/A', value: '' };

        const awayTopAssists: PlayerStat = awayAssistsData
          ? { name: awayAssistsData.name, value: `${awayAssistsData.displayValue} AST` }
          : { name: 'N/A', value: '' };

        games.push({
          homeTeam: home.team?.abbreviation || home.team?.displayName || 'HOME',
          awayTeam: away.team?.abbreviation || away.team?.displayName || 'AWAY',
          homeScore,
          awayScore,
          winner: homeScore > awayScore ? 'home' : 'away',
          homeTopScorer,
          awayTopScorer,
          homeTopRebounder,
          awayTopRebounder,
          homeTopAssists,
          awayTopAssists,
        });
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
