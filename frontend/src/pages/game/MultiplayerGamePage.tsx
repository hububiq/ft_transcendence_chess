import { useState, useCallback, useEffect } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebSocket";
import avatar_1 from "../../assets/avatar_1.png";
import avatar_2 from "../../assets/avatar_2.png";
import { resolveMediaUrl } from "../../utils/utils";

import { GameSidebar } from "../../features/gameplay/components/GameSidebar";

interface Move {
  n: number;
  white: string;
  black?: string;
}

const formatNotation = (move?: string) => {
  if (!move) return "";
  return move
    .replace(/N/g, "♞")
    .replace(/B/g, "♝")
    .replace(/R/g, "♜")
    .replace(/Q/g, "♛")
    .replace(/K/g, "♚");
};

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useUser();

  // Game States
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [currentFen, setCurrentFen] = useState("start");
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

  // Clocks & Turns
  const [playerTime, setPlayerTime] = useState(600);
  const [opponentTime, setOpponentTime] = useState(600);
  const [gameOver, setGameOver] = useState(false);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [isWaitingForRematch, setIsWaitingForRematch] = useState(false);
  const [receivedRematchOffer, setReceivedRematchOffer] = useState(false);

  // Derive active turn safely
  const activeColor = currentFen === "start" ? "w" : currentFen.split(" ")[1];
  const isPlayerTurn = activeColor === playerColor;

  const [opponent, setOpponent] = useState({
    username: "Waiting...",
    elo_rating: "?",
    avatar: avatar_1,
  });

  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case "board_state":
        setCurrentFen(data.fen);
        if (data.color) setPlayerColor(data.color);
        if (data.opponent) setOpponent(data.opponent);
        break;

      case "move":
        setCurrentFen(data.fen);
        setMoveHistory((prev) => {
          const lastMove = prev[prev.length - 1];

          const prettyMove = formatNotation(data.san_move);

          if (!lastMove || lastMove.black) {
            // 💡 CHANGE 5: Updated to use 'n' instead of 'number'
            return [...prev, { n: prev.length + 1, white: prettyMove }];
          } else {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = {
              ...lastMove,
              black: prettyMove,
            };
            return newHistory;
          }
        });
        break;

      case "game_over":
        setGameOver(true);
        setIsResignModalOpen(false); // Force modal closed if backend ends game
        break;

      case "rematch_request":
        // The opponent clicked Rematch! Show the modal to this player.
        setReceivedRematchOffer(true);
        break;

      case "rematch_accepted":
        // The opponent accepted! Navigate BOTH players to the brand new game URL
        // (Assuming you use react-router, adjust this to however you navigate)
        window.location.href = `/game/${data.new_game_id}`;
        break;

      case "rematch_declined":
        // The opponent said no. Reset our waiting button.
        setIsWaitingForRematch(false);
        alert("Opponent declined the rematch."); // Or show a nicer toast notification
        break;

      case "error":
        console.error("Server Error:", data.message);
        break;
    }
  }, []);

  const { sendMessage } = useWebSocket({
    url:
      gameId && user?.id
        ? `${import.meta.env.VITE_WS_BASE_URL}/ws/game/${gameId}?user_id=${user.id}`
        : "",
    enabled: !!gameId && !!user?.id,
    onMessage: handleServerMessage,
  });

  // Clock countdown logic
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      if (isPlayerTurn) {
        setPlayerTime((t) => Math.max(0, t - 1));
      } else {
        setOpponentTime((t) => Math.max(0, t - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver]);

  // ACTIONS
  const handlePlayerMove = (move: string) => {
    sendMessage({
      type: "move",
      move: move,
      player_id: user?.id,
    });
  };

  const confirmResign = () => {
    sendMessage({
      type: "surrender",
      player_id: user?.id,
    });
    setIsResignModalOpen(false);
  };

  const handleDrawOffer = () => {
    sendMessage({ type: "offer_draw" });
  };

  const handleRematchRequest = () => {
    setIsWaitingForRematch(true);
    sendMessage({ type: "rematch_request", player_id: user?.id });
  };

  const handleAcceptRematch = () => {
    setReceivedRematchOffer(false);
    sendMessage({ type: "rematch_accepted", player_id: user?.id });
  };

  const handleDeclineRematch = () => {
    setReceivedRematchOffer(false);
    sendMessage({ type: "rematch_declined", player_id: user?.id });
  };

  // Helpers
  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-neutral-200 relative">
      {/*Rematch Offer Modal*/}
      {receivedRematchOffer && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full shadow-2xl transition-all">
            <h2 className="text-xl font-bold text-white mb-2">Rematch?</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Your opponent has challenged you to a rematch. Do you accept?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineRematch}
                className="flex-1 py-2.5 rounded-lg font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptRematch}
                className="flex-1 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Resign Modal*/}
      {isResignModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full shadow-2xl transition-all">
            <h2 className="text-xl font-bold text-white mb-2">Resign Game?</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Are you sure you want to resign? This will count as a loss and
              your ELO will be updated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsResignModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResign}
                className="flex-1 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Yes, Resign
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase">
          Rapid 10|0 • Ranked
        </div>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex items-center justify-center p-8 gap-12">
        <div className="flex flex-col gap-6 max-w-[600px] w-full">
          {/* Opponent Panel */}
          <div
            className={`flex justify-between items-end transition-opacity duration-300 ${!isPlayerTurn ? "opacity-100" : "opacity-60"}`}
          >
            <div className="flex items-center gap-4">
              <img
                src={opponent.avatar}
                alt="Opponent"
                className="w-12 h-12 rounded-lg border border-neutral-800 object-cover shadow-lg"
              />
              <div>
                <h3 className="font-semibold text-lg text-white">
                  {opponent.username}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    ({opponent.elo_rating})
                  </span>
                </h3>
              </div>
            </div>
            <div
              className={`px-6 py-2 rounded-lg font-mono text-2xl font-bold border transition-all duration-300 ${!isPlayerTurn ? "bg-neutral-100 border-neutral-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-[#050505] border-neutral-900 text-neutral-500"}`}
            >
              {formatTime(opponentTime)}
            </div>
          </div>

          {/* Board */}
          <div className="w-[600px] h-[600px] rounded-sm overflow-hidden border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800 pointer-events-auto">
            <ChessBoard
              fen={currentFen}
              onMove={handlePlayerMove}
              onGameEnd={() => setGameOver(true)}
              playerColor={playerColor}
            />
          </div>

          {/* Player Panel */}
          <div
            className={`flex justify-between items-start transition-opacity duration-300 ${isPlayerTurn ? "opacity-100" : "opacity-60"}`}
          >
            <div className="flex items-center gap-4">
              <img
                src={
                  resolveMediaUrl(user?.profile?.avatar) ||
                  user?.profile?.oauth_avatar_url ||
                  avatar_2
                }
                alt="Player"
                className="w-12 h-12 rounded-lg border border-blue-500 object-cover shadow-[0_0_10px_rgba(37,99,235,0.3)]"
              />
              <div>
                <h3 className="font-semibold text-lg text-white">
                  {user?.username || "Loading..."}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    ({user?.profile?.elo_rating || "1200"})
                  </span>
                </h3>
              </div>
            </div>
            <div
              className={`px-6 py-2 rounded-lg font-mono text-2xl font-bold border transition-all duration-300 ${isPlayerTurn ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "bg-[#050505] border-neutral-900 text-neutral-500"}`}
            >
              {formatTime(playerTime)}
            </div>
          </div>
        </div>

        <GameSidebar
          mode="multiplayer"
          isGameOver={gameOver}
          isWaitingForRematch={isWaitingForRematch}
          moveHistory={moveHistory}
          onLeftAction={
            gameOver ? () => window.location.reload() : handleDrawOffer
          }
          onResign={() => setIsResignModalOpen(true)}
        />
      </main>
    </div>
  );
}
