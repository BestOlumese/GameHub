import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishToChannel } from "@/lib/ably.server";
import { GameType, MatchStatus } from "@/lib/generated/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId } = body;
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const result = await prisma.$transaction(async (tx) => {
    const waiting = await tx.match.findFirst({
      where: { gameType: GameType.ROCK_PAPER_SCISSORS, status: MatchStatus.WAITING },
      orderBy: { createdAt: "asc" },
      include: { players: true },
    });

    if (!waiting) {
      // Create new match with first player
      const newMatch = await tx.match.create({
        data: {
          gameType: GameType.ROCK_PAPER_SCISSORS,
          status: MatchStatus.WAITING,
          gameState: {
            currentRound: 1,
            totalRounds: 3,
            roundResults: [],
            scores: {},
          },
          players: {
            create: {
              userId,
              isHost: true,
              seat: 0,
              ready: true,
            },
          },
        },
        include: { players: true },
      });

      return { action: "waiting", match: newMatch };
    }

    // Add second player
    const addedPlayer = await tx.matchPlayer.create({
      data: {
        matchId: waiting.id,
        userId,
        isHost: false,
        seat: 1,
        ready: true,
      },
    });

    const updatedMatch = await tx.match.update({
      where: { id: waiting.id },
      data: {
        status: MatchStatus.ONGOING,
        startedAt: new Date(),
      },
      include: { players: true },
    });

    return { action: "matched", match: updatedMatch };
  });

  // Broadcast
  if (result.action === "matched") {
    const m = result.match;
    const players = m.players.map((p: any) => ({ userId: p.userId, seat: p.seat }));
    await publishToChannel("rps-matchmaking", "matched", {
      matchId: m.id,
      players,
    });
    await publishToChannel(`match:${m.id}`, "start", {
      matchId: m.id,
      players,
      gameState: m.gameState,
    });
    return NextResponse.json({ status: "matched", matchId: m.id, players });
  }

  return NextResponse.json({ status: "waiting", matchId: result.match.id });
}
