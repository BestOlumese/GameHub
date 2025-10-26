// app/api/check-username/route.ts
import { prisma } from "@/lib/db";
import { generateSuggestions } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.toLowerCase();

  if (!username) {
    return NextResponse.json({ available: false, suggestions: [] });
  }

  const exists = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  // generate suggestions if taken
  let suggestions: string[] = [];
  if (exists) {
    suggestions = generateSuggestions(username);
  }

  return NextResponse.json({ available: !exists, suggestions });
}
