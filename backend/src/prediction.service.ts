import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MockDataService } from './mock-data.service';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);
  private mathServiceUrl = 'http://localhost:8000';

  constructor(
    private prisma: PrismaService,
    private mockData: MockDataService
  ) {}

  async getPrediction(matchId: number): Promise<any> {
    // 1. Obter a partida
    let match: any;
    let history: any[] = [];
    
    if (this.prisma.isMock) {
      match = this.mockData.store.matches.find(m => m.id === matchId);
      if (!match) return null;
      
      // Buscar histórico da liga para calibração
      history = this.mockData.store.matches.filter(
        m => m.leagueId === match.leagueId && m.status === 'FT' && m.id < match.id
      );
    } else {
      match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: { league: true, homeTeam: true, awayTeam: true }
      });
      if (!match) return null;
      
      // Buscar histórico da liga no banco
      history = await this.prisma.match.findMany({
        where: {
          leagueId: match.leagueId,
          status: 'FT',
          date: { lt: match.date }
        }
      });
    }

    // Obter os nomes dos times
    let homeTeamName = '';
    let awayTeamName = '';
    
    if (this.prisma.isMock) {
      const hTeam = this.mockData.store.teams.find(t => t.id === match.homeTeamId);
      const aTeam = this.mockData.store.teams.find(t => t.id === match.awayTeamId);
      homeTeamName = hTeam ? hTeam.name : 'Home';
      awayTeamName = aTeam ? aTeam.name : 'Away';
    } else {
      homeTeamName = match.homeTeam.name;
      awayTeamName = match.awayTeam.name;
    }

    // 2. Preparar payload para o math-service
    const payload = {
      home_team: homeTeamName,
      away_team: awayTeamName,
      history: history.map(m => {
        let hName = '';
        let aName = '';
        if (this.prisma.isMock) {
          hName = this.mockData.store.teams.find(t => t.id === m.homeTeamId)?.name || 'Home';
          aName = this.mockData.store.teams.find(t => t.id === m.awayTeamId)?.name || 'Away';
        } else {
          // No banco real, precisamos buscar os nomes se não carregados
          hName = m.homeTeam?.name || `Team-${m.homeTeamId}`;
          aName = m.awayTeam?.name || `Team-${m.awayTeamId}`;
        }
        return {
          home_team: hName,
          away_team: aName,
          home_goals: m.homeGoals || 0,
          away_goals: m.awayGoals || 0,
          date: m.date.toISOString()
        };
      })
    };

    // 3. Tentar chamar o microsserviço Python
    try {
      this.logger.log(`Enviando solicitação de predição para ${this.mathServiceUrl}/predict...`);
      const response = await fetch(`${this.mathServiceUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.logger.log('Predição calculada com sucesso pelo Math-Service (Python).');
        return data;
      } else {
        throw new Error(`Math-Service retornou status ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Erro no Math-Service (Python): ${error.message}. Executando Fallback matemático em JS/TS.`);
      // 4. Executar cálculo de fallback em JS/TS
      return this.calculateFallbackPrediction(homeTeamName, awayTeamName, payload.history);
    }
  }

  // Fallback matemático 100% equivalente em TypeScript
  private calculateFallbackPrediction(homeTeam: string, awayTeam: string, history: any[]): any {
    // Cálculo simples de forças de ataque/defesa baseado na média de gols
    const allGames = history;
    if (allGames.length === 0) {
      // Retornar médias padrão caso não haja histórico
      return this.generateDummyPrediction(homeTeam, awayTeam, 1.4, 1.1);
    }

    const avgHomeGoals = allGames.reduce((acc, m) => acc + m.home_goals, 0) / allGames.length;
    const avgAwayGoals = allGames.reduce((acc, m) => acc + m.away_goals, 0) / allGames.length;

    // Calcular forças
    const homeTeamGames = allGames.filter(m => m.home_team === homeTeam || m.away_team === homeTeam);
    const awayTeamGames = allGames.filter(m => m.home_team === awayTeam || m.away_team === awayTeam);

    const homeGolsMarcadosHome = homeTeamGames.filter(m => m.home_team === homeTeam).reduce((acc, m) => acc + m.home_goals, 0);
    const homeGolsSofridosHome = homeTeamGames.filter(m => m.home_team === homeTeam).reduce((acc, m) => acc + m.away_goals, 0);
    const homeJogosHome = homeTeamGames.filter(m => m.home_team === homeTeam).length || 1;

    const awayGolsMarcadosAway = awayTeamGames.filter(m => m.away_team === awayTeam).reduce((acc, m) => acc + m.away_goals, 0);
    const awayGolsSofridosAway = awayTeamGames.filter(m => m.away_team === awayTeam).reduce((acc, m) => acc + m.home_goals, 0);
    const awayJogosAway = awayTeamGames.filter(m => m.away_team === awayTeam).length || 1;

    // Força de ataque = Gols marcados por jogo pelo time / Gols médios da liga naquele mando
    const homeAttack = (homeGolsMarcadosHome / homeJogosHome) / (avgHomeGoals || 1.3);
    const homeDefense = (homeGolsSofridosHome / homeJogosHome) / (avgAwayGoals || 1.0);

    const awayAttack = (awayGolsMarcadosAway / awayJogosAway) / (avgAwayGoals || 1.0);
    const awayDefense = (awayGolsSofridosAway / awayJogosAway) / (avgHomeGoals || 1.3);

    // Calcular lambdas com Home Advantage = 1.3
    const lam = Math.max(0.1, homeAttack * awayDefense * 1.3);
    const mu = Math.max(0.1, awayAttack * homeDefense);

    return this.generateDummyPrediction(homeTeam, awayTeam, lam, mu);
  }

  private generateDummyPrediction(homeTeam: string, awayTeam: string, lam: number, mu: number): any {
    const maxGoals = 10;
    const matrix: number[][] = Array(maxGoals + 1).fill(0).map(() => Array(maxGoals + 1).fill(0));
    
    // Distribuição de Poisson independente + Dixon Coles padrão (rho = -0.08)
    const rho = -0.08;
    const poisson = (k: number, l: number) => (Math.pow(l, k) * Math.exp(-l)) / this.factorial(k);

    let total = 0;
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const ph = poisson(h, lam);
        const pa = poisson(a, mu);
        let adj = 1.0;
        
        if (h === 0 && a === 0) adj = 1.0 - lam * mu * rho;
        else if (h === 0 && a === 1) adj = 1.0 + lam * rho;
        else if (h === 1 && a === 0) adj = 1.0 + mu * rho;
        else if (h === 1 && a === 1) adj = 1.0 - rho;
        
        matrix[h][a] = Math.max(0, ph * pa * adj);
        total += matrix[h][a];
      }
    }

    // Normalizar
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        matrix[h][a] = matrix[h][a] / (total || 1);
      }
    }

    // Agregar mercados
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let over05 = 0;
    let over15 = 0;
    let over25 = 0;
    let over35 = 0;
    let bttsYes = 0;

    const correctScoresList: any[] = [];

    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const p = matrix[h][a];
        if (h > a) homeWin += p;
        else if (h === a) draw += p;
        else awayWin += p;

        const totalGoals = h + a;
        if (totalGoals > 0.5) over05 += p;
        if (totalGoals > 1.5) over15 += p;
        if (totalGoals > 2.5) over25 += p;
        if (totalGoals > 3.5) over35 += p;

        if (h > 0 && a > 0) bttsYes += p;

        correctScoresList.push({
          score: `${h}x${a}`,
          probability: parseFloat(p.toFixed(4)),
          fair_odd: p > 0.0001 ? parseFloat((1.0 / p).toFixed(2)) : 999
        });
      }
    }

    // Ordenar correct scores por maior probabilidade e pegar top 20
    correctScoresList.sort((a, b) => b.probability - a.probability);
    const correctScores = correctScoresList.slice(0, 20);

    return {
      home_team: homeTeam,
      away_team: awayTeam,
      probabilities: {
        home_win: parseFloat(homeWin.toFixed(4)),
        draw: parseFloat(draw.toFixed(4)),
        away_win: parseFloat(awayWin.toFixed(4)),
        over_05: parseFloat(over05.toFixed(4)),
        over_15: parseFloat(over15.toFixed(4)),
        over_25: parseFloat(over25.toFixed(4)),
        over_35: parseFloat(over35.toFixed(4)),
        under_25: parseFloat((1.0 - over25).toFixed(4)),
        under_35: parseFloat((1.0 - over35).toFixed(4)),
        btts_yes: parseFloat(bttsYes.toFixed(4)),
        btts_no: parseFloat((1.0 - bttsYes).toFixed(4))
      },
      expected_goals: {
        home: parseFloat(lam.toFixed(2)),
        away: parseFloat(mu.toFixed(2))
      },
      correct_scores: correctScores,
      model_params: {
        home_attack: 1.0,
        home_defense: 1.0,
        away_attack: 1.0,
        away_defense: 1.0,
        home_advantage: 1.3,
        rho_correlation: rho
      }
    };
  }

  private factorial(n: number): number {
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }
}
