import { NextResponse } from 'next/server';
import { triggerGoldenHourSimulation } from '@/lib/graph-queries';

export async function POST() {
  try {
    const simulationResult = await triggerGoldenHourSimulation();
    return NextResponse.json({
      ...simulationResult,
      updatedNodes: simulationResult.boostedZones?.map(z => ({
        name: z.name,
        isSpike: false,
        feature: z.feature
      })) || []
    });
  } catch (error) {
    console.error('Error in POST /api/spike:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to simulate dynamic conditions.' },
      { status: 500 }
    );
  }
}
