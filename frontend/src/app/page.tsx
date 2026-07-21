'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  Calendar, 
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface MatchToday {
  id: number;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  status: string;
  bestMarket: string;
  ev: number;
}

interface Opportunity {
  matchId: number;
  time: string;
  match: string;
  market: string;
  probability: number;
  fairOdd: number;
  marketOdd: number;
  ev: number;
}

export default function Dashboard() {
  const [matchesToday, setMatchesToday] = useState<MatchToday[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Buscar jogos de hoje
        const todayStr = new Date().toISOString().split('T')[0];
        const resMatches = await fetch(`http://localhost:3001/api/matches?date=${todayStr}`);
        if (resMatches.ok) {
          const dataMatches = await resMatches.json();
          setMatchesToday(dataMatches);
        }

        // 2. Buscar oportunidades do Scanner
        const resScanner = await fetch(`http://localhost:3001/api/scanner?minEV=3`);
        if (resScanner.ok) {
          const dataScanner = await resScanner.json();
          setOpportunities(dataScanner.slice(0, 5)); // top 5
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Football Analytics <span className="text-[#10b981]">Pro</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Sua plataforma privada de precificação matemática de futebol. Ajustada com modelos de Dixon-Coles e Poisson para encontrar oportunidades de valor real no mercado de apostas.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <Link 
              href="/matches" 
              className="inline-flex items-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] transition-all duration-200"
            >
              <Calendar className="mr-2 h-4 w-4" /> Analisar Jogos de Hoje
            </Link>
            <Link 
              href="/scanner" 
              className="inline-flex items-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#1f293d] text-white transition-all duration-200"
            >
              <Search className="mr-2 h-4 w-4" /> Abrir Scanner EV+
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6 flex items-center justify-between transition-all duration-200 hover:border-emerald-500/20">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Jogos de Hoje</p>
            <p className="text-3xl font-extrabold text-white mt-1">{loading ? '...' : matchesToday.length}</p>
            <p className="text-xs text-slate-500 mt-2">Disponíveis para análise no modelo</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#10b981]">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6 flex items-center justify-between transition-all duration-200 hover:border-emerald-500/20">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Oportunidades Ativas</p>
            <p className="text-3xl font-extrabold text-[#10b981] mt-1">{loading ? '...' : opportunities.length}</p>
            <p className="text-xs text-slate-500 mt-2">Value bets com EV acima de 3.0%</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#10b981]">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6 flex items-center justify-between transition-all duration-200 hover:border-emerald-500/20 sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status do Modelo</p>
            <p className="text-3xl font-extrabold text-white mt-1">Ativo</p>
            <p className="text-xs text-slate-500 mt-2">Dixon-Coles & Poisson 100% Calibrados</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#10b981]">
            <Play className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jogos de Hoje */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl lg:col-span-2 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[#1f293d] flex justify-between items-center bg-[#0e1420]">
            <div>
              <h3 className="text-lg font-bold text-white">Jogos em Destaque (Hoje)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Partidas programadas e probabilidades de valor</p>
            </div>
            <Link href="/matches" className="text-xs text-[#10b981] hover:underline font-semibold flex items-center">
              Ver todos <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#1f293d]">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Carregando jogos de hoje...</div>
            ) : matchesToday.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-600" />
                <p>Nenhum jogo agendado para hoje nas ligas suportadas.</p>
              </div>
            ) : (
              matchesToday.slice(0, 6).map((match) => (
                <div key={match.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-[#1e293b]/20 transition-all duration-150">
                  <div className="flex items-center space-x-4 mb-3 md:mb-0">
                    <span className="text-xs text-slate-500 font-semibold bg-[#1e293b]/50 border border-[#1f293d] px-2 py-1 rounded">
                      {match.time}
                    </span>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">{match.league}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-semibold text-white">{match.homeTeam}</span>
                        <span className="text-xs text-slate-500 font-bold">x</span>
                        <span className="text-sm font-semibold text-white">{match.awayTeam}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end md:space-x-6 border-t md:border-t-0 pt-3 md:pt-0 border-[#1f293d]">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Melhor Entrada</p>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">{match.bestMarket}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {match.ev > 0 ? (
                        <div className="bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-1 rounded text-center">
                          <p className="text-[9px] text-[#10b981] font-bold uppercase">Valor</p>
                          <p className="text-xs font-bold text-[#10b981]">+{match.ev}% EV</p>
                        </div>
                      ) : (
                        <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-center">
                          <p className="text-[9px] text-slate-500 font-bold uppercase">Valor</p>
                          <p className="text-xs font-bold text-slate-400">---</p>
                        </div>
                      )}
                      
                      <Link 
                        href={`/matches/${match.id}`} 
                        className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#10b981] hover:text-[#0b0f19] text-slate-300 transition-all duration-200"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Melhores Oportunidades do Scanner */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[#1f293d] flex justify-between items-center bg-[#0e1420]">
            <div>
              <h3 className="text-lg font-bold text-white">Scanner EV+</h3>
              <p className="text-xs text-slate-400 mt-0.5">Alertas de Valor no Mercado</p>
            </div>
            <Link href="/scanner" className="text-xs text-[#10b981] hover:underline font-semibold flex items-center">
              Abrir Radar <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            {loading ? (
              <div className="text-center text-slate-500 py-12">Carregando oportunidades...</div>
            ) : opportunities.length === 0 ? (
              <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center space-y-2">
                <ShieldAlert className="h-8 w-8 text-slate-600" />
                <p>Nenhuma oportunidade de valor de alta probabilidade detectada no momento.</p>
              </div>
            ) : (
              opportunities.map((opp, idx) => (
                <Link
                  key={idx}
                  href={`/matches/${opp.matchId}`}
                  className="block p-4 bg-[#1e293b]/30 hover:bg-[#1e293b]/70 border border-[#1f293d] rounded-xl transition-all duration-200 hover:border-emerald-500/30"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-[#10b981] uppercase tracking-wider">{opp.market}</p>
                      <p className="text-sm font-semibold text-white mt-1 line-clamp-1">{opp.match}</p>
                    </div>
                    <div className="bg-emerald-500/10 text-[#10b981] text-xs font-black px-2 py-0.5 rounded border border-emerald-500/20">
                      +{opp.ev}% EV
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#1f293d] text-center">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Prob. Modelo</p>
                      <p className="text-xs font-bold text-white mt-0.5">{opp.probability}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Odd Justa</p>
                      <p className="text-xs font-bold text-slate-300 mt-0.5">@{opp.fairOdd}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Odd Mercado</p>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">@{opp.marketOdd}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
