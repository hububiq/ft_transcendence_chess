from ai_engine import compute_best_move

def test_ai_finds_checkmate():
    """This FEN string requires just one move for White to checkmate by moving Queen to f7"""
    mate_in_one_fen = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1"
    
    best_move = compute_best_move(mate_in_one_fen, depth=2)
    
    assert best_move == "f3f7"