import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getMeeting } from "@/lib/meetings";
import { generateJaasToken, isJaasConfigured } from "@/lib/jaas";
import { getUserByAuthUserId } from "@/lib/users";
import { isSuperAdmin } from "@/lib/permissions";

interface RouteContext {
  params: Promise<{ meetingId: string }>;
}

// GET /api/meetings/[meetingId]/token - Get JaaS JWT token for a meeting
export async function GET(request: Request, context: RouteContext) {
  try {
    if (!isJaasConfigured()) {
      return NextResponse.json(
        {
          error: "JaaS not configured",
          message:
            "Please configure JaaS credentials (JAAS_APP_ID, JAAS_API_KEY_ID, JAAS_PRIVATE_KEY) in your environment variables.",
        },
        { status: 500 },
      );
    }

    const { meetingId } = await context.params;
    const meeting = await getMeeting(meetingId);

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const session = await auth();
    const authUserId = session?.user?.id;

    if (!authUserId && meeting.accessType === "public") {
      const guestId = `guest-${meeting.id}-${Date.now()}`;
      const userName = "Guest";

      const token = generateJaasToken({
        roomName: meeting.jitsiRoomName,
        userId: guestId,
        userName,
        userEmail: undefined,
        userAvatar: undefined,
        isModerator: false,
        expiresInMinutes: 180,
      });

      return NextResponse.json({
        token,
        domain: "8x8.vc",
        roomName: meeting.jitsiRoomName,
      });
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getUserByAuthUserId(authUserId);
    const dbUserId = dbUser?.id ?? null;
    const userCompanyId = dbUser?.company_id ?? null;

    let hasAccess = false;

    if (dbUserId !== null) {
      if (meeting.hostUserId === dbUserId || meeting.participantUserIds.includes(dbUserId)) {
        hasAccess = true;
      }

      if (
        !hasAccess &&
        meeting.accessType === "company" &&
        userCompanyId &&
        meeting.participantCompanyIds.includes(userCompanyId)
      ) {
        hasAccess = true;
      }
    }

    if (!hasAccess && meeting.accessType === "public") {
      hasAccess = true;
    }

    if (!hasAccess && !(await isSuperAdmin())) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userName =
      session.user?.name?.trim() ||
      [dbUser?.first_name, dbUser?.last_name].filter(Boolean).join(" ").trim() ||
      session.user?.email ||
      "Guest";

    const userEmail = session.user?.email || dbUser?.email;
    /* The session user type is { id, email, name? } — there is no avatar on
       it, so this was always undefined. Kept explicit rather than reading a
       property that does not exist. */
    const userAvatar: string | undefined = undefined;

    const superUser = await isSuperAdmin();
    const isHost = dbUserId !== null && meeting.hostUserId === dbUserId;
    const isModerator = isHost || superUser;

    const token = generateJaasToken({
      roomName: meeting.jitsiRoomName,
      userId: authUserId,
      userName,
      userEmail,
      userAvatar,
      isModerator,
      expiresInMinutes: 180,
    });

    return NextResponse.json({
      token,
      domain: "8x8.vc",
      roomName: meeting.jitsiRoomName,
    });
  } catch (error) {
    console.error("Error generating JaaS token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
