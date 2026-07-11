import React, { useEffect, useRef, useState } from "react";
import { type Square, Chess } from "chess.js";
import {
  Chessboard,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs,
} from "react-chessboard";
import { type GameOutcome } from "../../../utils/constants";

interface ChessBoardProps {
  fen: string;
  onMove: (move: string) => void;
  onGameEnd: (outcome: GameOutcome) => void;
}

export function ChessBoard({ fen, onMove, onGameEnd }: ChessBoardProps) {
  // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState<string>(fen);
  const [moveFrom, setMoveFrom] = useState<string>("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  // sync internal chess.js whenever the backend sends a new FEN via props
  useEffect(() => {
    if (fen === "start") {
      chessGame.reset();
      setChessPosition(chessGame.fen());
    } else if (fen !== chessGame.fen()) {
      try {
        chessGame.load(fen);
        setChessPosition(chessGame.fen());
      } catch (e) {
        console.error("Backend sent an invalid FEN:", fen);
      }
    }
  }, [fen, chessGame]);

  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }

    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  }

  // Handle tap/click to move
  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square);
      setMoveFrom(hasMoveOptions ? square : "");
      return;
    }

    try {
      const move = chessGame.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      // 1. Optimistic UI update locally
      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});

      // 2. Format move for FastAPI (UCI format: e.g., "e2e4" or "e7e8q")
      const uciMove = `${move.from}${move.to}${move.promotion ? move.promotion : ""}`;
      onMove(uciMove);

      // 3. Local Game Over fallback
      checkLocalGameOver();
    } catch {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) setMoveFrom(square);
    }
  }

  // Handle drag and drop
  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare) return false;

    try {
      const move = chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      // 1. Optimistic UI update locally
      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});

      // 2. Format move for FastAPI (UCI format)
      const uciMove = `${move.from}${move.to}${move.promotion ? move.promotion : ""}`;
      onMove(uciMove);

      // 3. Local Game Over fallback
      checkLocalGameOver();

      return true;
    } catch {
      return false;
    }
  }

  // Fallback in case backend WebSocket takes too long to announce game over
  function checkLocalGameOver() {
    if (chessGame.isCheckmate()) {
      onGameEnd("win"); // If human just moved and it's checkmate, human won.
    } else if (chessGame.isDraw() || chessGame.isStalemate()) {
      onGameEnd("draw");
    }
  }

  return (
    <Chessboard
      id="click-or-drag-to-move"
      position={chessPosition}
      onPieceDrop={onPieceDrop}
      onSquareClick={onSquareClick}
      customSquareStyles={optionSquares}
    />
  );
}
