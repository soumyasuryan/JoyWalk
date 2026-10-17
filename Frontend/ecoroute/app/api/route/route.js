import { NextResponse } from 'next/server';
import {
  computeShortestPath,
  logCompletedWalk
} from '@/lib/graph-queries';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      source,
      target,
      mode = 'fastest',
      mood = 'Reflective',
      serenityWeight = 1.0,
      alpha = 1.0,
      commit = false
    } = body;

    if (!source || !target) {
      return NextResponse.json(
        { error: 'Source origin and destination haven must be provided.' },
        { status: 400 }
      );
    }

    const effectiveWeight =
      serenityWeight !== undefined && serenityWeight !== null
        ? parseFloat(serenityWeight)
        : parseFloat(alpha) || 1.0;

    const result = await computeShortestPath({
      source,
      target,
      mode,
      mood,
      serenityWeight: effectiveWeight,
      alpha: effectiveWeight
    });

    if (Boolean(commit) && result.path && result.path.length > 0) {
      await logCompletedWalk({
        routeName: `${source} ➔ ${target}`,
        distance: result.totalDistance,
        avgCanopy: result.avgCanopyIndex,
        joyPoints: result.totalJoyMoments
      });
      result.committed = true;
    }

    result.mode = mode;
    result.mood = mood;
    result.serenityWeight = effectiveWeight;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compute scenic route.' },
      { status: 500 }
    );
  }
}
