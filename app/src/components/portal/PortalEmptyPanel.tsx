import type { PortalNavId } from "../../lib/portal/types";
import { portalNavMeta } from "../../lib/portal/modules";
import { portalFonts } from "./tokens";

type Props = {
  active: PortalNavId;
};

export function PortalEmptyPanel({ active }: Props) {
  const item = portalNavMeta[active] ?? portalNavMeta.overview;
  const { mono, sans } = portalFonts;

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-8 md:p-10">
      <p className="text-[13px] text-[#1e6b3c]" style={mono}>
        {item.label}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-4xl" style={sans}>
        {item.blurb}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={sans}>
        This module is part of the ELSIAA client portal. If you expected data here, ask your company
        admin to enable the module on your membership.
      </p>
    </section>
  );
}
