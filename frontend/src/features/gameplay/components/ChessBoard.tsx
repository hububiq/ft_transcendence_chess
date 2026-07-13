import React, { useEffect, useRef, useState } from "react";
import { type Square, Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { type GameOutcome } from "../../../utils/constants";

interface ChessBoardProps {
  fen: string;
  onMove: (move: string) => void;
  onGameEnd: (outcome: GameOutcome) => void;
}

export function ChessBoard({ fen, onMove, onGameEnd }: ChessBoardProps) {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState<string>(fen);
  const [moveFrom, setMoveFrom] = useState<string>("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  useEffect(() => {
    if (fen === "start") {
      chessGame.reset();
      setChessPosition(chessGame.fen());
    } else if (fen !== chessGame.fen()) {
      try {
        chessGame.load(fen);
        setChessPosition(chessGame.fen());
      } catch {
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

  function onSquareClick(square: string, piece?: string) {
    if (chessGame.turn() === "b") return;

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
      console.log("Did found the move");
      return;
    }

    try {
      const move = chessGame.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});

      const uciMove = `${move.from}${move.to}${move.promotion ? move.promotion : ""}`;
      console.log("Sending:", uciMove);
      onMove(uciMove);
      checkLocalGameOver();
    } catch {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) setMoveFrom(square);
    }
  }

  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    if (!targetSquare) return false;
    if (chessGame.turn() === "b") return false;

    try {
      const move = chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setChessPosition(chessGame.fen());
      setMoveFrom("");
      setOptionSquares({});

      const uciMove = `${move.from}${move.to}${move.promotion ? move.promotion : ""}`;
      onMove(uciMove);
      checkLocalGameOver();

      return true;
    } catch {
      return false;
    }
  }

  function checkLocalGameOver() {
    if (chessGame.isCheckmate()) {
      onGameEnd("win");
    } else if (chessGame.isDraw() || chessGame.isStalemate()) {
      onGameEnd("draw");
    }
  }

  return (
    <Chessboard
      position={chessPosition}
      onPieceDrop={onPieceDrop}
      onSquareClick={onSquareClick}
      customSquareStyles={optionSquares}
    />
  );
}
