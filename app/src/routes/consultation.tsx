import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Booking } from "../components/Booking";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Book a Consultation — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Book a free 20-minute intro call or a 30-minute working session with ELSIAA. First call free.",
      },
      { property: "og:title", content: "Book a Consultation — ELSIAA" },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: ConsultationPage,
});

function ConsultationPage() {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-6 pt-36 pb-24 md:pt-44">
        <p
          className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Consultation
        </p>
        <h1
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Book a consultation.
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#111111]/55">
          Twenty minutes, free, no strings — or a full working session. Pick a
          day and a time; confirmation arrives by email within hours.
        </p>
        <div className="mt-10">
          <Booking />
        </div>
      </section>
    </main>
  );
}
