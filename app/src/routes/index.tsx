import { createFileRoute } from "@tanstack/react-router";
import { ElsiaaSections } from "../components/ElsiaaSections";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <ElsiaaSections />
    </main>
  );
}
