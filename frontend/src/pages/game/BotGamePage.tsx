import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowLeft, Bot } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";
import {
  type Difficulty,
  type GameOutcome,
  DIFFICULTY_CONFIG,
} from "../../utils/constants";
import { PreGameMenu } from "../../features/gameplay/components/PreGameMenu";
import { GameOverModal } from "../../features/gameplay/components/GameOverModal";
import { ParticipantBanner } from "../../features/gameplay/components/ParticipantBanner";
import {
  GameSidebar,
  type MoveRecord,
} from "../../features/gameplay/components/GameSidebar";
import clsx from "clsx";
import playerAvatar from "../../assets/a_logo.png";
import { useUser } from "../../hooks/useUser";

// Hardcoded for now based
const MOCK_PLAYER_ID = 5;
const MOCK_BOT_ID = 26;

export function BotGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const { user } = useUser();

  // game state
  const [currentFen, setCurrentFen] = useState<string>("start"); // board state for API
  const [botThinking, setBotThinking] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [gameOver, setGameOver] = useState<GameOutcome | null>(null);

  // WebSocket connection
  const ws = useRef<WebSocket | null>(null);

  // 1. Establishing WS connection when game starts
  useEffect(() => {
    if (!gameStarted) return;

    // TODO: replace with actual beckend WebSocket URL
    ws.current = new WebSocket("ws://localhost:8000/ws/bot-match");

    ws.current.onopen = () => {
      console.log("Connected to Chess Backend!");
    };

    // 2. Listening to the backend's JSON stream
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Recieved from server: ", data);

      switch (data.type) {
        case "board_state":
          setCurrentFen(data.fen);
          break;
        case "move":
          setCurrentFen(data.fen);

          // update history
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
          if (data.winner_id === MOCK_PLAYER_ID) {
            setGameOver("win");
          } else if (data.winner_id === MOCK_BOT_ID) {
            setGameOver("loss");
          } else {
            setGameOver("draw");
          }
          break;
      }
    };

    // Cleanup connection when component unmounts or game restarts
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [gameStarted]);

  // 3. Sending the Move Payload to FastAPI
  const handlePlayerMove = (move: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const payload = {
        type: "move",
        move: move, // e.g., "e2e4"
        player_id: MOCK_PLAYER_ID,
        opponent_id: MOCK_BOT_ID,
        is_vs_bot: true,
      };

      ws.current.send(JSON.stringify(payload));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  const handleResign = () => {
    setGameOver("loss");
    // MAYBE send a socket message here if the backend expects it!
  };

  const handleRestart = () => {
    setBotThinking(false);
    setMoveHistory([]);
    setCurrentFen("start");
    setGameOver(null);
    // Toggling this off and on will disconnect and reconnect the WebSocket cleanly
    setGameStarted(false);
    setTimeout(() => setGameStarted(true), 100);
  };

  const cfg = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="min-h-screen bg-black flex flex-col text-neutral-200">
      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> *Back to Home
        </Link>
        <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          {`${user?.username} vs Bot • Untimed`}
        </div>
        <div className="w-24" />
      </header>

      {!gameStarted && (
        <PreGameMenu
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onStartGame={() => setGameStarted(true)}
        />
      )}

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
            <ParticipantBanner
              avatar={<Bot className={clsx("w-6 h-6")} />}
              name="chess42 Bot"
              eloRating={`${cfg.label} (${cfg.elo})`}
              eloRatingColor={cfg.color}
              isThinking={botThinking}
              graveyard={<span>♟</span>}
            />

            <div className="w-[600px] h-[600px] rounded-sm overflow-hidden border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800">
              <ChessBoard
                fen={currentFen}
                onMove={handlePlayerMove}
                onGameEnd={setGameOver}
              />
            </div>

            <ParticipantBanner
              avatar={
                <img
                  src={playerAvatar}
                  alt="Player avatar"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
              }
              name={user?.username}
              nameColor="text-blue-500"
              eloRating={user?.profile?.elo_rating}
              graveyard={<span>♙</span>}
            />
          </div>

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
