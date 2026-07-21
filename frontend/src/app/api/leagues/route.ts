import { NextResponse } from 'next/server';
import { getRealLeagues } from '@/lib/api/footballData';

export async function GET() {
  try {
    const leagues = await getRealLeagues();
    return NextResponse.json(leagues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
