import prisma from './prisma';

export async function calculateSimpleSalary(staffId: string, monthYear: string) {
  const [year, month] = monthYear.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const totalDaysInMonth = endDate.getDate();
  
  const staff = await prisma.staffProfile.findUnique({
    where: { id: staffId },
    include: {
      leaves: {
        where: {
          date: { gte: startDate, lte: endDate }
        }
      }
    }
  });

  if (!staff) throw new Error('Staff not found');

  const monthlySalary = staff.monthlySalary;
  const dailyWage = monthlySalary / totalDaysInMonth;

  const fullLeaves = staff.leaves.filter(l => l.type === 'FULL').length;
  const halfLeaves = staff.leaves.filter(l => l.type === 'HALF').length;

  const deductions = (fullLeaves * dailyWage) + (halfLeaves * (dailyWage / 2));
  const simpleSalary = Math.max(0, monthlySalary - deductions);

  return {
    monthlySalary,
    totalDaysInMonth,
    dailyWage,
    fullLeaves,
    halfLeaves,
    deductions,
    simpleSalary
  };
}
