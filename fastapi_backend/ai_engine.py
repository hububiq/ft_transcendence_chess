import chess

PIECE_VALUES = {
    chess.PAWN: 10,
    chess.KNIGHT: 30,
    chess.BISHOP: 30,
    chess.ROOK: 50,
    chess.QUEEN: 90,
    chess.KING: 9000
}

def evaluate_board(board: chess.Board) -> int:
    """Calculates who is winning. Positive - white, negative - black"""
    if board.is_checkmate():
        return -9999 if board.turn == chess.WHITE else 9999
    # if the game is over and it ISN'T checkmate, it's a draw
    if board.is_game_over():
        return 0
    score = 0
    for piece_type in PIECE_VALUES:
        score += len(board.pieces(piece_type, chess.WHITE)) * PIECE_VALUES[piece_type]
        score -= len(board.pieces(piece_type, chess.BLACK)) * PIECE_VALUES[piece_type]
    return score

def minimax(board: chess.Board, depth: int, alpha: float, beta: float, maximizing: bool) -> int:
    """The recursive tree search algorithm with Alpha-Beta pruning"""
    if depth == 0 or board.is_game_over():
        return evaluate_board(board)
    
    if maximizing: # white's pawn turn
        max_eval = -99999
        for move in board.legal_moves:
            board.push(move)
            eval = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha: # Pruning, one of the rules from pseudocode
                break
        return max_eval
    else: # black turns
        min_eval = 99999
        for move in board.legal_moves:
            board.push(move)
            eval = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break 
        return min_eval 


def compute_best_move(fen_string: str, depth: int = 3) -> str:
    """The entrypoint for FastAPI. Return the best move in: type: xx, move: e7e5 format (json)"""
    board = chess.Board(fen_string)
    best_move = None
    maximizing = board.turn == chess.WHITE 

    if maximizing:
        best_val = -99999
        for move in board.legal_moves:
            board.push(move)
            move_val = minimax(board, depth - 1, -99999, 99999, False)
            board.pop()
            if move_val > best_val:
                best_val = move_val
                best_move = move
    else:
        best_val = 99999
        for move in board.legal_moves:
            board.push(move)
            move_val = minimax(board, depth - 1, -99999, 99999, True)
            board.pop()
            if move_val < best_val:
                best_val = move_val
                best_move = move

    return best_move.uci() if best_move else None
