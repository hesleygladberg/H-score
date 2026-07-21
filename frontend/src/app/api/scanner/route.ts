import { NextResponse } from 'next/server';
import { getRealMatchesToday, getRealTeamHistory } from '@/lib/api/footballData';
import { calculateDixonColesPrediction } from '@/lib/math/dixonColes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minEV = parseFloat(searchParams.get('minEV') || '2') / 100; // default 2%
  const minProb = parseFloat(searchParams.get('minProb') || '20') / 100; // default 20%

  try {
    // Buscar partidas de hoje não iniciadas (para encontrar valor futuro)
    const matches = await getRealMatchesToday();
    const scheduledMatches = matches.filter((m: any) => m.status === 'NS');

    const opportunities: any[] = [];

    for (const match of scheduledMatches) {
      let history: any[] = [];
      try {
        const homeHistory = await getRealTeamHistory(match.homeTeamId);
        const awayHistory = await getRealTeamHistory(match.awayTeamId);
        history = [...homeHistory, ...awayHistory];
      } catch (err) {
        // Ignorar
      }

      // Predição Dixon-Coles
      const pred = calculateDixonColesPrediction(match.homeTeam, match.awayTeam, history);
      const odds = match.odds || { home: 2.10, draw: 3.30, away: 3.40, over25: 1.95, under25: 1.85, bttsYes: 1.75, bttsNo: 1.95 };

      // Mercados para escanear
      const markets = [
        { name: 'Vitória Mandante (1)', prob: pred.probabilities.home_win, odd: odds.home },
        { name: 'Empate (X)', prob: pred.probabilities.draw, odd: odds.draw },
        { name: 'Vitória Visitante (2)', prob: pred.probabilities.away_win, odd: odds.away },
        { name: 'Over 2.5 Gols', prob: pred.probabilities.over_25, odd: odds.over25 },
        { name: 'Under 2.5 Gols', prob: pred.probabilities.under_25, odd: odds.under25 },
        { name: 'Ambas Marcam: Sim', prob: pred.probabilities.btts_yes, odd: odds.bttsYes },
        { name: 'Ambas Marcam: Não', prob: pred.probabilities.btts_no, odd: odds.bttsNo }
      ];

      for (const mkt of markets) {
        const ev = (mkt.prob * mkt.odd) - 1.0;
        if (mkt.prob >= minProb && ev >= minEV) {
          opportunities.push({
            matchId: match.id,
            time: match.time,
            match: `${match.homeTeam} x ${match.awayTeam}`,
            market: mkt.name,
            probability: parseFloat((mkt.prob * 100).toFixed(1)),
            fairOdd: mkt.prob > 0 ? parseFloat((1.0 / mkt.prob).toFixed(2)) : 999,
            marketOdd: mkt.odd,
            ev: parseFloat((ev * 100).toFixed(1))
          });
        }
      }
    }

    // Ordenar de maior EV para menor EV
    opportunities.sort((a, b) => b.ev - a.ev);

    return NextResponse.json(opportunities);
  } catch (error: any) {
    console.error('Erro na rota de scanner:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
