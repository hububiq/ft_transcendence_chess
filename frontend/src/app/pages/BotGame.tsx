import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Bot } from "lucide-react";
import { ChessBoardUI } from "./ChessBoard";
import {
  type Difficulty,
  type GameOutcome,
  DIFFICULTY_CONFIG,
} from "../utils/constants";
import { PreGameMenu } from "../components/ui/PreGameMenu";
import { GameOverModal } from "../components/ui/GameOverModal";
import { GameSidebar, type MoveRecord } from "../components/ui/GameSidebar";
import { ParticipantBanner } from "../components/ui/ParticipantBanner";
import clsx from "clsx";

import playerAvatar from "../assets/a_logo.png";

const INITIAL_CLOCK_SEC = 600;

export function BotGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameStarted, setGameStarted] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [botThinking, setBotThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [playerTime, setPlayerTime] = useState(INITIAL_CLOCK_SEC);
  const [botTime, setBotTime] = useState(INITIAL_CLOCK_SEC);
  const [gameOver, setGameOver] = useState<GameOutcome | null>(null);
  const [isTimed, setIsTimed] = useState(true);

  // Player timer
  useEffect(() => {
    const isMatchActive = gameStarted && !gameOver;
    if (!isMatchActive || !isPlayerTurn || !isTimed) return;
    const t = setInterval(() => setPlayerTime((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [gameStarted, isPlayerTurn, gameOver, isTimed]);

  // Bot timer
  useEffect(() => {
    const isMatchActive = gameStarted && !gameOver;
    if (!isMatchActive || isPlayerTurn) return;
    const t = setInterval(() => setBotTime((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [gameStarted, isPlayerTurn, gameOver]);

  const handleResign = () => setGameOver("loss");
  const handleRestart = () => {
    setIsPlayerTurn(true);
    setBotThinking(false);
    setMoveHistory([]);
    setPlayerTime(INITIAL_CLOCK_SEC);
    setBotTime(INITIAL_CLOCK_SEC);
    setGameOver(null);
    setGameStarted(true);
  };

  const cfg = DIFFICULTY_CONFIG[difficulty];

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
          {isTimed ? "Player vs Bot • Blitz 10|0" : "Time control is off"}
        </div>
        <div className="w-24" />
      </header>

      {/* Difficulty picker overlay (pre-game) */}
      {!gameStarted && (
        <PreGameMenu
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onStartGame={() => setGameStarted(true)}
          timeMode={isTimed}
          onTimeModeChange={setIsTimed}
        />
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <GameOverModal
          outcome={gameOver}
          difficulty={difficulty}
          onRestart={handleRestart}
        />
      )}

      {/* Main game */}
      {gameStarted && (
        <main className="flex-1 flex items-center justify-center p-8 gap-12">
          <div className="flex flex-col gap-6 max-w-[600px] w-full">
            {/* Bot panel */}
            <ParticipantBanner
              avatar={<Bot className={clsx("w-6 h-6")} />}
              name="chess42 Bot"
              subText={`${cfg.label} (${cfg.elo})`}
              subTextColor={cfg.color}
              time={isTimed ? botTime : undefined}
              isThinking={botThinking}
              graveyard={<span>♟</span>}
            />

            {/* Chess Board */}
            <div className="w-[600px] h-[600px] rounded-sm overflow-hidden border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800">
              <ChessBoardUI onGameEnd={setGameOver} />
            </div>

            {/* Player panel */}
            <ParticipantBanner
              avatar={
                <img
                  src={playerAvatar}
                  alt="Player's avatar"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
              }
              name="GrandMaster42"
              nameColor="text-blue-500"
              subText="(2145)"
              time={isTimed ? playerTime : undefined}
              graveyard={<span>♙</span>}
            />
          </div>

          {/* Sidebar */}
          <GameSidebar
            difficulty={difficulty}
            onRestart={handleRestart}
            onResign={handleResign}
            moveHistory={moveHistory}
          />
        </main>
      )}
    </div>
  );
}
