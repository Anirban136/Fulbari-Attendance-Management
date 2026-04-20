import { NextResponse } from 'next/server';


import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // e.g. "2026-04"

  if (!month) return NextResponse.json({ error: 'Month is required' }, { status: 400 });

  try {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59));

    const staffProfiles = await prisma.staffProfile.findMany({
      include: {
        attendances: {
          where: {
            shiftDate: { gte: startDate, lte: endDate }
          },
          include: { breaks: true }
        },
        advances: {
          where: {
            isActive: true,
            status: 'PENDING'
          }
        },
        slot: { include: { outlet: true } }
      }
    });

    const results = staffProfiles.map(staff => {
      const outlet = staff.slot.outlet;
      const expectedHours = outlet.expectedWorkHours;
      const workingDaysInMonth = 26; // Mock standard, should be configurable

      // Calculate Strict Stats
      let totalPayableHours = 0;
      let actualWorkHours = 0;

      staff.attendances.forEach(att => {
        if (!att.startTime || !att.endTime) return;
        
        const shiftDurationMs = att.endTime.getTime() - att.startTime.getTime();
        let breakDurationMs = 0;
        att.breaks.forEach(b => {
          if (b.startTime && b.endTime) {
            breakDurationMs += b.endTime.getTime() - b.startTime.getTime();
          }
        });

        const workTimeMs = shiftDurationMs - breakDurationMs;
        const workTimeHours = workTimeMs / (1000 * 60 * 60);
        
        actualWorkHours += workTimeHours;
        totalPayableHours += Math.min(workTimeHours, expectedHours);
      });

      const hourlyRate = staff.monthlySalary / (workingDaysInMonth * expectedHours);
      const strictRawSalary = totalPayableHours * hourlyRate;

      // Calculate Simple Stats
      let simpleActiveDays = 0;
      staff.attendances.forEach(att => {
        // Logic: Full if >= 80% expected, Half if >= 40%
        // Using actualWorkHours for this specific day
        const dayWorkTimeMs = (att.endTime?.getTime() || 0) - (att.startTime?.getTime() || 0);
        // ... (simplified for now)
        simpleActiveDays += 1; 
      });

      const perDaySalary = staff.monthlySalary / workingDaysInMonth;
      const simpleRawSalary = simpleActiveDays * perDaySalary;

      const totalAdvance = staff.advances.reduce((acc, curr) => acc + curr.amount, 0);

      const pfRate = 0.12;
      const strictPF = strictRawSalary * pfRate;
      const simplePF = simpleRawSalary * pfRate;
      const basePF = staff.monthlySalary * pfRate;
      const inHandBase = staff.monthlySalary - basePF;

      return {
        staffId: staff.id,
        name: staff.name,
        month,
        monthlySalary: staff.monthlySalary,
        pfAmount: basePF.toFixed(2),
        inHandBase: inHandBase.toFixed(2),
        strictRaw: strictRawSalary.toFixed(2),
        simpleRaw: simpleRawSalary.toFixed(2),
        strictPF: strictPF.toFixed(2),
        simplePF: simplePF.toFixed(2),
        totalAdvance: totalAdvance.toFixed(2),
        strictFinal: Math.max(0, strictRawSalary - strictPF - totalAdvance).toFixed(2),
        simpleFinal: Math.max(0, simpleRawSalary - simplePF - totalAdvance).toFixed(2),
        warnings: {
          highAdvance: totalAdvance > (staff.monthlySalary * 0.5),
          lowWork: actualWorkHours < (totalPayableHours * 0.8) // simplified
        }
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Payroll Calculation Error:', error);
    return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 });
  }
}
