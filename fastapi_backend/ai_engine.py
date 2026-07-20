import chess

PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 300,
    chess.BISHOP: 300,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 10000
}

# The best squares to control in the opening
CENTER_SQUARES = [chess.D4, chess.E4, chess.D5, chess.E5]
INNER_RING = [
    chess.C3, chess.D3, chess.E3, chess.F3,
    chess.C4, chess.F4, chess.C5, chess.F5,
    chess.C6, chess.D6, chess.E6, chess.F6
]

def evaluate_board(board: chess.Board) -> int:
    """Calculates who is winning. Positive - white, negative - black"""
    if board.is_checkmate():
        return -999999 if board.turn == chess.WHITE else 999999
    # if the game is over and it ISN'T checkmate, it's a draw
    if board.is_game_over():
        return 0
    score = 0
    for square, piece in board.piece_map().items():
        val = PIECE_VALUES[piece.piece_type]

        # Bonuses for playing more in the center
        if square in CENTER_SQUARES:
            val += 20
        elif square in INNER_RING:
            val += 10
        
        # Assure no knight on th edge
        if piece.piece_type == chess.KNIGHT:
            if chess.square_file(square) in (0, 7):
                val -= 15

        if piece.color == chess.WHITE:
            score += val 
        else: 
            score -= val
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
