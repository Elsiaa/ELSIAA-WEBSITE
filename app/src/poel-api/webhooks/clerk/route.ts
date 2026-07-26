import { NextResponse } from 'next/server';

/**
 * Clerk is no longer used. User linking runs in Auth.js callbacks (`linkAppUserOnSignIn`).
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Clerk webhooks are disabled. Remove this URL from your Clerk dashboard if it is still configured.' },
    { status: 410 }
  );
}
