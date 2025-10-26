"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import WaitingRoom from "./WaitingRoom";
import RPSGame from "./RPSGame";
import { getAblyClient } from "@/lib/ably.client";

export default function RPSMain({ userId, level }: { userId?: string; level: any }) {
  const [match, setMatch] = useState<any | null>(null);
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const startMatchmaking = useCallback(async () => {
    if (!userId) return;
    setMatch({ status: "searching" });
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/matchmaking/rps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      // expected: { status: "waiting" | "matched", matchId?, players?, ... }
      setMatch(data);
    } catch (e) {
      if ((e as any)?.name === "AbortError") return;
      console.error("matchmaking failed", e);
      setMatch(null);
    }
  }, [userId]);

  // auto-start matchmaking once userId available (only once)
  useEffect(() => {
    if (userId && !startedRef.current) {
      startedRef.current = true;
      startMatchmaking();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [userId, startMatchmaking]);

  // called by WaitingRoom when server publishes 'matched'
  function handleMatched(matchData: any) {
    setMatch(matchData);
  }

  // called by game to request rematch
  function handleRequestRematch() {
    // re-run matchmaking
    startedRef.current = true;
    startMatchmaking();
    setMatch({ status: "searching" });
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {!match && (
          <div className="p-6 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow">
            <h2 className="text-lg font-semibold text-black dark:text-white">Rock · Paper · Scissors</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Starting matchmaking...
            </p>
          </div>
        )}

        {match?.status === "searching" && (
          <div className="p-6 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Connecting to matchmaking...</p>
          </div>
        )}

        {match?.status === "waiting" && match.matchId && (
          <WaitingRoom matchId={match.matchId} userId={userId!} onMatched={handleMatched} />
        )}

        {match?.status === "matched" && match.matchId && (
          <RPSGame
            matchId={match.matchId}
            userId={userId!}
            initialPlayers={match.players}
            onRequestRematch={handleRequestRematch}
            level={level}
          />
        )}
      </div>
    </div>
  );
}
