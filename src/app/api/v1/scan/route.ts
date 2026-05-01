import { NextResponse } from 'next/server';


import prisma from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { qrToken } = await req.json();

    const slot = await prisma.staffSlot.findUnique({
      where: { qrToken },
      include: {
        profiles: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!slot || slot.profiles.length === 0) {
      return NextResponse.json({ error: 'Invalid QR Token or no active staff assigned' }, { status: 404 });
    }

    return NextResponse.json({ 
      slotName: slot.name,
      staffName: slot.profiles[0].name,
      staffId: slot.profiles[0].id
    });
  } catch (error) {
    console.error('API /scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
