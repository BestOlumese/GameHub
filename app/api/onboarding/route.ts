// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getExtendedSession } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Get logged-in user from session
    const session = await getExtendedSession(req.headers);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Parse body
    const { name, username, avatar } = await req.json();

    // 3️⃣ Validate input (basic)
    if (!name || !username) {
      return NextResponse.json(
        { error: "Name and username are required" },
        { status: 400 }
      );
    }

    // 4️⃣ Check if username already exists (case insensitive)
    const exists = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // 5️⃣ Update current user record
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        username,
        image: avatar,
        onboarded: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
