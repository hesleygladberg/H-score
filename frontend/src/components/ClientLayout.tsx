'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Radar, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Percent,
  Menu,
  X
} from 'lucide-react';

interface BankrollState {
  bankroll: number;
  defaultStake: number;
  maxRisk: number;
  roi: number;
  profit: number;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bankrollData, setBankrollData] = useState<BankrollState>({
    bankroll: 1000,
    defaultStake: 50,
    maxRisk: 100,
    roi: 0,
    profit: 0
  });

  // Buscar dados da banca no backend
  const fetchBankroll = async () => {
    try {
      const res = await fetch('/api/bankroll');
      if (res.ok) {
        const data = await res.json();
        setBankrollData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da banca:', error);
    }
  };

  useEffect(() => {
    fetchBankroll();
    
    // Configurar polling a cada 5 segundos para manter a banca atualizada
    const interval = setInterval(fetchBankroll, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Jogos do Dia', href: '/matches', icon: Calendar },
    { name: 'Scanner EV+', href: '/scanner', icon: Radar },
    { name: 'Gestão de Banca', href: '/bankroll', icon: Wallet },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19]">
      {/* Sidebar para telas grandes */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-[#131a26] border-r border-[#1f293d] flex-shrink-0">
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#1f293d]">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-[#10b981] font-bold text-xl tracking-wider">ANALYTICS PRO</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#10b981] text-[#0b0f19] shadow-md shadow-[#10b981]/10'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-[#0b0f19]' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#1f293d] bg-[#0e1420]">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Desenvolvido com Antigravity</p>
          <div className="text-xs text-slate-400"> Football Analytics Platform v1.0 </div>
        </div>
      </aside>

      {/* Sidebar Mobile (Drawer) */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
        <aside className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-[#131a26] border-r border-[#1f293d] h-full transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-[#1f293d]">
            <span className="text-[#10b981] font-bold text-lg tracking-wider">ANALYTICS PRO</span>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#10b981] text-[#0b0f19]'
                      : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-[#131a26] border-b border-[#1f293d] flex-shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white md:hidden mr-4Focus outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-white hidden md:block">
              {navItems.find(item => item.href === pathname)?.name || 'Análise de Jogo'}
            </h1>
          </div>

          {/* Banca Status Widget */}
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="flex items-center space-x-2 bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-3 py-1.5">
              <DollarSign className="h-4 w-4 text-[#10b981]" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-none">Banca</p>
                <p className="text-xs md:text-sm font-bold text-white leading-tight">
                  R$ {bankrollData.bankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-3 py-1.5">
              <TrendingUp className={`h-4 w-4 ${bankrollData.profit >= 0 ? 'text-[#10b981]' : 'text-red-500'}`} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-none">Lucro</p>
                <p className={`text-xs md:text-sm font-bold leading-tight ${bankrollData.profit >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                  R$ {bankrollData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-[#1e293b]/40 border border-[#1f293d] rounded-lg px-3 py-1.5">
              <Percent className={`h-4 w-4 ${bankrollData.roi >= 0 ? 'text-[#10b981]' : 'text-red-500'}`} />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-none">ROI</p>
                <p className={`text-xs md:text-sm font-bold leading-tight ${bankrollData.roi >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                  {bankrollData.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
