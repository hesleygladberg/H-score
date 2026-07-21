export interface DutchingSelection {
  score: string;      // placar, ex: "1-0"
  odd: number;        // odd do mercado
  probability: number; // probabilidade calculada pelo modelo (0 a 1)
}

export interface DutchingResult {
  totalStake: number;
  coverage: number;       // probabilidade total coberta (soma das prob. reais)
  impliedProbability: number; // C = soma das inversas das odds
  roi: number;            // ROI estimado da operação
  ev: number;             // EV estimado da operação
  potentialReturn: number; // Retorno bruto se vencer
  netProfit: number;      // Lucro líquido se vencer
  selections: {
    score: string;
    odd: number;
    probability: number;
    individualStake: number; // quanto apostar neste placar
    pctOfTotal: number;      // percentual da banca total
    return: number;          // retorno individual deste placar
  }[];
}

export function calculateDutching(selections: DutchingSelection[], totalStake: number): DutchingResult {
  if (!selections || selections.length === 0 || totalStake <= 0) {
    return {
      totalStake,
      coverage: 0,
      impliedProbability: 0,
      roi: 0,
      ev: 0,
      potentialReturn: 0,
      netProfit: 0,
      selections: []
    };
  }

  // C = soma de (1 / odd)
  const impliedProbability = selections.reduce((acc, sel) => acc + (1.0 / (sel.odd || 1)), 0);
  
  // Cobertura = soma das probabilidades reais calculadas pelo modelo
  const coverage = selections.reduce((acc, sel) => acc + sel.probability, 0);

  // Retorno Potencial = Stake / C
  const potentialReturn = impliedProbability > 0 ? totalStake / impliedProbability : 0;
  
  // Lucro Líquido = Retorno Potencial - Stake
  const netProfit = potentialReturn - totalStake;
  
  // ROI = (Lucro / Stake)
  const roi = totalStake > 0 ? netProfit / totalStake : 0;
  
  // EV = Cobertura / C - 1
  const ev = impliedProbability > 0 ? (coverage / impliedProbability) - 1 : 0;

  // Calcular distribuição individual de stakes
  const calculatedSelections = selections.map(sel => {
    // Stake individual = Stake / (Odd * C)
    const individualStake = impliedProbability > 0 ? totalStake / ((sel.odd || 1) * impliedProbability) : 0;
    const pctOfTotal = totalStake > 0 ? (individualStake / totalStake) * 100 : 0;
    
    return {
      score: sel.score,
      odd: sel.odd,
      probability: sel.probability,
      individualStake: parseFloat(individualStake.toFixed(2)),
      pctOfTotal: parseFloat(pctOfTotal.toFixed(1)),
      return: parseFloat((individualStake * sel.odd).toFixed(2))
    };
  });

  return {
    totalStake,
    coverage: parseFloat(coverage.toFixed(4)),
    impliedProbability: parseFloat(impliedProbability.toFixed(4)),
    roi: parseFloat(roi.toFixed(4)),
    ev: parseFloat(ev.toFixed(4)),
    potentialReturn: parseFloat(potentialReturn.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    selections: calculatedSelections
  };
}
