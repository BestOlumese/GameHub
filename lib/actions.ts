"use server";

import { headers } from "next/headers";
import { getExtendedSession } from "./auth-utils";
import { prisma } from "./db";
import { MatchStatus } from "./generated/prisma";
import { username } from "better-auth/plugins";

export async function userStats() {
  const session = await getExtendedSession(headers());
  if (!session) {
    return {
      status: "error",
      message: "User is not authenticated",
    };
  }

  try {
    // Get total counts for wins, losses, and draws
    const [wins, losses, draws, totalMatches] = await Promise.all([
      prisma.matchPlayer.count({
        where: {
          userId: session.user.id,
          result: "WIN", // assuming your matchPlayer table has a `result` field
        },
      }),
      prisma.matchPlayer.count({
        where: {
          userId: session.user.id,
          result: "LOSE",
        },
      }),
      prisma.matchPlayer.count({
        where: {
          userId: session.user.id,
          result: "DRAW",
        },
      }),
      prisma.matchPlayer.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return {
      status: "success",
      data: {
        wins,
        losses,
        draws,
        totalMatches,
      },
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      status: "error",
      message: "Failed to fetch user statistics",
    };
  }
}

export async function recentMatches() {
  const session = await getExtendedSession(headers());
  if (!session) {
    return {
      status: "error",
      message: "User is not authenticated",
    };
  }

  try {
    const recentMatches = await prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        players: {
          some: {
            userId: session?.user?.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      status: "success",
      data: recentMatches,
    };
  } catch (error) {
    console.error("Error fetching recent matches:", error);
    return {
      status: "error",
      message: "Failed to fetch recent matches",
    };
  }
}

export async function getLeaderboard() {
  const session = await getExtendedSession(headers());
  if (!session) {
    return {
      status: "error",
      message: "User is not authenticated",
    };
  }

  try {
    const matchPlayers = await prisma.matchPlayer.findMany({
      where: {
        match: { status: "FINISHED" },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
            rank: true,
            image: true,
          },
        },
      },
    });

    // Step 2: Aggregate results per user
    const statsMap = new Map<string, any>();

    for (const mp of matchPlayers) {
      const uid = mp.user.id;

      if (!statsMap.has(uid)) {
        statsMap.set(uid, {
          id: uid,
          username: mp.user.username,
          level: mp.user.level,
          rank: mp.user.rank,
          image: mp.user.image,
          wins: 0,
          losses: 0,
          draws: 0,
          totalGames: 0,
        });
      }

      const stats = statsMap.get(uid);
      stats.totalGames++;

      if (mp.result === "WIN") stats.wins++;
      else if (mp.result === "LOSE") stats.losses++;
      else if (mp.result === "DRAW") stats.draws++;

      statsMap.set(uid, stats);
    }

    // Step 3: Convert to array and sort
    const leaderboard = Array.from(statsMap.values()).sort((a, b) => {
      // Sort by wins first, then level
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.level - a.level;
    });

    return {
      status: "success",
      data: leaderboard,
    };
  } catch (error) {
    console.error("Error fetching leaderboards:", error);
    return {
      status: "error",
      message: "Failed to fetch leaderboards",
    };
  }
}
