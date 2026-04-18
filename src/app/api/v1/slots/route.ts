import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const availableOnly = searchParams.get('available') === 'true';

    const slots = await prisma.staffSlot.findMany({
      where: availableOnly ? {
        profiles: {
          none: { isActive: true }
        }
      } : {},
      include: {
        outlet: true,
      }
    });
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, outletId } = body;

    // Use a default outlet if none provided for MVP
    let targetOutletId = outletId;
    if (!targetOutletId) {
      const firstOutlet = await prisma.outlet.findFirst();
      if (firstOutlet) targetOutletId = firstOutlet.id;
    }

    if (!targetOutletId) {
      return NextResponse.json({ error: 'No outlet found to create slot' }, { status: 400 });
    }

    const newSlot = await prisma.staffSlot.create({
      data: {
        name,
        outletId: targetOutletId
      }
    });

    return NextResponse.json(newSlot, { status: 201 });
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json({ error: 'Failed to create staff slot' }, { status: 500 });
  }
}
