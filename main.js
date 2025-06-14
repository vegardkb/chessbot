//import { initialize_board, is_valid_move, get_black_move } from './chessrules.js';

const chessboard = document.getElementById("chessboard");
const gameStatus = document.getElementById("game-status");

var board = initialize_board();
var gameOver = false;
var isWhiteTurn = true;

var selected_piece = {
  piece: "",
  row: 0,
  col: 0,
};

// Initialize game status
updateGameStatus("White to move");

// Create the chessboard
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement("div");
    square.className = (row + col) % 2 === 0 ? "square white" : "square black";
    square.dataset.row = row;
    square.dataset.col = col;
    square.textContent = get_piece(board, row, col); // Initial setup
    square.addEventListener("click", handleSquareClick);
    chessboard.appendChild(square);
  }
}

// Function to handle square clicks
function handleSquareClick(event) {
  if (gameOver) return;

  console.log("Square clicked!");
  const clickedSquare = event.target;
  const row = parseInt(clickedSquare.dataset.row, 10);
  const col = parseInt(clickedSquare.dataset.col, 10);

  if (selected_piece.piece == "") {
    selected_piece = select_piece(board, row, col);
    if (selected_piece.piece != "" && is_white_piece(selected_piece.piece)) {
      highlight_piece_and_moves(selected_piece, board, chessboard);
    } else {
      selected_piece.piece = "";
    }
  } else {
    if (is_valid_move(board, selected_piece, row, col)) {
      board = perform_move(board, selected_piece, row, col);
      update_html_board(board, chessboard);

      if (black_in_mate(board)) {
        updateGameStatus("Checkmate! White wins!");
        gameStatus.className = "victory";
        gameOver = true;
        unhighlight_all(chessboard);
        selected_piece.piece = "";
        return;
      }

      if (black_in_check(board)) {
        updateGameStatus("Black is in check");
      } else {
        updateGameStatus("Black to move");
      }

      setTimeout(() => {
        const blackMoves = get_valid_moves(board, "black");
        if (blackMoves.length === 0) {
          if (black_in_check(board)) {
            updateGameStatus("Checkmate! White wins!");
            gameStatus.className = "victory";
          } else {
            updateGameStatus("Stalemate!");
            gameStatus.className = "";
          }
          gameOver = true;
          return;
        }

        const move = get_black_move(board, "random");
        if (move) {
          board = perform_move(board, move.piece, move.row, move.col);
          update_html_board(board, chessboard);

          const whiteMoves = get_valid_moves(board, "white");
          if (whiteMoves.length === 0) {
            if (white_in_check(board)) {
              updateGameStatus("Checkmate! Black wins!");
              gameStatus.className = "defeat";
              gameOver = true;
              return;
            } else {
              updateGameStatus("Stalemate!");
              gameStatus.className = "";
              gameOver = true;
              return;
            }
          }

          if (white_in_check(board)) {
            updateGameStatus("White is in check - Your move");
          } else {
            updateGameStatus("White to move");
          }
        }
      }, 500);
    }
    unhighlight_all(chessboard);
    selected_piece.piece = "";
  }
}

function select_piece(board, r, c) {
  var selected_piece = {
    piece: "",
    row: r,
    col: c,
  };
  selected_piece.piece = get_piece(board, r, c);
  return selected_piece;
}

function highlight_piece_and_moves(piece, board, html_board) {
  highlight_square(piece.row, piece.col, html_board, false);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (is_valid_move(board, piece, row, col)) {
        const isCapture = is_capture_move(board, piece, row, col);
        highlight_square(row, col, html_board, isCapture);
      }
    }
  }
}

function highlight_square(row, col, html_board, isCapture = false) {
  square = get_html_square(html_board, row, col);
  if (square.className == "square white") {
    square.className = isCapture
      ? "square white_capture"
      : "square white_highlight";
  } else if (square.className == "square black") {
    square.className = isCapture
      ? "square black_capture"
      : "square black_highlight";
  }
}

function unhighlight_square(row, col, html_board) {
  square = get_html_square(html_board, row, col);
  if (
    square.className == "square white_highlight" ||
    square.className == "square white_capture"
  ) {
    square.className = "square white";
  } else if (
    square.className == "square black_highlight" ||
    square.className == "square black_capture"
  ) {
    square.className = "square black";
  }
}

function unhighlight_all(html_board) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      unhighlight_square(row, col, html_board);
    }
  }
}

function perform_move(board, piece, row, col) {
  board[piece.row * 8 + piece.col] = "";
  board[row * 8 + col] = piece.piece;
  return board;
}

function update_html_board(board, html_board) {
  for (let square = 0; square < 64; square++) {
    html_board.children[square].textContent = board[square];
  }
}

function get_piece(board, row, col) {
  return board[row * 8 + col];
}

function get_html_square(html_board, row, col) {
  return html_board.children[row * 8 + col];
}

function updateGameStatus(message) {
  gameStatus.textContent = message;
  gameStatus.className = "";
}
