//import { initialize_board, is_valid_move } from './chessrules.js';

const chessboard = document.getElementById("chessboard");
const gameStatus = document.getElementById("game-status");
const whitePlayerSelect = document.getElementById("white-player");
const blackPlayerSelect = document.getElementById("black-player");
const newGameBtn = document.getElementById("new-game-btn");
const pauseBtn = document.getElementById("pause-btn");
const moveList = document.getElementById("move-list");
const firstBtn = document.getElementById("first-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const lastBtn = document.getElementById("last-btn");

var board = initialize_board();
var gameOver = false;
var isWhiteTurn = true;
var whitePlayerType = "user";
var blackPlayerType = "random";
var isPaused = false;
var isViewingHistory = false;

var moveHistory = [];
var boardHistory = [board.slice()];
var currentHistoryIndex = 0;

var lastMove = null;

var selected_piece = {
  piece: "",
  row: 0,
  col: 0,
};

function initializeGame() {
  board = initialize_board();
  gameOver = false;
  isWhiteTurn = true;
  isPaused = false;
  isViewingHistory = false;
  currentHistoryIndex = 0;
  selected_piece = { piece: "", row: 0, col: 0 };
  whitePlayerType = whitePlayerSelect.value;
  blackPlayerType = blackPlayerSelect.value;
  lastMove = null;

  moveHistory = [];
  boardHistory = [board.slice()];
  updateMoveHistoryDisplay();

  updateGameStatus("White to move");
  updateHTMLBoard();
  unhighlightAll();
  updateHistoryButtons();

  pauseBtn.textContent = "Pause";
  pauseBtn.classList.remove("paused");

  if (whitePlayerType === "random" && !isPaused) {
    setTimeout(() => makeAIMove("white"), 500);
  }
}

// Event listeners
newGameBtn.addEventListener("click", initializeGame);
pauseBtn.addEventListener("click", togglePause);
firstBtn.addEventListener("click", () => navigateToMove(0));
prevBtn.addEventListener("click", () =>
  navigateToMove(currentHistoryIndex - 1),
);
nextBtn.addEventListener("click", () =>
  navigateToMove(currentHistoryIndex + 1),
);
lastBtn.addEventListener("click", () => navigateToMove(moveHistory.length));

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseBtn.textContent = "Resume";
    pauseBtn.classList.add("paused");
  } else {
    pauseBtn.textContent = "Pause";
    pauseBtn.classList.remove("paused");

    // Resume AI play if it's an AI's turn
    const currentPlayerType = isWhiteTurn ? whitePlayerType : blackPlayerType;
    if (currentPlayerType === "random" && !gameOver && !isViewingHistory) {
      const currentColor = isWhiteTurn ? "white" : "black";
      setTimeout(() => makeAIMove(currentColor), 500);
    }
  }
}

// Create the chessboard
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

// Initialize game status
updateGameStatus("White to move");

// Function to handle square clicks
function handleSquareClick(event) {
  if (gameOver || isViewingHistory) return;

  const currentPlayerType = isWhiteTurn ? whitePlayerType : blackPlayerType;
  if (currentPlayerType === "random") return; // Don't allow clicks when AI is playing

  const clickedSquare = event.target;
  const row = parseInt(clickedSquare.dataset.row, 10);
  const col = parseInt(clickedSquare.dataset.col, 10);

  if (selected_piece.piece === "") {
    // Select a piece
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
    // Try to make a move
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
  const capturedPiece = getPiece(board, row, col);

  // Record the move
  const move = {
    piece: piece.piece,
    from: { row: piece.row, col: piece.col },
    to: { row: row, col: col },
    captured: capturedPiece,
    moveNumber: Math.floor(moveHistory.length / 2) + 1,
    isWhite: isWhiteTurn,
  };

  // Make the move
  board = performMove(board, piece, row, col);

  // Update last move for highlighting
  lastMove = {
    from: { row: piece.row, col: piece.col },
    to: { row: row, col: col },
  };

  // Add to history
  moveHistory.push(move);
  boardHistory.push(board.slice());
  currentHistoryIndex = moveHistory.length;

  updateHTMLBoard();
  updateMoveHistoryDisplay();
  highlightLastMove();

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

  if (nextPlayerType === "random" && !isPaused) {
    setTimeout(() => makeAIMove(nextColor), 500);
  }
}

function makeAIMove(color) {
  if (gameOver || isPaused || isViewingHistory) return;

  const moves = getValidMoves(board, color);
  if (moves.length === 0) {
    checkGameEnd();
    return;
  }

  const move = getRandomMove(board, color);
  if (move) {
    const capturedPiece = getPiece(board, move.row, move.col);

    // Record the move
    const moveRecord = {
      piece: move.piece.piece,
      from: { row: move.piece.row, col: move.piece.col },
      to: { row: move.row, col: move.col },
      captured: capturedPiece,
      moveNumber: Math.floor(moveHistory.length / 2) + 1,
      isWhite: isWhiteTurn,
    };

    // Make the move
    board = performMove(board, move.piece, move.row, move.col);

    // Update last move for highlighting
    lastMove = {
      from: { row: move.piece.row, col: move.piece.col },
      to: { row: move.row, col: move.col },
    };

    // Add to history
    moveHistory.push(moveRecord);
    boardHistory.push(board.slice());
    currentHistoryIndex = moveHistory.length;

    updateHTMLBoard();
    updateMoveHistoryDisplay();
    highlightLastMove();
    updateHistoryButtons();

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

    if (nextPlayerType === "random" && !isPaused) {
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
  const currentColorCap =
    currentColor.charAt(0).toUpperCase() + currentColor.slice(1);
  const opponentColor = isWhiteTurn ? "black" : "white";
  const opponentColorCap =
    opponentColor.charAt(0).toUpperCase() + opponentColor.slice(1);

  const currentMoves = getValidMoves(board, currentColor);

  if (currentMoves.length === 0) {
    if (isInCheck(board, currentColor)) {
      // Checkmate
      updateGameStatus(`Checkmate! ${opponentColorCap} wins!`);
      gameStatus.className = opponentColor === "white" ? "victory" : "defeat";
    } else {
      // Stalemate
      updateGameStatus("Stalemate!");
      gameStatus.className = "";
    }
    gameOver = true;
    return true;
  }

  return false;
}

function navigateToMove(index) {
  if (index < 0 || index > moveHistory.length) return;

  isViewingHistory = index < moveHistory.length;
  currentHistoryIndex = index;

  // Set board to the state at this move
  board = boardHistory[index].slice();

  // Update turn indicator based on move index
  isWhiteTurn = index % 2 === 0;

  updateHTMLBoard();
  updateMoveHistoryDisplay();
  updateHistoryButtons();

  if (isViewingHistory) {
    updateGameStatus("Viewing history");
    gameStatus.className = "viewing-history";

    // Highlight the move being viewed
    if (index > 0) {
      const move = moveHistory[index - 1];
      lastMove = { from: move.from, to: move.to };
      highlightLastMove();
    } else {
      lastMove = null;
      unhighlightAll();
    }
  } else {
    // Back to current position
    const nextColor = isWhiteTurn ? "white" : "black";
    const nextColorCap = nextColor.charAt(0).toUpperCase() + nextColor.slice(1);

    if (gameOver) {
      // Keep the game over status
    } else if (isInCheck(board, nextColor)) {
      updateGameStatus(`${nextColorCap} is in check`);
      gameStatus.className = "";
    } else {
      updateGameStatus(`${nextColorCap} to move`);
      gameStatus.className = "";
    }

    // Highlight the last move made
    if (moveHistory.length > 0) {
      const lastMoveRecord = moveHistory[moveHistory.length - 1];
      lastMove = { from: lastMoveRecord.from, to: lastMoveRecord.to };
      highlightLastMove();
    }

    // Resume AI play if needed
    const currentPlayerType = isWhiteTurn ? whitePlayerType : blackPlayerType;
    if (currentPlayerType === "random" && !gameOver && !isPaused) {
      const currentColor = isWhiteTurn ? "white" : "black";
      setTimeout(() => makeAIMove(currentColor), 500);
    }
  }
}

function updateMoveHistoryDisplay() {
  moveList.innerHTML = "";

  for (let i = 0; i < moveHistory.length; i++) {
    const move = moveHistory[i];
    const li = document.createElement("li");
    li.className = "move-item";

    const moveNumber = move.isWhite ? `${move.moveNumber}.` : "";
    const piece = getPieceSymbol(move.piece);
    const fromSquare = getSquareName(move.from.row, move.from.col);
    const toSquare = getSquareName(move.to.row, move.to.col);
    const capture = move.captured ? "x" : "-";

    li.textContent = `${moveNumber}${piece}${fromSquare}${capture}${toSquare}`;

    if (i === currentHistoryIndex - 1 && !isViewingHistory) {
      li.classList.add("current");
    } else if (i === currentHistoryIndex - 1 && isViewingHistory) {
      li.classList.add("viewing");
    }

    li.addEventListener("click", () => navigateToMove(i + 1));
    moveList.appendChild(li);
  }

  // Scroll to the current move
  const currentMove = moveList.querySelector(".current, .viewing");
  if (currentMove) {
    currentMove.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function updateHistoryButtons() {
  firstBtn.disabled = currentHistoryIndex === 0;
  prevBtn.disabled = currentHistoryIndex === 0;
  nextBtn.disabled = currentHistoryIndex === moveHistory.length;
  lastBtn.disabled = currentHistoryIndex === moveHistory.length;
}

function getPieceSymbol(piece) {
  // Return the piece as is since we're using Unicode symbols
  return piece;
}

function getSquareName(row, col) {
  const files = "abcdefgh";
  const ranks = "87654321";
  return files[col] + ranks[row];
}

function highlightLastMove() {
  unhighlightMoves();
  if (lastMove) {
    highlightMoveSquare(lastMove.from.row, lastMove.from.col);
    highlightMoveSquare(lastMove.to.row, lastMove.to.col);
  }
}

function highlightMoveSquare(row, col) {
  const square = getHTMLSquare(chessboard, row, col);
  const baseClass = square.className.includes("white") ? "white" : "black";

  // Don't overwrite selection highlights
  if (
    !square.className.includes("highlight") &&
    !square.className.includes("capture")
  ) {
    square.className = `square ${baseClass}_move`;
  }
}

function unhighlightMoves() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = getHTMLSquare(chessboard, row, col);
      if (square.className.includes("_move")) {
        const baseClass = square.className.includes("white")
          ? "white"
          : "black";
        square.className = `square ${baseClass}`;
      }
    }
  }
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
  const baseClass = square.className.includes("white") ? "white" : "black";

  if (isCapture) {
    square.className = `square ${baseClass}_capture`;
  } else {
    square.className = `square ${baseClass}_highlight`;
  }
}

function unhighlightSquare(row, col, htmlBoard) {
  const square = getHTMLSquare(htmlBoard, row, col);
  const baseClass = square.className.includes("white") ? "white" : "black";

  if (
    square.className.includes("highlight") ||
    square.className.includes("capture")
  ) {
    square.className = `square ${baseClass}`;

    // Restore move highlighting if this was the last move
    if (
      lastMove &&
      ((lastMove.from.row === row && lastMove.from.col === col) ||
        (lastMove.to.row === row && lastMove.to.col === col))
    ) {
      square.className = `square ${baseClass}_move`;
    }
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
  if (
    !gameStatus.className.includes("victory") &&
    !gameStatus.className.includes("defeat") &&
    !gameStatus.className.includes("viewing-history")
  ) {
    gameStatus.className = "";
  }
}

// Wrapper functions for chess rules
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
