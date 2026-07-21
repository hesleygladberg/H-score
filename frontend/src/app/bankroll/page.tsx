'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Plus, 
  History,
  Settings,
  Sliders,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface BankrollHistoryItem {
  id: string;
  date: string;
  balance: number;
  profit: number;
  roi: number;
}

export default function BankrollPage() {
  const [bankroll, setBankroll] = useState<number>(1000);
  const [defaultStake, setDefaultStake] = useState<number>(50);
  const [maxRisk, setMaxRisk] = useState<number>(100);
  
  const [roi, setRoi] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [history, setHistory] = useState<BankrollHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário de Configuração
  const [inputBankroll, setInputBankroll] = useState<string>('');
  const [inputStake, setInputStake] = useState<string>('');
  const [inputRisk, setInputRisk] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Formulário de Registro de Aposta
  const [showAddBet, setShowAddBet] = useState(false);
  const [betMatch, setBetMatch] = useState('');
  const [betMarket, setBetMarket] = useState('');
  const [betStake, setBetStake] = useState('');
  const [betOdd, setBetOdd] = useState('');
  const [betResult, setBetResult] = useState<'GREEN' | 'RED'>('GREEN');
  const [betSuccess, setBetSuccess] = useState(false);

  const fetchBankrollData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bankroll');
      if (res.ok) {
        const data = await res.json();
        setBankroll(data.bankroll);
        setDefaultStake(data.defaultStake);
        setMaxRisk(data.maxRisk);
        setRoi(data.roi);
        setProfit(data.profit);
        setHistory(data.history);
        
        setInputBankroll(data.bankroll.toString());
        setInputStake(data.defaultStake.toString());
        setInputRisk(data.maxRisk.toString());
      }
    } catch (e) {
      console.error('Erro ao buscar dados da banca:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankrollData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          data: {
            bankroll: parseFloat(inputBankroll),
            defaultStake: parseFloat(inputStake),
            maxRisk: parseFloat(inputRisk)
          }
        })
      });

      if (res.ok) {
        setConfigSuccess(true);
        setTimeout(() => {
          setConfigSuccess(false);
          setShowConfig(false);
        }, 1500);
        fetchBankrollData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBet = async (e: React.FormEvent) => {
    e.preventDefault();
    const stakeNum = parseFloat(betStake);
    const oddNum = parseFloat(betOdd);
    
    // Calcular lucro líquido da aposta
    const betProfit = betResult === 'GREEN' 
      ? stakeNum * oddNum - stakeNum 
      : -stakeNum;
      
    const newBalance = bankroll + betProfit;
    const newRoi = (betProfit / bankroll) * 100;

    try {
      const res = await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bet',
          data: {
            profit: betProfit,
            roi: newRoi,
            balance: newBalance
          }
        })
      });

      if (res.ok) {
        setBetSuccess(true);
        setTimeout(() => {
          setBetSuccess(false);
          setShowAddBet(false);
          setBetMatch('');
          setBetMarket('');
          setBetStake('');
          setBetOdd('');
        }, 1500);
        fetchBankrollData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Preparar dados do gráfico (inverter histórico para ir cronologicamente do mais antigo para o mais recente)
  const chartData = [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(h => ({
      name: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      Saldo: h.balance
    }));

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Gestão de Banca</h2>
          <p className="text-sm text-slate-400 mt-1">Monitore sua performance, configure seus limites e registre suas apostas</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#1f293d] text-white transition-all cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" /> Configurar Banca
          </button>
          <button 
            onClick={() => setShowAddBet(!showAddBet)}
            className="inline-flex items-center px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] transition-all cursor-pointer"
          >
            <Plus className="mr-2 h-4.5 w-4.5" /> Registrar Aposta
          </button>
        </div>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <form onSubmit={handleSaveSettings} className="bg-[#131a26] border border-[#1f293d] rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
            <Sliders className="h-4 w-4 text-[#10b981]" />
            <span>Configurações Básicas da Banca</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Banca Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                value={inputBankroll}
                onChange={(e) => setInputBankroll(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Stake Padrão (R$)</label>
              <input
                type="number"
                step="0.01"
                value={inputStake}
                onChange={(e) => setInputStake(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Risco Máximo por Entrada (R$)</label>
              <input
                type="number"
                step="0.01"
                value={inputRisk}
                onChange={(e) => setInputRisk(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#1f293d] text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] flex items-center"
            >
              {configSuccess ? <CheckCircle className="mr-1 h-4 w-4" /> : null}
              {configSuccess ? 'Salvo!' : 'Salvar Definições'}
            </button>
          </div>
        </form>
      )}

      {/* Add Bet Panel */}
      {showAddBet && (
        <form onSubmit={handleAddBet} className="bg-[#131a26] border border-[#1f293d] rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
            <Wallet className="h-4 w-4 text-[#10b981]" />
            <span>Registrar Nova Operação Realizada</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Partida</label>
              <input
                type="text"
                placeholder="Ex: Real Madrid x Barcelona"
                value={betMatch}
                onChange={(e) => setBetMatch(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Mercado / Entrada</label>
              <input
                type="text"
                placeholder="Ex: Dutching Correct Score"
                value={betMarket}
                onChange={(e) => setBetMarket(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Stake Utilizada (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 50.00"
                value={betStake}
                onChange={(e) => setBetStake(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Odd Final</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 2.10"
                value={betOdd}
                onChange={(e) => setBetOdd(e.target.value)}
                className="w-full bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Resultado</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setBetResult('GREEN')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                    betResult === 'GREEN'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-[#1e293b]/40 border-[#1f293d] text-slate-400 hover:text-white'
                  }`}
                >
                  GREEN
                </button>
                <button
                  type="button"
                  onClick={() => setBetResult('RED')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                    betResult === 'RED'
                      ? 'bg-red-500/10 border-red-500 text-red-400'
                      : 'bg-[#1e293b]/40 border-[#1f293d] text-slate-400 hover:text-white'
                  }`}
                >
                  RED
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddBet(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#1f293d] text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#0b0f19] flex items-center"
            >
              {betSuccess ? <CheckCircle className="mr-1 h-4 w-4" /> : null}
              {betSuccess ? 'Registrada!' : 'Confirmar Aposta'}
            </button>
          </div>
        </form>
      )}

      {/* Main KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Banca */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Banca Total</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">R$ {bankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#10b981]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1f293d] text-xs text-slate-500 font-semibold flex justify-between">
            <span>Stake Sugerida: R$ {defaultStake.toFixed(2)}</span>
            <span>Risco Max: R$ {maxRisk.toFixed(2)}</span>
          </div>
        </div>

        {/* Lucro */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lucro Líquido</p>
              <h3 className={`text-2xl font-extrabold mt-1 ${profit >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-emerald-500/10 text-[#10b981]' : 'bg-red-500/10 text-red-500'}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1f293d] text-xs text-slate-500 font-semibold flex items-center">
            {profit >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#10b981] mr-1" /> : <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />}
            <span className={profit >= 0 ? 'text-[#10b981]' : 'text-red-500'}>
              {profit >= 0 ? 'Evolução positiva' : 'Evolução negativa'}
            </span>
          </div>
        </div>

        {/* ROI */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Retorno sobre Investimento</p>
              <h3 className={`text-2xl font-extrabold mt-1 ${roi >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>{roi.toFixed(1)}%</h3>
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${roi >= 0 ? 'bg-emerald-500/10 text-[#10b981]' : 'bg-red-500/10 text-red-500'}`}>
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1f293d] text-xs text-slate-500 font-semibold flex justify-between">
            <span>Rendimento sobre a banca inicial</span>
          </div>
        </div>

        {/* Total Operações */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Operações</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{history.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#10b981]">
              <History className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#1f293d] text-xs text-slate-500 font-semibold flex justify-between">
            <span>Registro completo do diário de apostas</span>
          </div>
        </div>
      </div>

      {/* Chart & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Evolution */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Evolução do Patrimônio</h3>
            <p className="text-xs text-slate-400">Gráfico de histórico de saldo da banca</p>
          </div>
          
          <div className="h-[250px] w-full mt-4">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">Registros insuficientes para plotagem do gráfico.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131a26', border: '1px solid #1f293d', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Saldo" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ stroke: '#0b0f19', strokeWidth: 2, fill: '#10b981', r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* History Ledger */}
        <div className="bg-[#131a26] border border-[#1f293d] rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[#1f293d] bg-[#0e1420]">
            <h3 className="text-lg font-bold text-white">Histórico Recente</h3>
            <p className="text-xs text-slate-400 mt-0.5">Livro de registro de caixa e transações</p>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[#1f293d] max-h-[250px]">
            {loading ? (
              <div className="text-center text-slate-500 py-12">Carregando livro caixa...</div>
            ) : history.length === 0 ? (
              <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-slate-600" />
                <p>Nenhuma transação registrada até o momento.</p>
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id} className="p-4 flex justify-between items-center hover:bg-[#1e293b]/20 transition-all duration-150">
                  <div>
                    <span className="text-xs text-slate-400 font-bold">
                      {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-sm font-semibold text-white mt-0.5">Saldo: R$ {h.balance.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                      h.profit >= 0 
                        ? 'bg-emerald-500/10 text-[#10b981] border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {h.profit >= 0 ? '+' : ''}R$ {h.profit.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">ROI: {h.roi.toFixed(1)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
