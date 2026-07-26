import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { auth } from "../auth";
import { getMeeting } from "./meetings";
import { getUserByAuthUserId } from "./users";
import { isSuperAdmin } from "./permissions";

export type JoinMeetingResult =
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "denied" }
  | {
      status: "ok";
      meeting: NonNullable<Awaited<ReturnType<typeof getMeeting>>>;
      userId: string;
      displayName: string;
      isSuperuser: boolean;
    };

export const bootstrapJoinMeeting = createServerFn({ method: "GET" })
  .inputValidator(z.object({ meetingId: z.string().min(1) }))
  .handler(async ({ data }): Promise<JoinMeetingResult> => {
    const meeting = await getMeeting(data.meetingId);
    if (!meeting) return { status: "not_found" };

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId && meeting.accessType === "public") {
      return {
        status: "ok",
        meeting,
        userId: "guest",
        displayName: "Guest",
        isSuperuser: false,
      };
    }

    if (!userId) return { status: "unauthenticated" };

    const dbUser = await getUserByAuthUserId(userId);
    const dbUserId = dbUser?.id ?? null;
    const userCompanyId = dbUser?.company_id ?? null;

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

    const superuser = await isSuperAdmin();
    if (!hasAccess && !superuser) return { status: "denied" };

    const displayName =
      session.user?.name?.trim() ||
      [dbUser?.first_name, dbUser?.last_name].filter(Boolean).join(" ").trim() ||
      session.user?.email ||
      "Guest";

    return {
      status: "ok",
      meeting,
      userId,
      displayName,
      isSuperuser: superuser,
    };
  });
