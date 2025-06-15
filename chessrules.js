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

// Enhanced game state structure
class ChessGameState {
  constructor() {
    this.board = new Array(64).fill("");
    this.isWhiteTurn = true;
    this.castlingRights = {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    };
    this.enPassantSquare = null; // {row, col} or null
    this.halfMoveClock = 0; // For 50-move rule
    this.fullMoveNumber = 1;
    this.moveHistory = [];
    this.positionHistory = new Map(); // For threefold repetition
  }

  copy() {
    const newState = new ChessGameState();
    newState.board = [...this.board];
    newState.isWhiteTurn = this.isWhiteTurn;
    newState.castlingRights = { ...this.castlingRights };
    newState.enPassantSquare = this.enPassantSquare
      ? { ...this.enPassantSquare }
      : null;
    newState.halfMoveClock = this.halfMoveClock;
    newState.fullMoveNumber = this.fullMoveNumber;
    newState.moveHistory = [...this.moveHistory];
    newState.positionHistory = new Map(this.positionHistory);
    return newState;
  }

  getPositionKey() {
    return JSON.stringify({
      board: this.board,
      isWhiteTurn: this.isWhiteTurn,
      castlingRights: this.castlingRights,
      enPassantSquare: this.enPassantSquare,
    });
  }
}

// Move structure
class ChessMove {
  constructor(
    fromRow,
    fromCol,
    toRow,
    toCol,
    piece,
    moveType = "normal",
    promotionPiece = null,
  ) {
    this.from = { row: fromRow, col: fromCol };
    this.to = { row: toRow, col: toCol };
    this.piece = piece;
    this.moveType = moveType; // 'normal', 'castle', 'enpassant', 'promotion'
    this.promotionPiece = promotionPiece;
    this.capturedPiece = null;
  }
}

// Initialize a new chess game
function initialize_game() {
  const gameState = new ChessGameState();

  // Set up initial board position
  for (let square = 0; square < 64; square++) {
    const row = Math.floor(square / 8);
    const col = square % 8;

    if (row === 0) {
      if (col === 0 || col === 7)
        gameState.board[square] = piece_unicode.BlackRook;
      else if (col === 1 || col === 6)
        gameState.board[square] = piece_unicode.BlackKnight;
      else if (col === 2 || col === 5)
        gameState.board[square] = piece_unicode.BlackBishop;
      else if (col === 3) gameState.board[square] = piece_unicode.BlackQueen;
      else if (col === 4) gameState.board[square] = piece_unicode.BlackKing;
    } else if (row === 1) {
      gameState.board[square] = piece_unicode.BlackPawn;
    } else if (row === 6) {
      gameState.board[square] = piece_unicode.WhitePawn;
    } else if (row === 7) {
      if (col === 0 || col === 7)
        gameState.board[square] = piece_unicode.WhiteRook;
      else if (col === 1 || col === 6)
        gameState.board[square] = piece_unicode.WhiteKnight;
      else if (col === 2 || col === 5)
        gameState.board[square] = piece_unicode.WhiteBishop;
      else if (col === 3) gameState.board[square] = piece_unicode.WhiteQueen;
      else if (col === 4) gameState.board[square] = piece_unicode.WhiteKing;
    }
  }

  return gameState;
}

// Legacy compatibility function
function initialize_board() {
  return initialize_game().board;
}

// Check if coordinates are within board bounds
function isOnBoard(row, col) {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

// Check if square is empty
function is_empty(board, row, col) {
  return board[row * 8 + col] === "";
}

// Get piece at position
function get_piece(board, row, col) {
  return board[row * 8 + col];
}

// Check if piece is white
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

// Check if piece is black
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

// Check if two pieces are the same color
function is_same_color(piece1, piece2) {
  return (
    (is_white_piece(piece1) && is_white_piece(piece2)) ||
    (is_black_piece(piece1) && is_black_piece(piece2))
  );
}

// Piece type checking functions
function is_pawn(piece) {
  return piece === piece_unicode.WhitePawn || piece === piece_unicode.BlackPawn;
}

function is_rook(piece) {
  return piece === piece_unicode.WhiteRook || piece === piece_unicode.BlackRook;
}

function is_knight(piece) {
  return (
    piece === piece_unicode.WhiteKnight || piece === piece_unicode.BlackKnight
  );
}

function is_bishop(piece) {
  return (
    piece === piece_unicode.WhiteBishop || piece === piece_unicode.BlackBishop
  );
}

function is_queen(piece) {
  return (
    piece === piece_unicode.WhiteQueen || piece === piece_unicode.BlackQueen
  );
}

function is_king(piece) {
  return piece === piece_unicode.WhiteKing || piece === piece_unicode.BlackKing;
}

// Find a specific piece on the board
function find_piece(piece, board) {
  for (let square = 0; square < 64; square++) {
    if (board[square] === piece) {
      return square;
    }
  }
  return null;
}

// Check if path between two squares is clear
function path_is_empty(board, startRow, startCol, endRow, endCol) {
  const rowDir = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
  const colDir = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;

  let row = startRow + rowDir;
  let col = startCol + colDir;

  while (row !== endRow || col !== endCol) {
    if (!is_empty(board, row, col)) {
      return false;
    }
    row += rowDir;
    col += colDir;
  }
  return true;
}

// Check if a square is attacked by the opponent
function is_square_attacked(gameState, row, col, byColor) {
  const board = gameState.board;

  for (let square = 0; square < 64; square++) {
    const piece = board[square];
    if (!piece) continue;

    const pieceRow = Math.floor(square / 8);
    const pieceCol = square % 8;
    const pieceColor = is_white_piece(piece) ? "white" : "black";

    if (
      pieceColor === byColor &&
      can_piece_attack_square(board, piece, pieceRow, pieceCol, row, col)
    ) {
      return true;
    }
  }
  return false;
}

// Check if a piece can attack a specific square (without considering check)
function can_piece_attack_square(board, piece, fromRow, fromCol, toRow, toCol) {
  if (!isOnBoard(toRow, toCol)) return false;

  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  if (is_pawn(piece)) {
    const isWhite = is_white_piece(piece);
    const direction = isWhite ? -1 : 1;
    return dr === direction && absDc === 1;
  }

  if (is_rook(piece)) {
    return (
      (dr === 0 || dc === 0) &&
      path_is_empty(board, fromRow, fromCol, toRow, toCol)
    );
  }

  if (is_bishop(piece)) {
    return (
      absDr === absDc &&
      absDr > 0 &&
      path_is_empty(board, fromRow, fromCol, toRow, toCol)
    );
  }

  if (is_queen(piece)) {
    return (
      (dr === 0 || dc === 0 || (absDr === absDc && absDr > 0)) &&
      path_is_empty(board, fromRow, fromCol, toRow, toCol)
    );
  }

  if (is_knight(piece)) {
    return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
  }

  if (is_king(piece)) {
    return absDr <= 1 && absDc <= 1 && (absDr > 0 || absDc > 0);
  }

  return false;
}

// Check if king is in check
function is_in_check(gameState, color) {
  const board = gameState.board;
  const kingPiece =
    color === "white" ? piece_unicode.WhiteKing : piece_unicode.BlackKing;
  const kingSquare = find_piece(kingPiece, board);

  if (kingSquare === null) return false;

  const kingRow = Math.floor(kingSquare / 8);
  const kingCol = kingSquare % 8;
  const opponentColor = color === "white" ? "black" : "white";

  return is_square_attacked(gameState, kingRow, kingCol, opponentColor);
}

// Legacy compatibility functions
function white_in_check(board) {
  const gameState = new ChessGameState();
  gameState.board = board;
  return is_in_check(gameState, "white");
}

function black_in_check(board) {
  const gameState = new ChessGameState();
  gameState.board = board;
  return is_in_check(gameState, "black");
}

// Generate all possible moves for a piece
function generate_piece_moves(gameState, row, col) {
  const board = gameState.board;
  const piece = board[row * 8 + col];
  if (!piece) return [];

  const moves = [];
  const isWhite = is_white_piece(piece);

  if (is_pawn(piece)) {
    moves.push(...generate_pawn_moves(gameState, row, col, isWhite));
  } else if (is_rook(piece)) {
    moves.push(
      ...generate_sliding_moves(gameState, row, col, [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]),
    );
  } else if (is_bishop(piece)) {
    moves.push(
      ...generate_sliding_moves(gameState, row, col, [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]),
    );
  } else if (is_queen(piece)) {
    moves.push(
      ...generate_sliding_moves(gameState, row, col, [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]),
    );
  } else if (is_knight(piece)) {
    moves.push(...generate_knight_moves(gameState, row, col));
  } else if (is_king(piece)) {
    moves.push(...generate_king_moves(gameState, row, col, isWhite));
  }

  return moves;
}

// Generate pawn moves including en passant and promotion
function generate_pawn_moves(gameState, row, col, isWhite) {
  const board = gameState.board;
  const piece = board[row * 8 + col];
  const moves = [];
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  const promotionRow = isWhite ? 0 : 7;

  // Forward moves
  const newRow = row + direction;
  if (isOnBoard(newRow, col) && is_empty(board, newRow, col)) {
    if (newRow === promotionRow) {
      // Promotion
      const promotionPieces = isWhite
        ? [
            piece_unicode.WhiteQueen,
            piece_unicode.WhiteRook,
            piece_unicode.WhiteBishop,
            piece_unicode.WhiteKnight,
          ]
        : [
            piece_unicode.BlackQueen,
            piece_unicode.BlackRook,
            piece_unicode.BlackBishop,
            piece_unicode.BlackKnight,
          ];

      for (const promoPiece of promotionPieces) {
        moves.push(
          new ChessMove(row, col, newRow, col, piece, "promotion", promoPiece),
        );
      }
    } else {
      moves.push(new ChessMove(row, col, newRow, col, piece));

      // Two squares forward from starting position
      if (
        row === startRow &&
        isOnBoard(newRow + direction, col) &&
        is_empty(board, newRow + direction, col)
      ) {
        moves.push(new ChessMove(row, col, newRow + direction, col, piece));
      }
    }
  }

  // Captures
  for (const colOffset of [-1, 1]) {
    const captureCol = col + colOffset;
    if (isOnBoard(newRow, captureCol)) {
      const targetPiece = board[newRow * 8 + captureCol];

      if (targetPiece && !is_same_color(piece, targetPiece)) {
        if (newRow === promotionRow) {
          // Promotion with capture
          const promotionPieces = isWhite
            ? [
                piece_unicode.WhiteQueen,
                piece_unicode.WhiteRook,
                piece_unicode.WhiteBishop,
                piece_unicode.WhiteKnight,
              ]
            : [
                piece_unicode.BlackQueen,
                piece_unicode.BlackRook,
                piece_unicode.BlackBishop,
                piece_unicode.BlackKnight,
              ];

          for (const promoPiece of promotionPieces) {
            const move = new ChessMove(
              row,
              col,
              newRow,
              captureCol,
              piece,
              "promotion",
              promoPiece,
            );
            move.capturedPiece = targetPiece;
            moves.push(move);
          }
        } else {
          const move = new ChessMove(row, col, newRow, captureCol, piece);
          move.capturedPiece = targetPiece;
          moves.push(move);
        }
      }

      // En passant
      if (
        gameState.enPassantSquare &&
        gameState.enPassantSquare.row === newRow &&
        gameState.enPassantSquare.col === captureCol
      ) {
        const move = new ChessMove(
          row,
          col,
          newRow,
          captureCol,
          piece,
          "enpassant",
        );
        move.capturedPiece = board[row * 8 + captureCol];
        moves.push(move);
      }
    }
  }

  return moves;
}

// Generate sliding piece moves (rook, bishop, queen)
function generate_sliding_moves(gameState, row, col, directions) {
  const board = gameState.board;
  const piece = board[row * 8 + col];
  const moves = [];

  for (const [dr, dc] of directions) {
    let newRow = row + dr;
    let newCol = col + dc;

    while (isOnBoard(newRow, newCol)) {
      const targetPiece = board[newRow * 8 + newCol];

      if (!targetPiece) {
        moves.push(new ChessMove(row, col, newRow, newCol, piece));
      } else if (!is_same_color(piece, targetPiece)) {
        const move = new ChessMove(row, col, newRow, newCol, piece);
        move.capturedPiece = targetPiece;
        moves.push(move);
        break;
      } else {
        break;
      }

      newRow += dr;
      newCol += dc;
    }
  }

  return moves;
}

// Generate knight moves
function generate_knight_moves(gameState, row, col) {
  const board = gameState.board;
  const piece = board[row * 8 + col];
  const moves = [];
  const knightMoves = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ];

  for (const [dr, dc] of knightMoves) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (isOnBoard(newRow, newCol)) {
      const targetPiece = board[newRow * 8 + newCol];

      if (!targetPiece || !is_same_color(piece, targetPiece)) {
        const move = new ChessMove(row, col, newRow, newCol, piece);
        if (targetPiece) move.capturedPiece = targetPiece;
        moves.push(move);
      }
    }
  }

  return moves;
}

// Generate king moves including castling
function generate_king_moves(gameState, row, col, isWhite) {
  const board = gameState.board;
  const piece = board[row * 8 + col];
  const moves = [];

  // Regular king moves
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const newRow = row + dr;
      const newCol = col + dc;

      if (isOnBoard(newRow, newCol)) {
        const targetPiece = board[newRow * 8 + newCol];

        if (!targetPiece || !is_same_color(piece, targetPiece)) {
          const move = new ChessMove(row, col, newRow, newCol, piece);
          if (targetPiece) move.capturedPiece = targetPiece;
          moves.push(move);
        }
      }
    }
  }

  // Castling
  // Kingside castling
  if (is_valid_castle(gameState, row, col, true, isWhite)) {
    moves.push(new ChessMove(row, col, row, col + 2, piece, "castle"));
  }

  // Queenside castling
  if (is_valid_castle(gameState, row, col, false, isWhite)) {
    moves.push(new ChessMove(row, col, row, col - 2, piece, "castle"));
  }

  return moves;
}

// Apply a move to create a new game state
function apply_move(gameState, move) {
  const newState = gameState.copy();
  const board = newState.board;

  // Reset en passant square
  newState.enPassantSquare = null;

  // Update position history for threefold repetition before making the move
  const posKey = gameState.getPositionKey();
  const count = newState.positionHistory.get(posKey) || 0;
  newState.positionHistory.set(posKey, count + 1);

  // Handle different move types
  if (move.moveType === "castle") {
    // Castle: move king and rook
    const isWhite = is_white_piece(move.piece);
    const expectedRook = isWhite
      ? piece_unicode.WhiteRook
      : piece_unicode.BlackRook;

    board[move.from.row * 8 + move.from.col] = "";
    board[move.to.row * 8 + move.to.col] = move.piece;

    // Move the rook - with validation
    if (move.to.col === 6) {
      // Kingside
      const rookCol = 7;
      const newRookCol = 5;
      const rook = board[move.from.row * 8 + rookCol];

      // Validate that we're moving the correct rook
      if (rook !== expectedRook) {
        throw new Error(
          `Invalid castling: expected ${expectedRook} at ${rookCol}, found ${rook}`,
        );
      }

      board[move.from.row * 8 + rookCol] = "";
      board[move.from.row * 8 + newRookCol] = rook;
    } else {
      // Queenside
      const rookCol = 0;
      const newRookCol = 3;
      const rook = board[move.from.row * 8 + rookCol];

      // Validate that we're moving the correct rook
      if (rook !== expectedRook) {
        throw new Error(
          `Invalid castling: expected ${expectedRook} at ${rookCol}, found ${rook}`,
        );
      }

      board[move.from.row * 8 + rookCol] = "";
      board[move.from.row * 8 + newRookCol] = rook;
    }

    // Update castling rights
    if (is_white_piece(move.piece)) {
      newState.castlingRights.whiteKingSide = false;
      newState.castlingRights.whiteQueenSide = false;
    } else {
      newState.castlingRights.blackKingSide = false;
      newState.castlingRights.blackQueenSide = false;
    }
  } else if (move.moveType === "enpassant") {
    // En passant: move pawn and remove captured pawn
    board[move.from.row * 8 + move.from.col] = "";
    board[move.to.row * 8 + move.to.col] = move.piece;
    board[move.from.row * 8 + move.to.col] = ""; // Remove captured pawn
  } else if (move.moveType === "promotion") {
    // Promotion: replace pawn with promoted piece
    board[move.from.row * 8 + move.from.col] = "";
    board[move.to.row * 8 + move.to.col] = move.promotionPiece;
  } else {
    // Normal move
    board[move.from.row * 8 + move.from.col] = "";
    board[move.to.row * 8 + move.to.col] = move.piece;

    // Check for pawn two-square move (sets en passant square)
    if (is_pawn(move.piece) && Math.abs(move.to.row - move.from.row) === 2) {
      newState.enPassantSquare = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col,
      };
    }
  }

  // Update castling rights if king or rook moved
  if (is_king(move.piece)) {
    if (is_white_piece(move.piece)) {
      newState.castlingRights.whiteKingSide = false;
      newState.castlingRights.whiteQueenSide = false;
    } else {
      newState.castlingRights.blackKingSide = false;
      newState.castlingRights.blackQueenSide = false;
    }
  } else if (is_rook(move.piece)) {
    if (move.from.row === 0) {
      // Black rooks
      if (move.from.col === 0) newState.castlingRights.blackQueenSide = false;
      if (move.from.col === 7) newState.castlingRights.blackKingSide = false;
    } else if (move.from.row === 7) {
      // White rooks
      if (move.from.col === 0) newState.castlingRights.whiteQueenSide = false;
      if (move.from.col === 7) newState.castlingRights.whiteKingSide = false;
    }
  }

  // Update castling rights if rook was captured
  if (move.capturedPiece && is_rook(move.capturedPiece)) {
    if (move.to.row === 0) {
      // Black rook captured
      if (move.to.col === 0) newState.castlingRights.blackQueenSide = false;
      if (move.to.col === 7) newState.castlingRights.blackKingSide = false;
    } else if (move.to.row === 7) {
      // White rook captured
      if (move.to.col === 0) newState.castlingRights.whiteQueenSide = false;
      if (move.to.col === 7) newState.castlingRights.whiteKingSide = false;
    }
  }

  // Update halfmove clock
  if (is_pawn(move.piece) || move.capturedPiece) {
    newState.halfMoveClock = 0;
  } else {
    newState.halfMoveClock++;
  }

  // Update fullmove number
  if (!is_white_piece(move.piece)) {
    newState.fullMoveNumber++;
  }

  // Switch turns
  newState.isWhiteTurn = !newState.isWhiteTurn;

  return newState;
}

// Generate all legal moves for a color
function get_valid_moves(gameState, color) {
  const board = gameState.board;
  const moves = [];

  for (let square = 0; square < 64; square++) {
    const piece = board[square];
    if (!piece) continue;

    const pieceColor = is_white_piece(piece) ? "white" : "black";
    if (pieceColor !== color) continue;

    const row = Math.floor(square / 8);
    const col = square % 8;
    const pieceMoves = generate_piece_moves(gameState, row, col);

    // Filter out moves that would leave king in check
    for (const move of pieceMoves) {
      if (is_legal_move(gameState, move)) {
        moves.push(move);
      }
    }
  }

  return moves;
}

// Check if a move is legal (doesn't leave king in check)
function is_legal_move(gameState, move) {
  const newState = apply_move(gameState, move);
  const color = is_white_piece(move.piece) ? "white" : "black";
  return !is_in_check(newState, color);
}

// Check for game end conditions
function get_game_result(gameState) {
  const currentColor = gameState.isWhiteTurn ? "white" : "black";
  const validMoves = get_valid_moves(gameState, currentColor);

  if (validMoves.length === 0) {
    if (is_in_check(gameState, currentColor)) {
      return gameState.isWhiteTurn ? "black_wins" : "white_wins";
    } else {
      return "stalemate";
    }
  }

  // Check for 50-move rule
  if (gameState.halfMoveClock >= 50) {
    return "fifty_move_rule";
  }

  // Check for threefold repetition
  const posKey = gameState.getPositionKey();
  if (gameState.positionHistory.get(posKey) >= 3) {
    return "threefold_repetition";
  }

  return "ongoing";
}

// Legacy compatibility functions for the existing UI
function is_valid_move(board, piece, row, col) {
  const gameState = new ChessGameState();
  gameState.board = board;

  const pieceMoves = generate_piece_moves(gameState, piece.row, piece.col);

  for (const move of pieceMoves) {
    if (move.to.row === row && move.to.col === col) {
      return is_legal_move(gameState, move);
    }
  }

  return false;
}

function get_valid_moves_legacy(board, color) {
  const gameState = new ChessGameState();
  gameState.board = board;
  gameState.isWhiteTurn = color === "white";

  const moves = get_valid_moves(gameState, color);

  // Convert to legacy format
  return moves.map((move) => ({
    piece: {
      piece: move.piece,
      row: move.from.row,
      col: move.from.col,
    },
    row: move.to.row,
    col: move.to.col,
  }));
}

function get_black_move(board, type) {
  if (type === "random") {
    const moves = get_valid_moves_legacy(board, "black");
    return moves.length > 0
      ? moves[Math.floor(Math.random() * moves.length)]
      : null;
  }
  return null;
}

function is_capture_move(board, piece, row, col) {
  return (
    !is_empty(board, row, col) &&
    !is_same_color(piece.piece, board[row * 8 + col])
  );
}

// Comprehensive castling validation
function is_valid_castle(gameState, kingRow, kingCol, isKingSide, isWhite) {
  const board = gameState.board;

  // Validate that king and rook are on correct starting positions
  const expectedKingRow = isWhite ? 7 : 0;
  const expectedKingCol = 4;
  const rookCol = isKingSide ? 7 : 0;

  // King must be on starting square
  if (kingRow !== expectedKingRow || kingCol !== expectedKingCol) {
    return false;
  }

  const expectedKing = isWhite
    ? piece_unicode.WhiteKing
    : piece_unicode.BlackKing;
  const expectedRook = isWhite
    ? piece_unicode.WhiteRook
    : piece_unicode.BlackRook;

  // Check that king is the correct piece
  const kingPiece = board[kingRow * 8 + kingCol];
  if (kingPiece !== expectedKing) {
    return false;
  }

  // Check that rook is the correct piece and in correct position
  const rookPiece = board[kingRow * 8 + rookCol];
  if (rookPiece !== expectedRook) {
    return false;
  }

  // Additional validation: ensure the piece is the same color as expected
  if (is_white_piece(rookPiece) !== isWhite) {
    return false;
  }

  // Check castling rights
  if (isWhite) {
    if (isKingSide && !gameState.castlingRights.whiteKingSide) return false;
    if (!isKingSide && !gameState.castlingRights.whiteQueenSide) return false;
  } else {
    if (isKingSide && !gameState.castlingRights.blackKingSide) return false;
    if (!isKingSide && !gameState.castlingRights.blackQueenSide) return false;
  }

  // Check that king is not in check
  const color = isWhite ? "white" : "black";
  if (is_in_check(gameState, color)) {
    return false;
  }

  // Check that squares between king and rook are empty
  const direction = isKingSide ? 1 : -1;
  const endCol = isKingSide ? rookCol - 1 : rookCol + 1;

  for (
    let col = kingCol + direction;
    col !== endCol + direction;
    col += direction
  ) {
    if (!is_empty(board, kingRow, col)) {
      return false;
    }
  }

  // Check that king doesn't pass through or land on attacked squares
  const opponentColor = isWhite ? "black" : "white";
  const kingDestCol = kingCol + (isKingSide ? 2 : -2);

  for (let col = kingCol; col !== kingDestCol + direction; col += direction) {
    if (is_square_attacked(gameState, kingRow, col, opponentColor)) {
      return false;
    }
  }

  return true;
}

// Checkmate detection
function white_in_mate(board) {
  if (!white_in_check(board)) return false;

  const gameState = new ChessGameState();
  gameState.board = board;
  const moves = get_valid_moves(gameState, "white");
  return moves.length === 0;
}

function black_in_mate(board) {
  if (!black_in_check(board)) return false;

  const gameState = new ChessGameState();
  gameState.board = board;
  const moves = get_valid_moves(gameState, "black");
  return moves.length === 0;
}

// Utility functions for backward compatibility
function is_white(board, row, col) {
  return is_white_piece(board[row * 8 + col]);
}

function is_black(board, row, col) {
  return is_black_piece(board[row * 8 + col]);
}
