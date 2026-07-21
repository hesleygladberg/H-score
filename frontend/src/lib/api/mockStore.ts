// Mock Store contendo dados esportivos de alta fidelidade para fallbacks no frontend

export interface League {
  id: number;
  name: string;
  country: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  country: string;
}

export interface Match {
  id: number;
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  date: Date;
  status: string; // 'FT', 'NS', '1H', etc.
  homeGoals: number | null;
  awayGoals: number | null;
  venue?: string;
  referee?: string;
}

export function generateMockStore() {
  const leagues: League[] = [
    { id: 2013, name: 'Campeonato Brasileiro Série A', country: 'Brazil' },
    { id: 2021, name: 'Premier League', country: 'England' },
    { id: 2014, name: 'La Liga', country: 'Spain' },
    { id: 2019, name: 'Serie A', country: 'Italy' },
    { id: 2002, name: 'Bundesliga', country: 'Germany' }
  ];

  const teams: Team[] = [];
  const teamNamesByLeague: Record<number, string[]> = {
    2013: ['Flamengo', 'Palmeiras', 'São Paulo', 'Atlético Mineiro', 'Corinthians', 'Grêmio', 'Fluminense', 'Botafogo'],
    2021: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham', 'Aston Villa', 'Newcastle'],
    2014: ['Real Madrid', 'Barcelona', 'Atlético de Madrid', 'Real Sociedad', 'Girona', 'Athletic Club', 'Betis', 'Sevilla'],
    2019: ['Inter de Milão', 'Juventus', 'Milan', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina'],
    2002: ['Bayern de Munique', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'Stuttgart', 'Eintracht Frankfurt', 'Freiburg', 'Hoffenheim']
  };

  let teamId = 1;
  const leagueTeamIds: Record<number, number[]> = {};

  for (const league of leagues) {
    leagueTeamIds[league.id] = [];
    const names = teamNamesByLeague[league.id] || [];
    for (const name of names) {
      teams.push({
        id: teamId,
        name,
        logo: null,
        country: league.country
      });
      leagueTeamIds[league.id].push(teamId);
      teamId++;
    }
  }

  const matches: Match[] = [];
  const odds: any[] = [];
  const stats: any[] = [];
  const lineups: any[] = [];
  let matchId = 1;
  let oddsId = 1;

  // Gerar histórico de partidas concluídas (FT)
  const today = new Date();
  
  for (const league of leagues) {
    const tIds = leagueTeamIds[league.id];
    
    // Gerar 30 rodadas de partidas simuladas
    for (let round = 1; round <= 25; round++) {
      const roundDate = new Date(today);
      roundDate.setDate(today.getDate() - (26 - round));
      
      // Criar emparelhamentos simples
      for (let i = 0; i < tIds.length; i += 2) {
        const homeTeamId = tIds[(i + round) % tIds.length];
        const awayTeamId = tIds[(i + round + 1) % tIds.length];
        
        // Simular gols usando médias plausíveis
        const homeGoals = Math.floor(Math.random() * 4);
        const awayGoals = Math.floor(Math.random() * 3);
        
        const matchObj: Match = {
          id: matchId++,
          leagueId: league.id,
          homeTeamId,
          awayTeamId,
          date: new Date(roundDate),
          status: 'FT',
          homeGoals,
          awayGoals,
          venue: `${teams.find(t => t.id === homeTeamId)?.name} Stadium`,
          referee: `Referee ${i + 1}`
        };
        
        matches.push(matchObj);
        
        // Estatísticas
        stats.push({
          matchId: matchObj.id,
          teamId: homeTeamId,
          xg: parseFloat((1.0 + homeGoals * 0.4 + Math.random() * 0.3).toFixed(2)),
          goalsFor: homeGoals,
          shots: 10 + homeGoals * 2,
          shotsOnTarget: 3 + homeGoals,
          possession: 55,
          corners: 6,
          cards: 2,
          matches: 1
        });
        
        stats.push({
          matchId: matchObj.id,
          teamId: awayTeamId,
          xg: parseFloat((0.8 + awayGoals * 0.4 + Math.random() * 0.3).toFixed(2)),
          goalsFor: awayGoals,
          shots: 8 + awayGoals * 2,
          shotsOnTarget: 2 + awayGoals,
          possession: 45,
          corners: 4,
          cards: 3,
          matches: 1
        });
      }
    }

    // Gerar jogos de hoje (NS - Not Started)
    const roundDate = new Date(today);
    for (let i = 0; i < tIds.length; i += 2) {
      const homeTeamId = tIds[i];
      const awayTeamId = tIds[i + 1];
      
      const matchObj: Match = {
        id: matchId++,
        leagueId: league.id,
        homeTeamId,
        awayTeamId,
        date: new Date(roundDate),
        status: 'NS',
        homeGoals: null,
        awayGoals: null,
        venue: `${teams.find(t => t.id === homeTeamId)?.name} Stadium`,
        referee: `Referee ${i + 1}`
      };
      
      matches.push(matchObj);
      
      // Odds do Mercado 1X2 e mercados de gols
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: '1X2', selection: '1', odd: parseFloat((1.75 + Math.random() * 0.9).toFixed(2)), bookmaker: 'Bet365' });
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: '1X2', selection: 'X', odd: parseFloat((3.10 + Math.random() * 0.5).toFixed(2)), bookmaker: 'Bet365' });
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: '1X2', selection: '2', odd: parseFloat((2.50 + Math.random() * 1.5).toFixed(2)), bookmaker: 'Bet365' });
      
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: 'Over/Under 2.5', selection: 'Over', odd: parseFloat((1.80 + Math.random() * 0.3).toFixed(2)), bookmaker: 'Bet365' });
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: 'Over/Under 2.5', selection: 'Under', odd: parseFloat((1.75 + Math.random() * 0.3).toFixed(2)), bookmaker: 'Bet365' });
      
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: 'BTTS', selection: 'Sim', odd: parseFloat((1.65 + Math.random() * 0.2).toFixed(2)), bookmaker: 'Bet365' });
      odds.push({ id: `o-${oddsId++}`, matchId: matchObj.id, market: 'BTTS', selection: 'Não', odd: parseFloat((1.90 + Math.random() * 0.3).toFixed(2)), bookmaker: 'Bet365' });

      // Escalações
      const positions = ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-Campo', 'Atacante'];
      for (let k = 1; k <= 11; k++) {
        lineups.push({
          id: `lineup-h-${matchObj.id}-${k}`,
          matchId: matchObj.id,
          teamId: homeTeamId,
          playerName: `Jogador Casa ${k}`,
          position: positions[k % 5],
          starter: true,
          injured: false,
          suspended: false
        });
        lineups.push({
          id: `lineup-a-${matchObj.id}-${k}`,
          matchId: matchObj.id,
          teamId: awayTeamId,
          playerName: `Jogador Fora ${k}`,
          position: positions[k % 5],
          starter: true,
          injured: false,
          suspended: false
        });
      }
    }
  }

  return {
    leagues,
    teams,
    matches,
    odds,
    stats,
    lineups
  };
}
