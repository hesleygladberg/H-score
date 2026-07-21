'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Grid,
  Info,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';

interface MatchDetails {
  id: number;
  date: string;
  league: string;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  status: string;
  venue: string;
  referee: string;
  homeGoals: number | null;
  awayGoals: number | null;
  standings: any[];
  h2h: any[];
  lineups: any[];
  stats: { home: any; away: any };
  odds: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    under25: number;
    bttsYes: number;
    bttsNo: number;
  };
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
    over_05: number;
    over_15: number;
    over_25: number;
    over_35: number;
    under_25: number;
    under_35: number;
    btts_yes: number;
    btts_no: number;
  } | null;
  expectedGoals: { home: number; away: number } | null;
  correctScores: {
    score: string;
    probability: number;
    fairOdd: number;
    marketOdd: number;
    ev: number;
  }[];
}

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id;

  const [matchData, setMatchData] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Estados do Dutching
  const [selectedScores, setSelectedScores] = useState<string[]>([]);
  const [dutchingStake, setDutchingStake] = useState<string>('100');
  const [dutchingResult, setDutchingResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/matches/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatchData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes da partida:', error);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  // Efeito para recalcular o Dutching sempre que a seleção de placares ou a stake mudarem
  useEffect(() => {
    if (!matchData || selectedScores.length === 0) {
      setDutchingResult(null);
      return;
    }

    const calculateDutching = async () => {
      try {
        // Encontrar as seleções correspondentes no correctScores
        const selections = selectedScores.map(scoreStr => {
          const cs = matchData.correctScores.find(item => item.score === scoreStr);
          return {
            score: scoreStr,
            odd: cs ? cs.marketOdd : 10.0,
            probability: cs ? cs.probability / 100 : 0.05
          };
        });

        const res = await fetch('/api/dutching/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selections,
            totalStake: parseFloat(dutchingStake) || 100
          })
        });

        if (res.ok) {
          const data = await res.json();
          setDutchingResult(data);
        }
      } catch (error) {
        console.error('Erro ao calcular dutching:', error);
      }
    };

    calculateDutching();
  }, [selectedScores, dutchingStake, matchData]);

  if (loading) {
    return <div className="text-center text-slate-500 py-24">Processando base histórica e simulando partida...</div>;
  }

  if (!matchData) {
    return (
      <div className="text-center text-slate-500 py-24 flex flex-col items-center justify-center space-y-3">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm font-semibold">Partida não encontrada ou erro no servidor.</p>
        <button onClick={() => router.back()} className="text-[#10b981] hover:underline font-bold text-xs">Voltar</button>
      </div>
    );
  }

  const toggleScoreSelection = (score: string) => {
    if (selectedScores.includes(score)) {
      setSelectedScores(selectedScores.filter(s => s !== score));
    } else {
      setSelectedScores([...selectedScores, score]);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Visão Geral' },
    { id: 'overunder', name: 'Over/Under' },
    { id: 'btts', name: 'BTTS' },
    { id: 'correctscore', name: 'Correct Score' },
    { id: 'dutching', name: 'Dutching' },
    { id: 'lineups', name: 'Escalações' },
    { id: 'stats', name: 'Estatísticas' },
    { id: 'h2h', name: 'H2H' }
  ];

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <button 
        onClick={() => router.back()} 
        className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar para a lista
      </button>

      {/* Match Header Board */}
      <div className="bg-[#131a26] border border-[#1f293d] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Info Cabeçalho */}
        <div className="flex flex-col items-center text-center space-y-4">
          <span className="text-xs text-slate-400 font-bold bg-[#1e293b]/50 border border-[#1f293d] px-3 py-1 rounded-full uppercase tracking-wider">
            {matchData.league}
          </span>
          
          <div className="flex items-center justify-center space-x-6 md:space-x-12 w-full max-w-2xl">
            {/* Time Casa */}
            <div className="flex-1 flex flex-col items-center">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-[#1e293b]/20 border border-[#1f293d] rounded-full flex items-center justify-center p-3">
                <TeamLogo logoUrl={matchData.homeTeam.logo} teamName={matchData.homeTeam.name} size={64} className="h-full w-full" />
              </div>
              <h3 className="text-sm md:text-lg font-extrabold text-white mt-3 text-center">{matchData.homeTeam.name}</h3>
            </div>

            {/* Placar / Status */}
            <div className="flex flex-col items-center">
              {matchData.status === 'FT' ? (
                <div className="text-3xl md:text-5xl font-black text-white tracking-wide flex items-center space-x-3">
                  <span>{matchData.homeGoals}</span>
                  <span className="text-slate-500 font-medium text-xl md:text-2xl">-</span>
                  <span>{matchData.awayGoals}</span>
                </div>
              ) : (
                <div className="text-xl md:text-2xl font-black text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/25 px-4 py-1.5 rounded-xl">
                  {matchData.status === 'NS' ? 'VS' : matchData.status}
                </div>
              )}
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                {matchData.status === 'FT' ? 'Encerrado' : 'Agendado'}
              </span>
            </div>

            {/* Time Fora */}
            <div className="flex-1 flex flex-col items-center">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-[#1e293b]/20 border border-[#1f293d] rounded-full flex items-center justify-center p-3">
                <TeamLogo logoUrl={matchData.awayTeam.logo} teamName={matchData.awayTeam.name} size={64} className="h-full w-full" />
              </div>
              <h3 className="text-sm md:text-lg font-extrabold text-white mt-3 text-center">{matchData.awayTeam.name}</h3>
            </div>
          </div>

          {/* Local e Arbitragem */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-[#1f293d]/50 w-full max-w-md">
            <span className="flex items-center"><Calendar className="mr-1 h-3.5 w-3.5" /> {new Date(matchData.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })}</span>
            {matchData.venue && <span className="flex items-center"><MapPin className="mr-1 h-3.5 w-3.5" /> {matchData.venue}</span>}
            {matchData.referee && <span className="flex items-center"><User className="mr-1 h-3.5 w-3.5" /> {matchData.referee}</span>}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#1f293d] overflow-x-auto flex scrollbar-none">
        <div className="flex space-x-1 p-1 bg-[#131a26] border border-[#1f293d] rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#10b981] text-[#0b0f19] shadow-md shadow-[#10b981]/15'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e293b]/40'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="bg-[#131a26] border border-[#1f293d] rounded-2xl p-6 min-h-[300px]">
        
        {/* 1. Visão Geral */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Probabilidades 1X2 (Vitória/Empate/Derrota)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Comparativo do modelo probabilístico contra as odds vigentes do mercado</p>
            </div>
            
            {matchData.probabilities ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Casa */}
                <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 text-center flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase">Mandante ({matchData.homeTeam.name})</span>
                    <p className="text-4xl font-black text-white mt-2">{(matchData.probabilities.home_win * 100).toFixed(1)}%</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-[#1f293d] text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Odd Justa</p>
                      <p className="text-sm font-bold text-slate-300">@{(1.0 / matchData.probabilities.home_win).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Mercado</p>
                      <p className="text-sm font-bold text-emerald-400">@{matchData.odds.home}</p>
                    </div>
                  </div>
                </div>

                {/* Empate */}
                <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 text-center flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase">Empate</span>
                    <p className="text-4xl font-black text-white mt-2">{(matchData.probabilities.draw * 100).toFixed(1)}%</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-[#1f293d] text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Odd Justa</p>
                      <p className="text-sm font-bold text-slate-300">@{(1.0 / matchData.probabilities.draw).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Mercado</p>
                      <p className="text-sm font-bold text-emerald-400">@{matchData.odds.draw}</p>
                    </div>
                  </div>
                </div>

                {/* Visitante */}
                <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 text-center flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase">Visitante ({matchData.awayTeam.name})</span>
                    <p className="text-4xl font-black text-white mt-2">{(matchData.probabilities.away_win * 100).toFixed(1)}%</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-[#1f293d] text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Odd Justa</p>
                      <p className="text-sm font-bold text-slate-300">@{(1.0 / matchData.probabilities.away_win).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">Mercado</p>
                      <p className="text-sm font-bold text-emerald-400">@{matchData.odds.away}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Probabilidades indisponíveis</p>
            )}

            {/* Módulo Gols Esperados */}
            {matchData.expectedGoals && (
              <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mt-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-emerald-500/10 text-[#10b981] rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Projeção de Gols da Partida</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Gols projetados individualmente a partir do histórico de ataque/defesa Dixon-Coles</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">xG {matchData.homeTeam.name}</p>
                    <p className="text-xl font-extrabold text-white mt-1">{matchData.expectedGoals.home.toFixed(2)}</p>
                  </div>
                  <span className="text-slate-500 font-bold text-xl">x</span>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">xG {matchData.awayTeam.name}</p>
                    <p className="text-xl font-extrabold text-white mt-1">{matchData.expectedGoals.away.toFixed(2)}</p>
                  </div>
                  <div className="text-center border-l border-[#1f293d] pl-6 ml-6">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Gols Esperados (Jogo)</p>
                    <p className="text-xl font-extrabold text-[#10b981] mt-1">{(matchData.expectedGoals.home + matchData.expectedGoals.away).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Over/Under */}
        {activeTab === 'overunder' && matchData.probabilities && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Mercado de Gols (Over / Under)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Calcula o valor matemático em cada linha de gols a partir da probabilidade real simulada</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1420] text-slate-400 border-b border-[#1f293d]">
                    <th className="py-3 px-5 text-xs font-bold uppercase">Linha de Gols</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-center">Probabilidade Real</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-center">Odd Justa</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-center">Odd de Mercado</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-right">Valor Esperado (EV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {/* Over 0.5 */}
                  <tr className="hover:bg-[#1e293b]/10">
                    <td className="py-4 px-5 text-sm font-semibold text-white">Over 0.5</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center">{(matchData.probabilities.over_05 * 100).toFixed(1)}%</td>
                    <td className="py-4 px-5 text-sm font-medium text-slate-400 text-center">@{(1.0 / matchData.probabilities.over_05).toFixed(2)}</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center text-slate-300">@{(matchData.odds.over25 * 0.7).toFixed(2)}</td>
                    <td className="py-4 px-5 text-sm text-right whitespace-nowrap">
                      {((matchData.probabilities.over_05 * (matchData.odds.over25 * 0.7)) - 1.0) > 0 ? (
                        <span className="text-[#10b981] font-bold">+{( ((matchData.probabilities.over_05 * (matchData.odds.over25 * 0.7)) - 1.0)*100 ).toFixed(1)}% EV</span>
                      ) : (
                        <span className="text-slate-500">Sem valor</span>
                      )}
                    </td>
                  </tr>
                  {/* Over 1.5 */}
                  <tr className="hover:bg-[#1e293b]/10">
                    <td className="py-4 px-5 text-sm font-semibold text-white">Over 1.5</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center">{(matchData.probabilities.over_15 * 100).toFixed(1)}%</td>
                    <td className="py-4 px-5 text-sm font-medium text-slate-400 text-center">@{(1.0 / matchData.probabilities.over_15).toFixed(2)}</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center text-slate-300">@{(matchData.odds.over25 * 0.85).toFixed(2)}</td>
                    <td className="py-4 px-5 text-sm text-right whitespace-nowrap">
                      {((matchData.probabilities.over_15 * (matchData.odds.over25 * 0.85)) - 1.0) > 0 ? (
                        <span className="text-[#10b981] font-bold">+{( ((matchData.probabilities.over_15 * (matchData.odds.over25 * 0.85)) - 1.0)*100 ).toFixed(1)}% EV</span>
                      ) : (
                        <span className="text-slate-500">Sem valor</span>
                      )}
                    </td>
                  </tr>
                  {/* Over 2.5 */}
                  <tr className="hover:bg-[#1e293b]/10">
                    <td className="py-4 px-5 text-sm font-semibold text-white">Over 2.5</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center">{(matchData.probabilities.over_25 * 100).toFixed(1)}%</td>
                    <td className="py-4 px-5 text-sm font-medium text-slate-400 text-center">@{(1.0 / matchData.probabilities.over_25).toFixed(2)}</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center text-slate-300">@{matchData.odds.over25}</td>
                    <td className="py-4 px-5 text-sm text-right whitespace-nowrap">
                      {((matchData.probabilities.over_25 * matchData.odds.over25) - 1.0) > 0 ? (
                        <span className="text-[#10b981] font-bold">+{( ((matchData.probabilities.over_25 * matchData.odds.over25) - 1.0)*100 ).toFixed(1)}% EV</span>
                      ) : (
                        <span className="text-slate-500">Sem valor</span>
                      )}
                    </td>
                  </tr>
                  {/* Under 2.5 */}
                  <tr className="hover:bg-[#1e293b]/10">
                    <td className="py-4 px-5 text-sm font-semibold text-white">Under 2.5</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center">{(matchData.probabilities.under_25 * 100).toFixed(1)}%</td>
                    <td className="py-4 px-5 text-sm font-medium text-slate-400 text-center">@{(1.0 / matchData.probabilities.under_25).toFixed(2)}</td>
                    <td className="py-4 px-5 text-sm font-semibold text-center text-slate-300">@{matchData.odds.under25}</td>
                    <td className="py-4 px-5 text-sm text-right whitespace-nowrap">
                      {((matchData.probabilities.under_25 * matchData.odds.under25) - 1.0) > 0 ? (
                        <span className="text-[#10b981] font-bold">+{( ((matchData.probabilities.under_25 * matchData.odds.under25) - 1.0)*100 ).toFixed(1)}% EV</span>
                      ) : (
                        <span className="text-slate-500">Sem valor</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. BTTS */}
        {activeTab === 'btts' && matchData.probabilities && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Ambas Marcam Gols (BTTS)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Probabilidade de ambos os times marcarem gol contra a cotação do mercado</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sim */}
              <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 text-center flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase">Ambas Marcam: SIM</span>
                  <p className="text-4xl font-black text-white mt-2">{(matchData.probabilities.btts_yes * 100).toFixed(1)}%</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[#1f293d] text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Odd Justa</p>
                    <p className="text-sm font-bold text-slate-300">@{(1.0 / matchData.probabilities.btts_yes).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Mercado</p>
                    <p className="text-sm font-bold text-slate-300">@{matchData.odds.bttsYes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Valor EV</p>
                    <p className={`text-sm font-bold ${((matchData.probabilities.btts_yes * matchData.odds.bttsYes) - 1.0) > 0 ? 'text-[#10b981]' : 'text-slate-500'}`}>
                      {((matchData.probabilities.btts_yes * matchData.odds.bttsYes) - 1.0) > 0 
                        ? `+${(((matchData.probabilities.btts_yes * matchData.odds.bttsYes) - 1.0) * 100).toFixed(1)}%`
                        : '---'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Não */}
              <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 text-center flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase">Ambas Marcam: NÃO</span>
                  <p className="text-4xl font-black text-white mt-2">{(matchData.probabilities.btts_no * 100).toFixed(1)}%</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[#1f293d] text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Odd Justa</p>
                    <p className="text-sm font-bold text-slate-300">@{(1.0 / matchData.probabilities.btts_no).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Mercado</p>
                    <p className="text-sm font-bold text-slate-300">@{matchData.odds.bttsNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Valor EV</p>
                    <p className={`text-sm font-bold ${((matchData.probabilities.btts_no * matchData.odds.bttsNo) - 1.0) > 0 ? 'text-[#10b981]' : 'text-slate-500'}`}>
                      {((matchData.probabilities.btts_no * matchData.odds.bttsNo) - 1.0) > 0 
                        ? `+${(((matchData.probabilities.btts_no * matchData.odds.bttsNo) - 1.0) * 100).toFixed(1)}%`
                        : '---'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Correct Score */}
        {activeTab === 'correctscore' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Mercado de Placares Exatos (Correct Score)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Top 20 placares mais prováveis a partir das simulações de Monte Carlo</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1420] text-slate-400 border-b border-[#1f293d]">
                    <th className="py-3 px-5 text-xs font-bold uppercase">Placar</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-center">Probabilidade Real</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-center">Odd Justa</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-center">Odd de Mercado</th>
                    <th className="py-3 px-5 text-xs font-bold uppercase text-right">EV esperado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {matchData.correctScores.map((cs, idx) => (
                    <tr key={idx} className="hover:bg-[#1e293b]/10">
                      <td className="py-3.5 px-5 text-sm font-bold text-white">{cs.score}</td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-center">{cs.probability}%</td>
                      <td className="py-3.5 px-5 text-sm font-medium text-slate-400 text-center">@{cs.fairOdd.toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-sm font-semibold text-center text-slate-300">@{cs.marketOdd.toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-sm text-right whitespace-nowrap">
                        {cs.ev > 0 ? (
                          <span className="text-[#10b981] font-bold">+{cs.ev.toFixed(1)}% EV</span>
                        ) : (
                          <span className="text-slate-500">Sem valor</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Dutching */}
        {activeTab === 'dutching' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Calculadora e Painel de Dutching</h4>
              <p className="text-xs text-slate-400 mt-0.5">Selecione múltiplos placares para simular uma aposta distribuída com lucro igualitário</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seleção de Placares */}
              <div className="bg-[#1e293b]/10 border border-[#1f293d] rounded-xl p-5 lg:col-span-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Escolha os placares do Dutching</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {matchData.correctScores.map((cs, idx) => {
                    const isSelected = selectedScores.includes(cs.score);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleScoreSelection(cs.score)}
                        className={`p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-[#10b981]/15 border-[#10b981] text-white shadow-md shadow-[#10b981]/5'
                            : 'bg-[#1e293b]/40 border-[#1f293d] text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <p className="text-sm font-extrabold">{cs.score}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">@{cs.marketOdd.toFixed(1)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resultados do Dutching */}
              <div className="bg-[#1e293b]/20 border border-[#1f293d] rounded-xl p-5 space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Simulação e Resultados</p>
                
                {/* Input de Stake */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Stake Total (R$)</label>
                  <input
                    type="number"
                    value={dutchingStake}
                    onChange={(e) => setDutchingStake(e.target.value)}
                    className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                    placeholder="100.00"
                  />
                </div>

                {dutchingResult ? (
                  <div className="space-y-4 pt-2">
                    {/* Resumos Estatísticos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0e1420] border border-[#1f293d] p-3 rounded-lg text-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">ROI Estimado</p>
                        <p className={`text-sm font-extrabold mt-1 ${dutchingResult.roi >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                          {(dutchingResult.roi * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-[#0e1420] border border-[#1f293d] p-3 rounded-lg text-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Valor EV</p>
                        <p className={`text-sm font-extrabold mt-1 ${dutchingResult.ev >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                          {(dutchingResult.ev * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-[#0e1420] border border-[#1f293d] p-3 rounded-lg text-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Cobertura Real</p>
                        <p className="text-sm font-extrabold text-white mt-1">
                          {(dutchingResult.coverage * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-[#0e1420] border border-[#1f293d] p-3 rounded-lg text-center">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Lucro Líquido</p>
                        <p className={`text-sm font-extrabold mt-1 ${dutchingResult.netProfit >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                          R$ {dutchingResult.netProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Distribuição Individual */}
                    <div className="space-y-2 pt-2 border-t border-[#1f293d]">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Distribuição das Stakes</p>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {dutchingResult.selections.map((sel: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2 bg-[#0e1420]/55 rounded border border-[#1f293d]">
                            <span className="font-bold text-white">{sel.score} (@{sel.odd})</span>
                            <span className="text-slate-300">R$ {sel.individualStake} ({sel.pctOfTotal}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    <Info className="h-6 w-6 mx-auto text-slate-600 mb-2" />
                    Selecione pelo menos um placar na tabela para visualizar a distribuição de stakes.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. Escalações */}
        {activeTab === 'lineups' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Escalações das Equipes</h4>
              <p className="text-xs text-slate-400 mt-0.5">Lista de titulares, lesões e suspensões projetadas</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Home Team */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#1f293d]">
                  <TeamLogo logoUrl={matchData.homeTeam.logo} teamName={matchData.homeTeam.name} size={20} className="h-5 w-5" />
                  <h5 className="font-extrabold text-white">{matchData.homeTeam.name}</h5>
                </div>
                
                {/* Titulares */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Jogadores Titulares</p>
                  {matchData.lineups.filter(l => l.teamId === matchData.homeTeam.id && l.starter).map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-[#1e293b]/20 border border-[#1f293d] rounded">
                      <span className="font-medium text-white">{l.playerName}</span>
                      <span className="text-slate-500 bg-[#1e293b] px-1.5 py-0.5 rounded text-[10px]">{l.position}</span>
                    </div>
                  ))}
                </div>

                {/* Lesões / Suspensões */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-red-500 font-bold uppercase">Desfalques (Duvidosos/Out)</p>
                  {matchData.lineups.filter(l => l.teamId === matchData.homeTeam.id && (l.injured || l.suspended)).length === 0 ? (
                    <p className="text-xs text-slate-500">Sem desfalques registrados.</p>
                  ) : (
                    matchData.lineups.filter(l => l.teamId === matchData.homeTeam.id && (l.injured || l.suspended)).map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 bg-red-950/10 border border-red-900/20 rounded text-red-400">
                        <span>{l.playerName}</span>
                        <span className="text-[9px] font-bold bg-red-950 px-1.5 py-0.5 rounded">{l.injured ? 'Lesionado' : 'Suspenso'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Away Team */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#1f293d]">
                  <TeamLogo logoUrl={matchData.awayTeam.logo} teamName={matchData.awayTeam.name} size={20} className="h-5 w-5" />
                  <h5 className="font-extrabold text-white">{matchData.awayTeam.name}</h5>
                </div>
                
                {/* Titulares */}
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Jogadores Titulares</p>
                  {matchData.lineups.filter(l => l.teamId === matchData.awayTeam.id && l.starter).map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-[#1e293b]/20 border border-[#1f293d] rounded">
                      <span className="font-medium text-white">{l.playerName}</span>
                      <span className="text-slate-500 bg-[#1e293b] px-1.5 py-0.5 rounded text-[10px]">{l.position}</span>
                    </div>
                  ))}
                </div>

                {/* Lesões / Suspensões */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-red-500 font-bold uppercase">Desfalques (Duvidosos/Out)</p>
                  {matchData.lineups.filter(l => l.teamId === matchData.awayTeam.id && (l.injured || l.suspended)).length === 0 ? (
                    <p className="text-xs text-slate-500">Sem desfalques registrados.</p>
                  ) : (
                    matchData.lineups.filter(l => l.teamId === matchData.awayTeam.id && (l.injured || l.suspended)).map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 bg-red-950/10 border border-red-900/20 rounded text-red-400">
                        <span>{l.playerName}</span>
                        <span className="text-[9px] font-bold bg-red-950 px-1.5 py-0.5 rounded">{l.injured ? 'Lesionado' : 'Suspenso'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Estatísticas */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Estatísticas Históricas das Equipes</h4>
              <p className="text-xs text-slate-400 mt-0.5">Produção ofensiva, defensiva e xG acumulado na liga</p>
            </div>
            
            {matchData.stats.home && matchData.stats.away ? (
              <div className="space-y-4">
                {/* xG Acumulado */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase mb-1">
                    <span>{matchData.stats.home.xg} xG</span>
                    <span>xG Acumulado (Liga)</span>
                    <span>{matchData.stats.away.xg} xG</span>
                  </div>
                  <div className="flex h-2 bg-[#1e293b] rounded-full overflow-hidden">
                    <div 
                      className="bg-[#10b981]" 
                      style={{ width: `${(matchData.stats.home.xg / (matchData.stats.home.xg + matchData.stats.away.xg)) * 100}%` }}
                    />
                    <div 
                      className="bg-emerald-700" 
                      style={{ width: `${(matchData.stats.away.xg / (matchData.stats.home.xg + matchData.stats.away.xg)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Gols Marcados */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase mb-1">
                    <span>{matchData.stats.home.goalsFor} Gols</span>
                    <span>Gols Marcados</span>
                    <span>{matchData.stats.away.goalsFor} Gols</span>
                  </div>
                  <div className="flex h-2 bg-[#1e293b] rounded-full overflow-hidden">
                    <div 
                      className="bg-[#10b981]" 
                      style={{ width: `${(matchData.stats.home.goalsFor / (matchData.stats.home.goalsFor + matchData.stats.away.goalsFor)) * 100}%` }}
                    />
                    <div 
                      className="bg-emerald-700" 
                      style={{ width: `${(matchData.stats.away.goalsFor / (matchData.stats.home.goalsFor + matchData.stats.away.goalsFor)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Posse de Bola Média */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase mb-1">
                    <span>{matchData.stats.home.possession}%</span>
                    <span>Posse de Bola Média</span>
                    <span>{matchData.stats.away.possession}%</span>
                  </div>
                  <div className="flex h-2 bg-[#1e293b] rounded-full overflow-hidden">
                    <div 
                      className="bg-[#10b981]" 
                      style={{ width: `${matchData.stats.home.possession}%` }}
                    />
                    <div 
                      className="bg-emerald-700" 
                      style={{ width: `${matchData.stats.away.possession}%` }}
                    />
                  </div>
                </div>

                {/* Chutes por Jogo */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase mb-1">
                    <span>{matchData.stats.home.shots} ({(matchData.stats.home.shots/matchData.stats.home.matches).toFixed(1)}/j)</span>
                    <span>Total de Chutes</span>
                    <span>{matchData.stats.away.shots} ({(matchData.stats.away.shots/matchData.stats.away.matches).toFixed(1)}/j)</span>
                  </div>
                  <div className="flex h-2 bg-[#1e293b] rounded-full overflow-hidden">
                    <div 
                      className="bg-[#10b981]" 
                      style={{ width: `${(matchData.stats.home.shots / (matchData.stats.home.shots + matchData.stats.away.shots)) * 100}%` }}
                    />
                    <div 
                      className="bg-emerald-700" 
                      style={{ width: `${(matchData.stats.away.shots / (matchData.stats.home.shots + matchData.stats.away.shots)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Dados estatísticos históricos não cadastrados para esta rodada.</p>
            )}
          </div>
        )}

        {/* 8. H2H (Confrontos Diretos) */}
        {activeTab === 'h2h' && (
          <div className="space-y-6">
            <div className="mb-4">
              <h4 className="text-base font-bold text-white">Confrontos Diretos Históricos (H2H)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Resultados das últimas partidas disputadas entre as duas equipes</p>
            </div>
            
            {matchData.h2h.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">Nenhum confronto histórico recente registrado.</p>
            ) : (
              <div className="space-y-3">
                {matchData.h2h.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-4 bg-[#1e293b]/20 border border-[#1f293d] rounded-xl">
                    <span className="text-xs text-slate-500 font-semibold">{new Date(h.date).toLocaleDateString('pt-BR', { dateStyle: 'short' })}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`font-semibold ${h.homeTeam === matchData.homeTeam.name ? 'text-white' : 'text-slate-300'}`}>{h.homeTeam}</span>
                      <span className="bg-[#1e293b] border border-[#1f293d] font-black px-2 py-0.5 rounded text-white">{h.homeGoals} - {h.awayGoals}</span>
                      <span className={`font-semibold ${h.awayTeam === matchData.awayTeam.name ? 'text-white' : 'text-slate-300'}`}>{h.awayTeam}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
