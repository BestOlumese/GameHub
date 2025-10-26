// app/api/match/[matchId]/move/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publishToChannel } from "@/lib/ably.server";

function checkWinner(board: (string|null|undefined)[]) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of combos) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return "DRAW";
  return null;
}

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const body = await req.json();
  const { userId, index } = body;

  if (!userId || typeof index !== "number") {
    return NextResponse.json({ error: "missing userId or index" }, { status: 400 });
  }
  if (index < 0 || index > 8) return NextResponse.json({ error: "index out of range" }, { status: 400 });

  // Transactional logic for move
  const r = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { players: true, moves: { orderBy: { turn: "asc" } } },
    });
    if (!match) throw new Error("Match not found");
    if (match.status !== "ONGOING") throw new Error("Match not ongoing");

    // ensure player is part of match
    const players = match.players.sort((a,b) => a.seat - b.seat);
    const playerIndex = players.findIndex(p => p.userId === userId);
    if (playerIndex === -1) throw new Error("Player not in match");
    const symbol = playerIndex === 0 ? "X" : "O";

    // reconstruct board from match.gameState OR from moves
    let board: string[] = Array(9).fill("");
    if (match.gameState?.board && Array.isArray(match.gameState.board)) {
      board = match.gameState.board as string[];
    } else {
      for (const mv of match.moves) {
        const payload: any = mv.payload;
        if (typeof payload?.index === "number" && payload?.symbol) board[payload.index] = payload.symbol;
      }
    }

    if (board[index]) throw new Error("Cell already occupied");

    // determine whose turn it is
    const movesCount = match.moves.length;
    const currentSymbol = movesCount % 2 === 0 ? "X" : "O";
    if (currentSymbol !== symbol) throw new Error("Not your turn");

    const turnNumber = movesCount + 1;
    // create move
    const mv = await tx.move.create({
      data: {
        matchId,
        playerId: userId,
        payload: { index, symbol },
        turn: turnNumber,
      },
    });

    // apply move in board
    board[index] = symbol;

    // update match gameState
    const newGameState = { ...(match.gameState ?? {}), board };
    await tx.match.update({
      where: { id: matchId },
      data: { gameState: newGameState },
    });

    // check winner
    const winnerSymbol = checkWinner(board);
    if (winnerSymbol) {
      let winnerId: string | null = null;
      if (winnerSymbol === "X") winnerId = players[0].userId;
      else if (winnerSymbol === "O") winnerId = players[1].userId;

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: "FINISHED",
          endedAt: new Date(),
          winnerId,
        },
      });

      // update MatchPlayer results
      const updates = [];
      if (winnerSymbol === "DRAW") {
        updates.push(tx.matchPlayer.updateMany({ where: { matchId }, data: { result: "DRAW" } }));
      } else {
        // players[0] seat=0
        updates.push(tx.matchPlayer.updateMany({
          where: { matchId, userId: players[0].userId },
          data: { result: winnerSymbol === "X" ? "WIN" : "LOSE" },
        }));
        updates.push(tx.matchPlayer.updateMany({
          where: { matchId, userId: players[1].userId },
          data: { result: winnerSymbol === "O" ? "WIN" : "LOSE" },
        }));
      }
      await Promise.all(updates);
    }

    return { move: mv, gameState: newGameState, winnerSymbol: winnerSymbol ?? null };
  });

  // publish via Ably
  await publishToChannel(`match:${matchId}`, "move", { index: body.index, symbol: (r.move.payload as any).symbol });
  await publishToChannel(`match:${matchId}`, "state", { gameState: r.gameState });
  if (r.winnerSymbol) {
    await publishToChannel(`match:${matchId}`, "winner", { winner: r.winnerSymbol });
  }

  return NextResponse.json({ ok: true, winner: r.winnerSymbol });
}
