import { NextResponse } from 'next/server';


import prisma from '../../../../../lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, pin, monthlySalary, slotId, location, isActive } = body;

    const updateData: any = {
      name,
      phone,
      monthlySalary: monthlySalary ? Number(monthlySalary) : undefined,
      location,
      isActive
    };

    if (slotId) {
      updateData.slot = { connect: { id: slotId } };
    }

    if (pin) {
      updateData.hashedPin = Buffer.from(pin).toString('base64');
    }

    const updatedStaff = await prisma.staffProfile.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff profile' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Hard delete staff profile (cascade delete of history is handled by DB)
    await prisma.staffProfile.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff profile' }, { status: 500 });
  }
}
