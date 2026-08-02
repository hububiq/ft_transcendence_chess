import { useState, useCallback, useEffect } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Flag, Handshake } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebSocket";
import avatar_1 from "../../assets/avatar_1.png";
import avatar_2 from "../../assets/avatar_2.png";

interface Move {
  number: number;
  white: string;
  black?: string;
}

export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useUser();

  // Game States
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [currentFen, setCurrentFen] = useState("start");
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [playerTime, setPlayerTime] = useState(600); //
  const [opponentTime, setOpponentTime] = useState(600);

  // Placeholder for opponent state
  const [opponent, setOpponent] = useState({
    username: "Waiting...",
    elo_rating: "?",
    avatar: avatar_1,
  });

  // WebSocket Setup
  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case "board_state": // MATCH FASTAPI PAYLOAD
        setCurrentFen(data.fen);

        console.log(`Board state: ${data}`);
        // Optional: Assuming sends these fields
        if (data.color) setPlayerColor(data.color);
        if (data.opponent) setOpponent(data.opponent);
        break;

      case "move":
        setCurrentFen(data.fen);

        setMoveHistory((prev) => {
          const lastMove = prev[prev.length - 1];
          if (!lastMove || lastMove.black) {
            return [...prev, { number: prev.length + 1, white: data.move }];
          } else {
            const updated = [...prev];
            updated[updated.length - 1].black = data.move;
            return updated;
          }
        });
        break;
      case "error":
        console.error("Server Error:", data.message);
        break;
      // case "init": // Receive initial opponent data & game state
      //   // setCurrentFen(data.fen);
      //   // setOpponent(data.opponent);
      //   break;
      default:
        console.warn("Unhandled WS message:", data);
    }
  }, []);

  const { sendMessage } = useWebSocket({
    // url: gameId ? `ws://localhost:8001/ws/game/${gameId}` : "",
    // url:
    //   gameId && user?.id
    //     ? `ws://localhost:8001/ws/game/${gameId}?user_id=${user.id}`
    //     : "",
    url: gameId && user?.id ? `${import.meta.env.VITE_WS_BASE_URL}/ws/game/${gameId}?user_id=${user.id}` : "",
    enabled: !!gameId,
    onMessage: handleServerMessage,
  });

  // Actions
  const handlePlayerMove = (move: string) => {
    sendMessage({
      type: "move",
      move: move,
      player_id: user?.id, // Required for backend validation
    });
  };

  const handleResign = () => {
    sendMessage({
      type: "surrender",
      player_id: user?.id,
    });
  };

  const handleDrawOffer = () => {
    sendMessage({ type: "offer_draw" });
  };

  const handleGameOver = (result: string) => {
    console.log("Game Over:", result);
    // backend handles official game over
    // to update local UI state here
  };

  // Helpers
  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = time % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="min-h-screen bg-black flex flex-col text-neutral-200">
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
          <div className="w-24" /> {/* Spacer */}
        </header>

        <main className="flex-1 flex items-center justify-center p-8 gap-12">
          {/* Game Area */}
          <div className="flex flex-col gap-6 max-w-[600px] w-full">
            {/* Opponent Panel */}
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-4">
                <img
                  src={opponent.avatar}
                  alt="Opponent"
                  className="w-12 h-12 rounded-lg border border-neutral-800 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg text-white">
                    {opponent.username}{" "}
                    <span className="text-sm font-normal text-neutral-500">
                      ({opponent.elo_rating})
                    </span>
                  </h3>
                  {/* <div className="flex gap-1 text-neutral-600 text-lg">
                    <span>♟</span>
                    <span>♞</span>
                  </div> */}
                </div>
              </div>
              <div className="bg-[#050505] border border-neutral-900 px-6 py-2 rounded-lg font-mono text-2xl font-bold text-neutral-300">
                {formatTime(opponentTime)}
              </div>
            </div>

            {/* Board */}
            <div className="w-[600px] h-[600px] rounded-sm overflow-hidden border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800 pointer-events-auto">
              <ChessBoard
                fen={currentFen}
                onMove={handlePlayerMove}
                onGameEnd={handleGameOver}
                playerColor={playerColor}
              />
            </div>

            {/* Player Panel */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img
                  src={user?.profile?.avatar || avatar_2}
                  alt="Player"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg text-blue-500">
                    {user?.username || "Loading..."}{" "}
                    <span className="text-sm font-normal text-neutral-500">
                      ({user?.profile?.elo_rating || "1200"})
                    </span>
                  </h3>
                  {/* <div className="flex gap-1 text-neutral-100 text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                    <span>♙</span>
                  </div> */}
                </div>
              </div>
              <div className="bg-[#050505] border border-blue-500/30 px-6 py-2 rounded-lg font-mono text-2xl font-bold text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                {formatTime(playerTime)}
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-72 bg-[#050505] border border-neutral-900 rounded-xl h-[600px] flex flex-col p-4">
            <div className="flex-1 overflow-y-auto">
              <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4">
                Move History
              </h4>
              <div className="space-y-1 text-sm font-mono">
                {moveHistory.length === 0 ? (
                  <div className="text-neutral-600 italic text-xs">
                    No moves yet...
                  </div>
                ) : (
                  moveHistory.map((m) => (
                    <div
                      key={m.number}
                      className="flex px-2 py-1.5 hover:bg-neutral-900 rounded transition-colors"
                    >
                      <span className="w-8 text-neutral-500">{m.number}.</span>
                      <span className="flex-1 text-neutral-300">{m.white}</span>
                      <span className="flex-1 text-neutral-300">
                        {m.black || ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 flex gap-2">
              <button
                onClick={handleDrawOffer}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors text-sm font-medium"
              >
                <Handshake className="w-4 h-4" /> Draw
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
      </div>
    </>
  );
}
