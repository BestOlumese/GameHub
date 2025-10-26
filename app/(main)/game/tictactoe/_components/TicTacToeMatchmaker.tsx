"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { getAblyClient } from "@/lib/ably.client";
import TicTacToeGame from "./TicTacToeGame";

export default function TicTacToeMatchmaker({ userId, level }: { userId?: string; level: any }) {
  const [status, setStatus] = useState<
    "idle" | "searching" | "waiting" | "matched" | "timeout"
  >("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [timer, setTimer] = useState(90);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false); // avoid double-starts

  // Subscribe to matchmaking
  useEffect(() => {
    const client = getAblyClient();
    const channel = client.channels.get("tictactoe-matchmaking");

    function onMatched(msg: any) {
      const { matchId: mId, players } = msg.data;
      if (players.some((p: any) => p.userId === userId)) {
        const seat = players.find((p: any) => p.userId === userId)?.seat;
        setMySeat(seat);
        setMatchId(mId);
        setStatus("matched");
      }
    }

    channel.subscribe("matched", onMatched);
    return () => channel.unsubscribe("matched", onMatched);
  }, [userId]);

  // start automatically once there is a userId
  useEffect(() => {
    if (userId && !startedRef.current) {
      startedRef.current = true;
      startMatchmaking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Timer logic
  useEffect(() => {
    if ((status === "searching" || status === "waiting") && timer > 0) {
      const t = setTimeout(() => setTimer((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timer === 0 && (status === "searching" || status === "waiting")) {
      setStatus("timeout");
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [timer, status]);

  const startMatchmaking = useCallback(async () => {
    if (!userId) return;
    setStatus("searching");
    setTimer(90);

    // use AbortController so we can cancel if needed
    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    try {
      const res = await fetch("/api/matchmaking/tictactoe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      });
      if (!res.ok) {
        // server error or matchmaking rejected
        const data = await res.json().catch(() => ({}));
        console.error("matchmaking error", data);
        setStatus("timeout");
        return;
      }
      const data = await res.json();
      if (data.status === "waiting") setStatus("waiting");
      if (data.status === "matched") {
        setMatchId(data.matchId);
        const seat = data.players?.find((p: any) => p.userId === userId)?.seat ?? null;
        setMySeat(seat);
        setStatus("matched");
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        // aborted, ignore
      } else {
        console.error(err);
        setStatus("timeout");
      }
    }
  }, [userId]);

  // Called by TicTacToeGame when user clicks Play Again
  const requestRematch = useCallback(() => {
    // reset states; let startMatchmaking auto-run
    setMatchId(null);
    setMySeat(null);
    startedRef.current = true; // ensure subsequent auto-start not blocked
    startMatchmaking();
  }, [startMatchmaking]);

  if (status === "matched" && matchId) {
    return (
      <TicTacToeGame
        matchId={matchId}
        userId={userId!}
        seat={mySeat ?? 0}
        onRequestRematch={requestRematch}
        level={level}
      />
    );
  }

  // UI
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="w-full max-w-sm bg-white dark:bg-black rounded-2xl shadow-xl border border-neutral-300 dark:border-neutral-800 p-8 text-center transition">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Tic Tac Toe
        </h2>

        {status === "timeout" ? (
          <>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">
              Couldn’t find a match in time.
            </p>
            <button
              onClick={startMatchmaking}
              className="w-full py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black transition hover:opacity-90"
            >
              Search Again
            </button>
          </>
        ) : (
          <>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">
              {status === "searching" || status === "waiting"
                ? "Searching for opponent..."
                : "Initializing matchmaking..."}
            </p>

            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 border-4 border-neutral-300 dark:border-neutral-700 rounded-full flex items-center justify-center text-lg font-medium text-neutral-800 dark:text-neutral-200">
                {Math.floor(timer / 60)}:
                {String(timer % 60).padStart(2, "0")}
              </div>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              {status === "waiting" ? "Waiting for opponent..." : "Searching..."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
