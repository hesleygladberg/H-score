import { Controller, Get, Post, Body, Query, Param, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MockDataService } from './mock-data.service';
import { PredictionService } from './prediction.service';
import { DutchingService, DutchingSelection } from './dutching.service';

@Controller('api')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private prisma: PrismaService,
    private mockData: MockDataService,
    private predictionService: PredictionService,
    private dutchingService: DutchingService
  ) {}

  // 1. Listar jogos do dia com predições e melhor mercado
  @Get('matches')
  async getMatches(
    @Query('leagueId') leagueId?: string,
    @Query('date') dateStr?: string,
    @Query('minEV') minEVStr?: string
  ) {
    try {
      const lid = leagueId ? parseInt(leagueId) : undefined;
      const minEV = minEVStr ? parseFloat(minEVStr) : -999;
      
      let matches: any[] = [];
      
      if (this.prisma.isMock) {
        matches = [...this.mockData.store.matches];
      } else {
        matches = await this.prisma.match.findMany({
          include: { league: true }
        });
      }

      // Filtrar por liga se fornecido
      if (lid) {
        matches = matches.filter(m => m.leagueId === lid);
      }

      // Filtrar por data (padrão hoje se não passado)
      const filterDate = dateStr ? new Date(dateStr) : new Date();
      matches = matches.filter(m => {
        const mDate = new Date(m.date);
        return mDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
               mDate.getUTCMonth() === filterDate.getUTCMonth() &&
               mDate.getUTCDate() === filterDate.getUTCDate();
      });

      // Calcular predições e melhor mercado para cada jogo filtrado
      const results: any[] = [];
      for (const match of matches) {
        // Encontrar odds 1X2 para este jogo
        let oddsList: any[] = [];
        if (this.prisma.isMock) {
          oddsList = this.mockData.store.odds.filter(o => o.matchId === match.id);
        } else {
          oddsList = await this.prisma.odds.findMany({ where: { matchId: match.id } });
        }

        const pred = await this.predictionService.getPrediction(match.id);
        
        // Obter times
        let homeTeamName = '';
        let awayTeamName = '';
        let homeTeamLogo = '';
        let awayTeamLogo = '';
        let leagueName = '';

        if (this.prisma.isMock) {
          const hTeam = this.mockData.store.teams.find(t => t.id === match.homeTeamId);
          const aTeam = this.mockData.store.teams.find(t => t.id === match.awayTeamId);
          const leagueObj = this.mockData.store.leagues.find(l => l.id === match.leagueId);
          homeTeamName = hTeam?.name || '';
          awayTeamName = aTeam?.name || '';
          homeTeamLogo = hTeam?.logo || '';
          awayTeamLogo = aTeam?.logo || '';
          leagueName = leagueObj?.name || '';
        } else {
          // No banco real, buscar relações
          const hTeam = await this.prisma.team.findUnique({ where: { id: match.homeTeamId } });
          const aTeam = await this.prisma.team.findUnique({ where: { id: match.awayTeamId } });
          homeTeamName = hTeam?.name || '';
          awayTeamName = aTeam?.name || '';
          homeTeamLogo = hTeam?.logo || '';
          awayTeamLogo = aTeam?.logo || '';
          leagueName = match.league?.name || '';
        }

        // Calcular EV de cada seleção 1X2, Over/Under e encontrar a maior oportunidade
        let bestSelection = 'Nenhum Valor';
        let bestEV = -1.0;
        let bestOdd = 0.0;

        if (pred && oddsList.length > 0) {
          const markets = [
            { key: 'home_win', label: '1X2 Mandante', oddKey: 'Home', marketName: '1X2' },
            { key: 'draw', label: '1X2 Empate', oddKey: 'Draw', marketName: '1X2' },
            { key: 'away_win', label: '1X2 Visitante', oddKey: 'Away', marketName: '1X2' },
            { key: 'over_25', label: 'Over 2.5', oddKey: 'Over', marketName: 'Over/Under 2.5' },
            { key: 'under_25', label: 'Under 2.5', oddKey: 'Under', marketName: 'Over/Under 2.5' },
            { key: 'btts_yes', label: 'BTTS Sim', oddKey: 'Yes', marketName: 'BTTS' },
            { key: 'btts_no', label: 'BTTS Não', oddKey: 'No', marketName: 'BTTS' }
          ];

          markets.forEach(m => {
            const oddObj = oddsList.find(o => o.market === m.marketName && o.selection === m.oddKey);
            const prob = pred.probabilities[m.key];
            if (oddObj && prob !== undefined) {
              const ev = (prob * oddObj.odd) - 1.0;
              if (ev > bestEV && ev > 0) {
                bestEV = ev;
                bestSelection = `${m.label} (@${oddObj.odd})`;
                bestOdd = oddObj.odd;
              }
            }
          });
        }

        // Adicionar apenas se satisfizer EV mínimo
        if (bestEV >= minEV || minEV === -999) {
          results.push({
            id: match.id,
            time: new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
            league: leagueName,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeLogo: homeTeamLogo,
            awayLogo: awayTeamLogo,
            status: match.status,
            homeGoals: match.homeGoals,
            awayGoals: match.awayGoals,
            probabilities: pred?.probabilities || null,
            bestMarket: bestSelection,
            ev: bestEV > 0 ? parseFloat((bestEV * 100).toFixed(1)) : 0 // porcentagem
          });
        }
      }

      return results;
    } catch (e) {
      this.logger.error('Erro ao buscar partidas:', e.message);
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2. Obter detalhes completos de uma partida
  @Get('matches/:id')
  async getMatchDetails(@Param('id') idStr: string) {
    try {
      const matchId = parseInt(idStr);
      let match: any;
      let league: any;
      let homeTeam: any;
      let awayTeam: any;
      let standings: any[] = [];
      let homeStats: any = null;
      let awayStats: any = null;
      let h2h: any[] = [];
      let lineups: any[] = [];
      let oddsList: any[] = [];
      let players: any[] = [];

      if (this.prisma.isMock) {
        match = this.mockData.store.matches.find(m => m.id === matchId);
        if (!match) throw new HttpException('Partida não encontrada', HttpStatus.NOT_FOUND);

        league = this.mockData.store.leagues.find(l => l.id === match.leagueId);
        homeTeam = this.mockData.store.teams.find(t => t.id === match.homeTeamId);
        awayTeam = this.mockData.store.teams.find(t => t.id === match.awayTeamId);
        
        standings = this.mockData.store.standings.filter(s => s.leagueId === match.leagueId);
        
        homeStats = this.mockData.store.teamStats.find(ts => ts.teamId === match.homeTeamId);
        awayStats = this.mockData.store.teamStats.find(ts => ts.teamId === match.awayTeamId);

        h2h = this.mockData.store.matches.filter(
          m => m.status === 'FT' && 
          ((m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId) ||
           (m.homeTeamId === match.awayTeamId && m.awayTeamId === match.homeTeamId))
        ).slice(0, 5);

        lineups = this.mockData.store.lineups.filter(l => l.matchId === match.id);
        players = [...this.mockData.store.players];
        oddsList = this.mockData.store.odds.filter(o => o.matchId === match.id);
      } else {
        match = await this.prisma.match.findUnique({
          where: { id: matchId },
          include: { league: true, homeTeam: true, awayTeam: true }
        });
        if (!match) throw new HttpException('Partida não encontrada', HttpStatus.NOT_FOUND);

        league = match.league;
        homeTeam = match.homeTeam;
        awayTeam = match.awayTeam;

        standings = await this.prisma.standing.findMany({ where: { leagueId: match.leagueId } });
        homeStats = await this.prisma.teamStats.findFirst({ where: { teamId: match.homeTeamId } });
        awayStats = await this.prisma.teamStats.findFirst({ where: { teamId: match.awayTeamId } });
        
        h2h = await this.prisma.match.findMany({
          where: {
            status: 'FT',
            OR: [
              { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId },
              { homeTeamId: match.awayTeamId, awayTeamId: match.homeTeamId }
            ]
          },
          take: 5
        });

        lineups = await this.prisma.lineup.findMany({ where: { matchId: match.id } });
        players = await this.prisma.player.findMany({
          where: { OR: [{ teamId: match.homeTeamId }, { teamId: match.awayTeamId }] }
        });
        oddsList = await this.prisma.odds.findMany({ where: { matchId: match.id } });
      }

      // Enriquecer H2H com nomes dos times
      const h2hEnriched = h2h.map(m => {
        let hName = '';
        let aName = '';
        if (this.prisma.isMock) {
          hName = this.mockData.store.teams.find(t => t.id === m.homeTeamId)?.name || '';
          aName = this.mockData.store.teams.find(t => t.id === m.awayTeamId)?.name || '';
        }
        return {
          id: m.id,
          date: m.date,
          homeTeam: hName || `Time-${m.homeTeamId}`,
          awayTeam: aName || `Time-${m.awayTeamId}`,
          homeGoals: m.homeGoals,
          awayGoals: m.awayGoals
        };
      });

      // Enriquecer classificação
      const standingsEnriched = standings.map(s => {
        let tName = '';
        let tLogo = '';
        if (this.prisma.isMock) {
          const t = this.mockData.store.teams.find(team => team.id === s.teamId);
          tName = t?.name || '';
          tLogo = t?.logo || '';
        }
        return {
          position: s.position,
          teamName: tName || `Time-${s.teamId}`,
          teamLogo: tLogo,
          points: s.points,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          gf: s.gf,
          ga: s.ga,
          gd: s.gd
        };
      }).sort((a, b) => a.position - b.position);

      // Calcular predição Dixon-Coles / Monte Carlo
      const prediction = await this.predictionService.getPrediction(match.id);

      // Enriquecer escalações
      const lineupsEnriched = lineups.map(l => {
        const p = players.find(player => player.id === l.playerId);
        return {
          id: l.id,
          teamId: l.teamId,
          playerName: p?.name || 'Jogador',
          position: p?.position || 'M',
          starter: l.starter,
          injured: p?.injured || false,
          suspended: p?.suspended || false
        };
      });

      // Se for correct scores, as odds de mercado precisam ser associadas ou simuladas
      const correctScoresWithOdds = prediction?.correct_scores.map((cs: any) => {
        // Simular odd de mercado com margem de 10%
        const prob = cs.probability;
        const marketOdd = prob > 0 ? parseFloat((1.0 / (prob + 0.05 * Math.random())).toFixed(2)) : 500;
        const ev = (prob * marketOdd) - 1.0;
        
        return {
          score: cs.score,
          probability: parseFloat((prob * 100).toFixed(2)), // porcentagem
          fairOdd: cs.fair_odd,
          marketOdd: marketOdd,
          ev: parseFloat((ev * 100).toFixed(1))
        };
      }) || [];

      // Odds gerais filtradas
      const odds = {
        home: oddsList.find(o => o.market === '1X2' && o.selection === 'Home')?.odd || 2.0,
        draw: oddsList.find(o => o.market === '1X2' && o.selection === 'Draw')?.odd || 3.2,
        away: oddsList.find(o => o.market === '1X2' && o.selection === 'Away')?.odd || 3.8,
        over25: oddsList.find(o => o.market === 'Over/Under 2.5' && o.selection === 'Over')?.odd || 1.8,
        under25: oddsList.find(o => o.market === 'Over/Under 2.5' && o.selection === 'Under')?.odd || 2.0,
        bttsYes: oddsList.find(o => o.market === 'BTTS' && o.selection === 'Yes')?.odd || 1.7,
        bttsNo: oddsList.find(o => o.market === 'BTTS' && o.selection === 'No')?.odd || 2.1
      };

      return {
        id: match.id,
        date: match.date,
        league: league?.name,
        homeTeam: { id: homeTeam.id, name: homeTeam.name, logo: homeTeam.logo },
        awayTeam: { id: awayTeam.id, name: awayTeam.name, logo: awayTeam.logo },
        status: match.status,
        venue: match.venue,
        referee: match.referee,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        standings: standingsEnriched,
        h2h: h2hEnriched,
        lineups: lineupsEnriched,
        stats: {
          home: homeStats,
          away: awayStats
        },
        odds,
        probabilities: prediction?.probabilities || null,
        expectedGoals: prediction?.expected_goals || null,
        correctScores: correctScoresWithOdds
      };
    } catch (e) {
      this.logger.error(`Erro ao buscar detalhes da partida ${idStr}:`, e.message);
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. Scanner EV+
  @Get('scanner')
  async getScanner(
    @Query('minEV') minEVStr?: string,
    @Query('minProb') minProbStr?: string,
    @Query('leagueId') leagueId?: string,
    @Query('market') marketFilter?: string
  ) {
    try {
      const minEV = minEVStr ? parseFloat(minEVStr) / 100 : 0.02; // converter de % ou default 2%
      const minProb = minProbStr ? parseFloat(minProbStr) / 100 : 0.2; // default 20%
      const lid = leagueId ? parseInt(leagueId) : undefined;
      
      let matches: any[] = [];
      if (this.prisma.isMock) {
        matches = this.mockData.store.matches.filter(m => m.status === 'NS');
      } else {
        matches = await this.prisma.match.findMany({
          where: { status: 'NS' },
          include: { league: true }
        });
      }

      if (lid) {
        matches = matches.filter(m => m.leagueId === lid);
      }

      const opportunities: any[] = [];

      for (const match of matches) {
        const pred = await this.predictionService.getPrediction(match.id);
        if (!pred) continue;

        let oddsList: any[] = [];
        if (this.prisma.isMock) {
          oddsList = this.mockData.store.odds.filter(o => o.matchId === match.id);
        } else {
          oddsList = await this.prisma.odds.findMany({ where: { matchId: match.id } });
        }

        // Buscar nomes dos times
        let homeName = '';
        let awayName = '';
        if (this.prisma.isMock) {
          homeName = this.mockData.store.teams.find(t => t.id === match.homeTeamId)?.name || '';
          awayName = this.mockData.store.teams.find(t => t.id === match.awayTeamId)?.name || '';
        } else {
          const hTeam = await this.prisma.team.findUnique({ where: { id: match.homeTeamId } });
          const aTeam = await this.prisma.team.findUnique({ where: { id: match.awayTeamId } });
          homeName = hTeam?.name || '';
          awayName = aTeam?.name || '';
        }

        const markets = [
          { key: 'home_win', label: '1X2 Casa', oddKey: 'Home', marketName: '1X2' },
          { key: 'draw', label: '1X2 Empate', oddKey: 'Draw', marketName: '1X2' },
          { key: 'away_win', label: '1X2 Fora', oddKey: 'Away', marketName: '1X2' },
          { key: 'over_25', label: 'Over 2.5', oddKey: 'Over', marketName: 'Over/Under 2.5' },
          { key: 'under_25', label: 'Under 2.5', oddKey: 'Under', marketName: 'Over/Under 2.5' },
          { key: 'btts_yes', label: 'BTTS Sim', oddKey: 'Yes', marketName: 'BTTS' },
          { key: 'btts_no', label: 'BTTS Não', oddKey: 'No', marketName: 'BTTS' }
        ];

        markets.forEach(m => {
          if (marketFilter && marketFilter !== 'Todos' && !m.label.toLowerCase().includes(marketFilter.toLowerCase())) {
            return;
          }

          const oddObj = oddsList.find(o => o.market === m.marketName && o.selection === m.oddKey);
          const prob = pred.probabilities[m.key];
          
          if (oddObj && prob !== undefined && prob >= minProb) {
            const ev = (prob * oddObj.odd) - 1.0;
            if (ev >= minEV) {
              opportunities.push({
                matchId: match.id,
                time: new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
                match: `${homeName} x ${awayName}`,
                market: m.label,
                probability: parseFloat((prob * 100).toFixed(1)),
                fairOdd: parseFloat((1.0 / prob).toFixed(2)),
                marketOdd: oddObj.odd,
                ev: parseFloat((ev * 100).toFixed(1))
              });
            }
          }
        });
      }

      // Ordenar por maior EV
      return opportunities.sort((a, b) => b.ev - a.ev);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 4. Calculadora Dutching
  @Post('dutching/calculate')
  calculateDutching(@Body() body: { selections: DutchingSelection[]; totalStake: number }) {
    return this.dutchingService.calculate(body.selections, body.totalStake);
  }

  // 5. Obter Banca
  @Get('bankroll')
  async getBankroll() {
    if (this.prisma.isMock) {
      const history = this.mockData.store.bankrollHistory;
      const profit = history.reduce((acc, h) => acc + h.profit, 0);
      const initial = 1000;
      const roi = initial > 0 ? (profit / initial) * 100 : 0;
      
      return {
        bankroll: this.mockData.store.bankroll.bankroll,
        defaultStake: this.mockData.store.bankroll.defaultStake,
        maxRisk: this.mockData.store.bankroll.maxRisk,
        roi: parseFloat(roi.toFixed(1)),
        profit: parseFloat(profit.toFixed(2)),
        history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    } else {
      const settings = await this.prisma.bankroll.findUnique({ where: { id: 'active' } });
      const history = await this.prisma.bankrollHistory.findMany({
        orderBy: { date: 'desc' }
      });
      const profit = history.reduce((acc, h) => acc + h.profit, 0);
      const initial = settings?.bankroll || 1000;
      const roi = initial > 0 ? (profit / initial) * 100 : 0;

      return {
        bankroll: settings?.bankroll || 1000,
        defaultStake: settings?.defaultStake || 50,
        maxRisk: settings?.maxRisk || 100,
        roi: parseFloat(roi.toFixed(1)),
        profit: parseFloat(profit.toFixed(2)),
        history
      };
    }
  }

  // 6. Atualizar Banca / Adicionar Aposta
  @Post('bankroll')
  async updateBankroll(@Body() body: { action: 'settings' | 'bet'; data: any }) {
    if (body.action === 'settings') {
      const { bankroll, defaultStake, maxRisk } = body.data;
      if (this.prisma.isMock) {
        this.mockData.store.bankroll = { bankroll, defaultStake, maxRisk };
        return { success: true, settings: this.mockData.store.bankroll };
      } else {
        const settings = await this.prisma.bankroll.upsert({
          where: { id: 'active' },
          update: { bankroll, defaultStake, maxRisk },
          create: { id: 'active', bankroll, defaultStake, maxRisk }
        });
        return { success: true, settings };
      }
    } else if (body.action === 'bet') {
      const { profit, roi, balance } = body.data;
      const newHistory = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date(),
        balance: parseFloat(balance),
        profit: parseFloat(profit),
        roi: parseFloat(roi)
      };

      if (this.prisma.isMock) {
        this.mockData.store.bankrollHistory.push(newHistory);
        // Atualizar banca atual
        this.mockData.store.bankroll.bankroll = parseFloat(balance);
        return { success: true, transaction: newHistory };
      } else {
        const transaction = await this.prisma.bankrollHistory.create({
          data: {
            balance: parseFloat(balance),
            profit: parseFloat(profit),
            roi: parseFloat(roi)
          }
        });
        await this.prisma.bankroll.update({
          where: { id: 'active' },
          data: { bankroll: parseFloat(balance) }
        });
        return { success: true, transaction };
      }
    }
    throw new HttpException('Ação inválida', HttpStatus.BAD_REQUEST);
  }

  // 7. Listar Ligas da V1
  @Get('leagues')
  getLeagues() {
    return this.mockData.store.leagues;
  }
}
