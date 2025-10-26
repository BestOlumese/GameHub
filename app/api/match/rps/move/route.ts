// app/api/match/rps/move/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishToChannel } from "@/lib/ably.server";
import { MatchStatus } from "@/lib/generated/prisma";

/**
 * Allowed choices: "rock" | "paper" | "scissors" | "NO_PICK"
 * Turn numbering: use match.gameState.currentRound (1-indexed)
 */

const WIN_RULES: Record<string, string> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

function decideRoundWinner(choiceA: string, choiceB: string, playerA: string, playerB: string) {
  // returns winner userId or null for draw
  if (choiceA === choiceB) return null;
  if (choiceA === "NO_PICK" && choiceB !== "NO_PICK") return playerB;
  if (choiceB === "NO_PICK" && choiceA !== "NO_PICK") return playerA;
  if (WIN_RULES[choiceA] === choiceB) return playerA;
  if (WIN_RULES[choiceB] === choiceA) return playerB;
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, userId, choice } = body;

    if (!matchId || !userId || typeof choice !== "string")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    // Normalize
    const c = choice.toLowerCase();
    const valid = ["rock", "paper", "scissors", "NO_PICK".toLowerCase()];
    if (!["rock", "paper", "scissors", "no_pick"].includes(c))
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });

    // load match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (match.status !== MatchStatus.ONGOING && match.status !== MatchStatus.WAITING)
      return NextResponse.json({ error: "Match not accepting moves" }, { status: 400 });

    // ensure player in match
    const players = match.players.sort((a, b) => a.seat - b.seat); // seat 0 and 1
    const player = players.find((p) => p.userId === userId);
    if (!player) return NextResponse.json({ error: "Player not part of match" }, { status: 403 });

    // determine current round (default 1)
    const gameState = match.gameState ?? { currentRound: 1, totalRounds: 3, scores: {}, roundResults: [] };
    let currentRound = (gameState.currentRound ?? 1);

    // Check if player already submitted for this round
    const existingMove = await prisma.move.findFirst({
      where: { matchId, playerId: userId, turn: currentRound },
    });
    if (existingMove) {
      // already submitted this round
      return NextResponse.json({ ok: true, message: "Already submitted for this round" });
    }

    // Save move (turn = currentRound)
    await prisma.move.create({
      data: {
        matchId,
        playerId: userId,
        payload: { choice: c === "no_pick" ? "NO_PICK" : c },
        turn: currentRound,
      },
    });

    // Publish "player-move-submitted" so UIs know somebody submitted (optional)
    await publishToChannel(`match:${matchId}`, "player-move-submitted", { userId });

    // Fetch moves for this round
    const roundMoves = await prisma.move.findMany({
      where: { matchId, turn: currentRound },
    });

    // If both moves present -> decide round
    if (roundMoves.length >= 2) {
      // map them to players (we expect 2 players)
      // pick order: roundMoves[0], roundMoves[1]
      const m1 = roundMoves[0];
      const m2 = roundMoves[1];
      const p1 = m1.playerId;
      const p2 = m2.playerId;
      const choice1 = (m1.payload as any).choice;
      const choice2 = (m2.payload as any).choice;

      const winnerId = decideRoundWinner(choice1, choice2, p1, p2);

      // update scores in gameState
      const scores: Record<string, number> = { ...(gameState.scores ?? {}) };
      scores[p1] = scores[p1] ?? 0;
      scores[p2] = scores[p2] ?? 0;
      if (winnerId === p1) scores[p1] += 1;
      else if (winnerId === p2) scores[p2] += 1;
      // else draw -> no increment

      // push round result
      const roundResEntry = {
        round: currentRound,
        moves: [
          { playerId: p1, choice: choice1 },
          { playerId: p2, choice: choice2 },
        ],
        winnerId: winnerId,
      };

      const newRoundResults = [...(gameState.roundResults ?? []), roundResEntry];

      // compute next round and whether game over
      const nextRound = (gameState.currentRound ?? 1) + 1;
      const totalRounds = gameState.totalRounds ?? 3;
      const isGameOver = nextRound > totalRounds;

      // update match.gameState and possibly status
      await prisma.match.update({
        where: { id: matchId },
        data: {
          gameState: {
            currentRound: nextRound,
            totalRounds,
            scores,
            roundResults: newRoundResults,
          },
          status: isGameOver ? MatchStatus.FINISHED : MatchStatus.ONGOING,
          ...(isGameOver ? { endedAt: new Date(), winnerId: getFinalWinnerId(scores) } : {}),
        },
      });

      // publish round result to clients (server-authoritative)
      await publishToChannel(`match:${matchId}`, "round_result", {
        round: currentRound,
        moves: roundResEntry.moves,
        winnerId,
        scores,
        nextRound,
        isGameOver,
      });

      // if game over, publish final event
      if (isGameOver) {
        const finalWinner = getFinalWinnerId(scores); // may be null for draw
        await publishToChannel(`match:${matchId}`, "game_over", {
          winnerId: finalWinner,
          scores,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("RPS move error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

// choose final winner by comparing score values, null if tie
function getFinalWinnerId(scores: Record<string, number>) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]); // descending
  const top = entries[0];
  // if tie detect
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return null;
  return top[0];
}
