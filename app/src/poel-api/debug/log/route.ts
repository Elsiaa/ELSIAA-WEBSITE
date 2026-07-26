import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side logging endpoint for client-side events
 * This allows client-side code to log to server logs which persist
 */
export async function POST(request: NextRequest) {
  try {
    const { level, message, data } = await request.json();
    
    const logMessage = `[CLIENT-LOG] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CLIENT-LOG] Error logging:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}




