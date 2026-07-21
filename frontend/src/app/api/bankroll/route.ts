import { NextResponse } from 'next/server';
import { prisma, isMock } from '@/lib/prisma';

// Fallback em memória para a banca
let inMemoryBankroll = {
  bankroll: 1000.0,
  defaultStake: 50.0,
  maxRisk: 100.0,
  roi: 0.0,
  profit: 0.0,
  history: [] as any[]
};

export async function GET() {
  try {
    if (isMock || !prisma) {
      return NextResponse.json(inMemoryBankroll);
    }

    // Tentar obter da tabela Bankroll do Supabase
    let bankObj = await prisma.bankroll.findUnique({
      where: { id: 'active' }
    });

    if (!bankObj) {
      // Se não existir, criar padrão
      bankObj = await prisma.bankroll.create({
        data: {
          id: 'active',
          bankroll: 1000.0,
          defaultStake: 50.0,
          maxRisk: 100.0
        }
      });
    }

    // Buscar histórico do Supabase
    const dbHistory = await prisma.bankrollHistory.findMany({
      orderBy: { date: 'desc' }
    });

    // Calcular Lucro e ROI
    const initialBankroll = 1000.0;
    const profit = bankObj.bankroll - initialBankroll;
    const roi = (profit / initialBankroll) * 100;

    return NextResponse.json({
      bankroll: bankObj.bankroll,
      defaultStake: bankObj.defaultStake,
      maxRisk: bankObj.maxRisk,
      roi: parseFloat(roi.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      history: dbHistory
    });

  } catch (error: any) {
    console.error('Erro na API de banca:', error);
    // Em caso de qualquer erro de banco, servir em memória
    return NextResponse.json(inMemoryBankroll);
  }
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    if (isMock || !prisma) {
      if (action === 'settings') {
        inMemoryBankroll.bankroll = data.bankroll;
        inMemoryBankroll.defaultStake = data.defaultStake;
        inMemoryBankroll.maxRisk = data.maxRisk;
      } else if (action === 'bet') {
        inMemoryBankroll.bankroll = data.balance;
        inMemoryBankroll.profit += data.profit;
        inMemoryBankroll.roi = (inMemoryBankroll.profit / 1000.0) * 100;
        inMemoryBankroll.history.unshift({
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          balance: data.balance,
          profit: data.profit,
          roi: data.roi
        });
      }
      return NextResponse.json({ success: true, ...inMemoryBankroll });
    }

    if (action === 'settings') {
      const updated = await prisma.bankroll.upsert({
        where: { id: 'active' },
        update: {
          bankroll: data.bankroll,
          defaultStake: data.defaultStake,
          maxRisk: data.maxRisk
        },
        create: {
          id: 'active',
          bankroll: data.bankroll,
          defaultStake: data.defaultStake,
          maxRisk: data.maxRisk
        }
      });
      return NextResponse.json({ success: true, updated });
    } 
    
    if (action === 'bet') {
      // 1. Atualizar a banca ativa
      const updated = await prisma.bankroll.upsert({
        where: { id: 'active' },
        update: { bankroll: data.balance },
        create: { id: 'active', bankroll: data.balance, defaultStake: 50, maxRisk: 100 }
      });

      // 2. Registrar no histórico
      const historyItem = await prisma.bankrollHistory.create({
        data: {
          balance: data.balance,
          profit: data.profit,
          roi: data.roi
        }
      });

      return NextResponse.json({ success: true, updated, historyItem });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na API de banca:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
