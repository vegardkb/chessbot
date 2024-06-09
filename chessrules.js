

const piece_unicode = {
    WhiteKing: '♔',
    WhiteQueen: '♕',
    WhiteRook: '♖',
    WhiteBishop: '♗',
    WhiteKnight: '♘',
    WhitePawn: '♙',
    BlackKing: '♚',
    BlackQueen: '♛',
    BlackRook: '♜',
    BlackBishop: '♝',
    BlackKnight: '♞',
    BlackPawn: '♟︎',
    Empty: '',
};

function initialize_board() {
    var board = new Array(64);
    for (let square = 0; square < 64; square++){
        const row = Math.floor(square / 8);
        const col = square % 8;
        if (row == 0) {
            if (col == 0 || col == 7) {
                board[square] = piece_unicode.BlackRook;
            }else if (col == 1 || col == 6) {
                board[square] = piece_unicode.BlackKnight;
            }else if (col == 2 || col == 5) {
                board[square] = piece_unicode.BlackBishop;
            }else if (col == 3) {
                board[square] = piece_unicode.BlackQueen;
            }else if (col == 4) {
                board[square] = piece_unicode.BlackKing;
            }

        } else if (row == 1) {
            board[square] = piece_unicode.BlackPawn;
        } else if (row == 7) {
            if (col == 0 || col == 7) {
                board[square] = piece_unicode.WhiteRook;
            }else if (col == 1 || col == 6) {
                board[square] = piece_unicode.WhiteKnight;
            }else if (col == 2 || col == 5) {
                board[square] = piece_unicode.WhiteBishop;
            }else if (col == 3) {
                board[square] = piece_unicode.WhiteQueen;
            }else if (col == 4) {
                board[square] = piece_unicode.WhiteKing;
            }

        } else if (row == 6) {
            board[square] = piece_unicode.WhitePawn;
        } else {
            board[square] = piece_unicode.Empty;
        }

    }
    return board;
}

function perform_dummy_move(board, piece, row, col) {
    var dummy_board = new Array(64);
    for (let square = 0; square < 64; square++) {
        dummy_board[square] = board[square];
    }
    dummy_board[piece.row*8+piece.col] = '';
    dummy_board[row*8 + col] = piece.piece;
    return dummy_board;
}


function is_valid_move(board, piece, row, col) {
    const dummy_board = perform_dummy_move(board, piece, row, col);
    if (white_in_check(dummy_board)) {
        return false;
    }
    return piece_sees_square(board, piece, row, col);
}

function piece_sees_square(board, piece, row, col) {
    if ((row < 0 || row > 7) || (col < 0 || col > 7)) {
        return false;
    }
    if (piece.piece == piece_unicode.WhitePawn) {
        if (col == piece.col) {
            if ((row - piece.row == -1) && (is_empty(board, row, col))) {
                return true;
            } else if ((row - piece.row == -2) && (piece.row == 6) && (path_is_empty(board, piece.row, piece.col, row, col)) && is_empty(board, row, col)) {
                return true;
            }
        } else if ((col == piece.col + 1) || (col == piece.col - 1)) {
            if ((row - piece.row == -1) && (!is_empty(board, row, col) && !is_white(board, row, col))) {
                return true;
            }
        }
    }else if (piece.piece == piece_unicode.WhiteKnight) {
        if (!is_empty(board, row, col) && is_white(board, row, col)) {
            return false;
        }
        const dr = Math.abs(row - piece.row);
        const dc = Math.abs(col - piece.col);

        if ((dr == 1 && dc == 2) || (dr == 2 && dc == 1)) {
            return true;
        }
    } else if (piece.piece == piece_unicode.WhiteQueen) {
        if (!is_empty(board, row, col) && is_white(board, row, col)) {
            return false;
        }
        const dr = Math.abs(row - piece.row);
        const dc = Math.abs(col - piece.col);

        if (!((dr == dc) || (dr == 0) || (dc == 0))) {
            return false;
        }
        if (!path_is_empty(board, piece.row, piece.col, row, col)) {
            return false;
        }
        return true;

    } else if (piece.piece == piece_unicode.WhiteRook) {
        if (!is_empty(board, row, col) && is_white(board, row, col)) {
            return false;
        }
        const dr = Math.abs(row - piece.row);
        const dc = Math.abs(col - piece.col);

        if ((dr !== 0) && (dc !== 0)) {
            return false;
        }
        if (!path_is_empty(board, piece.row, piece.col, row, col)) {
            return false;
        }
        return true;

    } else if (piece.piece == piece_unicode.WhiteBishop) {
        if (!is_empty(board, row, col) && is_white(board, row, col)) {
            return false;
        }
        const dr = Math.abs(row - piece.row);
        const dc = Math.abs(col - piece.col);

        if ((dr !== dc)) {
            return false;
        }
        if (!path_is_empty(board, piece.row, piece.col, row, col)) {
            return false;
        }
        return true
    }  else if (piece.piece == piece_unicode.WhiteKing) {
        if (!is_empty(board, row, col) && is_white(board, row, col)) {
            return false;
        }
        const dr = Math.abs(row - piece.row);
        const dc = Math.abs(col - piece.col);

        if ((dr > 1) || (dc > 1)) {
            return false;
        }
        return true
    }
    return false;
}

function white_in_check(board) {
    const king_square = find_piece(piece_unicode.WhiteKing, board);
    const king_row = Math.floor(king_square / 8);
    const king_col = king_square % 8;

    for (let square = 0; square < 64; square++) {
        const r = Math.floor(square / 8);
        const c = square % 8;
        if (!is_white(board, r, c) && !is_empty(board, r, c)) {
            const piece = {
                piece: board[square],
                row: r,
                col: c,
            };
            if (piece_sees_square(piece, king_row, king_col)) {
                return true;
            }
        }
    }
    return false;
}

function white_in_mate(board) {
    if (!white_in_check(board)) {
        return false;
    }
    for (let square = 0; square < 64; square++) {
        const r = Math.floor(square / 8);
        const c = square % 8;
        if (is_white(board, r, c)) {
            const piece = {
                piece: board[square],
                row: r,
                col: c,
            };
            for (let tSquare = 0; tSquare < 64; tSquare++) {
                if (is_valid_move(piece, Math.floor(tSquare / 8), tSquare % 8)) {
                    return false;
                }
            }
        }
    }
    return true;
}

function is_empty(board, row, col) {
    return board[row*8+col] == '';
}

function path_is_empty(board, start_row, start_col, target_row, target_col) {

    const row_dir = target_row > start_row ? 1 : target_row < start_row ? -1 : 0;
    const col_dir = target_col > start_col ? 1 : target_col < start_col ? -1 : 0;

    console.log([start_row, start_col, target_row, target_col]);
    console.log([row_dir, col_dir]);
    for (
        let row = start_row + row_dir, col = start_col + col_dir;
        row !== target_row || col !== target_col;
        row += row_dir, col += col_dir
    ) {
        console.log([row, col]);
        if (!is_empty(board, row, col)) {
            console.log("Obstruction detected");
            return false;
        }
    }
    return true
}

function is_white(board, row, col) {
    const piece = board[row*8+col];
    if (piece == piece_unicode.WhitePawn) {
        return true;
    } else if (piece == piece_unicode.WhiteRook) {
        return true;
    } else if (piece == piece_unicode.WhiteBishop) {
        return true;
    } else if (piece == piece_unicode.WhiteKnight) {
        return true;
    } else if (piece == piece_unicode.WhiteKing) {
        return true;
    } else if (piece == piece_unicode.WhiteQueen) {
        return true;
    }
    return false;
}

function find_piece(piece_unicode, board) {
    for (let square = 0; square < 64; square ++) {
        if (board[square] === piece_unicode) {
            return square;
        }
    }
    return null; // King not found (should not happen in a legal chess position)
}

function is_square_attacked(board, target_row, target_col, attacker) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] !== ' ' && board[row][col] !== attacker) {
                const isValidMove = is_valid_move(board, board[row][col], row, col, targetRow, targetCol);
                if (isValidMove) {
                    return true;
                }
            }
        }
    }

    return false;
}