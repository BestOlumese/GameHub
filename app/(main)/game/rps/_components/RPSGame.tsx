"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAblyClient } from "@/lib/ably.client";
import { calculateMatchXP } from "@/lib/utils";
import { useRouter } from "next/navigation";

/**
 * RPSGame
 * - matchId: server match id
 * - userId: current user id
 * - initialPlayers: (optional) players list from matchmaking payload
 * - onRequestRematch: called when user clicks Play Again (auto-rematch)
 */

const CHOICES = [
  { key: "rock", label: "Rock", icon: "🪨" },
  { key: "paper", label: "Paper", icon: "📄" },
  { key: "scissors", label: "Scissors", icon: "✂️" },
] as const;

type ChoiceKey = "rock" | "paper" | "scissors" | "NO_PICK";
type PlayerMove = { playerId: string; choice: ChoiceKey };

export default function RPSGame({
  matchId,
  userId,
  initialPlayers,
  onRequestRematch,
  level: currentLevel,
}: {
  matchId: string;
  userId: string;
  initialPlayers?: any[];
  level: any;
  onRequestRematch?: () => void;
}) {
  const router = useRouter();
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(3); // best of 3
  const [myChoice, setMyChoice] = useState<ChoiceKey | null>(null);
  const [opponentMoveRevealed, setOpponentMoveRevealed] =
    useState<PlayerMove | null>(null);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [roundHistory, setRoundHistory] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string>(
    "Waiting for round to start..."
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);
  const [localPlayers, setLocalPlayers] = useState<any[]>(initialPlayers ?? []);

  const channelRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const roundTimeRef = useRef<number>(5);
  const revealTimeoutRef = useRef<number | null>(null);

  // confetti canvas
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const confettiParticles = useRef<any[]>([]);
  const confettiRaf = useRef<number | null>(null);

  // audio context
  const audioCtxRef = useRef<AudioContext | null>(null);
  function ensureAudio() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current!;
  }
  function tone(freq: number, dur = 0.12) {
    try {
      const ctx = ensureAudio();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.stop(ctx.currentTime + dur + 0.02);
    } catch {}
  }

  function playMoveSound() {
    tone(880, 0.05);
  }
  function playWinSound() {
    tone(880, 0.12);
    setTimeout(() => tone(1200, 0.12), 140);
  }
  function playLoseSound() {
    tone(240, 0.18);
  }
  function playDrawSound() {
    tone(440, 0.1);
  }

  // derive opponentId from players or history
  const opponentId = useMemo(() => {
    if (localPlayers?.length === 2) {
      return localPlayers.find((p: any) => p.userId !== userId)?.userId ?? null;
    }
    // fallback: find other id in scores or history
    const keys = Object.keys(scores);
    const opp = keys.find((k) => k !== userId);
    if (opp) return opp;
    if (roundHistory.length) {
      const last = roundHistory[roundHistory.length - 1];
      if (last?.moves) {
        const players = last.moves.map((m: any) => m.playerId);
        return players.find((p: string) => p !== userId) ?? null;
      }
    }
    return null;
  }, [localPlayers, scores, roundHistory, userId]);

  // subscribe to Ably match channel
  useEffect(() => {
    const client = getAblyClient();
    const ch = client.channels.get(`match:${matchId}`);
    channelRef.current = ch;

    function onStart(msg: any) {
      const gs = msg.data.gameState ?? {};
      setCurrentRound(gs.currentRound ?? 1);
      setTotalRounds(gs.totalRounds ?? 3);
      setScores(gs.scores ?? {});
      setRoundHistory(gs.roundResults ?? []);
      setMessage(`Round ${gs.currentRound ?? 1} — pick within 5s`);
      setMyChoice(null);
      setOpponentSubmitted(false);
      setOpponentMoveRevealed(null);
      setIsGameOver(false);
      setFinalWinner(null);
      startRoundTimer();
    }

    function onRoundResult(msg: any) {
      // Expect server to supply the authoritative moves & winner
      const data = msg.data;
      // structure: { round, moves: [{playerId, choice}], winnerId, scores, nextRound, isGameOver }
      const {
        round,
        moves,
        winnerId,
        scores: newScores,
        nextRound,
        isGameOver,
      } = data;
      setRoundHistory((p) => [...p, { round, moves, winnerId }]);
      setScores(newScores ?? {});
      setOpponentSubmitted(false);
      setMyChoice(null);
      // Reveal opponent move with small animation
      const other = moves.find((m: any) => m.playerId !== userId);
      setOpponentMoveRevealed(other ?? null);

      // show message briefly then proceed
      if (winnerId) {
        setMessage(winnerId === userId ? "Round won!" : "Round lost");
      } else {
        setMessage("Round drawn");
      }

      // play sounds & confetti
      if (isGameOver) {
        setIsGameOver(true);
        setFinalWinner(winnerId ?? null);
        setMessage(
          winnerId
            ? winnerId === userId
              ? "You won the match!"
              : "You lost the match"
            : "Match ended in a draw"
        );
        if (winnerId === userId) {
          startConfetti(90);
          playWinSound();
        } else if (!winnerId) {
          playDrawSound();
          startConfetti(30, 900);
        } else {
          playLoseSound();
        }
        stopRoundTimer();
        return;
      } else {
        // not game over: show revealed moves for 1.2s then move to next round
        playMoveSound();
        if (winnerId === userId) {
          // small win sound
          playWinSound();
        } else if (winnerId) {
          playLoseSound();
        } else {
          playDrawSound();
        }

        // schedule next round start after reveal
        if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = window.setTimeout(() => {
          setCurrentRound(nextRound ?? round + 1);
          setMessage(`Round ${nextRound ?? round + 1} — pick within 5s`);
          setOpponentMoveRevealed(null);
          startRoundTimer();
        }, 1200) as unknown as number;
      }
    }

    function onPlayerSubmitted(msg: any) {
      if (msg.data.userId !== userId) setOpponentSubmitted(true);
    }

    async function onGameOver(msg: any) {
      const { winnerId, scores: finalScores } = msg.data;
      setIsGameOver(true);
      setFinalWinner(winnerId ?? null);
      setScores(finalScores ?? {});

      let result: "win" | "draw" | "lose" =
        winnerId === userId ? "win" : winnerId ? "lose" : "draw";

      // UI & sounds
      setMessage(
        result === "win"
          ? "You won the match!"
          : result === "lose"
          ? "You lost the match"
          : "Match ended in a draw"
      );

      if (result === "win") {
        startConfetti(90);
        playWinSound();
      } else if (result === "draw") {
        playDrawSound();
        startConfetti(30, 900);
      } else {
        playLoseSound();
      }

      stopRoundTimer();

      // 🟩 Award XP
      try {
        const xpToAdd = calculateMatchXP(currentLevel, result);

        const res = await fetch("/api/user/add-xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xpToAdd }),
        });

        if (!res.ok) throw new Error("Failed to award XP");

        console.log(`Awarded ${xpToAdd} XP for ${result}`);
        router.refresh();
      } catch (err) {
        console.error("XP reward failed:", err);
      }
    }

    ch.subscribe("start", onStart);
    ch.subscribe("round_result", onRoundResult);
    ch.subscribe("player-move-submitted", onPlayerSubmitted);
    ch.subscribe("game_over", onGameOver);

    return () => {
      ch.unsubscribe("start", onStart);
      ch.unsubscribe("round_result", onRoundResult);
      ch.unsubscribe("player-move-submitted", onPlayerSubmitted);
      ch.unsubscribe("game_over", onGameOver);
      stopRoundTimer();
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, userId]);

  // Round timer: 5 seconds auto submit NO_PICK
  function startRoundTimer() {
    stopRoundTimer();
    let left = 5;
    roundTimeRef.current = left;
    setMessage(`Round ${currentRound} — pick within ${left}s`);
    timerRef.current = window.setInterval(() => {
      left -= 1;
      roundTimeRef.current = left;
      if (left <= 0) {
        stopRoundTimer();
        // auto submit NO_PICK
        submitChoice("NO_PICK");
        return;
      }
      setMessage(`Round ${currentRound} — pick within ${left}s`);
    }, 1000) as unknown as number;
  }
  function stopRoundTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // submit choice to server
  async function submitChoice(choice: ChoiceKey) {
    if (myChoice) return;
    setMyChoice(choice);
    setMessage("Choice submitted. Waiting for opponent...");
    stopRoundTimer();
    try {
      await fetch("/api/match/rps/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, userId, choice }),
      });
      // server will emit events to drive the UI
      playMoveSound();
    } catch (e) {
      console.error(e);
    }
  }

  // confetti impl (lightweight)
  function startConfetti(amount = 80, duration = 1600) {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    confettiParticles.current = [];
    for (let i = 0; i < amount; i++) {
      confettiParticles.current.push(createParticle(rect.width, rect.height));
    }
    let start = performance.now();
    function frame(now: number) {
      const t = now - start;
      const progress = t / duration;
      ctx.clearRect(0, 0, rect.width, rect.height);
      confettiParticles.current.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      confettiParticles.current = confettiParticles.current.filter(
        (p) => p.life > 0 && p.y < rect.height + 50
      );
      if (progress < 1 || confettiParticles.current.length) {
        confettiRaf.current = requestAnimationFrame(frame);
      } else {
        if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
        confettiRaf.current = null;
      }
    }
    if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
    confettiRaf.current = requestAnimationFrame(frame);
  }
  function clearConfetti() {
    const c = confettiRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    confettiParticles.current = [];
    if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
    confettiRaf.current = null;
  }
  function createParticle(w: number, h: number) {
    const colors = ["#10B981", "#EF4444", "#111827", "#ffffff"]; // green, red, dark, white
    const x = Math.random() * w;
    const y = -10 - Math.random() * 40;
    const vx = (Math.random() - 0.5) * 6;
    const vy = 2 + Math.random() * 6;
    const size = 6 + Math.random() * 8;
    const life = 80 + Math.random() * 60;
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      x,
      y,
      vx,
      vy,
      size,
      color,
      life,
      rotation: Math.random() * Math.PI,
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.12;
        this.vx *= 0.995;
        this.life -= 1.5;
        this.rotation += 0.07;
      },
      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(
          -this.size / 2,
          -this.size / 2,
          this.size,
          this.size * 0.6
        );
        ctx.restore();
      },
    };
  }

  // Play again handler (auto rematch)
  function handlePlayAgain() {
    clearConfetti();
    setRoundHistory([]);
    setScores({});
    setIsGameOver(false);
    setFinalWinner(null);
    setMyChoice(null);
    setOpponentMoveRevealed(null);
    setMessage("Searching for new match...");
    if (onRequestRematch) onRequestRematch();
  }

  // helpers for display result class
  function resultClassForRound(r: any) {
    if (!r?.winnerId) return "text-neutral-500";
    if (r.winnerId === userId) return "text-emerald-500";
    return "text-rose-500";
  }

  // UI
  return (
    <div className="relative p-6 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow">
      <canvas
        ref={confettiRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Rock · Paper · Scissors
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            {message}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Round
          </p>
          <p className="font-medium">
            {currentRound} / {totalRounds}
          </p>
        </div>
      </div>

      {/* players + scores */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-500">You</p>
          <p className="font-semibold">{scores[userId] ?? 0}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xs text-neutral-500">VS</p>
          <p className="text-sm text-neutral-500">{opponentId ?? "Opponent"}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs text-neutral-500">Them</p>
          <p className="font-semibold">
            {opponentId ? scores[opponentId] ?? 0 : 0}
          </p>
        </div>
      </div>

      {/* choices */}
      {!isGameOver && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {CHOICES.map((c) => {
            const picked = myChoice === (c.key as ChoiceKey);
            return (
              <motion.button
                key={c.key}
                onClick={() => submitChoice(c.key as ChoiceKey)}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0.98 }}
                animate={{ opacity: 1 }}
                disabled={!!myChoice}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border ${
                  picked
                    ? "border-neutral-800 dark:border-neutral-200 bg-neutral-100 dark:bg-neutral-900"
                    : "border-neutral-200 dark:border-neutral-800"
                } hover:shadow-sm transition`}
              >
                <div className="text-2xl">{c.icon}</div>
                <div className="text-xs uppercase font-medium tracking-wide">
                  {c.label}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* reveal / opponent */}
      <div className="flex items-center justify-center gap-6 mb-4">
        {/* your pick */}
        <div className="w-28 h-20 flex flex-col items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="text-xs text-neutral-500">Your pick</div>
          <div
            className={`text-lg font-semibold mt-2 ${
              myChoice
                ? myChoice === "rock"
                  ? "text-neutral-800"
                  : myChoice === "paper"
                  ? "text-neutral-700"
                  : "text-neutral-800"
                : "text-neutral-400"
            }`}
          >
            {myChoice
              ? CHOICES.find((x) => x.key === myChoice)?.icon ?? myChoice
              : "—"}
          </div>
        </div>

        <div className="text-sm text-neutral-400">vs</div>

        {/* opponent pick (revealed when round_result arrives) */}
        <div className="w-28 h-20 flex flex-col items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="text-xs text-neutral-500">Opponent</div>
          <div
            className={`text-lg font-semibold mt-2 ${
              opponentMoveRevealed ? "text-neutral-800" : "text-neutral-400"
            }`}
          >
            {opponentMoveRevealed
              ? CHOICES.find((x) => x.key === opponentMoveRevealed.choice)
                  ?.icon ?? opponentMoveRevealed.choice
              : opponentSubmitted
              ? "?"
              : "—"}
          </div>
        </div>
      </div>

      {/* round history */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">Round history</h4>
        {roundHistory.length === 0 && (
          <p className="text-sm text-neutral-500">No rounds yet</p>
        )}
        <div className="space-y-2">
          {roundHistory.map((r: any, idx: number) => {
            const you = r.moves.find((m: any) => m.playerId === userId);
            const opp = r.moves.find((m: any) => m.playerId !== userId);
            return (
              <div
                key={idx}
                className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-lg flex items-center justify-between"
              >
                <div className="text-sm">
                  <div>Round {r.round}</div>
                  <div className="text-xs text-neutral-500">
                    You {you?.choice ?? "—"} • Them {opp?.choice ?? "—"}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    r.winnerId
                      ? r.winnerId === userId
                        ? "text-emerald-500"
                        : "text-rose-500"
                      : "text-neutral-500"
                  }`}
                >
                  {r.winnerId
                    ? r.winnerId === userId
                      ? "You"
                      : "Them"
                    : "Draw"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* game over */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-center"
          >
            <div
              className="inline-block px-4 py-3 rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(239,68,68,0.04))",
              }}
            >
              <h3
                className="text-lg font-extrabold inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    finalWinner === null
                      ? "linear-gradient(90deg, #9ca3af, #d1d5db)" // Draw
                      : finalWinner === userId
                      ? "linear-gradient(90deg, #10B981, #34D399)" // Win
                      : "linear-gradient(90deg, #EF4444, #FCA5A5)", // Lose
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text", // Safari/WebKit fix
                  WebkitTextFillColor: "transparent", // ensure gradient shows only in text
                  display: "inline-block",
                }}
              >
                {finalWinner
                  ? finalWinner === userId
                    ? "You won the match!"
                    : "You lost the match"
                  : "Match ended in a draw"}
              </h3>
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-2 text-sm font-semibold ${
                    calculateMatchXP(
                      currentLevel,
                      finalWinner === userId
                        ? "win"
                        : finalWinner
                        ? "lose"
                        : "draw"
                    ) >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {(() => {
                    const xp = calculateMatchXP(
                      currentLevel,
                      finalWinner === userId
                        ? "win"
                        : finalWinner
                        ? "lose"
                        : "draw"
                    );
                    return xp >= 0 ? `+${xp} XP Gained` : `${xp} XP Lost`;
                  })()}
                </motion.div>
              )}
            </div>
            ``
            <div className="mt-4">
              <button
                onClick={handlePlayAgain}
                className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition transform hover:scale-105"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
