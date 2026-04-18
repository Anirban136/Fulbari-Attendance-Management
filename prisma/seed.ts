import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const outlet = await prisma.outlet.create({
    data: {
      name: 'Main Cafe',
      shiftStartTime: '09:00',
      shiftEndTime: '17:00',
      expectedWorkHours: 8.0,
      timezone: 'UTC',
    },
  });

  console.log('Created outlet:', outlet.id);

  // Create 5 default staff slots
  for (let i = 1; i <= 5; i++) {
    await prisma.staffSlot.create({
      data: {
        outletId: outlet.id,
        name: `StaffSlot${i}`,
      },
    });
    console.log(`Created StaffSlot${i}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
