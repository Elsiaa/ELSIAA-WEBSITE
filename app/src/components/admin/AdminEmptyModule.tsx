import { adminFonts } from "./tokens";

export function AdminEmptyModule({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const { mono, sans } = adminFonts;
  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-8 md:p-10">
      <p className="text-[13px] text-[#1e6b3c]" style={mono}>
        {title}
      </p>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={sans}>
        {body}
      </p>
    </section>
  );
}
