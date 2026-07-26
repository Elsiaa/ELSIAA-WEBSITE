import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import {
  getMeeting,
  updateMeeting,
  deleteMeeting,
  updateMeetingStatus,
} from '@/lib/meetings';
import { getUserByAuthUserId, getUserById } from '@/lib/users';
import { isSuperAdmin } from '@/lib/permissions';

interface RouteContext {
  params: Promise<{ meetingId: string }>;
}

// GET /api/meetings/[meetingId] - Get a specific meeting
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await getUserByAuthUserId(authUserId);
    const dbUserId = dbUser?.id ?? null;
    const userCompanyId = dbUser?.company_id ?? null;

    const { meetingId } = await context.params;
    const meeting = await getMeeting(meetingId);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    let hasAccess = false;

    if (dbUserId !== null) {
      if (
        meeting.hostUserId === dbUserId ||
        meeting.participantUserIds.includes(dbUserId)
      ) {
        hasAccess = true;
      }

      if (
        !hasAccess &&
        meeting.accessType === 'company' &&
        userCompanyId &&
        meeting.participantCompanyIds.includes(userCompanyId)
      ) {
        hasAccess = true;
      }
    }

    if (!hasAccess && meeting.accessType === 'public') {
      hasAccess = true;
    }

    if (!hasAccess && !(await isSuperAdmin())) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

// PATCH /api/meetings/[meetingId] - Update a meeting
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await context.params;
    const meeting = await getMeeting(meetingId);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const dbUser = await getUserByAuthUserId(authUserId);
    const superUser = await isSuperAdmin();
    const isHost = dbUser ? meeting.hostUserId === dbUser.id : false;

    if (!isHost && !superUser) {
      return NextResponse.json(
        { error: 'Only the host or admin can update this meeting' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, participantUserIds, ...otherUpdates } = body;

    let participantDatabaseIds: string[] | undefined;
    if (participantUserIds !== undefined) {
      participantDatabaseIds = [];
      if (Array.isArray(participantUserIds) && participantUserIds.length > 0) {
        for (const pid of participantUserIds) {
          const u = await getUserById(pid);
          if (u) participantDatabaseIds.push(u.id);
        }
      }
    }

    const updates: Record<string, unknown> = { ...otherUpdates };
    if (participantDatabaseIds !== undefined) {
      updates.participantUserIds = participantDatabaseIds;
    }

    let updatedMeeting;

    if (status) {
      const additionalData: { startedAt?: string; endedAt?: string } = {};

      if (status === 'in-progress' && !meeting.startedAt) {
        additionalData.startedAt = new Date().toISOString();
      }

      if (status === 'completed' && !meeting.endedAt) {
        additionalData.endedAt = new Date().toISOString();
      }

      updatedMeeting = await updateMeetingStatus(meetingId, status, additionalData);
    } else {
      updatedMeeting = await updateMeeting(meetingId, updates);
    }

    if (!updatedMeeting) {
      return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

// DELETE /api/meetings/[meetingId] - Delete a meeting
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await context.params;
    const meeting = await getMeeting(meetingId);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const dbUser = await getUserByAuthUserId(authUserId);
    const superUser = await isSuperAdmin();
    const isHost = dbUser ? meeting.hostUserId === dbUser.id : false;

    if (!isHost && !superUser) {
      return NextResponse.json(
        { error: 'Only the host or admin can delete this meeting' },
        { status: 403 }
      );
    }

    const deleted = await deleteMeeting(meetingId);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
