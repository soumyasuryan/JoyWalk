import { NextResponse } from 'next/server';
import { computeComparisonRoutes } from '@/lib/graph-queries';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      source,
      target,
      mood = 'Reflective',
      serenityWeight = 1.0,
      alpha = 1.0
    } = body;

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Source and target locations must be provided.' },
        { status: 400 }
      );
    }

    const effectiveWeight =
      serenityWeight !== undefined && serenityWeight !== null
        ? parseFloat(serenityWeight)
        : parseFloat(alpha) || 1.0;

    const results = await computeComparisonRoutes({
      source,
      target,
      mood,
      serenityWeight: effectiveWeight,
      alpha: effectiveWeight
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in POST /api/compare:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compute tri-mode route comparison.' },
      { status: 500 }
    );
  }
}
