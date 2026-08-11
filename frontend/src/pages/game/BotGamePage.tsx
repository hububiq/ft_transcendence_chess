import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bot } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import { type GameOutcome } from "../../utils/constants";
import { GameOverModal } from "../../features/gameplay/components/GameOverModal";
import { ParticipantBannerBot } from "../../features/gameplay/components/ParticipantBannerBot";
import { GameSidebar } from "../../features/gameplay/components/GameSidebar";
import clsx from "clsx";
import playerAvatar from "../../assets/avatar_1.png";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebSocket";
import { createBotGame } from "../../api/gameApi";
import { resolveMediaUrl } from "../../utils/utils";


const SYSTEM_BOT_ID = null;

export function BotGame() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const { user } = useUser();

  // game state
  const [currentFen, setCurrentFen] = useState<string>("start");
  const [botThinking, setBotThinking] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [gameOver, setGameOver] = useState<GameOutcome | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | number | null>(null);
  const hasFetchedRef = useRef(false);
  const currentPlayerId = user?.id || 0;

  const navigate = useNavigate();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleHomeClick = () => {
    if (gameOver || !gameStarted) {
      navigate("/");
    } else {
      setShowLeaveConfirm(true);
    }
  };

  const confirmLeave = () => {
    sendMessage({
      type: "surrender",
      player_id: currentPlayerId,
      opponent_id: SYSTEM_BOT_ID,
    });
    sessionStorage.removeItem("activeBotGameId"); // Clear it so they don't resume a forfeited game
    navigate("/");
  };

  // Axios API
  const initGame = async () => {
    if (!user || !user.id) {
      console.warn("Waiting for user profile to load...");
      return;
    }

    const savedGameId = sessionStorage.getItem("activeBotGameId");

    if (savedGameId) {
      console.log("Resuming existing bot game:", savedGameId);
      setGameId(savedGameId);
      setGameStarted(true);
      return;
    }

    try {
      const data = await createBotGame({
        user_id: user.id,
      });

      console.log("SERVER RESPONSE:", data);

      sessionStorage.setItem("activeBotGameId", data.game_id.toString());
      setGameId(data.game_id);
      setGameStarted(true);
    } catch (error) {
      console.error("Failed to initialize game:", error);
    }
  };

  useEffect(() => {
    if (user && user.id && !gameStarted && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      initGame();
    }
  }, [user]);

  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case "board_state":
        setCurrentFen(data.fen);
        if (data.history) {
          setMoveHistory(parseHistory(data.history));
        }
        break;
      case "move":
        setCurrentFen(data.fen);

        setMoveHistory((prev) => {
          const newHistory: MoveRecord[] = [...prev];
          const lastIndex: number = newHistory.length - 1;
          const prettyMoveBot = formatNotation(data.san_move);

          if (lastIndex < 0 || newHistory[lastIndex].black) {
            newHistory.push({
              n: newHistory.length + 1,
              white: prettyMoveBot,
            });
            setBotThinking(true);
          } else {
            newHistory[lastIndex] = {
              ...newHistory[lastIndex],
              black: prettyMoveBot,
            };
            setBotThinking(false);
          }
          return newHistory;
        });
        break;

      case "game_over":
        if (data.result === "1/2-1/2") {
          setGameOver("draw");
        } else if (data.loser_id === currentPlayerId) {
          setGameOver("loss");
        } else if (data.winner_id === currentPlayerId) {
          setGameOver("win");
        }
        break;
    }
  };

  const { sendMessage } = useWebSocket({
    url: gameId
      ? `ws://localhost:8001/ws/game/${gameId}?user_id=${currentPlayerId}`
      : "",
    enabled: gameStarted && !!gameId,
    onMessage: handleServerMessage,
  });

  const handlePlayerMove = (move: string) => {
    const isWhiteTurn =
      currentFen === "start" || currentFen.split(" ")[1] === "w";
    if (!isWhiteTurn) return;
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

    sessionStorage.removeItem("activeBotGameId");

    hasFetchedRef.current = false;
    initGame();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-neutral-200">
      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          {`${user?.username || "Player"} vs Bot • Untimed`}
        </div>
        <div className="w-24" />
      </header>

      {/* Restart Confirmation Modal Overlay */}
      {showRestartConfirm && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
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
        <div className="relative z-70">
          <GameOverModal outcome={gameOver} onRestart={handleRestart} />
        </div>
      )}

      {/* Leave Warning Modal */}
      {showLeaveConfirm && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Leave Game?</h2>
              <p className="text-neutral-500 text-sm">
                If you leave now, you will abandon this match against the bot.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-lg text-sm font-medium transition-colors"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {gameStarted && (
        <main className="flex-1 flex items-center justify-center p-8 gap-12">
          <div className="flex flex-col gap-6 max-w-[600px] w-full">
            <ParticipantBannerBot
              avatar={<Bot className={clsx("w-6 h-6")} />}
              name="chess42 Bot"
              isThinking={botThinking}
            />

            <div className="w-[600px] h-[600px] rounded-sm relative z-50 border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800">
              <ChessBoard
                fen={currentFen}
                playerColor="w"
                onMove={handlePlayerMove}
                onGameEnd={setGameOver}
              />
            </div>

            <ParticipantBannerBot
              avatar={
                <img
                  src={
                    resolveMediaUrl(user?.profile?.avatar) ||
                    user?.profile?.oauth_avatar_url ||
                    playerAvatar
                  }
                  alt="Player avatar"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
              }
              name={user?.username || "Player"}
              nameColor="text-blue-500"
              eloRating={user?.profile?.elo_rating || "?"}
            />
          </div>

          <GameSidebar
            onLeftAction={() => setShowRestartConfirm(true)}
            onResign={handleResign}
            moveHistory={moveHistory}
          />
        </main>
      )}
    </div>
  );
}
