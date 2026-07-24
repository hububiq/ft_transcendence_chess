import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import {
  type Difficulty,
  type GameOutcome,
  DIFFICULTY_CONFIG,
} from "../../utils/constants";
import { PreGameMenu } from "../../features/gameplay/components/PreGameMenu";
import { GameOverModal } from "../../features/gameplay/components/GameOverModal";
import { ParticipantBannerBot } from "../../features/gameplay/components/ParticipantBannerBot";
import {
  GameSidebar,
  type MoveRecord,
} from "../../features/gameplay/components/GameSidebar";
import clsx from "clsx";
import playerAvatar from "../../assets/a_logo.png";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebSocket";
import { createBotGame } from "../../api/gameApi";

const SYSTEM_BOT_ID = null;

export function BotGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const { user } = useUser();

  // game state
  const [currentFen, setCurrentFen] = useState<string>("start");
  const [botThinking, setBotThinking] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [gameOver, setGameOver] = useState<GameOutcome | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);

  const [gameId, setGameId] = useState<string | number | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState<boolean>(false);

  // Fallback to 0 if user is a guest or still loading
  const currentPlayerId = user?.id || 0;

  // Axios API
  const initGame = async () => {
    try {
      setIsCreatingGame(true);

      const data = await createBotGame({
        user_id: currentPlayerId,
      });

      setGameId(data.game_id);
      setGameStarted(true);
    } catch (error) {
      console.error("Failed to initialize game:", error);
      // Optional: Add UI error handling (e.g., toast notification)
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleServerMessage = (data: any) => {
    console.log("Received from server: ", data);

    switch (data.type) {
      case "board_state":
        setCurrentFen(data.fen);
        break;
      case "move":
        setCurrentFen(data.fen);

        setMoveHistory((prev) => {
          const newHistory: MoveRecord[] = [...prev];
          const lastIndex: number = newHistory.length - 1;

          if (lastIndex < 0 || newHistory[lastIndex].black) {
            newHistory.push({ n: newHistory.length + 1, white: data.move });
            setBotThinking(true);
          } else {
            newHistory[lastIndex] = {
              ...newHistory[lastIndex],
              black: data.move,
            };
            setBotThinking(false);
          }
          return newHistory;
        });
        break;

      case "game_over":
        if (data.winner_id === currentPlayerId) {
          setGameOver("win");
        } else if (data.winner_id === SYSTEM_BOT_ID) {
          setGameOver("loss");
        } else {
          setGameOver("draw");
        }
        break;
    }
  };

  const { sendMessage } = useWebSocket({
    url: gameId ? `ws://localhost:8001/ws/game/${gameId}` : "",
    enabled: gameStarted && !!gameId,
    onMessage: handleServerMessage,
  });

  const handlePlayerMove = (move: string) => {
    sendMessage({
      type: "move",
      move: move,
      player_id: currentPlayerId,
      opponent_id: SYSTEM_BOT_ID,
      is_vs_bot: true,
    });
  };

  const handleResign = () => {
    sendMessage({
      type: "surrender",
      player_id: currentPlayerId,
      opponent_id: SYSTEM_BOT_ID,
    });
    setGameOver("loss");
  };

  const handleRestart = () => {
    setBotThinking(false);
    setMoveHistory([]);
    setCurrentFen("start");
    setGameOver(null);
    setShowRestartConfirm(false);
    setGameStarted(false);
    setGameId(null);

    initGame();
  };

  const cfg = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="min-h-screen bg-black flex flex-col text-neutral-200">
      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          {`${user?.username || "Player"} vs Bot • Untimed`}
        </div>
        <div className="w-24" />
      </header>

      {/* Pre Game with Loading State */}
      {!gameStarted && (
        <div className="flex-1 flex flex-col items-center justify-center">
          {isCreatingGame ? (
            <div className="flex flex-col items-center gap-4 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Initializing game engine...</p>
            </div>
          ) : (
            <PreGameMenu
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              onStartGame={initGame}
            />
          )}
        </div>
      )}

      {/* Restart Confirmation Modal Overlay */}
      {showRestartConfirm && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Restart Game?
              </h2>
              <p className="text-neutral-500 text-sm">
                Are you sure you want to abandon this match and start over?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                No, continue
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-lg text-sm font-medium transition-colors"
              >
                Yes, restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal
          outcome={gameOver}
          difficulty={difficulty}
          onRestart={handleRestart}
        />
      )}

      {gameStarted && (
        <main className="flex-1 flex items-center justify-center p-8 gap-12">
          <div className="flex flex-col gap-6 max-w-[600px] w-full">
            <ParticipantBannerBot
              avatar={<Bot className={clsx("w-6 h-6")} />}
              name="chess42 Bot"
              eloRating={`${cfg.label} (${cfg.elo})`}
              eloRatingColor={cfg.color}
              isThinking={botThinking}
              graveyard={<span>♟</span>}
            />

            <div className="w-[600px] h-[600px] rounded-sm overflow border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800">
              <ChessBoard
                fen={currentFen}
                onMove={handlePlayerMove}
                onGameEnd={setGameOver}
              />
            </div>

            <ParticipantBannerBot
              avatar={
                <img
                  src={playerAvatar}
                  alt="Player avatar"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
              }
              name={user?.username || "Player"}
              nameColor="text-blue-500"
              eloRating={user?.profile?.elo_rating || 1200}
              graveyard={<span>♙</span>}
            />
          </div>

          <GameSidebar
            difficulty={difficulty}
            onRestart={() => setShowRestartConfirm(true)}
            onResign={handleResign}
            moveHistory={moveHistory}
          />
        </main>
      )}
    </div>
  );
}
