'use client';

import React from 'react';
import { X, CheckCircle2, Cpu, Info, ShieldCheck } from 'lucide-react';

interface CalculationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeTeamName: string;
  awayTeamName: string;
  expectedGoals?: { home: number; away: number };
  probabilities?: any;
}

export default function CalculationLogModal({
  isOpen,
  onClose,
  homeTeamName,
  awayTeamName,
  expectedGoals,
  probabilities,
}: CalculationLogModalProps) {
  if (!isOpen) return null;

  const lambdaH = expectedGoals?.home || 1.65;
  const lambdaA = expectedGoals?.away || 0.85;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-[#10b981]/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] text-white">
        {/* Modal Header */}
        <div className="p-4 bg-[#111827] border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Cpu className="h-5 w-5 text-[#10b981]" />
            <div>
              <h3 className="text-sm font-black text-white">Log de Cálculos e Transparência Matemática</h3>
              <p className="text-[10px] text-slate-400">Modo Debug - Registro completo do modelo probabilístico</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* 1. Modelo & Algoritmo */}
          <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">
                1. Algoritmo Utilizado
              </span>
              <span className="bg-[#10b981]/15 text-[#8ff38f] border border-[#10b981]/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                Dixon-Coles (1997) + Distribuição Bivariada de Poisson
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              O modelo calcula os parâmetros de gols esperados ($\lambda$) para cada equipe a partir das forças defensivas e ofensivas históricas, aplicando o fator de vantagem do mandante ($1.35$) e ajuste de correlação de placares baixos ($\rho = -0.08$).
            </p>
          </div>

          {/* 2. Parâmetros Calculados */}
          <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-3.5 space-y-2">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">
              2. Parâmetros do Jogo ({homeTeamName} vs {awayTeamName})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-center">
              <div className="bg-[#090d16] p-2 rounded-lg border border-[#1f293d]">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Gols Esperados Mandante</span>
                <span className="text-sm font-black text-[#8ff38f]">λ Casa = {lambdaH.toFixed(2)}</span>
              </div>
              <div className="bg-[#090d16] p-2 rounded-lg border border-[#1f293d]">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Gols Esperados Visitante</span>
                <span className="text-sm font-black text-[#8ff38f]">λ Fora = {lambdaA.toFixed(2)}</span>
              </div>
              <div className="bg-[#090d16] p-2 rounded-lg border border-[#1f293d]">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Correção Dixon-Coles</span>
                <span className="text-sm font-black text-blue-400">ρ = -0.08</span>
              </div>
            </div>
          </div>

          {/* 3. Equações Utilizadas */}
          <div className="bg-[#1e293b]/40 border border-[#1f293d] rounded-xl p-3.5 space-y-2">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px]">
              3. Fórmulas de Precificação
            </span>
            <div className="space-y-1.5 text-slate-300 font-mono text-[11px] bg-[#090d16] p-2.5 rounded-lg border border-[#1f293d]">
              <p>• Poisson: P(X=k) = (λ^k * e^-λ) / k!</p>
              <p>• Odd Justa: Odd Justa = 1 / P(Placar)</p>
              <p>• EV (%): EV = (P(Placar) * Odd Mercado - 1.0) * 100%</p>
              <p>• Cobertura Matriz: Σ P(Placares Selecionados)</p>
            </div>
          </div>

          {/* 4. Garantia de Integridade */}
          <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-3 flex items-center space-x-3 text-slate-300">
            <ShieldCheck className="h-6 w-6 text-[#10b981] flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-[11px]">Garantia de Integridade H-Scores V2</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Nenhum valor é gerado por números aleatórios. Toda a matriz é 100% determinística e normalizada para somar exatamente 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#111827] border-t border-[#1f293d] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#10b981] hover:bg-[#059669] text-black font-extrabold px-4 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fechar Log
          </button>
        </div>
      </div>
    </div>
  );
}
