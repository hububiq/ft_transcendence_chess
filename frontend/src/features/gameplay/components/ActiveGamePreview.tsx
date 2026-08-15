import { Chessboard } from "react-chessboard";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/context/AuthProvider";
import { useActiveGame } from "../../../hooks/useActiveGame";


function ActiveGamePreviewContent() {
  const navigate = useNavigate();

  const {
    activeGame,
    isLoading,
    errorMessage,
  } = useActiveGame();

  if (isLoading || errorMessage || !activeGame) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 left-[17rem] z-50 w-48">
      <button
        type="button"
        onClick={() => {
          // Return to the ongoing game without starting new matchmaking
          navigate(`/game/${activeGame.game_id}`);
        }}
        className="w-full rounded-xl border border-neutral-800 bg-[#080808] p-3 text-left shadow-2xl transition-colors hover:border-blue-500/50"
      >
        <div className="mb-2">
          <p className="text-xs font-semibold text-white">
            Game in Progress
          </p>

          <p className="mt-0.5 text-[10px] text-neutral-500">
            Click to return
          </p>
        </div>

        {activeGame.fen ? (
          <div className="pointer-events-none overflow-hidden rounded-lg border border-neutral-800">
            <Chessboard
              position={activeGame.fen}
              boardOrientation={activeGame.color}
            />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg border border-neutral-800 bg-black px-4 text-center text-xs text-neutral-600">
            Preview unavailable
          </div>
        )}

        <div className="mt-2 text-center text-xs font-medium text-blue-400">
          Return to Game
        </div>
      </button>
    </aside>
  );
}


export function ActiveGamePreview() {
  const {
    user,
    isInitializing,
  } = useAuth();

  if (isInitializing || !user) {
    return null;
  }

  return <ActiveGamePreviewContent />;
}