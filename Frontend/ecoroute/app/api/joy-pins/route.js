import { NextResponse } from 'next/server';
import { getAllJoyPins, addJoyPin, likeJoyPin } from '@/lib/graph-queries';

export async function GET() {
  try {
    const joyPins = await getAllJoyPins();
    return NextResponse.json({ joyPins });
  } catch (error) {
    console.error('Error in GET /api/joy-pins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Pockets of Joy.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, pinId, title, category, description, neighborhood, lat, lon, author } = body;

    if (action === 'like') {
      if (!pinId) {
        return NextResponse.json({ error: 'pinId is required to like a pin.' }, { status: 400 });
      }
      const updatedPin = await likeJoyPin(pinId);
      return NextResponse.json({ message: 'Pocket of Joy liked!', pin: updatedPin });
    }

    if (!title || !neighborhood) {
      return NextResponse.json(
        { error: 'Both title and neighborhood are required to drop a Pocket of Joy.' },
        { status: 400 }
      );
    }

    const newPin = await addJoyPin({
      title,
      category,
      description,
      neighborhood,
      lat,
      lon,
      author
    });

    return NextResponse.json({
      message: 'New Pocket of Joy placed on the scenic map!',
      pin: newPin
    });
  } catch (error) {
    console.error('Error in POST /api/joy-pins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to drop Pocket of Joy.' },
      { status: 500 }
    );
  }
}
