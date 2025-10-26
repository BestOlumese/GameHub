"use client";
import { useEffect } from "react";
import { getAblyClient } from "@/lib/ably.client";

export default function WaitingRoom({
  matchId,
  userId,
  onMatched,
}: {
  matchId: string;
  userId: string;
  onMatched: (matchData: any) => void;
}) {
  useEffect(() => {
    const client = getAblyClient();
    const ch = client.channels.get("rps-matchmaking");

    function onMatchedMsg(msg: any) {
      const { matchId: matchedId, players } = msg.data;
      if (matchedId !== matchId) return;
      if (players?.some((p: any) => p.userId === userId)) {
        onMatched({ status: "matched", matchId: matchedId, players });
      }
    }

    ch.subscribe("matched", onMatchedMsg);
    return () => ch.unsubscribe("matched", onMatchedMsg);
  }, [matchId, userId, onMatched]);

  return (
    <div className="p-6 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow text-center">
      <h3 className="text-lg font-semibold text-black dark:text-white">Waiting for opponent…</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Match ID: {matchId}</p>
      <div className="mt-4">
        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-neutral-300 dark:bg-neutral-700 w-1/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
