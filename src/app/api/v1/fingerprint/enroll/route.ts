import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

/**
 * POST /api/v1/fingerprint/enroll
 * 
 * Enroll a fingerprint for a staff member.
 * Body: { staffId, templateData, fingerIndex?, deviceInfo? }
 */
export async function POST(req: Request) {
  try {
    const { staffId, templateData, fingerIndex, deviceInfo } = await req.json();

    if (!staffId || !templateData) {
      return NextResponse.json(
        { error: 'Staff ID and fingerprint template data are required' },
        { status: 400 }
      );
    }

    // Verify staff exists
    const staff = await prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: { fingerprints: true }
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Limit to 3 fingerprints per staff member
    if (staff.fingerprints.length >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 fingerprints allowed per staff member. Delete an existing one first.' },
        { status: 400 }
      );
    }

    // Store the fingerprint template
    const fingerprint = await prisma.fingerprintTemplate.create({
      data: {
        staffId,
        templateData,
        fingerIndex: fingerIndex || 'RIGHT_INDEX',
        deviceInfo: deviceInfo || null,
      }
    });

    return NextResponse.json({
      success: true,
      fingerprintId: fingerprint.id,
      totalEnrolled: staff.fingerprints.length + 1,
      message: 'Fingerprint enrolled successfully'
    });
  } catch (error) {
    console.error('API /fingerprint/enroll Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/fingerprint/enroll?id=xxx
 * 
 * Delete a specific fingerprint enrollment.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const staffId = searchParams.get('staffId');

    if (id) {
      // Delete specific fingerprint
      await prisma.fingerprintTemplate.delete({ where: { id } });
    } else if (staffId) {
      // Delete all fingerprints for a staff member
      await prisma.fingerprintTemplate.deleteMany({ where: { staffId } });
    } else {
      return NextResponse.json({ error: 'Fingerprint ID or Staff ID required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Fingerprint(s) deleted' });
  } catch (error) {
    console.error('API /fingerprint/enroll DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
