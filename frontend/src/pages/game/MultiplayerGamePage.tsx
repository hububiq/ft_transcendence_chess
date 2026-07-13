import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Flag, Handshake } from "lucide-react";
import { ChessBoard } from "../../features/gameplay/components/ChessBoard";

// This is a skeleton
interface Player {
  id: string;
  username: string;
  elo_rating: number;
  avatar: string;
  capturedPieces: string[];
}

interface Move {
  number: number;
  white: string;
  black?: string;
}

interface GameState {
  status: "active" | "draw" | "checkmate" | "resigned";
  turn: "white" | "black";
  moves: Move[];
  playerTime: number;
  opponentTime: number;
}

export function Game() {
  const [playerTime, setPlayerTime] = useState(300); // 5 mins in seconds
  const [opponentTime, setOpponentTime] = useState(300);

  // Simple formatting for timer
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
            Back to Hub
          </Link>
          <div className="text-xs font-bold tracking-widest text-neutral-600 uppercase">
            Blitz 5|0 • Ranked
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
                  src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150&h=150"
                  alt="Opponent"
                  className="w-12 h-12 rounded-lg border border-neutral-800 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg text-white">
                    ChessKing{" "}
                    <span className="text-sm font-normal text-neutral-500">
                      (2150)
                    </span>
                  </h3>
                  <div className="flex gap-1 text-neutral-600 text-lg">
                    <span>♟</span>
                    <span>♞</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#050505] border border-neutral-900 px-6 py-2 rounded-lg font-mono text-2xl font-bold text-neutral-300">
                {formatTime(opponentTime)}
              </div>
            </div>

            {/* Board */}
            <div className="w-[600px] h-[600px] rounded-sm overflow-hidden border-8 border-[#0a0a0a] shadow-2xl bg-neutral-800">
              <ChessBoard />
            </div>

            {/* Player Panel */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
                  alt="Player"
                  className="w-12 h-12 rounded-lg border-2 border-blue-500 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg text-blue-500">
                    GrandMaster99{" "}
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

          {/* Sidebar Controls */}
          <div className="w-72 bg-[#050505] border border-neutral-900 rounded-xl h-[600px] flex flex-col p-4">
            <div className="flex-1 overflow-y-auto">
              <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4">
                Move History
              </h4>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex px-2 py-1.5 bg-neutral-900 rounded">
                  <span className="w-8 text-neutral-500">1.</span>
                  <span className="flex-1 text-neutral-300">e4</span>
                  <span className="flex-1 text-neutral-300">e5</span>
                </div>
                <div className="flex px-2 py-1.5">
                  <span className="w-8 text-neutral-500">2.</span>
                  <span className="flex-1 text-neutral-300">Nf3</span>
                  <span className="flex-1 text-neutral-300">Nc6</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-colors text-sm font-medium">
                <Handshake className="w-4 h-4" /> Draw
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-lg transition-colors text-sm font-medium">
                <Flag className="w-4 h-4" /> Resign
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
