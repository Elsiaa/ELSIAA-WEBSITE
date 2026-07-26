import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireCompanyAdmin, requireSuperAdmin } from '@/lib/permissions';
import {
  getProjectFees,
  createProjectFee,
  deleteProjectFee,
} from '@/lib/project-payments';
import { getProjectById } from '@/lib/projects';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    
    // Verify project exists and user has access
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is company admin for this company
    await requireCompanyAdmin(project.companyId);

    const fees = await getProjectFees(projectId);
    return NextResponse.json({ fees });
  } catch (error: any) {
    console.error('Error fetching project fees:', error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch project fees' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only superadmin can create fees (company admins are clients, they don't create fees)
    await requireSuperAdmin();

    const { id: projectId } = await context.params;
    
    // Verify project exists
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, amount } = body;

    if (!name || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid name or amount' }, { status: 400 });
    }

    const fee = await createProjectFee({
      projectId,
      companyId: project.companyId,
      name,
      amount,
      createdByClerkUserId: userId,
    });

    return NextResponse.json({ fee }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project fee:', error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create project fee' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only superadmin can delete fees
    await requireSuperAdmin();

    const body = await request.json();
    const { feeId, projectId } = body;

    if (!feeId || !projectId) {
      return NextResponse.json({ error: 'Fee ID and Project ID are required' }, { status: 400 });
    }

    await deleteProjectFee(feeId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting project fee:', error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete project fee' }, { status: 500 });
  }
}

