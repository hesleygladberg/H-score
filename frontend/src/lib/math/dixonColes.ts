// Motor de Dixon-Coles & Poisson em TypeScript para precificação e simulação de futebol

interface MatchHistoryItem {
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  date: string;
}

export function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function poisson(k: number, lambdaValue: number): number {
  return (Math.pow(lambdaValue, k) * Math.exp(-lambdaValue)) / factorial(k);
}

export function calculateDixonColesPrediction(
  homeTeam: string,
  awayTeam: string,
  history: MatchHistoryItem[]
) {
  const maxGoals = 10;
  const rho = -0.08; // Parâmetro de correlação Dixon-Coles padrão

  if (history.length === 0) {
    // Retornar médias padrão caso não haja histórico suficiente
    return generatePredictionFromLambdas(homeTeam, awayTeam, 1.4, 1.1, rho);
  }

  // 1. Médias gerais da liga
  const avgHomeGoals = history.reduce((acc, m) => acc + m.home_goals, 0) / history.length;
  const avgAwayGoals = history.reduce((acc, m) => acc + m.away_goals, 0) / history.length;

  // 2. Filtrar histórico de cada equipe
  const homeTeamGames = history.filter(m => m.home_team === homeTeam || m.away_team === homeTeam);
  const awayTeamGames = history.filter(m => m.home_team === awayTeam || m.away_team === awayTeam);

  const homeGoalsScoredHome = homeTeamGames.filter(m => m.home_team === homeTeam).reduce((acc, m) => acc + m.home_goals, 0);
  const homeGoalsConcededHome = homeTeamGames.filter(m => m.home_team === homeTeam).reduce((acc, m) => acc + m.away_goals, 0);
  const homeMatchesHome = homeTeamGames.filter(m => m.home_team === homeTeam).length || 1;

  const awayGoalsScoredAway = awayTeamGames.filter(m => m.away_team === awayTeam).reduce((acc, m) => acc + m.away_goals, 0);
  const awayGoalsConcededAway = awayTeamGames.filter(m => m.away_team === awayTeam).reduce((acc, m) => acc + m.home_goals, 0);
  const awayMatchesAway = awayTeamGames.filter(m => m.away_team === awayTeam).length || 1;

  // 3. Calcular forças individuais
  const homeAttack = (homeGoalsScoredHome / homeMatchesHome) / (avgHomeGoals || 1.3);
  const homeDefense = (homeGoalsConcededHome / homeMatchesHome) / (avgAwayGoals || 1.0);

  const awayAttack = (awayGoalsScoredAway / awayMatchesAway) / (avgAwayGoals || 1.0);
  const awayDefense = (awayGoalsConcededAway / awayMatchesAway) / (avgHomeGoals || 1.3);

  // 4. Calcular lambdas teóricos (Home Advantage = 1.35)
  const lambdaHome = Math.max(0.1, homeAttack * awayDefense * 1.35);
  const lambdaAway = Math.max(0.1, awayAttack * homeDefense);

  return generatePredictionFromLambdas(homeTeam, awayTeam, lambdaHome, lambdaAway, rho);
}

export function generatePredictionFromLambdas(
  homeTeam: string,
  awayTeam: string,
  lambdaHome: number,
  lambdaAway: number,
  rho: number
) {
  const maxGoals = 8;
  const matrix: number[][] = Array(maxGoals + 1).fill(0).map(() => Array(maxGoals + 1).fill(0));
  let total = 0;

  // Dixon-Coles grid builder
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const ph = poisson(h, lambdaHome);
      const pa = poisson(a, lambdaAway);
      let adj = 1.0;

      // Correção de dependência Dixon-Coles para placares baixos
      if (h === 0 && a === 0) adj = 1.0 - lambdaHome * lambdaAway * rho;
      else if (h === 0 && a === 1) adj = 1.0 + lambdaHome * rho;
      else if (h === 1 && a === 0) adj = 1.0 + lambdaAway * rho;
      else if (h === 1 && a === 1) adj = 1.0 - rho;

      matrix[h][a] = Math.max(0, ph * pa * adj);
      total += matrix[h][a];
    }
  }

  // Normalizar a matriz probabilística para somar exatamente 1.0
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      matrix[h][a] = matrix[h][a] / (total || 1);
    }
  }

  // Agregações de Mercados
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
        score: `${h}-${a}`,
        probability: parseFloat((p * 100).toFixed(2)), // salvar como percentual (0 a 100)
        fairOdd: p > 0.0001 ? parseFloat((1.0 / p).toFixed(2)) : 999.0
      });
    }
  }

  // Obter Top 20 correct scores ordenados
  correctScoresList.sort((a, b) => b.probability - a.probability);
  const correctScores = correctScoresList.slice(0, 20);

  return {
    homeTeam,
    awayTeam,
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
    expectedGoals: {
      home: parseFloat(lambdaHome.toFixed(2)),
      away: parseFloat(lambdaAway.toFixed(2))
    },
    correctScores
  };
}
