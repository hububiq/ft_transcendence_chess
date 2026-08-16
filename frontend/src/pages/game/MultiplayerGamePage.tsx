import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebSocket";
import avatar_1 from "../../assets/avatar_1.png";
import avatar_2 from "../../assets/avatar_2.png";
import { resolveMediaUrl } from "../../utils/utils";
import { GameSidebar } from "../../features/gameplay/components/GameSidebar";
import { GameOverModal } from "../../features/gameplay/components/GameOverModal";
import { type GameOutcome } from "../../utils/constants";
import { api } from "../../api/axios";
import {
  type MoveRecord,
  parseHistory,
  formatNotation,
} from "../../utils/chessHelpers";

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useUser();

  const [opponentId, setOpponentId] = useState<number | null>(null);

  // Game States
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [currentFen, setCurrentFen] = useState("start");
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [gameOver, setGameOver] = useState<GameOutcome | null>(null);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [isWaitingForRematch, setIsWaitingForRematch] = useState(false);
  const [receivedRematchOffer, setReceivedRematchOffer] = useState(false);

  // Clocks & Turns
  const [playerTime, setPlayerTime] = useState(15);
  const [opponentTime, setOpponentTime] = useState(15);

  // Derive active turn safely
  const activeColor = currentFen === "start" ? "w" : currentFen.split(" ")[1];
  const isPlayerTurn = activeColor === playerColor;
  const navigate = useNavigate();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleHomeClick = () => {
    if (gameOver) {
      navigate("/");
    } else {
      setShowLeaveConfirm(true);
    }
  };
  const confirmLeave = () => {
    sendMessage({
      type: "surrender",
      player_id: user?.id,
    });
    navigate("/");
  };

  const [opponent, setOpponent] = useState({
    username: "Waiting...",
    elo_rating: "?",
    avatar: avatar_1,
  });

  const handleServerMessage = (data: any) => {
    console.log("WebSocket Data Received:", data);
    if (data.opponent) {
      setOpponent(data.opponent);
    }

    switch (data.type) {
      case "board_state":
        setCurrentFen(data.fen);
        if (data.color) setPlayerColor(data.color);
        if (data.opponent_id) {
          setOpponentId(data.opponent_id);
          setOpponent((prev) => ({
            ...prev,
            username: `Loading Opponent...`,
          }));
        }
        if (data.history) {
          setMoveHistory(parseHistory(data.history));
        }
        break;

      case "move":
        setCurrentFen(data.fen);
        setMoveHistory((prev) => {
          const lastMove = prev[prev.length - 1];
          const prettyMove = formatNotation(data.san_move);

          if (!lastMove || lastMove.black) {
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
        if (data.result === "1/2-1/2") {
          setGameOver("draw");
        } else if (data.loser_id === user?.id) {
          setGameOver("loss");
        } else if (data.winner_id === user?.id) {
          setGameOver("win");
        } else {
          setGameOver("draw");
        }
        setIsResignModalOpen(false);
        break;

      case "rematch_request":
        setReceivedRematchOffer(true);
        break;

      case "rematch_accepted":
        window.location.href = `/game/${data.new_game_id}`;
        break;

      case "rematch_declined":
        setIsWaitingForRematch(false);
        alert("Opponent declined the rematch.");
        break;

      case "error":
        console.error("Server Error:", data.message);
        break;
    }
  };

  const { sendMessage } = useWebSocket({
    url:
      gameId && user?.id
        ? `${import.meta.env.VITE_WS_BASE_URL}/ws/game/${gameId}?user_id=${user.id}`
        : "",
    enabled: !!gameId && !!user?.id,
    onMessage: handleServerMessage,
  });

  // fetch opponents ID
  useEffect(() => {
    if (!opponentId) return;

    const fetchOpponentProfile = async () => {
      try {
        const response = await api.get(
          `api/users/${opponentId}/`,
        );
        const data = response.data;

        console.log("Opponent Profile Data:", data);

        setOpponent({
          username: data.username || "Unknown",
          elo_rating: data.profile.elo_rating || "?",
          avatar: data.avatar || avatar_2,
        });
      } catch (error) {
        console.error("Error fetching opponent:", error);
        setOpponent((prev) => ({ ...prev, username: "Player--" }));
      }
    };

    fetchOpponentProfile();
  }, [opponentId]);

  // Clock countdown logic
  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      if (isPlayerTurn) {
        setPlayerTime((t) => {
          const newTime = t - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            sendMessage({
              type: "claim_timeout",
              player_id: opponentId,
              opponenet_id: user?.id
            });
          }
          return newTime > 0 ? newTime : 0;
        });  
      } else {
        setOpponentTime((t) => {
          const newTime = t - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            console.log("CLOCK HIT ZERO! Firing claim_timeout to FastAPI!");
            sendMessage({
              type: "claim_timeout",
              player_id: user?.id,
              opponent_id: opponentId
            });
          }
          return newTime > 0 ? newTime : 0;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlayerTurn, gameOver, user?.id, opponentId, sendMessage]); // Hubert: addeed dependencies

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
      {receivedRematchOffer && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Rematch?</h2>
              <p className="text-neutral-500 text-sm">
                Your opponent has challenged you to a rematch. Do you accept?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleDeclineRematch}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptRematch}
                className="flex-1 py-2.5 bg-blue-950/30 hover:bg-blue-900/40 text-blue-500 border border-blue-900/30 rounded-lg text-sm font-medium transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Resign Modal*/}
      {isResignModalOpen && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Resign Game?
              </h2>
              <p className="text-neutral-500 text-sm">
                Are you sure you want to resign? This will count as a loss and
                your ELO will be updated.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsResignModalOpen(false)}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmResign}
                className="flex-1 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-lg text-sm font-medium transition-colors"
              >
                Yes, Resign
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Game Over Modal*/}
      {gameOver && (
        <div className="relative z-70">
          <GameOverModal outcome={gameOver} onRestart={handleRematchRequest} />
        </div>
      )}

      {/*Leave Warning Modal */}
      {showLeaveConfirm && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Leave Game?</h2>
              <p className="text-neutral-500 text-sm">
                If you leave now, you will automatically resign and lose ELO.
                Are you sure?
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

      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
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
          <div className="w-[600px] h-[600px] rounded-sm relative z-50 border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800 pointer-events-auto">
            <ChessBoard
              fen={currentFen}
              onMove={handlePlayerMove}
              onGameEnd={setGameOver as any}
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
                    ({user?.profile?.elo_rating || ""})
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
          isGameOver={!!gameOver}
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
