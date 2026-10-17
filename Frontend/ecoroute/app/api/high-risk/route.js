import { NextResponse } from 'next/server';
import { getAllJoyPins } from '@/lib/graph-queries';

export async function GET() {
  try {
    const joyPins = await getAllJoyPins();
    return NextResponse.json({
      highRiskNodes: [],
      joyPins
    });
  } catch (error) {
    return NextResponse.json({ highRiskNodes: [] });
  }
}
