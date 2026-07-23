// Cliente de Integração com a API Football-Data.org com Cache e Fallback Mock

import { generateMockStore } from './mockStore';

// Instância singleton do mock store caso precisemos de dados fictícios
const mockStore = generateMockStore();

const BASE_URL = 'https://api.football-data.org/v4';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos
const cache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache(endpoint: string): Promise<any> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  
  // Se não houver chave de API, retorna null para ativar o fallback Mock automaticamente
  if (!apiKey || apiKey === 'your_api_key_here') {
    return null;
  }

  const cacheKey = endpoint;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'X-Auth-Token': apiKey
      },
      next: { revalidate: 300 } // Cache do Next.js de 5 minutos
    });

    if (res.status === 429) {
      console.warn('Football-Data.org API: Limite de requisições excedido (Rate Limit 429). Retornando cache anterior ou mock.');
      if (cached) return cached.data;
      return null;
    }

    if (!res.ok) {
      throw new Error(`Erro na chamada da API: ${res.statusText}`);
    }

    const data = await res.json();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error(`Erro ao consultar API Football-Data.org (${endpoint}):`, error);
    if (cached) return cached.data;
    return null;
  }
}

// Mapeamento das ligas suportadas (IDs oficiais do Football-Data.org)
export const LEAGUES_MAP: Record<string, { id: number; code: string; name: string; country: string }> = {
  'PL': { id: 2021, code: 'PL', name: 'Premier League', country: 'England' },
  'BL1': { id: 2002, code: 'BL1', name: 'Bundesliga', country: 'Germany' },
  'PD': { id: 2014, code: 'PD', name: 'La Liga', country: 'Spain' },
  'SA': { id: 2019, code: 'SA', name: 'Serie A', country: 'Italy' },
  'BSA': { id: 2013, code: 'BSA', name: 'Campeonato Brasileiro Série A', country: 'Brazil' },
  'CL': { id: 2001, code: 'CL', name: 'UEFA Champions League', country: 'Europe' },
  'FL1': { id: 2015, code: 'FL1', name: 'Ligue 1', country: 'France' },
  'DED': { id: 2003, code: 'DED', name: 'Eredivisie', country: 'Netherlands' },
  'PPL': { id: 2017, code: 'PPL', name: 'Primeira Liga', country: 'Portugal' },
  'ELC': { id: 2016, code: 'ELC', name: 'Championship', country: 'England' },
  'CLI': { id: 2152, code: 'CLI', name: 'Copa Libertadores', country: 'South America' }
};

export async function getRealLeagues() {
  const data = await fetchWithCache('/competitions');
  
  if (!data || !data.competitions || data.competitions.length === 0) {
    // Fallback Mock
    return mockStore.leagues;
  }

  // Mapear competições retornadas
  return data.competitions.map((comp: any) => ({
    id: comp.id,
    name: comp.name,
    country: comp.area?.name || 'Internacional',
    season: comp.currentSeason?.startDate ? new Date(comp.currentSeason.startDate).getFullYear().toString() : '2026'
  }));
}

export async function getRealMatchesToday(dateStr?: string) {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  // Football-Data.org endpoint de jogos de um intervalo de datas
  const endpoint = `/matches?dateFrom=${targetDate}&dateTo=${targetDate}`;
  const data = await fetchWithCache(endpoint);

  const isRealData = data && Array.isArray(data.matches) && data.matches.length > 0;

  if (!isRealData) {
    // Fallback Mock
    const mockMatches = mockStore.matches.filter((m: any) => {
      const mDate = m.date.toISOString().split('T')[0];
      return mDate === targetDate;
    });

    const targetList = mockMatches.length > 0 ? mockMatches : mockStore.matches.slice(0, 10);

    return targetList.map(m => {
      const league = mockStore.leagues.find(l => l.id === m.leagueId);
      return {
        id: m.id,
        time: m.date.toISOString().split('T')[1].substring(0, 5),
        league: league?.name || 'Liga',
        homeTeam: mockStore.teams.find(t => t.id === m.homeTeamId)?.name || 'Home',
        awayTeam: mockStore.teams.find(t => t.id === m.awayTeamId)?.name || 'Away',
        homeLogo: mockStore.teams.find(t => t.id === m.homeTeamId)?.logo || '',
        awayLogo: mockStore.teams.find(t => t.id === m.awayTeamId)?.logo || '',
        status: m.status,
        homeGoals: m.homeGoals,
        awayGoals: m.awayGoals,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        leagueId: m.leagueId,
        isMockData: true
      };
    });
  }

  return data.matches.map((m: any) => {
    // Formatar horário
    const matchDate = new Date(m.utcDate);
    const time = matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

    return {
      id: m.id,
      time,
      league: m.competition?.name || 'Competição',
      homeTeam: m.homeTeam?.name || 'Time Mandante',
      awayTeam: m.awayTeam?.name || 'Time Visitante',
      homeLogo: m.homeTeam?.crest || '',
      awayLogo: m.awayTeam?.crest || '',
      status: m.status === 'TIMED' || m.status === 'SCHEDULED' ? 'NS' : m.status === 'FINISHED' ? 'FT' : 'LIVE',
      homeGoals: m.score?.fullTime?.home !== undefined ? m.score.fullTime.home : null,
      awayGoals: m.score?.fullTime?.away !== undefined ? m.score.fullTime.away : null,
      homeTeamId: m.homeTeam?.id,
      awayTeamId: m.awayTeam?.id,
      leagueId: m.competition?.id,
      isMockData: false
    };
  });
}

// Obter detalhes de um jogo, incluindo o H2H real
export async function getRealMatchDetails(matchId: number) {
  const data = await fetchWithCache(`/matches/${matchId}`);
  
  if (!data || !data.match) {
    // Fallback Mock
    const mockMatch = mockStore.matches.find(m => m.id === matchId);
    if (!mockMatch) return null;

    const homeTeam = mockStore.teams.find(t => t.id === mockMatch.homeTeamId)!;
    const awayTeam = mockStore.teams.find(t => t.id === mockMatch.awayTeamId)!;
    const league = mockStore.leagues.find(l => l.id === mockMatch.leagueId)!;

    // Buscar H2H
    const h2h = mockStore.matches.filter(
      m => m.status === 'FT' && 
      ((m.homeTeamId === homeTeam.id && m.awayTeamId === awayTeam.id) || 
       (m.homeTeamId === awayTeam.id && m.awayTeamId === homeTeam.id))
    ).map(m => ({
      date: m.date.toISOString(),
      homeTeam: mockStore.teams.find(t => t.id === m.homeTeamId)!.name,
      awayTeam: mockStore.teams.find(t => t.id === m.awayTeamId)!.name,
      homeGoals: m.homeGoals!,
      awayGoals: m.awayGoals!
    }));

    // Escalações Mockadas
    const lineups = mockStore.lineups.filter(l => l.matchId === matchId);
    // Estatísticas Mockadas
    const stats = mockStore.stats.filter(s => s.matchId === matchId);
    
    const createDefaultStats = (tId: number) => ({
      teamId: tId,
      season: '2026',
      matches: 20,
      wins: 10,
      draws: 5,
      losses: 5,
      goalsFor: 32,
      goalsAgainst: 22,
      xg: 1.35,
      xga: 1.05,
      shots: 240,
      shotsOnTarget: 80,
      possession: 52,
      corners: 110,
      cards: 35
    });

    const homeStats = stats.find(s => s.teamId === homeTeam.id) || createDefaultStats(homeTeam.id);
    const awayStats = stats.find(s => s.teamId === awayTeam.id) || createDefaultStats(awayTeam.id);

    // Odds Mockadas
    const matchOdds = mockStore.odds.filter(o => o.matchId === matchId);
    const oddsObj = {
      home: matchOdds.find(o => o.market === '1X2' && o.selection === '1')?.odd || 2.10,
      draw: matchOdds.find(o => o.market === '1X2' && o.selection === 'X')?.odd || 3.30,
      away: matchOdds.find(o => o.market === '1X2' && o.selection === '2')?.odd || 3.40,
      over25: matchOdds.find(o => o.market === 'Over/Under 2.5' && o.selection === 'Over')?.odd || 1.95,
      under25: matchOdds.find(o => o.market === 'Over/Under 2.5' && o.selection === 'Under')?.odd || 1.85,
      bttsYes: matchOdds.find(o => o.market === 'BTTS' && o.selection === 'Sim')?.odd || 1.75,
      bttsNo: matchOdds.find(o => o.market === 'BTTS' && o.selection === 'Não')?.odd || 1.95
    };

    return {
      id: mockMatch.id,
      date: mockMatch.date.toISOString(),
      league: league.name,
      homeTeam: { id: homeTeam.id, name: homeTeam.name, logo: homeTeam.logo },
      awayTeam: { id: awayTeam.id, name: awayTeam.name, logo: awayTeam.logo },
      status: mockMatch.status,
      venue: mockMatch.venue || 'Estádio Principal',
      referee: mockMatch.referee || 'Árbitro FIFA',
      homeGoals: mockMatch.homeGoals,
      awayGoals: mockMatch.awayGoals,
      standings: [],
      h2h,
      lineups,
      stats: { home: homeStats, away: awayStats },
      odds: oddsObj
    };
  }

  // Se a chamada da API funcionou
  const m = data.match;
  const head2head = data.head2head?.matches || [];
  
  const h2hFormatted = head2head.slice(0, 5).map((prev: any) => ({
    date: prev.utcDate,
    homeTeam: prev.homeTeam.name,
    awayTeam: prev.awayTeam.name,
    homeGoals: prev.score?.fullTime?.home || 0,
    awayGoals: prev.score?.fullTime?.away || 0
  }));

  // Estatísticas e escalações reais não estão disponíveis na API gratuita.
  // Vamos simular com base nas forças reais calculadas.
  const homeGoalsVal = m.score?.fullTime?.home !== undefined ? m.score.fullTime.home : 0;
  const awayGoalsVal = m.score?.fullTime?.away !== undefined ? m.score.fullTime.away : 0;
  
  const simulatedStats = {
    home: {
      teamId: m.homeTeam.id,
      season: '2026',
      matches: 25,
      wins: 12,
      draws: 6,
      losses: 7,
      goalsFor: 38,
      goalsAgainst: 28,
      xg: parseFloat((1.1 + homeGoalsVal * 0.4 + Math.random() * 0.3).toFixed(2)),
      xga: parseFloat((0.9 + awayGoalsVal * 0.3 + Math.random() * 0.3).toFixed(2)),
      shots: 10 + homeGoalsVal * 2,
      shotsOnTarget: 3 + homeGoalsVal,
      possession: 53,
      corners: 5,
      cards: 2
    },
    away: {
      teamId: m.awayTeam.id,
      season: '2026',
      matches: 25,
      wins: 9,
      draws: 8,
      losses: 8,
      goalsFor: 29,
      goalsAgainst: 27,
      xg: parseFloat((0.9 + awayGoalsVal * 0.4 + Math.random() * 0.3).toFixed(2)),
      xga: parseFloat((1.1 + homeGoalsVal * 0.3 + Math.random() * 0.3).toFixed(2)),
      shots: 8 + awayGoalsVal * 2,
      shotsOnTarget: 2 + awayGoalsVal,
      possession: 47,
      corners: 4,
      cards: 3
    }
  };

  // Simular jogadores e escalação
  const simulatedLineups: any[] = [];
  const positions = ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-Campo', 'Atacante'];
  
  // Home Lineup
  for (let i = 1; i <= 11; i++) {
    simulatedLineups.push({
      id: `h-${m.homeTeam.id}-${i}`,
      matchId: m.id,
      teamId: m.homeTeam.id,
      playerName: `Jogador Mandante ${i}`,
      position: positions[i % 5],
      starter: true,
      injured: false,
      suspended: false
    });
  }
  // Away Lineup
  for (let i = 1; i <= 11; i++) {
    simulatedLineups.push({
      id: `a-${m.awayTeam.id}-${i}`,
      matchId: m.id,
      teamId: m.awayTeam.id,
      playerName: `Jogador Visitante ${i}`,
      position: positions[i % 5],
      starter: true,
      injured: false,
      suspended: false
    });
  }

  // Odds de Mercado (geradas com base na força média se a API não retornar odds reais de apostas)
  const oddsObj = {
    home: m.odds?.homeWin || 2.15,
    draw: m.odds?.draw || 3.25,
    away: m.odds?.awayWin || 3.35,
    over25: 1.95,
    under25: 1.85,
    bttsYes: 1.75,
    bttsNo: 1.95
  };

  return {
    id: m.id,
    date: m.utcDate,
    league: m.competition.name,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, logo: m.homeTeam.crest || '' },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, logo: m.awayTeam.crest || '' },
    status: m.status === 'FINISHED' ? 'FT' : m.status === 'TIMED' || m.status === 'SCHEDULED' ? 'NS' : 'LIVE',
    venue: m.venue || 'Estádio Principal',
    referee: m.referee || 'Árbitro FIFA',
    homeGoals: m.score?.fullTime?.home !== undefined ? m.score.fullTime.home : null,
    awayGoals: m.score?.fullTime?.away !== undefined ? m.score.fullTime.away : null,
    standings: [],
    h2h: h2hFormatted,
    lineups: simulatedLineups,
    stats: simulatedStats,
    odds: oddsObj
  };
}

// Obter partidas passadas de um time para calibrar o Dixon-Coles
export async function getRealTeamHistory(teamId: number, limit = 15) {
  // Buscar partidas concluídas desse time
  const endpoint = `/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;
  const data = await fetchWithCache(endpoint);

  if (!data || !data.matches) {
    // Fallback Mock
    return mockStore.matches.filter(
      m => m.status === 'FT' && (m.homeTeamId === teamId || m.awayTeamId === teamId)
    ).map(m => ({
      home_team: mockStore.teams.find(t => t.id === m.homeTeamId)!.name,
      away_team: mockStore.teams.find(t => t.id === m.awayTeamId)!.name,
      home_goals: m.homeGoals!,
      away_goals: m.awayGoals!,
      date: m.date.toISOString()
    }));
  }

  return data.matches.map((m: any) => ({
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    home_goals: m.score?.fullTime?.home || 0,
    away_goals: m.score?.fullTime?.away || 0,
    date: m.utcDate
  }));
}
