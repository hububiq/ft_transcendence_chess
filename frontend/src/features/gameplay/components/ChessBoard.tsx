import React, { useEffect, useRef, useState } from "react";
import { type Square, Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { type GameOutcome } from "../../../utils/constants";

interface ChessBoardProps {
  fen: string;
  playerColor: "w" | "b";
  onMove: (move: string) => void;
  onGameEnd: (outcome: GameOutcome) => void;
}

export function ChessBoard({
  fen,
  playerColor,
  onMove,
  onGameEnd,
}: ChessBoardProps) {
  const chessGameRef = useRef(new Chess());

  const [chessPosition, setChessPosition] = useState<string>(fen);
  const [prevFen, setPrevFen] = useState<string>(fen);
  const [moveFrom, setMoveFrom] = useState<string>("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  const [checkSquare, setCheckSquare] = useState<string>("");

  if (fen !== prevFen) {
    setPrevFen(fen);
    setChessPosition(fen);
    setMoveFrom("");
    setOptionSquares({});
  }

  function updateCheckState() {
    const chessGame = chessGameRef.current;
    // Fallbacks to support different versions of chess.js
    const isCheck =
      typeof chessGame.isCheck === "function"
        ? chessGame.isCheck()
        : (chessGame as any).in_check?.();

    if (isCheck) {
      const turn = chessGame.turn();
      const board = chessGame.board();
      // Find the king's square of the player currently in turn
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const piece = board[r][c];
          if (piece && piece.type === "k" && piece.color === turn) {
            setCheckSquare(piece.square);
            return;
          }
        }
      }
    }
    setCheckSquare("");
  }

  useEffect(() => {
    const chessGame = chessGameRef.current;
    if (fen === "start") {
      chessGame.reset();
    } else if (fen !== chessGame.fen()) {
      try {
        chessGame.load(fen);
      } catch {
        console.error("Backend sent an invalid FEN:", fen);
      }
    }
    updateCheckState();
  }, [fen]);

  useEffect(() => {
    updateCheckState();
  }, [chessPosition]);

  function getMoveOptions(square: Square) {
    const chessGame = chessGameRef.current;
    const moves = chessGame.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to as Square) &&
          chessGame.get(move.to as Square)?.color !==
            chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.15) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.15) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }

    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string, piece?: string) {
    const chessGame = chessGameRef.current;

    if (chessGame.turn() !== playerColor) return;

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
    const chessGame = chessGameRef.current;
    if (!targetSquare) return false;
    if (chessGame.turn() !== playerColor) return false;

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

  function onPieceDragBegin(_piece: string, sourceSquare: string) {
    const chessGame = chessGameRef.current;
    if (chessGame.turn() !== playerColor) return;
    getMoveOptions(sourceSquare as Square);
  }

  function checkLocalGameOver() {
    const chessGame = chessGameRef.current;
    const isMate =
      typeof chessGame.isCheckmate === "function"
        ? chessGame.isCheckmate()
        : (chessGame as any).in_checkmate?.();
    const isDraw =
      typeof chessGame.isDraw === "function"
        ? chessGame.isDraw()
        : (chessGame as any).in_draw?.();
    const isStalemate =
      typeof chessGame.isStalemate === "function"
        ? chessGame.isStalemate()
        : (chessGame as any).in_stalemate?.();

    if (isMate) {
      onGameEnd("win");
    } else if (isDraw || isStalemate) {
      onGameEnd("draw");
    }
  }

  const customSquareStyles = { ...optionSquares };
  if (checkSquare) {
    customSquareStyles[checkSquare] = {
      ...customSquareStyles[checkSquare],
      background: "rgba(255, 0, 0, 0.2)",
      boxShadow: "inset 0 0 15px rgba(255, 0, 0, 0.3)",
      borderRadius: "50%",
    };
  }

  return (
    <Chessboard
      position={chessPosition}
      onPieceDrop={onPieceDrop}
      onSquareClick={onSquareClick}
      onPieceDragBegin={onPieceDragBegin}
      customSquareStyles={customSquareStyles}
      boardOrientation={playerColor === "w" ? "white" : "black"}
    />
  );
}
