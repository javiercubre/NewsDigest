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
  homeTopSteals: PlayerStat;
  awayTopSteals: PlayerStat;
  homeTopBlocks: PlayerStat;
  awayTopBlocks: PlayerStat;
}

export interface PlayerOfTheNight {
  name: string;
  team: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  gameScore: number; // Calculated performance score
  matchup: string; // e.g., "LAL vs BOS"
}

export interface FeaturedPlayerStats {
  name: string;
  team: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  minutes: string;
  matchup: string;
  didPlay: boolean;
}

export interface NBAScores {
  games: NBAGame[];
  date: string;
  playerOfTheNight?: PlayerOfTheNight;
  neemiasQueta?: FeaturedPlayerStats;
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
  id: string;
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

// Box score interfaces for detailed player stats
interface ESPNBoxScorePlayer {
  displayName: string;
  stats?: string[]; // Stats array: [MIN, FG, 3PT, FT, OREB, DREB, REB, AST, STL, BLK, TO, PF, +/-, PTS]
}

interface ESPNBoxScoreAthlete {
  athlete: ESPNBoxScorePlayer;
  stats?: string[];
}

interface ESPNBoxScoreTeam {
  team: {
    abbreviation: string;
    displayName: string;
  };
  statistics: Array<{
    athletes: ESPNBoxScoreAthlete[];
  }>;
}

interface ESPNBoxScoreResponse {
  boxscore: {
    players: ESPNBoxScoreTeam[];
  };
}

interface PlayerGameStats {
  name: string;
  team: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  matchup: string;
}

interface ESPNResponse {
  events: ESPNEvent[];
  day: {
    date: string;
  };
}

/**
 * Calculate a game score for a player's performance
 * Formula: PTS + 0.4*REB + 0.7*AST + 2*STL + 2*BLK
 * This weights defensive plays (steals, blocks) highly since they're rarer
 */
function calculateGameScore(stats: PlayerGameStats): number {
  return (
    stats.points +
    0.4 * stats.rebounds +
    0.7 * stats.assists +
    2 * stats.steals +
    2 * stats.blocks
  );
}

interface TeamLeaders {
  steals: { name: string; value: number };
  blocks: { name: string; value: number };
}

interface BoxScoreResult {
  players: PlayerGameStats[];
  neemiasQueta?: FeaturedPlayerStats;
  teamLeaders: Record<string, TeamLeaders>; // keyed by team abbreviation
}

/**
 * Fetch detailed box score for a game and extract all player stats
 * Also specifically looks for Neemias Queta
 */
async function fetchGameBoxScore(
  gameId: string,
  matchup: string
): Promise<BoxScoreResult> {
  const players: PlayerGameStats[] = [];
  let neemiasQueta: FeaturedPlayerStats | undefined;
  const teamLeaders: Record<string, TeamLeaders> = {};

  try {
    const response = await axios.get<ESPNBoxScoreResponse>(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    const boxscore = response.data?.boxscore;
    if (!boxscore?.players) return { players, teamLeaders };

    for (const team of boxscore.players) {
      const teamAbbr = team.team?.abbreviation || 'UNK';

      // Initialize team leaders tracking
      let topSteals = { name: 'N/A', value: 0 };
      let topBlocks = { name: 'N/A', value: 0 };

      for (const statGroup of team.statistics || []) {
        for (const athleteData of statGroup.athletes || []) {
          const athlete = athleteData.athlete;
          const stats = athleteData.stats;

          if (!athlete?.displayName || !stats || stats.length < 10) continue;

          // ESPN stats array order: MIN, PTS, FG, 3PT, FT, REB, AST, TO, STL, BLK, OREB, DREB, PF, +/-
          // Index:                    0    1   2    3   4    5    6   7    8    9    10    11  12   13
          const minutes = stats[0];
          const points = parseInt(stats[1]) || 0;
          const rebounds = parseInt(stats[5]) || 0;
          const assists = parseInt(stats[6]) || 0;
          const steals = parseInt(stats[8]) || 0;
          const blocks = parseInt(stats[9]) || 0;

          // Check if this is Neemias Queta
          if (athlete.displayName.toLowerCase().includes('neemias queta') ||
              athlete.displayName.toLowerCase().includes('queta')) {
            neemiasQueta = {
              name: athlete.displayName,
              team: teamAbbr,
              points,
              rebounds,
              assists,
              steals,
              blocks,
              minutes,
              matchup,
              didPlay: minutes !== '0' && minutes !== 'DNP' && minutes !== '--',
            };
          }

          // Skip players who didn't play (DNP)
          if (minutes === '0' || minutes === 'DNP' || minutes === '--') continue;

          // Track team leaders for steals and blocks
          if (steals > topSteals.value) {
            topSteals = { name: athlete.displayName, value: steals };
          }
          if (blocks > topBlocks.value) {
            topBlocks = { name: athlete.displayName, value: blocks };
          }

          players.push({
            name: athlete.displayName,
            team: teamAbbr,
            points,
            rebounds,
            assists,
            steals,
            blocks,
            matchup,
          });
        }
      }

      // Store team leaders
      teamLeaders[teamAbbr] = {
        steals: topSteals,
        blocks: topBlocks,
      };
    }
  } catch (error) {
    // Silently fail for individual game box scores - we'll still have scoreboard data
    console.log(`Failed to fetch box score for game ${gameId}`);
  }

  return { players, neemiasQueta, teamLeaders };
}

// Maps game ID to team leaders for steals/blocks
type GameLeadersMap = Record<string, Record<string, TeamLeaders>>;

interface NightlyStatsResult {
  playerOfTheNight?: PlayerOfTheNight;
  neemiasQueta?: FeaturedPlayerStats;
  gameLeaders: GameLeadersMap;
}

/**
 * Find the Player of the Night from all games and track Neemias Queta
 */
async function findNightlyStats(
  gameIds: Array<{ id: string; matchup: string }>
): Promise<NightlyStatsResult> {
  const gameLeaders: GameLeadersMap = {};

  if (gameIds.length === 0) return { gameLeaders };

  const allPlayers: PlayerGameStats[] = [];
  let neemiasQueta: FeaturedPlayerStats | undefined;

  // Fetch box scores for all games in parallel
  const boxScorePromises = gameIds.map((game) =>
    fetchGameBoxScore(game.id, game.matchup)
  );
  const results = await Promise.all(boxScorePromises);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const gameId = gameIds[i].id;

    allPlayers.push(...result.players);

    // Store team leaders for this game
    gameLeaders[gameId] = result.teamLeaders;

    // Track Neemias Queta if found in any game
    if (result.neemiasQueta) {
      neemiasQueta = result.neemiasQueta;
    }
  }

  // Calculate game scores and find the best performer
  let bestPlayer: PlayerGameStats | null = null;
  let bestGameScore = -1;

  for (const player of allPlayers) {
    const gameScore = calculateGameScore(player);
    if (gameScore > bestGameScore) {
      bestGameScore = gameScore;
      bestPlayer = player;
    }
  }

  const playerOfTheNight = bestPlayer
    ? {
        name: bestPlayer.name,
        team: bestPlayer.team,
        points: bestPlayer.points,
        rebounds: bestPlayer.rebounds,
        assists: bestPlayer.assists,
        steals: bestPlayer.steals,
        blocks: bestPlayer.blocks,
        gameScore: Math.round(bestGameScore * 10) / 10,
        matchup: bestPlayer.matchup,
      }
    : undefined;

  return { playerOfTheNight, neemiasQueta, gameLeaders };
}

/**
 * Fetch NBA scores from ESPN API
 */
export async function fetchNBAScores(): Promise<NBAScores> {
  const games: NBAGame[] = [];
  const completedGameIds: Array<{ id: string; matchup: string }> = [];

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
        const homeAbbr = home.team?.abbreviation || 'HOME';
        const awayAbbr = away.team?.abbreviation || 'AWAY';

        // Track game ID for Player of the Night calculation
        completedGameIds.push({
          id: event.id,
          matchup: `${awayAbbr} @ ${homeAbbr}`,
        });

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

        // Steals and blocks will be populated from box scores later
        // (not available in scoreboard API)
        games.push({
          homeTeam: homeAbbr,
          awayTeam: awayAbbr,
          homeScore,
          awayScore,
          winner: homeScore > awayScore ? 'home' : 'away',
          homeTopScorer,
          awayTopScorer,
          homeTopRebounder,
          awayTopRebounder,
          homeTopAssists,
          awayTopAssists,
          homeTopSteals: { name: 'N/A', value: '' },
          awayTopSteals: { name: 'N/A', value: '' },
          homeTopBlocks: { name: 'N/A', value: '' },
          awayTopBlocks: { name: 'N/A', value: '' },
        });
      }
    }

    // Find Player of the Night, track Neemias Queta, and get steals/blocks leaders
    const { playerOfTheNight, neemiasQueta, gameLeaders } = await findNightlyStats(completedGameIds);

    // Update games with steals/blocks leaders from box scores
    for (let i = 0; i < games.length; i++) {
      const gameId = completedGameIds[i]?.id;
      const leaders = gameLeaders[gameId];
      if (leaders) {
        const game = games[i];
        const homeLeaders = leaders[game.homeTeam];
        const awayLeaders = leaders[game.awayTeam];

        if (homeLeaders) {
          game.homeTopSteals = homeLeaders.steals.value > 0
            ? { name: homeLeaders.steals.name, value: `${homeLeaders.steals.value} STL` }
            : { name: 'N/A', value: '0 STL' };
          game.homeTopBlocks = homeLeaders.blocks.value > 0
            ? { name: homeLeaders.blocks.name, value: `${homeLeaders.blocks.value} BLK` }
            : { name: 'N/A', value: '0 BLK' };
        }
        if (awayLeaders) {
          game.awayTopSteals = awayLeaders.steals.value > 0
            ? { name: awayLeaders.steals.name, value: `${awayLeaders.steals.value} STL` }
            : { name: 'N/A', value: '0 STL' };
          game.awayTopBlocks = awayLeaders.blocks.value > 0
            ? { name: awayLeaders.blocks.name, value: `${awayLeaders.blocks.value} BLK` }
            : { name: 'N/A', value: '0 BLK' };
        }
      }
    }

    return {
      games,
      date: getFormattedYesterday(),
      playerOfTheNight,
      neemiasQueta,
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
