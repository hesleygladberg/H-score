import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Tipagem para armazenamento em memória (Fallback Mock)
export interface MockStore {
  leagues: any[];
  teams: any[];
  matches: any[];
  standings: any[];
  players: any[];
  lineups: any[];
  teamStats: any[];
  odds: any[];
  predictions: any[];
  correctScores: any[];
  dutchings: any[];
  bankroll: { bankroll: number; defaultStake: number; maxRisk: number };
  bankrollHistory: any[];
}

@Injectable()
export class MockDataService implements OnModuleInit {
  private readonly logger = new Logger(MockDataService.name);
  
  // Banco de dados em memória temporário
  public store: MockStore = {
    leagues: [],
    teams: [],
    matches: [],
    standings: [],
    players: [],
    lineups: [],
    teamStats: [],
    odds: [],
    predictions: [],
    correctScores: [],
    dutchings: [],
    bankroll: { bankroll: 1000, defaultStake: 50, maxRisk: 100 },
    bankrollHistory: [
      { id: '1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), balance: 1000, profit: 0, roi: 0 },
    ]
  };

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Inicializando geração de dados simulados (Mock)...');
    this.generateAllMockData();
    
    // Se o banco real estiver ativo, podemos semear os dados lá caso esteja vazio
    if (!this.prisma.isMock) {
      try {
        const count = await this.prisma.league.count();
        if (count === 0) {
          this.logger.log('Banco de dados PostgreSQL real está vazio. Semeando dados...');
          await this.seedDatabase();
        } else {
          this.logger.log('Banco de dados PostgreSQL já contém dados. Pulando semeadura.');
        }
      } catch (error) {
        this.logger.error('Erro ao semear banco de dados PostgreSQL:', error.message);
      }
    }
  }

  private generateAllMockData() {
    // 1. Ligas da V1
    const leaguesData = [
      { id: 1, name: 'Brasileirão Série A', country: 'Brazil', season: '2026' },
      { id: 2, name: 'Premier League', country: 'England', season: '2025/2026' },
      { id: 3, name: 'La Liga', country: 'Spain', season: '2025/2026' },
      { id: 4, name: 'Serie A Itália', country: 'Italy', season: '2025/2026' },
      { id: 5, name: 'Bundesliga', country: 'Germany', season: '2025/2026' }
    ];
    this.store.leagues = leaguesData;

    // 2. Times por Liga (20 por liga, exceto Bundesliga que tem 18)
    const teamsByLeague: Record<number, string[]> = {
      1: [ // Brasileirão
        'Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Grêmio', 'Atlético-MG', 'Botafogo', 'Fluminense',
        'Athletico-PR', 'Internacional', 'Fortaleza', 'Bahia', 'Vasco', 'Cruzeiro', 'Santos', 'Red Bull Bragantino',
        'Cuiabá', 'Juventude', 'Criciúma', 'Atlético-GO'
      ],
      2: [ // Premier League
        'Man City', 'Arsenal', 'Liverpool', 'Aston Villa', 'Tottenham', 'Chelsea', 'Man United', 'Newcastle',
        'West Ham', 'Brighton', 'Bournemouth', 'Crystal Palace', 'Wolves', 'Fulham', 'Everton', 'Brentford',
        'Nottingham Forest', 'Leicester', 'Ipswich', 'Southampton'
      ],
      3: [ // La Liga
        'Real Madrid', 'Barcelona', 'Girona', 'Atlético Madrid', 'Athletic Club', 'Real Sociedad', 'Real Betis',
        'Villarreal', 'Valencia', 'Alavés', 'Osasuna', 'Getafe', 'Celta Vigo', 'Sevilla', 'Mallorca', 'Las Palmas',
        'Rayo Vallecano', 'Valladolid', 'Leganés', 'Espanyol'
      ],
      4: [ // Serie A
        'Inter', 'Milan', 'Juventus', 'Atalanta', 'Bologna', 'Roma', 'Lazio', 'Fiorentina', 'Torino', 'Napoli',
        'Genoa', 'Monza', 'Verona', 'Lecce', 'Udinese', 'Cagliari', 'Empoli', 'Parma', 'Como', 'Venezia'
      ],
      5: [ // Bundesliga
        'Leverkusen', 'Stuttgart', 'Bayern Munich', 'RB Leipzig', 'Dortmund', 'Frankfurt', 'Hoffenheim',
        'Heidenheim', 'Werder Bremen', 'Freiburg', 'Augsburg', 'Wolfsburg', 'Mönchengladbach', 'Mainz',
        'Bochum', 'Union Berlin', 'St. Pauli', 'Holstein Kiel'
      ]
    };

    let globalTeamId = 1;
    let globalPlayerId = 1;

    for (const [leagueIdStr, teamNames] of Object.entries(teamsByLeague)) {
      const leagueId = parseInt(leagueIdStr);
      const league = leaguesData.find(l => l.id === leagueId)!;
      
      const leagueTeams: any[] = [];
      
      teamNames.forEach((name, index) => {
        const teamId = globalTeamId++;
        const logoUrl = `https://media.api-sports.io/football/teams/${teamId}.png`; // Url simulada
        const teamObj = {
          id: teamId,
          leagueId: league.id,
          name,
          logo: logoUrl,
          country: league.country
        };
        this.store.teams.push(teamObj);
        leagueTeams.push(teamObj);

        // Gerar Jogadores por Time (15 jogadores: 11 titulares padrão, 4 reservas)
        const positions = ['Goalkeeper', 'Defender', 'Defender', 'Defender', 'Defender', 'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder', 'Attacker', 'Attacker', 'Attacker', 'Attacker', 'Goalkeeper', 'Defender'];
        for (let i = 0; i < 15; i++) {
          const pId = globalPlayerId++;
          this.store.players.push({
            id: pId,
            teamId,
            name: `${name} Player ${i + 1}`,
            position: positions[i],
            injured: Math.random() < 0.08,     // 8% de chance de lesão
            suspended: Math.random() < 0.04    // 4% de chance de suspensão
          });
        }
      });

      // 3. Gerar Partidas (Histórico de jogos jogados, jogos de hoje, e jogos futuros)
      // Vamos simular um campeonato em andamento. Digamos que estamos na rodada 25.
      // Rodadas 1 a 24 estão jogadas (com placares e estatísticas).
      // Rodada 25 é HOJE (jogos hoje, alguns em andamento, alguns planejados).
      // Rodadas 26 a 38 são futuras (planejadas, com odds).
      
      const numTeams = leagueTeams.length;
      const rounds = numTeams % 2 === 0 ? numTeams - 1 : numTeams;
      const matchesPerRound = Math.floor(numTeams / 2);
      
      // Algoritmo de Berger para gerar a tabela de jogos
      let matchId = (leagueId - 1) * 400 + 1;
      
      for (let r = 0; r < rounds * 2; r++) { // Ida e Volta (38 rodadas para 20 times)
        const roundNum = r + 1;
        const roundDate = new Date();
        // Definir data da rodada relativa a hoje
        // Rodada 25 (HOJE): diferença = 0 dias
        const roundDiffDays = (roundNum - 25) * 7;
        roundDate.setDate(roundDate.getDate() + roundDiffDays);
        
        for (let m = 0; m < matchesPerRound; m++) {
          let homeIndex = (r + m) % (numTeams - 1);
          let awayIndex = (numTeams - 1 - m + r) % (numTeams - 1);
          
          if (m === 0) {
            awayIndex = numTeams - 1;
          }
          
          // Alternar mandante e visitante no returno
          if (roundNum > rounds) {
            const temp = homeIndex;
            homeIndex = awayIndex;
            awayIndex = temp;
          }
          
          const homeTeam = leagueTeams[homeIndex];
          const awayTeam = leagueTeams[awayIndex];
          
          const mDate = new Date(roundDate);
          mDate.setHours(12 + (m % 3) * 3, 0, 0, 0); // Horários variados
          
          let status = 'NS'; // Not Started
          let homeGoals = null;
          let awayGoals = null;
          
          if (roundNum < 25) {
            status = 'FT'; // Full Time
            // Gerar placar realista baseado em forças fictícias
            // Vantagem de casa + força aleatória
            const baseHome = 1.3 + (homeIndex % 3) * 0.3;
            const baseAway = 0.9 + (awayIndex % 3) * 0.3;
            homeGoals = this.randomPoisson(baseHome);
            awayGoals = this.randomPoisson(baseAway);
          } else if (roundNum === 25) {
            // Alguns jogos concluídos, alguns ao vivo, alguns planejados
            const randomState = Math.random();
            if (randomState < 0.4) {
              status = 'FT';
              homeGoals = this.randomPoisson(1.5);
              awayGoals = this.randomPoisson(1.1);
            } else if (randomState < 0.6) {
              status = '1H'; // Live, primeiro tempo
              homeGoals = this.randomPoisson(0.7);
              awayGoals = this.randomPoisson(0.5);
            } else {
              status = 'NS';
            }
          }
          
          const matchObj = {
            id: matchId++,
            leagueId: league.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            date: mDate,
            status,
            round: `Rodada ${roundNum}`,
            venue: `${homeTeam.name} Stadium`,
            referee: `Arbitro ${m + 1}`,
            homeGoals,
            awayGoals
          };
          this.store.matches.push(matchObj);
          
          // Se a partida foi concluída, gerar estatísticas detalhadas da partida
          if (status === 'FT') {
            const hGoals = homeGoals!;
            const aGoals = awayGoals!;
            
            // Gerar xG realista
            const hXG = Math.max(0.2, hGoals + (Math.random() - 0.5));
            const aXG = Math.max(0.2, aGoals + (Math.random() - 0.5));
            
            // Estatísticas
            const stats = [
              { matchId: matchObj.id, teamId: homeTeam.id, xg: hXG, shots: hGoals * 3 + 4, shotsOnTarget: hGoals + 2, possession: 52, corners: 5, cards: 2 },
              { matchId: matchObj.id, teamId: awayTeam.id, xg: aXG, shots: awayGoals * 3 + 3, shotsOnTarget: awayGoals + 1, possession: 48, corners: 4, cards: 3 }
            ];
            
            // Guardamos em listas locais que depois agregaremos no TeamStats
          }

          // Se a partida não começou (NS) ou é de hoje, gerar as Odds do mercado
          if (status === 'NS') {
            // Gerar odds realistas baseadas nas forças relativas
            const probHome = 0.45 + (homeIndex % 3) * 0.05 - (awayIndex % 3) * 0.05;
            const probDraw = 0.25;
            const probAway = 1.0 - probHome - probDraw;
            
            const oddHome = parseFloat((1.0 / probHome).toFixed(2));
            const oddDraw = parseFloat((1.0 / probDraw).toFixed(2));
            const oddAway = parseFloat((1.0 / probAway).toFixed(2));

            // Cadastrar Odds 1X2
            this.store.odds.push({ id: `o-1x2-h-${matchObj.id}`, matchId: matchObj.id, market: '1X2', selection: 'Home', odd: oddHome, bookmaker: 'Bet365', updatedAt: new Date() });
            this.store.odds.push({ id: `o-1x2-d-${matchObj.id}`, matchId: matchObj.id, market: '1X2', selection: 'Draw', odd: oddDraw, bookmaker: 'Bet365', updatedAt: new Date() });
            this.store.odds.push({ id: `o-1x2-a-${matchObj.id}`, matchId: matchObj.id, market: '1X2', selection: 'Away', odd: oddAway, bookmaker: 'Bet365', updatedAt: new Date() });
            
            // Odds Over/Under 2.5
            const probOver = 0.48 + Math.random() * 0.1;
            const oddOver = parseFloat((1.0 / probOver).toFixed(2));
            const oddUnder = parseFloat((1.0 / (1.0 - probOver)).toFixed(2));
            this.store.odds.push({ id: `o-ou-over-${matchObj.id}`, matchId: matchObj.id, market: 'Over/Under 2.5', selection: 'Over', odd: oddOver, bookmaker: 'Bet365', updatedAt: new Date() });
            this.store.odds.push({ id: `o-ou-under-${matchObj.id}`, matchId: matchObj.id, market: 'Over/Under 2.5', selection: 'Under', odd: oddUnder, bookmaker: 'Bet365', updatedAt: new Date() });

            // Odds BTTS
            const probBTTS = 0.52 + (Math.random() - 0.5) * 0.1;
            const oddBTTSYes = parseFloat((1.0 / probBTTS).toFixed(2));
            const oddBTTSNo = parseFloat((1.0 / (1.0 - probBTTS)).toFixed(2));
            this.store.odds.push({ id: `o-btts-yes-${matchObj.id}`, matchId: matchObj.id, market: 'BTTS', selection: 'Yes', odd: oddBTTSYes, bookmaker: 'Bet365', updatedAt: new Date() });
            this.store.odds.push({ id: `o-btts-no-${matchObj.id}`, matchId: matchObj.id, market: 'BTTS', selection: 'No', odd: oddBTTSNo, bookmaker: 'Bet365', updatedAt: new Date() });
          }
        }
      }
    }

    // 4. Calcular Standings e TeamStats com base nos jogos 'FT'
    this.recalculateStandingsAndTeamStats();
    
    // 5. Gerar Escalações padrão para todas as partidas
    this.generateMatchLineups();
    
    this.logger.log(`Dados em memória gerados: ${this.store.leagues.length} ligas, ${this.store.teams.length} times, ${this.store.matches.length} partidas, ${this.store.players.length} jogadores.`);
  }

  private recalculateStandingsAndTeamStats() {
    this.store.standings = [];
    this.store.teamStats = [];

    const statsMap: Record<number, any> = {};

    // Inicializar mapas para cada time
    this.store.teams.forEach(team => {
      statsMap[team.id] = {
        teamId: team.id,
        season: team.leagueId === 1 ? '2026' : '2025/2026',
        matches: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0,
        xg: 0.0, xga: 0.0,
        shots: 0, shotsOnTarget: 0, corners: 0, cards: 0, possession: 0.0
      };
    });

    // Processar partidas finalizadas
    this.store.matches.forEach(match => {
      if (match.status !== 'FT') return;
      
      const homeStats = statsMap[match.homeTeamId];
      const awayStats = statsMap[match.awayTeamId];
      
      const hg = match.homeGoals!;
      const ag = match.awayGoals!;
      
      homeStats.matches++;
      awayStats.matches++;
      homeStats.goalsFor += hg;
      homeStats.goalsAgainst += ag;
      awayStats.goalsFor += ag;
      awayStats.goalsAgainst += hg;

      // xG simulado
      const hXG = hg + (Math.random() - 0.5);
      const aXG = ag + (Math.random() - 0.5);
      homeStats.xg += Math.max(0.1, hXG);
      homeStats.xga += Math.max(0.1, aXG);
      awayStats.xg += Math.max(0.1, aXG);
      awayStats.xga += Math.max(0.1, hXG);

      // Chutes, Cantos, Posse simulados
      homeStats.shots += hg * 3 + 5;
      awayStats.shots += ag * 3 + 4;
      homeStats.shotsOnTarget += hg + 2;
      awayStats.shotsOnTarget += ag + 1;
      homeStats.corners += 3 + Math.floor(Math.random() * 6);
      awayStats.corners += 2 + Math.floor(Math.random() * 5);
      homeStats.cards += Math.floor(Math.random() * 4);
      awayStats.cards += Math.floor(Math.random() * 5);
      
      const hPoss = 40 + Math.random() * 20;
      homeStats.possession += hPoss;
      awayStats.possession += (100 - hPoss);

      if (hg > ag) {
        homeStats.wins++;
        awayStats.losses++;
      } else if (hg === ag) {
        homeStats.draws++;
        awayStats.draws++;
      } else {
        homeStats.losses++;
        awayStats.wins++;
      }
    });

    // Finalizar médias de estatísticas e salvar no store
    Object.keys(statsMap).forEach(key => {
      const stats = statsMap[parseInt(key)];
      if (stats.matches > 0) {
        stats.possession = parseFloat((stats.possession / stats.matches).toFixed(1));
        stats.xg = parseFloat((stats.xg).toFixed(1)); // Acumulado
        stats.xga = parseFloat((stats.xga).toFixed(1)); // Acumulado
      }
      this.store.teamStats.push({
        id: `ts-${stats.teamId}`,
        ...stats
      });
    });

    // Calcular tabela de classificação (Standings) por Liga
    this.store.leagues.forEach(league => {
      const leagueTeams = this.store.teams.filter(t => t.leagueId === league.id);
      const standingsList = leagueTeams.map(team => {
        const stats = statsMap[team.id];
        const points = stats.wins * 3 + stats.draws;
        const gd = stats.goalsFor - stats.goalsAgainst;
        return {
          leagueId: league.id,
          teamId: team.id,
          points,
          wins: stats.wins,
          draws: stats.draws,
          losses: stats.losses,
          gf: stats.goalsFor,
          ga: stats.goalsAgainst,
          gd,
          position: 1 // Temporário
        };
      });

      // Ordenar classificação
      standingsList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

      // Atribuir posições
      standingsList.forEach((standing, index) => {
        standing.position = index + 1;
        this.store.standings.push({
          id: `s-${league.id}-${standing.teamId}`,
          ...standing
        });
      });
    });
  }

  private generateMatchLineups() {
    this.store.lineups = [];
    
    // Gerar escalações para partidas de Hoje e Recentes (digamos, ID de 1 a 150 para economizar memória e performance em memória)
    const matchesToScale = this.store.matches.filter(m => m.id <= 150 || m.status === 'FT');

    matchesToScale.forEach(match => {
      const homePlayers = this.store.players.filter(p => p.teamId === match.homeTeamId);
      const awayPlayers = this.store.players.filter(p => p.teamId === match.awayTeamId);
      
      const homeStarters = homePlayers.slice(0, 11);
      const awayStarters = awayPlayers.slice(0, 11);
      
      homeStarters.forEach(player => {
        this.store.lineups.push({
          id: `l-${match.id}-${player.id}`,
          matchId: match.id,
          teamId: match.homeTeamId,
          playerId: player.id,
          starter: true,
          formation: '4-3-3'
        });
      });

      awayStarters.forEach(player => {
        this.store.lineups.push({
          id: `l-${match.id}-${player.id}`,
          matchId: match.id,
          teamId: match.awayTeamId,
          playerId: player.id,
          starter: true,
          formation: '4-4-2'
        });
      });
    });
  }

  private randomPoisson(lambda: number): number {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  // Método de Semeadura para o Banco de Dados Real (Supabase)
  private async seedDatabase() {
    try {
      // 1. Semeando Ligas
      for (const league of this.store.leagues) {
        await this.prisma.league.create({ data: league });
      }
      this.logger.log('Ligas semeadas.');

      // 2. Semeando Times
      for (const team of this.store.teams) {
        await this.prisma.team.create({
          data: {
            id: team.id,
            name: team.name,
            logo: team.logo,
            country: team.country
          }
        });
      }
      this.logger.log('Times semeados.');

      // 3. Semeando Jogadores
      // Para o banco, semeamos em blocos para ser mais rápido
      await this.prisma.player.createMany({ data: this.store.players });
      this.logger.log('Jogadores semeados.');

      // 4. Semeando Partidas
      // Para evitar timeouts no migrate, dividiremos as partidas em lotes e pegaremos apenas as primeiras 300 para o banco
      const matchesToSeed = this.store.matches.slice(0, 300).map(m => ({
        id: m.id,
        leagueId: m.leagueId,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        date: m.date,
        status: m.status,
        round: m.round,
        venue: m.venue,
        referee: m.referee
      }));
      await this.prisma.match.createMany({ data: matchesToSeed });
      this.logger.log('Partidas semeadas.');

      // 5. Semeando Classificação
      const standingsToSeed = this.store.standings.filter(s => s.teamId <= 300).map(s => ({
        id: s.id,
        leagueId: s.leagueId,
        teamId: s.teamId,
        position: s.position,
        points: s.points,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        gf: s.gf,
        ga: s.ga,
        gd: s.gd
      }));
      await this.prisma.standing.createMany({ data: standingsToSeed });

      // 6. Semeando Estatísticas
      const statsToSeed = this.store.teamStats.map(s => ({
        id: s.id,
        teamId: s.teamId,
        season: s.season,
        matches: s.matches,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        xg: s.xg,
        xga: s.xga,
        shots: s.shots,
        shotsOnTarget: s.shotsOnTarget,
        corners: s.corners,
        cards: s.cards,
        possession: s.possession
      }));
      await this.prisma.teamStats.createMany({ data: statsToSeed });

      // 7. Semeando Odds
      const oddsToSeed = this.store.odds.slice(0, 500).map(o => ({
        id: o.id,
        matchId: o.matchId,
        market: o.market,
        selection: o.selection,
        odd: o.odd,
        bookmaker: o.bookmaker,
        updatedAt: o.updatedAt
      }));
      await this.prisma.odds.createMany({ data: oddsToSeed });
      
      // 8. Banca inicial
      await this.prisma.bankroll.create({
        data: {
          id: 'active',
          bankroll: 1000,
          defaultStake: 50,
          maxRisk: 100
        }
      });

      this.logger.log('Semeadura concluída com sucesso no banco de dados real!');
    } catch (e) {
      this.logger.error('Falha ao semear banco de dados PostgreSQL real. Continuando em modo isolado.', e.stack);
    }
  }
}
