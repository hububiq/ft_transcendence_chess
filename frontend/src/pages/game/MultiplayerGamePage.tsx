import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import { useUser } from "../../hooks/useUser";
import { useGameReconnectSocket } from "../../features/gameplay/hooks/useGameReconnectSocket";
import avatar_1 from "../../assets/avatar_1.png";
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

type MultiplayerGameServerMessage =
  | {
      type: "board_state";
      fen: string;
      color: "w" | "b";
      opponent_id: number | null;
      tournament_id?: number | null;
      history: string[];
      white_time?: number;
      black_time?: number;
    }
  | {
      type: "move";
      move: string;
      san_move: string;
      fen: string;
    }
  | {
      type: "game_over";
      winner_id: number | null;
      loser_id: number | null;
      result: "1-0" | "0-1" | "1/2-1/2";
      pgn: string;
      rematch_state?: "idle" | "received" | "sent";
    }
  | {
      type: "draw_offer";
    }
  | {
      type: "draw_declined";
    }
  | {
      type: "rematch_request";
    }
  | {
      type: "rematch_accepted";
      new_game_id: number;
    }
  | {
      type: "rematch_declined";
    }
  | {
      type: "rematch_request_sent";
    }
  | {
      type: "opponent_gone";
    }
  | {
      type: "tournament_won";
      tournament_id: number;
    }
  | {
      type: "error";
      message: string;
      fen?: string;
    };

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
  const [receivedDrawOffer, setReceivedDrawOffer] = useState(false);
  const [isTournamentGame, setIsTournamentGame] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const [isTournamentChampion, setIsTournamentChampion] = useState(false);
  const [rematchStatus, setRematchStatus] = useState("idle"); // "idle", "pending", "gone"

  // Clocks & Turns
  const [playerTime, setPlayerTime] = useState(15 * 60);
  const [opponentTime, setOpponentTime] = useState(15 * 60);

  // Derive active turn safely
  const activeColor = currentFen === "start" ? "w" : currentFen.split(" ")[1];
  const isPlayerTurn = activeColor === playerColor;
  const navigate = useNavigate();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleHomeClick = () => {
    if (gameOver) {
      navigate(isTournamentGame ? "/tournament" : "/");
    } else {
      setShowLeaveConfirm(true);
    }
  };
  const confirmLeave = () => {
    sendMessage({
      type: "surrender",
    });
    navigate(isTournamentGame ? "/tournament" : "/");
  };

  const [opponent, setOpponent] = useState({
    username: "Waiting...",
    elo_rating: "?",
    avatar: avatar_1,
  });

  const handleServerMessage = (data: MultiplayerGameServerMessage) => {
    switch (data.type) {
      case "board_state":
        setCurrentFen(data.fen);
        if (data.color) setPlayerColor(data.color);
        if (data.tournament_id) setIsTournamentGame(true);
        if (data.white_time !== undefined && data.black_time !== undefined) {
          if (data.color === "w") {
            setPlayerTime(data.white_time);
            setOpponentTime(data.black_time);
          } else {
            setPlayerTime(data.black_time);
            setOpponentTime(data.white_time);
          }
        }
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
        if (data.white_time !== undefined && data.black_time !== undefined) {
          if (data.color === "w") {
            setPlayerTime(data.white_time);
            setOpponentTime(data.black_time);
          } else {
            setPlayerTime(data.black_time);
            setOpponentTime(data.white_time);
          }
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
        if (data.rematch_state === "received") {
          setReceivedRematchOffer(true);
        } else if (data.rematch_state === "sent") {
          setRematchStatus("pending");
        }
        setIsResignModalOpen(false);
        break;

      case "draw_offer":
        setReceivedDrawOffer(true); // Pops up the Draw Modal!
        break;

      case "draw_declined":
        alert("Opponent declined your draw offer.");
        break;

      case "rematch_request":
        setReceivedRematchOffer(true);
        break;

      case "rematch_accepted":
        window.location.href = `/game/${data.new_game_id}`;
        break;

      case "rematch_declined":
        setRematchStatus("declined");
        setIsWaitingForRematch(false);
        break;

      case "rematch_request_sent":
        setRematchStatus("pending");
        break;

      case "opponent_gone":
        setRematchStatus("gone");
        setReceivedRematchOffer(false);
        //alert("Your opponent left the room.");
        break;

      case "tournament_won":
        setIsTournamentChampion(true);
        break;

      case "error":
        console.error("Server Error:", data.message);
        alert(data.message); // Tells the user why it failed
        // If the server provides the true FEN, snap the board back to reality
        if (data.fen) {
          setCurrentFen(data.fen);
          setBoardKey((prev) => prev + 1);
        }
        break;
    }
  };

  // Use reconnect-aware WebSocket lifecycle only for remote multiplayer games
  const { sendMessage } = useGameReconnectSocket({
    url:
      gameId && user?.id
        ? `${import.meta.env.VITE_WS_BASE_URL}/ws/game/${gameId}`
        : "",
    enabled: !!gameId && !!user?.id,
    onMessage: handleServerMessage,
  });

  // fetch opponents ID
  useEffect(() => {
    if (!opponentId) return;

    const fetchOpponentProfile = async () => {
      try {
        const response = await api.get(`/api/users/${opponentId}/`);
        const data = response.data;

        setOpponent({
          username: data.username || "Unknown",
          elo_rating: data.profile.elo_rating || "?",
          avatar:
            resolveMediaUrl(data.profile?.avatar) ||
            data.profile?.oauth_avatar_url ||
            avatar_1,
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
    if (gameOver || moveHistory.length === 0) return;

    const timer = setInterval(() => {
      if (isPlayerTurn) {
        setPlayerTime((t) => {
          const newTime = t - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            sendMessage({
              type: "claim_timeout",
              player_id: opponentId,
              opponent_id: user?.id,
            });
          }
          return newTime > 0 ? newTime : 0;
        });
      } else {
        setOpponentTime((t) => {
          const newTime = t - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            sendMessage({
              type: "claim_timeout",
              player_id: user?.id,
              opponent_id: opponentId,
            });
          }
          return newTime > 0 ? newTime : 0;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isPlayerTurn,
    gameOver,
    user?.id,
    opponentId,
    sendMessage,
    moveHistory.length,
  ]); // Hubert: addeed dependencies

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
    });
    setIsResignModalOpen(false);
  };

  const handleDrawOffer = () => {
    sendMessage({ type: "offer_draw" });
  };

  const handleAcceptDraw = () => {
    setReceivedDrawOffer(false);
    sendMessage({ type: "draw_accepted" });
  };

  const handleDeclineDraw = () => {
    setReceivedDrawOffer(false);
    sendMessage({ type: "draw_declined" });
  };

  const handleRematchRequest = () => {
    setRematchStatus("pending");
    setIsWaitingForRematch(true);
    sendMessage({
      type: "rematch_request",
      player_id: user?.id,
      opponent_id: opponentId,
    });
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
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

      {/* Draw Offer Modal */}
      {receivedDrawOffer && !gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70">
          <div className="bg-[#080808] border border-neutral-800 rounded-2xl p-8 w-full max-w-sm text-center flex flex-col items-center gap-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Draw Offer</h2>
              <p className="text-neutral-500 text-sm">
                Your opponent has offered a draw. Do you accept?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleDeclineDraw}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptDraw}
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
      {gameOver && !isTournamentChampion && (
        <div className="relative z-[100]">
          <GameOverModal
            outcome={gameOver}
            onRestart={handleRematchRequest}
            onHome={handleHomeClick}
            isTournament={isTournamentGame}
            rematchStatus={rematchStatus}
          />
        </div>
      )}

      {/* 2. THE CHAMPION FIRECRACKER MODAL (Replaces the normal win screen!) */}
      {isTournamentChampion && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] animate-in fade-in duration-500 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border-2 border-yellow-500/50 p-12 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_150px_rgba(234,179,8,0.3)] transform animate-in zoom-in-95">
            <div className="text-8xl animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">
              🏆
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 uppercase tracking-widest drop-shadow-lg">
                Champion!
              </h2>
              <p className="text-yellow-100/80 text-lg font-medium">
                🎇 🎆 Congratulations, you won the tournament! 🎆 🎇
              </p>
            </div>

            <button
              onClick={() => navigate("/tournament")} // Drops them back to the bracket to see the final results!
              className="mt-6 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-12 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-300"
            >
              Back to Bracket
            </button>
          </div>
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
          Rapid 15|0 • Ranked
        </div>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 gap-4 lg:gap-12">
        <div className="flex flex-col gap-4 sm:gap-6 max-w-[600px] w-full px-2 sm:px-0">
          {/* Opponent Panel */}
          <div
            className={`flex justify-between items-end transition-opacity duration-300 ${!isPlayerTurn ? "opacity-100" : "opacity-60"}`}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={opponent.avatar}
                alt="Opponent"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-neutral-800 object-cover shadow-lg"
              />
              <div>
                <h3 className="font-semibold text-base sm:text-lg text-white">
                  {opponent.username}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    ({opponent.elo_rating})
                  </span>
                </h3>
                {/* THE NEW "WAITING" BADGE */}
                {moveHistory.length === 0 && !isPlayerTurn && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span className="text-xs text-yellow-500 font-medium tracking-wide">
                      Waiting for opponent...
                    </span>
                  </div>
                )}
                {/* END OF BADGE */}
              </div>
            </div>
            <div
              className={`px-6 py-2 rounded-lg font-mono text-2xl font-bold border transition-all duration-300 ${!isPlayerTurn ? "bg-neutral-100 border-neutral-100 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "bg-[#050505] border-neutral-900 text-neutral-500"}`}
            >
              {formatTime(opponentTime)}
            </div>
          </div>

          {/* Board */}
          <div className="w-full aspect-square max-w-[600px] mx-auto rounded-sm relative z-50 border-4 sm:border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800 pointer-events-auto">
            <ChessBoard
              key={boardKey}
              fen={currentFen}
              onMove={handlePlayerMove}
              onGameEnd={setGameOver}
              playerColor={playerColor}
            />
          </div>

          {/* Player Panel */}
          <div
            className={`flex justify-between items-start transition-opacity duration-300 ${isPlayerTurn ? "opacity-100" : "opacity-60"}`}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={
                  resolveMediaUrl(user?.profile?.avatar) ||
                  user?.profile?.oauth_avatar_url ||
                  avatar_1
                }
                alt="Player"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-blue-500 object-cover shadow-[0_0_10px_rgba(37,99,235,0.3)]"
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

          {/* Mobile Buttons Bar */}
          <div className="flex lg:hidden gap-3 w-full mt-2">
            {(!isTournamentGame || gameOver) && (
              <button
                onClick={
                  gameOver ? () => window.location.reload() : handleDrawOffer
                }
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-medium py-3 rounded-lg transition-colors text-sm"
              >
                {gameOver ? "New Game" : "Offer Draw"}
              </button>
            )}
            <button
              onClick={() => setIsResignModalOpen(true)}
              disabled={!!gameOver}
              className="flex-1 bg-red-950/30 border border-red-900/30 hover:bg-red-900/40 text-red-500 font-medium py-3 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resign
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <GameSidebar
            mode="multiplayer"
            isGameOver={!!gameOver}
            isWaitingForRematch={isWaitingForRematch}
            moveHistory={moveHistory}
            onLeftAction={
              gameOver ? () => window.location.reload() : handleDrawOffer
            }
            onResign={() => setIsResignModalOpen(true)}
            onDraw={isTournamentGame ? undefined : handleDrawOffer}
          />
        </div>
      </main>
    </div>
  );
}
