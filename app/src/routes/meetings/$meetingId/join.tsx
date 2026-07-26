import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import JitsiMeetClient from "../../../components/meetings/join-meeting";
import {
  bootstrapJoinMeeting,
  type JoinMeetingResult,
} from "../../../lib/join-meeting.functions";
import { absoluteUrl } from "../../../lib/site-url";

export const Route = createFileRoute("/meetings/$meetingId/join")({
  head: () => ({
    meta: [
      { title: "Join meeting — ELSIAA" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/meetings") }],
  }),
  component: JoinMeetingRoute,
});

function JoinMeetingRoute() {
  const { meetingId } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<JoinMeetingResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void bootstrapJoinMeeting({ data: { meetingId } }).then((result) => {
      if (cancelled) return;
      if (result.status === "unauthenticated") {
        void navigate({ to: "/portal/sign-in" });
        return;
      }
      setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [meetingId, navigate]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#111]/45">
        Loading meeting…
      </div>
    );
  }

  if (data.status === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-semibold">Meeting not found</h1>
          <p className="mt-2 text-sm text-[#111]/55">
            The meeting you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  if (data.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#111]/45">
        Redirecting to sign in…
      </div>
    );
  }

  if (data.status === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-[#111]/55">
            You don&apos;t have permission to join this meeting.
          </p>
          <Link to="/portal" className="mt-4 inline-block text-[#1e6b3c] underline">
            Back to portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F3]">
      <JitsiMeetClient
        meeting={data.meeting}
        userId={data.userId}
        displayName={data.displayName}
        isSuperuser={data.isSuperuser}
      />
    </main>
  );
}
