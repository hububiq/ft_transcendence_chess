import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { ArrowLeft, Flag, Bot, RotateCcw, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { ChessBoardUI } from "./ChessBoard";

type Difficulty = "easy" | "medium" | "hard" | "master";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; elo: number; color: string; delay: number }
> = {
  easy: { label: "Easy", elo: 800, color: "text-green-500", delay: 1200 },
  medium: { label: "Medium", elo: 1400, color: "text-yellow-500", delay: 800 },
  hard: { label: "Hard", elo: 1900, color: "text-orange-500", delay: 500 },
  master: { label: "Master", elo: 2400, color: "text-red-500", delay: 200 },
};

const PIECE_SYMBOLS: Record<string, string> = {
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙",
};

export function BotGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  // const [pieces, setPieces] = useState(INITIAL_PIECES);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(
    null,
  );
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [botThinking, setBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<
    { n: number; white: string; black?: string }[]
  >([]);
  const [playerTime, setPlayerTime] = useState(600);
  const [botTime, setBotTime] = useState(600);
  const [lastMove, setLastMove] = useState<{
    from: [number, number];
    to: [number, number];
  } | null>(null);
  const [botMoveIndex, setBotMoveIndex] = useState(0);
  const [gameOver, setGameOver] = useState<"win" | "loss" | null>(null);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Player timer
  useEffect(() => {
    if (!gameStarted || !isPlayerTurn || botThinking || gameOver) return;
    const t = setInterval(() => setPlayerTime((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [gameStarted, isPlayerTurn, botThinking, gameOver]);

  // Bot timer
  useEffect(() => {
    if (!gameStarted || isPlayerTurn || !botThinking || gameOver) return;
    const t = setInterval(() => setBotTime((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [gameStarted, isPlayerTurn, botThinking, gameOver]);

  const doMockBotMove = useCallback(() => {
    const moveData = MOCK_BOT_MOVES[botMoveIndex % MOCK_BOT_MOVES.length];
    const [fr, fc] = moveData.from;
    const [tr, tc] = moveData.to;

    setPieces((prev) => {
      const without = prev.filter((p) => !(p.row === tr && p.col === tc));
      return without.map((p) =>
        p.row === fr && p.col === fc ? { ...p, row: tr, col: tc } : p,
      );
    });

    const cols = "abcdefgh";
    const notation = `${cols[fc]}${8 - fr}${cols[tc]}${8 - tr}`;
    setMoveHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && !last.black)
        return [...prev.slice(0, -1), { ...last, black: notation }];
      return [...prev, { n: prev.length + 1, white: "...", black: notation }];
    });
    setLastMove({ from: [fr, fc], to: [tr, tc] });
    setBotMoveIndex((i) => i + 1);
    setBotThinking(false);
    setIsPlayerTurn(true);
  }, [botMoveIndex]);

  const handleSquareClick = (row: number, col: number) => {
    if (!gameStarted || !isPlayerTurn || botThinking || gameOver) return;

    const clickedPiece = pieces.find((p) => p.row === row && p.col === col);

    if (selectedSquare) {
      const [sr, sc] = selectedSquare;
      if (sr === row && sc === col) {
        setSelectedSquare(null);
        return;
      }

      const moving = pieces.find((p) => p.row === sr && p.col === sc);
      if (moving && moving.color === "w") {
        // Move the piece
        setPieces((prev) => {
          const without = prev.filter((p) => !(p.row === row && p.col === col));
          return without.map((p) =>
            p.row === sr && p.col === sc ? { ...p, row, col } : p,
          );
        });

        const cols = "abcdefgh";
        const notation = `${cols[sc]}${8 - sr}${cols[col]}${8 - row}`;
        setMoveHistory((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.black)
            return [...prev, { n: prev.length + 1, white: notation }];
          return prev;
        });
        setLastMove({ from: [sr, sc], to: [row, col] });
        setSelectedSquare(null);
        setIsPlayerTurn(false);
        setBotThinking(true);

        // Bot responds after delay
        setTimeout(() => doMockBotMove(), DIFFICULTY_CONFIG[difficulty].delay);
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === "w") {
      setSelectedSquare([row, col]);
    } else {
      setSelectedSquare(null);
    }
  };

  const handleResign = () => setGameOver("loss");
  const handleRestart = () => {
    // setPieces(INITIAL_PIECES);
    setSelectedSquare(null);
    setIsPlayerTurn(true);
    setBotThinking(false);
    setMoveHistory([]);
    setPlayerTime(600);
    setBotTime(600);
    setLastMove(null);
    setBotMoveIndex(0);
    setGameOver(null);
    setGameStarted(true);
  };

  const cfg = DIFFICULTY_CONFIG[difficulty];

  // const squares = Array.from({ length: 64 }, (_, i) => ({
  //   row: Math.floor(i / 8),
  //   col: i % 8,
  //   isBlack: (Math.floor(i / 8) + (i % 8)) % 2 === 1,
  // }));

  return (
    <div className="min-h-screen bg-black flex flex-col text-neutral-200">
      {/* Header */}
      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </Link>
        <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          Player vs Bot • Blitz 10|0
        </div>
        <div className="w-24" />
      </header>

      {/* Difficulty picker overlay (pre-game) */}
      {!gameStarted && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-10 w-full max-w-md flex flex-col items-center text-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Play vs Bot
              </h2>
              <p className="text-neutral-500 text-sm">
                Choose your opponent difficulty and start the game.
              </p>
            </div>

            {/* Difficulty selector */}
            <div className="w-full relative">
              <button
                onClick={() => setShowDifficultyMenu((v) => !v)}
                className="w-full flex items-center justify-between bg-black border border-neutral-800 hover:border-neutral-700 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={clsx("w-2 h-2 rounded-full", {
                      "bg-green-500": difficulty === "easy",
                      "bg-yellow-500": difficulty === "medium",
                      "bg-orange-500": difficulty === "hard",
                      "bg-red-500": difficulty === "master",
                    })}
                  />
                  <span className="text-white">{cfg.label}</span>
                  <span className="text-neutral-500">({cfg.elo} ELO)</span>
                </span>
                <ChevronDown
                  className={clsx(
                    "w-4 h-4 text-neutral-500 transition-transform",
                    showDifficultyMenu && "rotate-180",
                  )}
                />
              </button>

              {showDifficultyMenu && (
                <div className="absolute top-full mt-1 w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg overflow-hidden z-10 shadow-2xl">
                  {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        setShowDifficultyMenu(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-900 transition-colors",
                        difficulty === d ? "bg-neutral-900" : "",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={clsx("w-2 h-2 rounded-full", {
                            "bg-green-500": d === "easy",
                            "bg-yellow-500": d === "medium",
                            "bg-orange-500": d === "hard",
                            "bg-red-500": d === "master",
                          })}
                        />
                        <span className="text-white">
                          {DIFFICULTY_CONFIG[d].label}
                        </span>
                      </span>
                      <span className="text-neutral-500 text-xs">
                        {DIFFICULTY_CONFIG[d].elo} ELO
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setGameStarted(true)}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all hover:shadow-[0_0_20px_rgba(147,51,234,0.25)]"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-10 w-full max-w-sm text-center flex flex-col items-center gap-6">
            <div
              className={clsx(
                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl",
                gameOver === "win"
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20",
              )}
            >
              {gameOver === "win" ? "♔" : "♚"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {gameOver === "win" ? "You Won!" : "You Resigned"}
              </h2>
              <p className="text-neutral-500 text-sm">
                {gameOver === "win"
                  ? "Excellent play against the bot."
                  : `Better luck next time against ${cfg.label} bot.`}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main game */}
      {gameStarted && (
        <main className="flex-1 flex items-center justify-center p-8 gap-12">
          <div className="flex flex-col gap-6 max-w-[600px] w-full">
            {/* Bot panel */}
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-lg border flex items-center justify-center text-2xl transition-all",
                    botThinking
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-neutral-800 bg-neutral-900",
                  )}
                >
                  <Bot
                    className={clsx(
                      "w-6 h-6",
                      botThinking
                        ? "text-purple-400 animate-pulse"
                        : "text-neutral-500",
                    )}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">
                    chess42 Bot{" "}
                    <span className={clsx("text-sm font-normal", cfg.color)}>
                      {cfg.label} ({cfg.elo})
                    </span>
                  </h3>
                  {botThinking ? (
                    <p className="text-xs text-purple-400 animate-pulse mt-0.5">
                      Thinking…
                    </p>
                  ) : (
                    <div className="flex gap-1 text-neutral-600 text-lg">
                      <span>♟</span>
                      <span>♞</span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={clsx(
                  "border px-6 py-2 rounded-lg font-mono text-2xl font-bold transition-all",
                  botThinking
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                    : "bg-[#050505] border-neutral-900 text-neutral-300",
                )}
              >
                {formatTime(botTime)}
              </div>
            </div>

            {/* Board */}
            <div className="w-[600px] h-[600px] rounded-sm overflow-hidden border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800">
              <ChessBoardUI />
            </div>

            {/* Player panel */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
                  alt="Player"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg text-blue-500">
                    GrandMaster42{" "}
                    <span className="text-sm font-normal text-neutral-500">
                      (2145)
                    </span>
                  </h3>
                  <div className="flex gap-1 text-neutral-100 text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                    <span>♙</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#050505] border border-blue-500/30 px-6 py-2 rounded-lg font-mono text-2xl font-bold text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                {formatTime(playerTime)}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 bg-[#050505] border border-neutral-900 rounded-xl h-[600px] flex flex-col p-4">
            {/* Difficulty badge */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                Bot Difficulty
              </span>
              <span
                className={clsx(
                  "text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-900",
                  cfg.color,
                )}
              >
                {cfg.label}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4">
                Move History
              </h4>
              <div className="space-y-1 text-sm font-mono">
                {moveHistory.length === 0 && (
                  <p className="text-neutral-700 text-xs">No moves yet.</p>
                )}
                {moveHistory.map((m) => (
                  <div
                    key={m.n}
                    className={clsx(
                      "flex px-2 py-1.5 rounded",
                      m.n % 2 === 1 ? "bg-neutral-900" : "",
                    )}
                  >
                    <span className="w-8 text-neutral-500">{m.n}.</span>
                    <span className="flex-1 text-neutral-300">{m.white}</span>
                    <span className="flex-1 text-neutral-300">
                      {m.black ?? ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" /> Restart
              </button>
              <button
                onClick={handleResign}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-lg transition-colors text-sm font-medium"
              >
                <Flag className="w-4 h-4" /> Resign
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
