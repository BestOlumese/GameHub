import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishToChannel } from "@/lib/ably.server";
import { MatchStatus, GameType } from "@/lib/generated/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // find an existing waiting match
      const waiting = await tx.match.findFirst({
        where: {
          gameType: GameType.TIC_TAC_TOE,
          status: MatchStatus.WAITING,
        },
        orderBy: { createdAt: "asc" },
        include: { players: true },
      });

      if (!waiting) {
        // create new waiting match with first player
        const newMatch = await tx.match.create({
          data: {
            gameType: GameType.TIC_TAC_TOE,
            status: MatchStatus.WAITING,
            gameState: { board: Array(9).fill("") },
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

      // ensure waiting match not full
      if (waiting.players.length >= 2) {
        throw new Error("Waiting match already full");
      }

      // add second player
      await tx.matchPlayer.create({
        data: {
          matchId: waiting.id,
          userId,
          isHost: false,
          seat: 1,
          ready: true,
        },
      });

      const updated = await tx.match.update({
        where: { id: waiting.id },
        data: {
          status: MatchStatus.ONGOING,
          startedAt: new Date(),
        },
        include: {
          players: true,
        },
      });

      return { action: "matched", match: updated };
    });

    // handle results
    if (result.action === "matched") {
      const m = result.match;
      const players = m.players.map((p) => ({
        userId: p.userId,
        seat: p.seat,
      }));

      // notify both players
      await publishToChannel("tictactoe-matchmaking", "matched", {
        matchId: m.id,
        players,
      });

      // notify per-match channel
      await publishToChannel(`match:${m.id}`, "start", {
        matchId: m.id,
        players,
        gameState: m.gameState ?? { board: Array(9).fill("") },
      });

      return NextResponse.json({
        status: "matched",
        matchId: m.id,
        players,
      });
    }

    const m = result.match;
    return NextResponse.json({ status: "waiting", matchId: m.id });
  } catch (err: any) {
    console.error("Matchmaking error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
