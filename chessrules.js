const piece_unicode = {
  WhiteKing: "♔",
  WhiteQueen: "♕",
  WhiteRook: "♖",
  WhiteBishop: "♗",
  WhiteKnight: "♘",
  WhitePawn: "♙",
  BlackKing: "♚",
  BlackQueen: "♛",
  BlackRook: "♜",
  BlackBishop: "♝",
  BlackKnight: "♞",
  BlackPawn: "♟︎",
  Empty: "",
};

function initialize_board() {
  var board = new Array(64);
  for (let square = 0; square < 64; square++) {
    const row = Math.floor(square / 8);
    const col = square % 8;
    if (row == 0) {
      if (col == 0 || col == 7) {
        board[square] = piece_unicode.BlackRook;
      } else if (col == 1 || col == 6) {
        board[square] = piece_unicode.BlackKnight;
      } else if (col == 2 || col == 5) {
        board[square] = piece_unicode.BlackBishop;
      } else if (col == 3) {
        board[square] = piece_unicode.BlackQueen;
      } else if (col == 4) {
        board[square] = piece_unicode.BlackKing;
      }
    } else if (row == 1) {
      board[square] = piece_unicode.BlackPawn;
    } else if (row == 7) {
      if (col == 0 || col == 7) {
        board[square] = piece_unicode.WhiteRook;
      } else if (col == 1 || col == 6) {
        board[square] = piece_unicode.WhiteKnight;
      } else if (col == 2 || col == 5) {
        board[square] = piece_unicode.WhiteBishop;
      } else if (col == 3) {
        board[square] = piece_unicode.WhiteQueen;
      } else if (col == 4) {
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
  dummy_board[piece.row * 8 + piece.col] = "";
  dummy_board[row * 8 + col] = piece.piece;
  return dummy_board;
}

function is_valid_move(board, piece, row, col) {
  const dummy_board = perform_dummy_move(board, piece, row, col);
  if (is_white_piece(piece.piece) && white_in_check(dummy_board)) {
    return false;
  }
  if (is_black_piece(piece.piece) && black_in_check(dummy_board)) {
    return false;
  }
  return piece_sees_square(board, piece, row, col);
}

function get_valid_moves(board, color) {
  const dummy_piece =
    color === "white"
      ? { piece: piece_unicode.WhiteKing }
      : { piece: piece_unicode.BlackKing };
  let moves = [];
  for (let square = 0; square < 64; square++) {
    const row = Math.floor(square / 8);
    const col = square % 8;
    if (is_empty(board, row, col)) {
      continue;
    }
    const piece = {
      piece: board[square],
      row: row,
      col: col,
    };

    if (!is_same_color(dummy_piece, piece)) {
      continue;
    }
    for (let target_square = 0; target_square < 64; target_square++) {
      const target_row = Math.floor(target_square / 8);
      const target_col = target_square % 8;
      if (is_valid_move(board, piece, target_row, target_col)) {
        moves.push({
          piece: piece,
          row: target_row,
          col: target_col,
        });
      }
    }
  }

  return moves;
}

function get_black_move(board, type) {
  if (type === "random") {
    moves = get_valid_moves(board, "black");
    console.log(moves);
    return moves[Math.floor(Math.random() * moves.length)];
  } else {
    return;
  }
}

function piece_sees_square(board, piece, row, col) {
  if (row < 0 || row > 7 || col < 0 || col > 7) {
    return false;
  }
  if (is_pawn(piece) && is_white_piece(piece.piece)) {
    if (col == piece.col) {
      if (row - piece.row == -1 && is_empty(board, row, col)) {
        return true;
      } else if (
        row - piece.row == -2 &&
        piece.row == 6 &&
        path_is_empty(board, piece.row, piece.col, row, col) &&
        is_empty(board, row, col)
      ) {
        return true;
      }
    } else if (col == piece.col + 1 || col == piece.col - 1) {
      if (
        row - piece.row == -1 &&
        !is_empty(board, row, col) &&
        !is_same_color(piece, { piece: board[row * 8 + col] })
      ) {
        return true;
      }
    }
  } else if (is_pawn(piece) && is_black_piece(piece.piece)) {
    if (col == piece.col) {
      if (row - piece.row == 1 && is_empty(board, row, col)) {
        return true;
      } else if (
        row - piece.row == 2 &&
        piece.row == 1 &&
        path_is_empty(board, piece.row, piece.col, row, col) &&
        is_empty(board, row, col)
      ) {
        return true;
      }
    } else if (col == piece.col + 1 || col == piece.col - 1) {
      if (
        row - piece.row == 1 &&
        !is_empty(board, row, col) &&
        !is_same_color(piece, { piece: board[row * 8 + col] })
      ) {
        return true;
      }
    }
  } else if (is_knight(piece)) {
    if (
      !is_empty(board, row, col) &&
      is_same_color(piece, { piece: board[row * 8 + col] })
    ) {
      return false;
    }
    const dr = Math.abs(row - piece.row);
    const dc = Math.abs(col - piece.col);

    if ((dr == 1 && dc == 2) || (dr == 2 && dc == 1)) {
      return true;
    }
  } else if (is_queen(piece)) {
    if (
      !is_empty(board, row, col) &&
      is_same_color(piece, { piece: board[row * 8 + col] })
    ) {
      return false;
    }
    const dr = Math.abs(row - piece.row);
    const dc = Math.abs(col - piece.col);

    if (!(dr == dc || dr == 0 || dc == 0)) {
      return false;
    }
    if (!path_is_empty(board, piece.row, piece.col, row, col)) {
      return false;
    }
    return true;
  } else if (is_rook(piece)) {
    if (
      !is_empty(board, row, col) &&
      is_same_color(piece, { piece: board[row * 8 + col] })
    ) {
      return false;
    }
    const dr = Math.abs(row - piece.row);
    const dc = Math.abs(col - piece.col);

    if (dr !== 0 && dc !== 0) {
      return false;
    }
    if (!path_is_empty(board, piece.row, piece.col, row, col)) {
      return false;
    }
    return true;
  } else if (is_bishop(piece)) {
    if (
      !is_empty(board, row, col) &&
      is_same_color(piece, { piece: board[row * 8 + col] })
    ) {
      return false;
    }
    const dr = Math.abs(row - piece.row);
    const dc = Math.abs(col - piece.col);

    if (dr !== dc) {
      return false;
    }
    if (!path_is_empty(board, piece.row, piece.col, row, col)) {
      return false;
    }
    return true;
  } else if (is_king(piece)) {
    if (
      !is_empty(board, row, col) &&
      is_same_color(piece, { piece: board[row * 8 + col] })
    ) {
      return false;
    }
    const dr = Math.abs(row - piece.row);
    const dc = Math.abs(col - piece.col);

    if (dr > 1 || dc > 1) {
      return false;
    }
    return true;
  }
  return false;
}

function is_pawn(piece) {
  if (
    piece.piece == piece_unicode.WhitePawn ||
    piece.piece == piece_unicode.BlackPawn
  ) {
    return true;
  } else {
    return false;
  }
}

function is_knight(piece) {
  if (
    piece.piece == piece_unicode.WhiteKnight ||
    piece.piece == piece_unicode.BlackKnight
  ) {
    return true;
  } else {
    return false;
  }
}

function is_bishop(piece) {
  if (
    piece.piece == piece_unicode.WhiteBishop ||
    piece.piece == piece_unicode.BlackBishop
  ) {
    return true;
  } else {
    return false;
  }
}

function is_rook(piece) {
  if (
    piece.piece == piece_unicode.WhiteRook ||
    piece.piece == piece_unicode.BlackRook
  ) {
    return true;
  } else {
    return false;
  }
}

function is_queen(piece) {
  if (
    piece.piece == piece_unicode.WhiteQueen ||
    piece.piece == piece_unicode.BlackQueen
  ) {
    return true;
  } else {
    return false;
  }
}

function is_king(piece) {
  if (
    piece.piece == piece_unicode.WhiteKing ||
    piece.piece == piece_unicode.BlackKing
  ) {
    return true;
  } else {
    return false;
  }
}

function white_in_check(board) {
  const king_square = find_piece(piece_unicode.WhiteKing, board);
  return piece_is_attacked(board, king_square);
}

function black_in_check(board) {
  const king_square = find_piece(piece_unicode.BlackKing, board);
  return piece_is_attacked(board, king_square);
}

function white_in_mate(board) {
  if (!white_in_check(board)) {
    return false;
  }
  console.log("White in check");
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
        if (is_valid_move(board, piece, Math.floor(tSquare / 8), tSquare % 8)) {
          return false;
        }
      }
    }
  }
  return true;
}

function black_in_mate(board) {
  if (!black_in_check(board)) {
    return false;
  }
  console.log("Black in check");
  for (let square = 0; square < 64; square++) {
    const r = Math.floor(square / 8);
    const c = square % 8;
    if (is_black(board, r, c)) {
      const piece = {
        piece: board[square],
        row: r,
        col: c,
      };
      for (let tSquare = 0; tSquare < 64; tSquare++) {
        if (is_valid_move(board, piece, Math.floor(tSquare / 8), tSquare % 8)) {
          return false;
        }
      }
    }
  }
  return true;
}

function piece_is_attacked(board, piece_square) {
  const piece = {
    piece: board[piece_square],
    row: Math.floor(piece_square / 8),
    col: piece_square % 8,
  };

  for (let square = 0; square < 64; square++) {
    const r = Math.floor(square / 8);
    const c = square % 8;
    if (!is_empty(board, r, c)) {
      const attacker = {
        piece: board[square],
        row: r,
        col: c,
      };
      if (is_same_color(attacker, piece)) {
        continue;
      }

      if (piece_sees_square(board, attacker, piece.row, piece.col)) {
        return true;
      }
    }
  }
  return false;
}

function is_white_piece(piece) {
  return [
    piece_unicode.WhitePawn,
    piece_unicode.WhiteRook,
    piece_unicode.WhiteBishop,
    piece_unicode.WhiteKnight,
    piece_unicode.WhiteKing,
    piece_unicode.WhiteQueen,
  ].includes(piece);
}

function is_black_piece(piece) {
  return [
    piece_unicode.BlackPawn,
    piece_unicode.BlackRook,
    piece_unicode.BlackBishop,
    piece_unicode.BlackKnight,
    piece_unicode.BlackKing,
    piece_unicode.BlackQueen,
  ].includes(piece);
}

function is_same_color(piece_a, piece_b) {
  return (
    (is_white_piece(piece_a.piece) && is_white_piece(piece_b.piece)) ||
    (is_black_piece(piece_a.piece) && is_black_piece(piece_b.piece))
  );
}

function is_empty(board, row, col) {
  return board[row * 8 + col] == "";
}

function path_is_empty(board, start_row, start_col, target_row, target_col) {
  const row_dir = target_row > start_row ? 1 : target_row < start_row ? -1 : 0;
  const col_dir = target_col > start_col ? 1 : target_col < start_col ? -1 : 0;

  for (
    let row = start_row + row_dir, col = start_col + col_dir;
    !(row === target_row && col === target_col);
    row += row_dir, col += col_dir
  ) {
    if (!is_empty(board, row, col)) {
      return false;
    }
  }
  return true;
}

function is_white(board, row, col) {
  const piece = board[row * 8 + col];
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

function is_black(board, row, col) {
  const piece = board[row * 8 + col];
  if (piece == piece_unicode.BlackPawn) {
    return true;
  } else if (piece == piece_unicode.BlackRook) {
    return true;
  } else if (piece == piece_unicode.BlackBishop) {
    return true;
  } else if (piece == piece_unicode.BlackKnight) {
    return true;
  } else if (piece == piece_unicode.BlackKing) {
    return true;
  } else if (piece == piece_unicode.BlackQueen) {
    return true;
  }
  return false;
}

function find_piece(piece_unicode, board) {
  for (let square = 0; square < 64; square++) {
    if (board[square] === piece_unicode) {
      return square;
    }
  }
  return null;
}

function is_capture_move(board, piece, row, col) {
  return (
    !is_empty(board, row, col) &&
    !is_same_color(piece, { piece: board[row * 8 + col] })
  );
}
