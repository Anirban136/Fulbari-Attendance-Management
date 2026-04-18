import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { staffId, pin } = await req.json();

    const staff = await prisma.staffProfile.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // BASE64 matching for mock hash
    const hashedPin = Buffer.from(pin).toString('base64');

    if (staff.hashedPin !== hashedPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Get today's attendance state
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const attendance = await prisma.attendanceRecord.findFirst({
      where: {
        staffId,
        shiftDate: today
      }
    });

    return NextResponse.json({
      success: true,
      staffName: staff.name,
      currentState: attendance?.state || 'NOT_STARTED',
      attendanceId: attendance?.id || null
    });
  } catch (error) {
    console.error('API /verify-pin Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
