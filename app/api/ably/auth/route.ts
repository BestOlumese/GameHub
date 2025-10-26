// app/api/ably/auth/route.ts
import { NextResponse } from "next/server";
import { ablyRest } from "@/lib/ably.server";

export async function GET() {
  // Optionally: validate session here, only issue tokens to authenticated users.
  const tokenRequest = await ablyRest.auth.createTokenRequest({});
  return NextResponse.json(tokenRequest);
}
