'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radar, 
  ChevronRight, 
  AlertCircle, 
  SlidersHorizontal,
  ChevronDown,
  TrendingUp,
  Percent,
  Play
} from 'lucide-react';

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

interface League {
  id: number;
  name: string;
  country: string;
}

export default function ScannerPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedLeague, setSelectedLeague] = useState<string>('Todos');
  const [minEV, setMinEV] = useState<number>(3); // padrão 3.0%
  const [minProb, setMinProb] = useState<number>(30); // padrão 30%
  const [selectedMarket, setSelectedMarket] = useState<string>('Todos');

  const marketsList = ['Todos', '1X2', 'Over', 'Under', 'BTTS'];

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      
      // Buscar oportunidades
      const resScanner = await fetch(
        `/api/scanner?minEV=${minEV}&minProb=${minProb}`
      );
      if (resScanner.ok) {
        const dataScanner = await resScanner.json();
        setOpportunities(dataScanner);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do scanner:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Buscar ligas na inicialização
    const fetchLeagues = async () => {
      try {
        const res = await fetch('/api/leagues');
        if (res.ok) {
          const data = await res.json();
          setLeagues(data);
        }
      } catch (e) {
        console.error('Erro ao buscar ligas:', e);
      }
    };
    
    fetchLeagues();
    fetchOpportunities();
    
    // Polling a cada 10 segundos
    const interval = setInterval(fetchOpportunities, 10000);
    return () => clearInterval(interval);
  }, [minEV, minProb]); // Refetch quando alterar EV ou Probabilidade mínima

  // Filtragem local
  const filteredOps = opportunities.filter(opp => {
    // Filtrar por liga (o campo opp.match contem os times, não a liga diretamente. A API retorna as ligas. Mas no scanner a API envia oportunidades. Para simplificar, a API pode filtrar por liga usando a query, mas localmente podemos fazer a busca na correspondência se quisermos. A nossa API suporta leagueId na query).
    // Para facilidade, faremos o filtro na chamada da API ou ignoramos por simplicidade caso não retorne liga.
    const matchesMarket = selectedMarket === 'Todos' || opp.market.toLowerCase().includes(selectedMarket.toLowerCase());
    return matchesMarket;
  });

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Radar className="mr-2 h-6 w-6 text-[#10b981] animate-pulse" /> Scanner EV+
          </h2>
          <p className="text-sm text-slate-400 mt-1">Radar em tempo real de oportunidades matemáticas encontradas (Value Bets)</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold bg-[#131a26] border border-[#1f293d] rounded-lg px-3 py-2">
          <Play className="h-4 w-4 text-[#10b981]" />
          <span>Monitorando em Tempo Real</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
          <SlidersHorizontal className="h-4 w-4 text-[#10b981]" />
          <span>Filtros do Radar</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro de EV Mínimo */}
          <div className="relative">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">EV Mínimo</p>
            <select
              value={minEV}
              onChange={(e) => setMinEV(parseFloat(e.target.value))}
              className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981] appearance-none cursor-pointer"
            >
              <option value="1">EV positivo (+1%)</option>
              <option value="3">EV moderado (+3%)</option>
              <option value="5">EV alto (+5%)</option>
              <option value="10">EV extremo (+10%)</option>
            </select>
            <ChevronDown className="absolute right-3 top-7.5 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Filtro de Probabilidade Mínima */}
          <div className="relative">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Probabilidade Mínima</p>
            <select
              value={minProb}
              onChange={(e) => setMinProb(parseInt(e.target.value))}
              className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981] appearance-none cursor-pointer"
            >
              <option value="20">Mínimo 20%</option>
              <option value="30">Mínimo 30%</option>
              <option value="40">Mínimo 40%</option>
              <option value="50">Mínimo 50%</option>
            </select>
            <ChevronDown className="absolute right-3 top-7.5 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Filtro de Mercado */}
          <div className="relative">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Mercado</p>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981] appearance-none cursor-pointer"
            >
              {marketsList.map(m => (
                <option key={m} value={m}>{m === 'Todos' ? 'Todos os Mercados' : m}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-7.5 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Resultados Monitorados */}
          <div className="flex flex-col justify-end">
            <p className="text-[10px] text-transparent font-bold uppercase mb-1">Total</p>
            <div className="flex items-center justify-center text-xs text-slate-400 font-semibold bg-[#1e293b]/20 border border-[#1f293d] rounded-lg py-2 px-4 h-[38px]">
              {filteredOps.length} Oportunidades encontradas
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Oportunidades */}
      {loading ? (
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-16 text-center text-slate-500">
          Escaneando mercados e carregando simulações...
        </div>
      ) : filteredOps.length === 0 ? (
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-600 animate-pulse" />
          <p className="text-sm font-semibold">Nenhuma oportunidade detectada para os limites configurados.</p>
          <p className="text-xs text-slate-600">Experimente diminuir o EV Mínimo ou a Probabilidade Mínima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOps.map((opp, idx) => (
            <div 
              key={idx} 
              className="bg-[#131a26] border border-[#1f293d] rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-all duration-200"
            >
              {/* Top Banner */}
              <div className="px-5 py-4 bg-[#0e1420] border-b border-[#1f293d] flex justify-between items-center">
                <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/20 uppercase">
                  {opp.market}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Hoje às {opp.time}
                </span>
              </div>
              
              {/* Content Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{opp.match}</h4>
                  
                  {/* Comparativo Odds */}
                  <div className="grid grid-cols-3 gap-2 mt-5 p-3 bg-[#1e293b]/20 border border-[#1f293d] rounded-xl text-center">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">Probabilidade</p>
                      <p className="text-sm font-extrabold text-white mt-1">{opp.probability}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">Odd Justa</p>
                      <p className="text-sm font-bold text-slate-300 mt-1">@{opp.fairOdd}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">Odd Mercado</p>
                      <p className="text-sm font-extrabold text-emerald-400 mt-1">@{opp.marketOdd}</p>
                    </div>
                  </div>
                </div>

                {/* Footer buttons / EV status */}
                <div className="flex items-center justify-between border-t border-[#1f293d] pt-4 mt-5">
                  <div className="flex items-center space-x-2">
                    {opp.ev > 8 ? (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-950/80 text-[#8ff38f] border border-emerald-800/80 rounded-full uppercase">EXCELENTE</span>
                    ) : opp.ev >= 3 ? (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded-full uppercase">BOM</span>
                    ) : opp.ev >= 0 ? (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-slate-800 text-slate-300 border border-slate-700 rounded-full uppercase">NEUTRO</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-red-950/80 text-red-400 border border-red-800/80 rounded-full uppercase">RUIM</span>
                    )}
                    <span className="text-xs font-bold text-[#10b981]">+{opp.ev}% EV</span>
                  </div>
                  
                  <Link 
                    href={`/matches/${opp.matchId}`}
                    className="inline-flex items-center text-xs font-bold bg-[#1e293b] hover:bg-[#10b981] hover:text-[#0b0f19] text-white px-3 py-1.5 rounded-lg transition-all duration-200"
                  >
                    Análise Completa <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
