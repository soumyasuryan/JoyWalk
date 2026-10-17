import { NextResponse } from 'next/server';
import { triggerGoldenHourSimulation } from '@/lib/graph-queries';

export async function POST() {
  try {
    const simulationResult = await triggerGoldenHourSimulation();
    return NextResponse.json(simulationResult);
  } catch (error) {
    console.error('Error in POST /api/golden-hour:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to simulate Golden Hour breeze corridors.' },
      { status: 500 }
    );
  }
}
