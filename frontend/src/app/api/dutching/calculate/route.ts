import { NextResponse } from 'next/server';
import { calculateDutching } from '@/lib/math/dutching';

export async function POST(request: Request) {
  try {
    const { selections, totalStake } = await request.json();
    const result = calculateDutching(selections, totalStake);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
