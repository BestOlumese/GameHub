"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAblyClient } from "@/lib/ably.client";
import { calculateMatchXP } from "@/lib/utils";
import { useRouter } from "next/navigation";

type SymbolType = "X" | "O" | "";

export default function TicTacToeGame({
  matchId,
  userId,
  seat,
  onRequestRematch,
  level: currentLevel,
}: {
  matchId: string;
  userId: string;
  seat: number;
  onRequestRematch?: () => void;
  level: any;
}) {
  const router = useRouter();
  const [board, setBoard] = useState<SymbolType[]>(Array(9).fill(""));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const mySymbol = seat === 0 ? "X" : "O";

  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const confettiParticles = useRef<any[]>([]);
  const confettiRaf = useRef<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  function ensureAudio() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current!;
  }
  function tone(freq: number, duration = 0.12, type: OscillatorType = "sine") {
    const ctx = ensureAudio();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0;
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.12, now + 0.005);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.stop(now + duration + 0.02);
  }
  function soundMove() {
    tone(880, 0.06, "triangle");
    setTimeout(() => tone(1320, 0.06, "sine"), 60);
  }
  function soundWin() {
    tone(880, 0.14, "sine");
    setTimeout(() => tone(1320, 0.12, "sine"), 140);
  }
  function soundLose() {
    tone(220, 0.2, "sine");
  }
  function soundDraw() {
    tone(440, 0.12, "sine");
    setTimeout(() => tone(330, 0.12, "sine"), 120);
  }

  // Ably event subscriptions
  useEffect(() => {
    const client = getAblyClient();
    const channel = client.channels.get(`match:${matchId}`);

    function onStart(msg: any) {
      const { gameState } = msg.data;
      setBoard(gameState?.board ?? Array(9).fill(""));
      setTurn("X");
      setWinner(null);
      setWinningLine(null);
      setXpGained(null);
      clearConfetti();
    }

    function onMove(msg: any) {
      const { index, symbol } = msg.data;
      setBoard((prev) => {
        const copy = [...prev];
        copy[index] = symbol;
        return copy;
      });
      setTurn((prev) => (prev === "X" ? "O" : "X"));
      try {
        ensureAudio().resume?.();
        soundMove();
      } catch {}
    }

    function onState(msg: any) {
      setBoard(msg.data.gameState.board);
    }

    async function onWinner(msg: any) {
      const w = msg.data.winner ?? null;
      const gs = msg.data.gameState?.board ?? undefined;
      setWinner(w);

      if (w && w !== "DRAW") {
        computeWinningLineFromBoard(gs ?? board);
        try {
          ensureAudio().resume?.();
          if (w === mySymbol) soundWin();
          else soundLose();
        } catch {}
        if (w === mySymbol) startConfetti(90);
      } else if (w === "DRAW") {
        try {
          ensureAudio().resume?.();
          soundDraw();
        } catch {}
        startConfetti(30, 900);
      }

      // ---- XP Award ----
      try {
        const result = w === "DRAW" ? "draw" : w === mySymbol ? "win" : "lose";

        const xpToAdd = calculateMatchXP(currentLevel, result);
        setXpGained(xpToAdd); // show XP gained

        const res = await fetch("/api/user/add-xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xpToAdd }),
        });

        if (!res.ok) throw new Error("Failed to award XP");
        console.log(`Awarded ${xpToAdd} XP for ${w}`);

        setTimeout(() => router.refresh(), 1500); // small delay for animation
      } catch (err) {
        console.error("XP reward failed:", err);
      }
    }

    channel.subscribe("start", onStart);
    channel.subscribe("move", onMove);
    channel.subscribe("state", onState);
    channel.subscribe("winner", onWinner);

    return () => channel.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, mySymbol]);

  useEffect(() => {
    computeWinningLineFromBoard(board);
  }, [board]);

  function computeWinningLineFromBoard(bd: SymbolType[]) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {
        setWinningLine(line);
        return;
      }
    }
    setWinningLine(null);
  }

  function myTurn() {
    const movesMade = board.filter(Boolean).length;
    const current = movesMade % 2 === 0 ? "X" : "O";
    return current === mySymbol;
  }

  async function makeMove(index: number) {
    if (board[index]) return;
    if (!myTurn() || winner) return;
    try {
      await fetch(`/api/match/${matchId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, index }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Confetti ----
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
        (p) => p.life > 0 && p.y < rect.height + 40
      );
      if (progress < 1 || confettiParticles.current.length) {
        confettiRaf.current = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(confettiRaf.current ?? 0);
        confettiRaf.current = null;
      }
    }
    if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
    confettiRaf.current = requestAnimationFrame(frame);
  }

  function clearConfetti() {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.current = [];
    if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
    confettiRaf.current = null;
  }

  function createParticle(w: number, h: number) {
    const colors = ["#ff3b30", "#0a84ff", "#222222", "#ffffff"];
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

  function getLineCoords(line: number[]) {
    if (!cellRefs.current || cellRefs.current.length < 9) return null;
    const aEl = cellRefs.current[line[0]];
    const cEl = cellRefs.current[line[2]];
    if (!aEl || !cEl || !boardRef.current) return null;
    const boardRect = boardRef.current.getBoundingClientRect();
    const aRect = aEl.getBoundingClientRect();
    const cRect = cEl.getBoundingClientRect();
    const ax = aRect.left + aRect.width / 2 - boardRect.left;
    const ay = aRect.top + aRect.height / 2 - boardRect.top;
    const cx = cRect.left + cRect.width / 2 - boardRect.left;
    const cy = cRect.top + cRect.height / 2 - boardRect.top;
    return { ax, ay, cx, cy, w: boardRect.width, h: boardRect.height };
  }

  function handlePlayAgain() {
    try {
      ensureAudio().resume?.();
    } catch {}
    if (onRequestRematch) {
      clearConfetti();
      setWinner(null);
      setWinningLine(null);
      setXpGained(null);
      onRequestRematch();
    } else {
      window.location.reload();
    }
  }

  const X_COLOR = "#ff3b30";
  const O_COLOR = "#0a84ff";

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center relative">
      <canvas
        ref={confettiRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
        }}
      />

      <motion.div
        className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 p-6 rounded-2xl shadow-xl relative"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28 }}
      >
        <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
          Tic Tac Toe
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          You are <span className="font-semibold">{mySymbol}</span> | Turn:{" "}
          <span className="font-semibold">{turn}</span>
        </p>

        <div ref={boardRef} className="relative inline-block">
          <svg
            className="absolute left-0 top-0 pointer-events-none"
            width="100%"
            height="100%"
            viewBox={`0 0 300 300`}
            preserveAspectRatio="none"
            style={{ zIndex: 40 }}
          >
            {winningLine &&
              (() => {
                const coords = getLineCoords(winningLine);
                if (!coords) return null;
                const { ax, ay, cx, cy } = coords;
                return (
                  <motion.line
                    x1={ax}
                    y1={ay}
                    x2={cx}
                    y2={cy}
                    stroke={
                      typeof window !== "undefined" &&
                      document?.body?.classList?.contains("dark")
                        ? "#fff"
                        : "#111"
                    }
                    strokeWidth={6}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                  />
                );
              })()}
          </svg>

          <div
            className="grid grid-cols-3 gap-2 mt-2"
            style={{ width: 300, height: 300 }}
          >
            {board.map((c, i) => {
              const isWinningCell = !!winningLine?.includes(i);
              return (
                <button
                  key={i}
                  ref={(el) => (cellRefs.current[i] = el)}
                  onClick={() => {
                    try {
                      ensureAudio().resume?.();
                    } catch {}
                    makeMove(i);
                  }}
                  className={`w-[96px] h-[96px] border border-neutral-400 dark:border-neutral-700 rounded-md text-4xl font-bold flex items-center justify-center select-none transition ${
                    c
                      ? "cursor-default"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  style={{
                    background: "transparent",
                    boxShadow: isWinningCell
                      ? "0 6px 18px rgba(0,0,0,0.06)"
                      : undefined,
                  }}
                >
                  {c === "X" && (
                    <motion.span
                      initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
                      animate={{
                        scale: isWinningCell ? 1.08 : 1,
                        rotate: 0,
                        opacity: 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 22,
                      }}
                      style={{ color: X_COLOR }}
                    >
                      X
                    </motion.span>
                  )}
                  {c === "O" && (
                    <motion.span
                      initial={{ scale: 0.6, rotate: 6, opacity: 0 }}
                      animate={{
                        scale: isWinningCell ? 1.08 : 1,
                        rotate: 0,
                        opacity: 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 22,
                      }}
                      style={{
                        color: O_COLOR,
                        WebkitTextStroke: `0px transparent`,
                      }}
                    >
                      O
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.32 }}
              className="mt-6 flex flex-col items-center"
            >
              <div
                className="px-4 py-2 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,59,48,0.08), rgba(10,132,255,0.06))",
                }}
              >
                <h4
                  className="text-2xl font-extrabold tracking-tight"
                  style={{
                    background:
                      winner === "DRAW"
                        ? "linear-gradient(90deg,#999,#bbb)"
                        : winner === mySymbol
                        ? "linear-gradient(90deg,#ff3b30,#ff8b7a)"
                        : "linear-gradient(90deg,#0a84ff,#7fb8ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow:
                      winner === "DRAW"
                        ? "0 4px 18px rgba(0,0,0,0.06)"
                        : winner === mySymbol
                        ? "0 14px 30px rgba(255,59,48,0.14)"
                        : "0 14px 30px rgba(10,132,255,0.12)",
                  }}
                >
                  {winner === "DRAW"
                    ? "It’s a Draw!"
                    : winner === mySymbol
                    ? "You Win!"
                    : "You Lose"}
                </h4>
              </div>

              <motion.button
                onClick={handlePlayAgain}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md hover:shadow-lg transition"
              >
                Play Again
              </motion.button>

              {/* XP Display */}
              {xpGained !== null && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-3 text-sm font-medium ${
                    xpGained >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {xpGained >= 0
                    ? `+${xpGained} XP Gained`
                    : `${xpGained} XP Lost`}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
