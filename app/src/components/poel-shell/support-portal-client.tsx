"use client";

import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import SupportDesk from "@/components/support/support-desk";
import type { Company, User } from "@/types/company";

type Props = {
  companies: Company[];
  allUsers: User[];
  fixedCompanyId: string;
  appUserId: string;
  portalIsCompanyAdmin: boolean;
};

export default function SupportPortalClient({
  companies,
  allUsers,
  fixedCompanyId,
  appUserId,
  portalIsCompanyAdmin,
}: Props) {
  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-sm text-[#111]/55 hover:text-[#111] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portal
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="w-8 h-8 text-[#1e6b3c]" />
          <h1 className="text-3xl font-bold">Support</h1>
        </div>
        <p className="text-sm text-[#111]/55 mb-6">
          Open a ticket to write detailed replies and attach files with large previews. New messages email everyone on
          the ticket.
        </p>
        <SupportDesk
          mode="portal"
          isSuperAdmin={false}
          companies={companies}
          allUsers={allUsers}
          fixedCompanyId={fixedCompanyId}
          appUserId={appUserId}
          portalIsCompanyAdmin={portalIsCompanyAdmin}
        />
      </div>
    </div>
  );
}
