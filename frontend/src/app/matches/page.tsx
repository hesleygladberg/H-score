'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';

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
  const router = useRouter();
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
        <div className="flex flex-wrap items-center gap-3">
          {/* API Status Badge inspirada no CSCORE */}
          {matches.length > 0 && matches.some((m: any) => m.isMockData === false) ? (
            <div className="flex items-center space-x-2 text-[11px] font-bold text-[#8ff38f] bg-[#10b981]/10 border border-[#10b981]/30 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8ff38f] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8ff38f]"></span>
              </span>
              <span>API Real Conectada (Football-Data.org)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span>Modo Demonstrativo (Chave de API não configurada)</span>
            </div>
          )}

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

      {/* Matches List Section */}
      <div className="bg-[#131a26] border border-[#1f293d] rounded-xl overflow-hidden p-4 md:p-6">
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium animate-pulse">
            Carregando inteligência estatística e partidas...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="h-10 w-10 text-slate-600" />
            <p className="text-sm font-semibold">Nenhum jogo encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Sleek Table (lg:block hidden) */}
            <div className="hidden lg:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1420] text-slate-400 border-b border-[#1f293d] text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 rounded-l-lg">Horário / Liga</th>
                    <th className="py-3.5 px-4">Confronto</th>
                    <th className="py-3.5 px-4 text-center">Probabilidades (1 X 2)</th>
                    <th className="py-3.5 px-4 text-center">Melhor Entrada</th>
                    <th className="py-3.5 px-4 text-center">EV Esperado</th>
                    <th className="py-3.5 px-4 text-right rounded-r-lg">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]/60">
                  {filteredMatches.map((match) => (
                    <tr
                      key={match.id}
                      onClick={() => router.push(`/matches/${match.id}`)}
                      className="group hover:bg-[#1e293b]/30 transition-all duration-200 cursor-pointer"
                    >
                      {/* Horário / Liga */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className="inline-block text-[11px] font-bold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded w-fit">
                            {match.time}
                          </span>
                          <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]">
                            {match.league}
                          </span>
                        </div>
                      </td>

                      {/* Confronto */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <TeamLogo logoUrl={match.homeLogo} teamName={match.homeTeam} size={24} />
                            <span className="text-sm font-bold text-white group-hover:text-[#10b981] transition-colors">
                              {match.homeTeam}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-bold px-1">vs</span>
                          <div className="flex items-center space-x-2">
                            <TeamLogo logoUrl={match.awayLogo} teamName={match.awayTeam} size={24} />
                            <span className="text-sm font-bold text-white group-hover:text-[#10b981] transition-colors">
                              {match.awayTeam}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Probabilidades Reais (1 X 2) */}
                      <td className="py-4 px-4">
                        {match.probabilities ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <div className="bg-[#0e1420] border border-[#1f293d] rounded px-2 py-1 text-center min-w-[45px]">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">1</p>
                              <p className="text-xs font-bold text-slate-200">{(match.probabilities.home_win * 100).toFixed(0)}%</p>
                            </div>
                            <div className="bg-[#0e1420] border border-[#1f293d] rounded px-2 py-1 text-center min-w-[45px]">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">X</p>
                              <p className="text-xs font-bold text-slate-200">{(match.probabilities.draw * 100).toFixed(0)}%</p>
                            </div>
                            <div className="bg-[#0e1420] border border-[#1f293d] rounded px-2 py-1 text-center min-w-[45px]">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">2</p>
                              <p className="text-xs font-bold text-slate-200">{(match.probabilities.away_win * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-xs text-slate-500">N/A</p>
                        )}
                      </td>

                      {/* Melhor Mercado */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-slate-300 bg-[#1e293b]/40 border border-[#1f293d] px-2.5 py-1 rounded-md">
                          {match.bestMarket}
                        </span>
                      </td>

                      {/* EV esperado */}
                      <td className="py-4 px-4 text-center">
                        {match.ev > 0 ? (
                          <span className="inline-flex items-center bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-xs font-black px-2.5 py-1 rounded-md">
                            +{match.ev}% EV
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-slate-800/60 text-slate-500 border border-slate-700/60 text-xs font-medium px-2 py-0.5 rounded">
                            Sem Valor
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center text-xs font-bold text-[#10b981] group-hover:translate-x-1 transition-transform">
                          Analisar <ChevronRight className="ml-1 h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View (lg:hidden block) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => router.push(`/matches/${match.id}`)}
                  className="bg-[#0e1420]/80 border border-[#1f293d] hover:border-[#10b981]/50 rounded-xl p-4 transition-all duration-200 cursor-pointer space-y-3 shadow-sm hover:shadow-md hover:shadow-[#10b981]/5"
                >
                  {/* Card Header: Liga e Horário */}
                  <div className="flex items-center justify-between border-b border-[#1f293d]/60 pb-2">
                    <span className="text-xs font-bold text-slate-400 truncate max-w-[70%]">
                      {match.league}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded">
                      {match.time}
                    </span>
                  </div>

                  {/* Teams / Confronto */}
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <TeamLogo logoUrl={match.homeLogo} teamName={match.homeTeam} size={26} />
                        <span className="text-sm font-bold text-white">{match.homeTeam}</span>
                      </div>
                      {match.probabilities && (
                        <span className="text-xs font-bold text-slate-400 bg-[#1e293b]/60 px-2 py-0.5 rounded">
                          {(match.probabilities.home_win * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <TeamLogo logoUrl={match.awayLogo} teamName={match.awayTeam} size={26} />
                        <span className="text-sm font-bold text-white">{match.awayTeam}</span>
                      </div>
                      {match.probabilities && (
                        <span className="text-xs font-bold text-slate-400 bg-[#1e293b]/60 px-2 py-0.5 rounded">
                          {(match.probabilities.away_win * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Entrada + EV */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1f293d]/60 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Entrada:</span>
                      <span className="font-bold text-white">{match.bestMarket}</span>
                    </div>
                    <div>
                      {match.ev > 0 ? (
                        <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-black px-2 py-0.5 rounded">
                          +{match.ev}% EV
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-500 font-medium px-2 py-0.5 rounded">
                          Sem Valor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
