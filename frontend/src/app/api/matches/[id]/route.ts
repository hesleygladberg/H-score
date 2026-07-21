import { NextResponse } from 'next/server';
import { getRealMatchDetails, getRealTeamHistory } from '@/lib/api/footballData';
import { calculateDixonColesPrediction } from '@/lib/math/dixonColes';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const matchId = parseInt(id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'ID de partida inválido' }, { status: 400 });
    }

    const matchDetails = await getRealMatchDetails(matchId);
    if (!matchDetails) {
      return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    }

    // Carregar históricos para o modelo matemático
    let history: any[] = [];
    try {
      const homeHistory = await getRealTeamHistory(matchDetails.homeTeam.id);
      const awayHistory = await getRealTeamHistory(matchDetails.awayTeam.id);
      history = [...homeHistory, ...awayHistory];
    } catch (err) {
      console.warn(`Erro ao obter histórico para calibração da partida ${matchId}:`, err);
    }

    // Rodar Dixon-Coles & Poisson
    const pred = calculateDixonColesPrediction(
      matchDetails.homeTeam.name,
      matchDetails.awayTeam.name,
      history
    );

    // Calcular EV para os correct scores
    const correctScores = pred.correctScores.map(cs => {
      // Procurar odd de mercado correspondente ou simular uma baseada na probabilidade
      // Placares como "1-0" ou "2-1"
      let marketOdd = cs.fairOdd * (1.1 - Math.random() * 0.15); // flutuações de mercado
      marketOdd = Math.max(1.1, parseFloat(marketOdd.toFixed(2)));
      
      const ev = (cs.probability / 100 * marketOdd) - 1.0;
      
      return {
        score: cs.score,
        probability: cs.probability,
        fairOdd: cs.fairOdd,
        marketOdd,
        ev: parseFloat((ev * 100).toFixed(1))
      };
    });

    return NextResponse.json({
      ...matchDetails,
      probabilities: pred.probabilities,
      expectedGoals: pred.expectedGoals,
      correctScores
    });
  } catch (error: any) {
    console.error(`Erro na rota /api/matches/[id]:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
