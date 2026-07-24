'use client';

import React from 'react';
import { Calculator, Award, Zap, TrendingUp } from 'lucide-react';

interface CSScoreTopPanelProps {
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
    over_25: number;
    btts_yes: number;
  };
  mostLikelyScore?: {
    score: string;
    probability: number;
  };
  maxEvItem?: {
    score: string;
    ev: number;
  };
  homeTeamName: string;
  awayTeamName: string;
  onOpenDebugModal: () => void;
}

export default function CSScoreTopPanel({
  probabilities,
  mostLikelyScore,
  maxEvItem,
  homeTeamName,
  awayTeamName,
  onOpenDebugModal,
}: CSScoreTopPanelProps) {
  const homeProb = (probabilities.home_win * 100).toFixed(1);
  const drawProb = (probabilities.draw * 100).toFixed(1);
  const awayProb = (probabilities.away_win * 100).toFixed(1);
  const over25Prob = (probabilities.over_25 * 100).toFixed(1);
  const bttsProb = (probabilities.btts_yes * 100).toFixed(1);

  return (
    <div className="bg-[#090d16] border border-[#10b981]/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-3 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1f293d]">
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Painel Resumo Profissional (CSCORE)
          </h3>
          <span className="text-[9px] font-extrabold bg-[#10b981]/15 text-[#8ff38f] border border-[#10b981]/30 px-2 py-0.5 rounded-full">
            Tudo Visível Sem Scroll
          </span>
        </div>

        <button
          onClick={onOpenDebugModal}
          className="flex items-center space-x-1.5 bg-[#1e293b] hover:bg-[#28364f] text-slate-200 hover:text-white px-3 py-1 rounded-xl text-xs font-bold transition-all border border-[#334155] cursor-pointer"
        >
          <Calculator className="h-3.5 w-3.5 text-[#10b981]" />
          <span>Ver Cálculo (Debug)</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-center">
        {/* 1. Casa */}
        <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate" title={homeTeamName}>
            Mandante
          </span>
          <p className="text-base font-black text-white mt-0.5">{homeProb}%</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">1X2</span>
        </div>

        {/* 2. Empate */}
        <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Empate</span>
          <p className="text-base font-black text-white mt-0.5">{drawProb}%</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">1X2</span>
        </div>

        {/* 3. Visitante */}
        <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase truncate" title={awayTeamName}>
            Visitante
          </span>
          <p className="text-base font-black text-white mt-0.5">{awayProb}%</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">1X2</span>
        </div>

        {/* 4. Over 2.5 */}
        <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Over 2.5</span>
          <p className="text-base font-black text-[#8ff38f] mt-0.5">{over25Prob}%</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Gols</span>
        </div>

        {/* 5. BTTS */}
        <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 font-bold uppercase">BTTS (Ambas)</span>
          <p className="text-base font-black text-[#8ff38f] mt-0.5">{bttsProb}%</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Ambas Marcam</span>
        </div>

        {/* 6. Placar Mais Provável */}
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-emerald-400 font-bold uppercase flex items-center justify-center gap-1">
            <Award className="h-3 w-3" />
            Mais Provável
          </span>
          <p className="text-base font-black text-white mt-0.5">
            {mostLikelyScore ? mostLikelyScore.score : '---'}
          </p>
          <span className="text-[9px] text-emerald-300 font-extrabold mt-0.5">
            {mostLikelyScore ? `${mostLikelyScore.probability.toFixed(1)}%` : '---'}
          </span>
        </div>

        {/* 7. EV Máximo Encontrado */}
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[9px] text-amber-400 font-bold uppercase flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            EV Máximo
          </span>
          <p className="text-base font-black text-amber-300 mt-0.5">
            {maxEvItem ? `${maxEvItem.ev >= 0 ? '+' : ''}${maxEvItem.ev.toFixed(1)}%` : '---'}
          </p>
          <span className="text-[9px] text-amber-200 font-extrabold mt-0.5">
            {maxEvItem ? `Placar ${maxEvItem.score}` : '---'}
          </span>
        </div>
      </div>
    </div>
  );
}
