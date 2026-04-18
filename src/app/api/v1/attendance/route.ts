import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { staffId, action } = await req.json();
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current status
      let attendance = await tx.attendanceRecord.findFirst({
        where: { staffId, shiftDate: today },
        include: { breaks: true }
      });

      const currentState = attendance?.state || 'NOT_STARTED';

      // 2. Validate Transitions
      switch (action) {
        case 'START_SHIFT':
          if (currentState !== 'NOT_STARTED') {
            return NextResponse.json({ error: 'Shift already started or ended' }, { status: 400 });
          }
          attendance = await tx.attendanceRecord.create({
            data: {
              staffId,
              shiftDate: today,
              state: 'SHIFT_STARTED',
              startTime: new Date()
            }
          });
          break;

        case 'START_BREAK':
          if (currentState !== 'SHIFT_STARTED') {
            return NextResponse.json({ error: 'Cannot start break in current state' }, { status: 400 });
          }
          await tx.breakLog.create({
            data: { attendanceId: attendance!.id, startTime: new Date() }
          });
          attendance = await tx.attendanceRecord.update({
            where: { id: attendance!.id },
            data: { state: 'ON_BREAK' }
          });
          break;

        case 'END_BREAK':
          if (currentState !== 'ON_BREAK') {
            return NextResponse.json({ error: 'Not on break' }, { status: 400 });
          }
          const activeBreak = await tx.breakLog.findFirst({
            where: { attendanceId: attendance!.id, endTime: null },
            orderBy: { startTime: 'desc' }
          });
          if (activeBreak) {
            await tx.breakLog.update({
              where: { id: activeBreak.id },
              data: { endTime: new Date() }
            });
          }
          attendance = await tx.attendanceRecord.update({
            where: { id: attendance!.id },
            data: { state: 'SHIFT_STARTED' }
          });
          break;

        case 'END_SHIFT':
          if (currentState !== 'SHIFT_STARTED') {
            return NextResponse.json({ error: 'Cannot end shift in current state' }, { status: 400 });
          }
          attendance = await tx.attendanceRecord.update({
            where: { id: attendance!.id },
            data: { state: 'SHIFT_ENDED', endTime: new Date() }
          });
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ success: true, newState: attendance.state });
    });
  } catch (error) {
    console.error('API /attendance Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
