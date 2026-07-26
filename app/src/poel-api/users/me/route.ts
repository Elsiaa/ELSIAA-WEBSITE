import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUser, isSuperAdmin } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getCurrentUser();
    const superAdmin = await isSuperAdmin();

    return NextResponse.json({
      user: currentUser,
      isSuperAdmin: superAdmin,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}




