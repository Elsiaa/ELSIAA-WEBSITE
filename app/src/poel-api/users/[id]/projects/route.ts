/**
 * User Project Permissions API
 * GET /api/users/[id]/projects - Get projects user has access to
 * PUT /api/users/[id]/projects - Set which projects user can access (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserByAuthUserId, getUserById } from '@/lib/users';
import { getUserProjectPermissions, setUserProjectPermissions } from '@/lib/user-project-permissions';
import { isSuperAdmin } from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const requestingUser = await getUserByAuthUserId(authUserId);
    const superuser = await isSuperAdmin();

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!superuser && (!requestingUser || requestingUser.id !== id)) {
      if (!requestingUser || requestingUser.role !== 'admin' || requestingUser.company_id !== targetUser.company_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const projectIds = await getUserProjectPermissions(id);
    return NextResponse.json({ projectIds });
  } catch (error) {
    console.error('Error fetching user project permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { projectIds } = body;

    if (!Array.isArray(projectIds)) {
      return NextResponse.json({ error: 'projectIds must be an array' }, { status: 400 });
    }

    const requestingUser = await getUserByAuthUserId(authUserId);
    const superuser = await isSuperAdmin();

    if (!superuser && (!requestingUser || requestingUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only company admins can manage project permissions' },
        { status: 403 }
      );
    }

    const targetUser = await getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!superuser && requestingUser && requestingUser.company_id !== targetUser.company_id) {
      return NextResponse.json(
        { error: 'You can only manage users in your own company' },
        { status: 403 }
      );
    }

    if (targetUser.role === 'admin') {
      if (requestingUser && requestingUser.id === id) {
        return NextResponse.json(
          { error: 'Forbidden - admins cannot change their own project access' },
          { status: 403 }
        );
      }
      if (superuser && !requestingUser && targetUser.auth_user_id && authUserId === targetUser.auth_user_id) {
        return NextResponse.json(
          { error: 'Forbidden - admins cannot change their own project access' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Forbidden - admins have access to all projects and cannot have specific project permissions set' },
        { status: 403 }
      );
    }

    const success = await setUserProjectPermissions(id, projectIds);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user project permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
