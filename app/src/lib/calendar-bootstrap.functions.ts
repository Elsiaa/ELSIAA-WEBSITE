import { createServerFn } from "@tanstack/react-start";
import { readAdminSession } from "./admin/session.server";
import {
  getAllBlockedTimeSlots,
  getMeetingRequests,
  type BlockedTimeSlot,
  type MeetingRequest,
} from "./meeting-scheduling";
import { getAllMeetingsList, type Meeting } from "./meetings";

export type CalendarBootstrap = {
  meetingRequests: MeetingRequest[];
  meetings: Meeting[];
  blockedSlots: BlockedTimeSlot[];
};

export const bootstrapAdminCalendar = createServerFn({ method: "GET" }).handler(
  async (): Promise<CalendarBootstrap> => {
    const session = await readAdminSession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    const [meetingRequests, meetings, blockedSlots] = await Promise.all([
      getMeetingRequests("pending"),
      getAllMeetingsList(),
      getAllBlockedTimeSlots(),
    ]);

    return {
      meetingRequests: meetingRequests ?? [],
      meetings: meetings ?? [],
      blockedSlots: blockedSlots ?? [],
    };
  },
);
