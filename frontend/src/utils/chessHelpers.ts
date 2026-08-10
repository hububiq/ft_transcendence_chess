export interface MoveRecord {
  n: number;
  white: string;
  black?: string;
}

export const formatNotation = (move?: string) => {
  if (!move) return "";
  return move
    .replace(/N/g, "♞")
    .replace(/B/g, "♝")
    .replace(/R/g, "♜")
    .replace(/Q/g, "♛")
    .replace(/K/g, "♚");
};

export const parseHistory = (historyArray: string[]): MoveRecord[] => {
  if (!historyArray || !Array.isArray(historyArray)) return [];
  const pairedMoves: MoveRecord[] = [];
  
  for (let i = 0; i < historyArray.length; i += 2) {
    pairedMoves.push({
      n: Math.floor(i / 2) + 1,
      white: formatNotation(historyArray[i]),
      black: historyArray[i + 1] ? formatNotation(historyArray[i + 1]) : undefined,
    });
  }
  return pairedMoves;
};