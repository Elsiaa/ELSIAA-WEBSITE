import { NextResponse } from "next/server";
import { isGitHubRateLimitError } from "@/lib/github-dynamic-repo";

export function extensionGitHubFetchErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string>,
  fallbackMessage: string,
): NextResponse {
  if (isGitHubRateLimitError(err)) {
    return NextResponse.json(
      { error: err.message, code: "github_rate_limit" },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Retry-After": String(err.retryAfterSeconds),
        },
      },
    );
  }

  const message = err instanceof Error ? err.message : fallbackMessage;
  const isNotFound = message.includes("not found") || message.includes("404");
  return NextResponse.json(
    { error: message },
    { status: isNotFound ? 404 : 500, headers: corsHeaders },
  );
}
