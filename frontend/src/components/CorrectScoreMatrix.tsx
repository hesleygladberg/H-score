'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ScoreItem {
  score: string;
  probability: number;
  fairOdd: number;
}

interface CorrectScoreMatrixProps {
  scores: ScoreItem[];
  selectedScores: string[];
  onToggleScore: (score: string) => void;
}

export default function CorrectScoreMatrix({
  scores,
  selectedScores,
  onToggleScore,
}: CorrectScoreMatrixProps) {
  // Mapear scores para busca rápida
  const scoreMap = new Map<string, ScoreItem>();
  scores.forEach((s) => {
    // Normalizar chave "1-0" ou "1x0"
    const key = s.score.replace('x', '-');
    scoreMap.set(key, s);
  });

  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3, 4];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Matriz Probabilística de Correct Score
            <span className="text-[9px] font-extrabold uppercase bg-blue-950/80 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded-full">
              Visão Primária 4x5
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            Distribuição espacial de probabilidades por gols do mandante x visitante
          </p>
        </div>

        {/* Legenda de Cores */}
        <div className="flex items-center space-x-3 text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-medium">Alta (&gt;10%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300 font-medium">Média (5-10%)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span>
            <span className="text-slate-400 font-medium">Baixa (&lt;5%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {rows.map((h) =>
          cols.map((a) => {
            const scoreKey = `${h}-${a}`;
            const item = scoreMap.get(scoreKey);
            const prob = item ? item.probability : 0;
            const fairOdd = item ? item.fairOdd : 0;
            const isSelected = selectedScores.includes(scoreKey);

            // Determinar estilo por faixa de probabilidade
            let colorStyle = 'bg-[#0f172a]/60 border-[#1e293b] text-slate-400 hover:border-slate-700';
            if (prob >= 10) {
              colorStyle = isSelected
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:border-emerald-500';
            } else if (prob >= 5) {
              colorStyle = isSelected
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:border-amber-500';
            } else {
              colorStyle = isSelected
                ? 'bg-blue-500/20 border-blue-400 text-white'
                : 'bg-slate-900/50 border-slate-800/60 text-slate-400 hover:border-slate-600';
            }

            return (
              <button
                key={scoreKey}
                onClick={() => onToggleScore(scoreKey)}
                className={`relative p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${colorStyle}`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-emerald-500 text-black rounded-full flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
                <p className="text-xs font-black tracking-wider text-white">
                  {h}x{a}
                </p>
                <p className="text-sm font-extrabold mt-1">
                  {prob > 0 ? `${prob.toFixed(1)}%` : '---'}
                </p>
                <p className="text-[10px] font-semibold opacity-80 mt-0.5">
                  {fairOdd > 0 ? `@${fairOdd.toFixed(2)}` : '---'}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
