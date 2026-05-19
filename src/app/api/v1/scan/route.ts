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

    const staff = slot.profiles[0];
    const authenticatorCount = await prisma.authenticator.count({
      where: { staffId: staff.id }
    });

    return NextResponse.json({ 
      slotName: slot.name,
      staffName: staff.name,
      staffId: staff.id,
      hasBiometrics: authenticatorCount > 0
    });
  } catch (error) {
    console.error('API /scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
