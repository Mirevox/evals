import { NextResponse } from "next/server";
import type { ApiErrorBody } from "./types";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse {
  const body: ApiErrorBody = {
    error: { code, message, details },
  };
  return NextResponse.json(body, { status });
}

export function requireCaptureAuth(
  request: Request,
  captureToken: string | null,
): NextResponse | null {
  if (!captureToken) return null;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${captureToken}`;
  if (header !== expected) {
    return jsonError(
      "UNAUTHORIZED",
      "Missing or invalid capture bearer token",
      401,
    );
  }
  return null;
}
