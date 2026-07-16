import { createFileRoute } from "@tanstack/react-router";
import { ElsiaaExperience } from "../components/ElsiaaExperience";

export const Route = createFileRoute("/designs")({
  component: Designs,
});

function Designs() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <ElsiaaExperience />
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p
          className="text-3xl md:text-5xl italic"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Discover the new generation of design.
        </p>
      </section>
    </main>
  );
}
