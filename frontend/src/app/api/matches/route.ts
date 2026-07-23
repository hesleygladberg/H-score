import { NextResponse } from 'next/server';
import { getRealMatchesToday, getRealTeamHistory } from '@/lib/api/footballData';
import { calculateDixonColesPrediction } from '@/lib/math/dixonColes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || undefined;
  const leagueIdStr = searchParams.get('leagueId');
  const lid = leagueIdStr ? parseInt(leagueIdStr) : undefined;

  try {
    const matches = await getRealMatchesToday(dateStr);
    
    // Filtrar por liga se especificado
    let filteredMatches = matches;
    if (lid) {
      filteredMatches = matches.filter((m: any) => m.leagueId === lid);
    }

    const results = [];

    for (const match of filteredMatches) {
      // Dixon-Coles sem estourar o limite de 10 req/min da API gratuita
      const history: any[] = [];

      // Calcular predições matemáticas Dixon-Coles
      const pred = calculateDixonColesPrediction(match.homeTeam, match.awayTeam, history);

      // Calcular melhor mercado
      const odds = match.odds || { home: 2.10, draw: 3.30, away: 3.40, over25: 1.95, under25: 1.85, bttsYes: 1.75, bttsNo: 1.95 };
      
      const homeWinProb = pred.probabilities.home_win;
      const drawProb = pred.probabilities.draw;
      const awayWinProb = pred.probabilities.away_win;
      
      const homeEV = (homeWinProb * odds.home) - 1.0;
      const drawEV = (drawProb * odds.draw) - 1.0;
      const awayEV = (awayWinProb * odds.away) - 1.0;
      
      let bestMarket = '1 (Casa)';
      let bestEV = homeEV;
      
      if (drawEV > bestEV) {
        bestMarket = 'X (Empate)';
        bestEV = drawEV;
      }
      if (awayEV > bestEV) {
        bestMarket = '2 (Fora)';
        bestEV = awayEV;
      }

      // Over/Under e BTTS
      const over25EV = (pred.probabilities.over_25 * odds.over25) - 1.0;
      if (over25EV > bestEV) {
        bestMarket = 'Over 2.5 Gols';
        bestEV = over25EV;
      }

      const bttsEV = (pred.probabilities.btts_yes * odds.bttsYes) - 1.0;
      if (bttsEV > bestEV) {
        bestMarket = 'Ambas Marcam: Sim';
        bestEV = bttsEV;
      }

      results.push({
        id: match.id,
        time: match.time,
        league: match.league,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeLogo: match.homeLogo,
        awayLogo: match.awayLogo,
        status: match.status,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        probabilities: pred.probabilities,
        bestMarket,
        ev: bestEV > 0 ? parseFloat((bestEV * 100).toFixed(1)) : 0,
        isMockData: match.isMockData ?? false
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Erro na rota /api/matches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
