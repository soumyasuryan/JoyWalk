import { NextResponse } from 'next/server';
import { getDailyWellbeing, resetDailyWellbeing, logCompletedWalk } from '@/lib/graph-queries';

export async function GET() {
  try {
    const data = await getDailyWellbeing();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/wellbeing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wellbeing metrics.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, routeName, distance, avgCanopy, joyPoints } = body;

    if (action === 'reset') {
      const resetData = await resetDailyWellbeing();
      return NextResponse.json({ message: 'Daily serenity journal reset.', ...resetData });
    }

    if (action === 'log') {
      const updated = await logCompletedWalk({ routeName, distance, avgCanopy, joyPoints });
      return NextResponse.json({ message: 'Walk logged to serenity journal!', ...updated });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/wellbeing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update wellbeing data.' },
      { status: 500 }
    );
  }
}
