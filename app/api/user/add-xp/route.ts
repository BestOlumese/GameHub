// app/api/user/add-xp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getExtendedSession } from "@/lib/auth-utils";
import { Rank } from "@/lib/generated/prisma";
import { getRankForLevel, xpForNextLevel } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { xpToAdd } = await req.json();
    const session = await getExtendedSession(req.headers);

    if (!session || typeof xpToAdd !== "number") {
      return NextResponse.json(
        { error: "User not authenticated or invalid xpToAdd" },
        { status: 400 }
      );
    }

    const user = session.user;
    let xp = user?.xp ?? 0;
    let level = user?.level ?? 1;

    // ✅ Apply XP (positive or negative)
    xp += xpToAdd;

    // ✅ Level up loop
    while (xp >= xpForNextLevel(level) && level < 999) {
      xp -= xpForNextLevel(level);
      level++;
    }

    // ✅ Level down loop
    while (xp < 0 && level > 1) {
      level--;
      xp += xpForNextLevel(level); // regain previous level XP pool
    }

    // ✅ Hard limits
    if (level <= 1 && xp < 0) xp = 0; // cannot go below Level 1
    if (level >= 999) {
      level = 999;
      xp = Math.min(xp, xpForNextLevel(999)); // cap XP at max level
    }

    // ✅ Rank update
    const rank: Rank = getRankForLevel(level) as Rank;

    // ✅ Save user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { xp, level, rank },
    });

    return NextResponse.json({
      message: "XP updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("XP update failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
