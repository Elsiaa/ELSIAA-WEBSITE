/**
 * next/server shim for copied Poel API route handlers.
 */
export class NextRequest extends Request {
  nextUrl: URL;
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  }
}

export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): NextResponse {
    const headers = new Headers(init?.headers);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }

  static redirect(url: string | URL, status = 307): NextResponse {
    return new NextResponse(null, {
      status,
      headers: { Location: String(url) },
    });
  }

  static next(): NextResponse {
    return new NextResponse(null, { status: 200 });
  }
}
