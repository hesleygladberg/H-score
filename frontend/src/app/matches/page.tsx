'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  SlidersHorizontal,
  ChevronDown
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
  probabilities?: any;
}

interface League {
  id: number;
  name: string;
  country: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchToday[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).split('/').reverse().join('-')
  );
  
  // Filtros
  const [selectedLeague, setSelectedLeague] = useState<string>('Todos');
  const [minEV, setMinEV] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ligas
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const resLeagues = await fetch('/api/leagues');
        if (resLeagues.ok) {
          const dataLeagues = await resLeagues.json();
          setLeagues(dataLeagues);
        }
      } catch (error) {
        console.error('Erro ao buscar ligas:', error);
      }
    };
    fetchLeagues();
  }, []);

  // Jogos
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const resMatches = await fetch(`/api/matches?date=${selectedDate}`);
        if (resMatches.ok) {
          const dataMatches = await resMatches.json();
          setMatches(dataMatches);
        }
      } catch (error) {
        console.error('Erro ao buscar jogos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [selectedDate]);

  // Filtragem local
  const filteredMatches = matches.filter(match => {
    const matchesLeague = selectedLeague === 'Todos' || match.league === selectedLeague;
    const matchesEV = match.ev >= minEV;
    const matchesSearch = searchQuery === '' || 
      match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.league.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesLeague && matchesEV && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Jogos de Hoje</h2>
          <p className="text-sm text-slate-400 mt-1">Grade completa de jogos do dia analisados pelo modelo matemático</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold bg-[#131a26] border border-[#1f293d] rounded-lg px-3 py-1.5">
          <Calendar className="h-4 w-4 text-[#10b981]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-slate-300 font-bold text-xs focus:outline-none cursor-pointer scheme-dark"
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
          <SlidersHorizontal className="h-4 w-4 text-[#10b981]" />
          <span>Filtros de Análise</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca por Time */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar time ou liga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] transition-all"
            />
          </div>

          {/* Filtro de Liga */}
          <div className="relative">
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981] appearance-none cursor-pointer"
            >
              <option value="Todos">Todas as Ligas</option>
              {leagues.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Filtro de EV Mínimo */}
          <div className="relative">
            <select
              value={minEV}
              onChange={(e) => setMinEV(parseFloat(e.target.value))}
              className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981] appearance-none cursor-pointer"
            >
              <option value="0">Todos os EVs</option>
              <option value="1">EV positivo (+1% EV)</option>
              <option value="3">EV moderado (+3% EV)</option>
              <option value="5">EV alto (+5% EV)</option>
              <option value="10">EV excepcional (+10% EV)</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Contador de Resultados */}
          <div className="flex items-center justify-center sm:justify-end text-xs text-slate-400 font-semibold bg-[#1e293b]/20 border border-[#1f293d] rounded-lg py-2 px-4">
            Mostrando {filteredMatches.length} de {matches.length} partidas
          </div>
        </div>
      </div>

      {/* Matches List Table */}
      <div className="bg-[#131a26] border border-[#1f293d] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">Carregando dados estatísticos do servidor...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="h-10 w-10 text-slate-600" />
            <p className="text-sm font-semibold">Nenhum jogo encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-[#0e1420] text-slate-400 border-b border-[#1f293d]">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Horário / Liga</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Confronto</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-center">Probabilidades Reais</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Melhor Entrada</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-right">EV esperado</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-[#1e293b]/10 transition-all duration-150">
                    {/* Horário / Liga */}
                    <td className="py-5 px-6 whitespace-nowrap">
                      <span className="text-xs text-slate-200 font-semibold bg-[#1e293b]/50 border border-[#1f293d] px-2 py-1 rounded mr-2">
                        {match.time}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{match.league}</span>
                    </td>
                    
                    {/* Confronto */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{match.homeTeam}</span>
                        <span className="text-xs text-slate-500 font-bold">x</span>
                        <span className="text-sm font-bold text-white">{match.awayTeam}</span>
                      </div>
                    </td>

                    {/* Probabilidades Reais (1 X 2) */}
                    <td className="py-5 px-6">
                      {match.probabilities ? (
                        <div className="flex items-center justify-center space-x-1 text-center">
                          <div className="bg-[#1e293b]/50 border border-[#1f293d] rounded px-2 py-1 min-w-[50px]">
                            <p className="text-[9px] text-slate-500 font-bold leading-none">1</p>
                            <p className="text-xs font-bold text-slate-300 mt-0.5">{(match.probabilities.home_win * 100).toFixed(0)}%</p>
                          </div>
                          <div className="bg-[#1e293b]/50 border border-[#1f293d] rounded px-2 py-1 min-w-[50px]">
                            <p className="text-[9px] text-slate-500 font-bold leading-none">X</p>
                            <p className="text-xs font-bold text-slate-300 mt-0.5">{(match.probabilities.draw * 100).toFixed(0)}%</p>
                          </div>
                          <div className="bg-[#1e293b]/50 border border-[#1f293d] rounded px-2 py-1 min-w-[50px]">
                            <p className="text-[9px] text-slate-500 font-bold leading-none">2</p>
                            <p className="text-xs font-bold text-slate-300 mt-0.5">{(match.probabilities.away_win * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-xs text-slate-500 font-medium">Não calculado</p>
                      )}
                    </td>

                    {/* Melhor Mercado */}
                    <td className="py-5 px-6 whitespace-nowrap">
                      <p className="text-xs font-semibold text-slate-300">{match.bestMarket}</p>
                    </td>

                    {/* EV esperado */}
                    <td className="py-5 px-6 text-right whitespace-nowrap">
                      {match.ev > 0 ? (
                        <span className="inline-flex items-center bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 text-xs font-black px-2.5 py-1 rounded">
                          +{match.ev}% EV
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-slate-800/80 text-slate-500 border border-slate-700 text-xs font-medium px-2.5 py-1 rounded">
                          Sem Valor
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-5 px-6 text-center whitespace-nowrap">
                      <Link 
                        href={`/matches/${match.id}`} 
                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1e293b] hover:bg-[#10b981] hover:text-[#0b0f19] text-white transition-all duration-200"
                      >
                        Análise <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
