//import { initialize_board, is_valid_move, get_black_move } from './chessrules.js';

const chessboard = document.getElementById("chessboard");
const gameStatus = document.getElementById("game-status");
const whitePlayerSelect = document.getElementById("white-player");
const blackPlayerSelect = document.getElementById("black-player");
const newGameBtn = document.getElementById("new-game-btn");

var board = initialize_board();
var gameOver = false;
var isWhiteTurn = true;
var whitePlayerType = "user";
var blackPlayerType = "random";

var selected_piece = {
  piece: "",
  row: 0,
  col: 0,
};

function initializeGame() {
  board = initialize_board();
  gameOver = false;
  isWhiteTurn = true;
  selected_piece = { piece: "", row: 0, col: 0 };
  whitePlayerType = whitePlayerSelect.value;
  blackPlayerType = blackPlayerSelect.value;

  updateGameStatus("White to move");
  updateHTMLBoard();
  unhighlightAll();

  if (isAIPlayer(whitePlayerType)) {
    setTimeout(() => makeAIMove("white"), 500);
  }
}

newGameBtn.addEventListener("click", initializeGame);

for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement("div");
    square.className = (row + col) % 2 === 0 ? "square white" : "square black";
    square.dataset.row = row;
    square.dataset.col = col;
    square.textContent = getPiece(board, row, col);
    square.addEventListener("click", handleSquareClick);
    chessboard.appendChild(square);
  }
}

updateGameStatus("White to move");

function handleSquareClick(event) {
  if (gameOver) return;

  const currentPlayerType = isWhiteTurn ? whitePlayerType : blackPlayerType;
  if (isAIPlayer(currentPlayerType)) return;

  const clickedSquare = event.target;
  const row = parseInt(clickedSquare.dataset.row, 10);
  const col = parseInt(clickedSquare.dataset.col, 10);

  if (selected_piece.piece === "") {
    selected_piece = selectPiece(board, row, col);
    if (selected_piece.piece !== "") {
      const pieceColor = isWhitePiece(selected_piece.piece) ? "white" : "black";
      const currentColor = isWhiteTurn ? "white" : "black";

      if (pieceColor === currentColor) {
        highlightPieceAndMoves(selected_piece, board, chessboard);
      } else {
        selected_piece.piece = "";
      }
    }
  } else {
    if (isValidMove(board, selected_piece, row, col)) {
      makeMove(selected_piece, row, col);
    }
    unhighlightAll();
    selected_piece.piece = "";
  }
}

function selectPiece(board, r, c) {
  return {
    piece: getPiece(board, r, c),
    row: r,
    col: c,
  };
}

function makeMove(piece, row, col) {
  board = performMove(board, piece, row, col);
  updateHTMLBoard();

  // Check for game end conditions
  if (checkGameEnd()) {
    return;
  }

  // Switch turns
  isWhiteTurn = !isWhiteTurn;

  // Update status and potentially make AI move
  const nextPlayerType = isWhiteTurn ? whitePlayerType : blackPlayerType;
  const nextColor = isWhiteTurn ? "white" : "black";
  const nextColorCap = nextColor.charAt(0).toUpperCase() + nextColor.slice(1);

  if (isInCheck(board, nextColor)) {
    updateGameStatus(`${nextColorCap} is in check`);
  } else {
    updateGameStatus(`${nextColorCap} to move`);
  }

  if (isAIPlayer(nextPlayerType)) {
    setTimeout(() => makeAIMove(nextColor), 500);
  }
}

function makeAIMove(color) {
  if (gameOver) return;

  const moves = getValidMoves(board, color);
  if (moves.length === 0) {
    checkGameEnd();
    return;
  }

  const move = getRandomMove(board, color);
  if (move) {
    board = performMove(board, move.piece, move.row, move.col);
    updateHTMLBoard();

    if (checkGameEnd()) {
      return;
    }

    isWhiteTurn = !isWhiteTurn;

    const nextPlayerType = isWhiteTurn ? whitePlayerType : blackPlayerType;
    const nextColor = isWhiteTurn ? "white" : "black";
    const nextColorCap = nextColor.charAt(0).toUpperCase() + nextColor.slice(1);

    if (isInCheck(board, nextColor)) {
      updateGameStatus(`${nextColorCap} is in check`);
    } else {
      updateGameStatus(`${nextColorCap} to move`);
    }

    if (isAIPlayer(nextPlayerType)) {
      setTimeout(() => makeAIMove(nextColor), 500);
    }
  }
}

function getRandomMove(board, color) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

function checkGameEnd() {
  const currentColor = isWhiteTurn ? "white" : "black";
  const opponentColor = isWhiteTurn ? "black" : "white";
  const opponentColorCap =
    opponentColor.charAt(0).toUpperCase() + opponentColor.slice(1);

  const currentMoves = getValidMoves(board, currentColor);

  if (currentMoves.length === 0) {
    if (isInCheck(board, currentColor)) {
      updateGameStatus(`Checkmate! ${opponentColorCap} wins!`);
      gameStatus.className = opponentColor === "white" ? "victory" : "defeat";
    } else {
      updateGameStatus("Stalemate!");
      gameStatus.className = "";
    }
    gameOver = true;
    return true;
  }

  return false;
}

function isInCheck(board, color) {
  return color === "white" ? white_in_check(board) : black_in_check(board);
}

function highlightPieceAndMoves(piece, board, htmlBoard) {
  highlightSquare(piece.row, piece.col, htmlBoard, false);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, piece, row, col)) {
        const isCapture = isCaptureMove(board, piece, row, col);
        highlightSquare(row, col, htmlBoard, isCapture);
      }
    }
  }
}

function highlightSquare(row, col, htmlBoard, isCapture = false) {
  const square = getHTMLSquare(htmlBoard, row, col);
  if (square.className === "square white") {
    square.className = isCapture
      ? "square white_capture"
      : "square white_highlight";
  } else if (square.className === "square black") {
    square.className = isCapture
      ? "square black_capture"
      : "square black_highlight";
  }
}

function unhighlightSquare(row, col, htmlBoard) {
  const square = getHTMLSquare(htmlBoard, row, col);
  if (
    square.className === "square white_highlight" ||
    square.className === "square white_capture" ||
    square.className === "square white_move"
  ) {
    square.className = "square white";
  } else if (
    square.className === "square black_highlight" ||
    square.className === "square black_capture" ||
    square.className === "square black_move"
  ) {
    square.className = "square black";
  }
}

function unhighlightAll() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      unhighlightSquare(row, col, chessboard);
    }
  }
}

function performMove(board, piece, row, col) {
  const newBoard = [...board];
  newBoard[piece.row * 8 + piece.col] = "";
  newBoard[row * 8 + col] = piece.piece;
  return newBoard;
}

function updateHTMLBoard() {
  for (let square = 0; square < 64; square++) {
    chessboard.children[square].textContent = board[square];
  }
}

function getPiece(board, row, col) {
  return board[row * 8 + col];
}

function getHTMLSquare(htmlBoard, row, col) {
  return htmlBoard.children[row * 8 + col];
}

function updateGameStatus(message) {
  gameStatus.textContent = message;
  gameStatus.className = "";
}

function isValidMove(board, piece, row, col) {
  return is_valid_move(board, piece, row, col);
}

function isCaptureMove(board, piece, row, col) {
  return is_capture_move(board, piece, row, col);
}

function getValidMoves(board, color) {
  return get_valid_moves(board, color);
}

function isWhitePiece(piece) {
  return is_white_piece(piece);
}

function isBlackPiece(piece) {
  return is_black_piece(piece);
}

function isUserPlayer(playerType) {
  return playerType === "user";
}

function isAIPlayer(playerType) {
  return playerType !== "user";
}
