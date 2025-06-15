//import { initialize_game, get_valid_moves, is_valid_move } from './chessrules.js';
//import { engineRegistry } from './engines.js';

// DOM elements
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
const promotionDialog = document.getElementById("promotion-dialog");
const promotionOverlay = document.getElementById("promotion-overlay");
const promotionPieces = document.getElementById("promotion-pieces");

// Game state variables
var gameState = initialize_game();
var gameOver = false;
var isPaused = false;
var isViewingHistory = false;

// Move history for UI display
var moveHistory = [];
var boardHistory = [gameState.board.slice()];
var currentHistoryIndex = 0;

// Last move tracking for highlighting
var lastMove = null;

// Current selection
var selected_piece = {
  piece: "",
  row: 0,
  col: 0,
};

// Promotion handling
var pendingPromotion = null;

// Initialize the game
function initializeGame() {
  gameState = initialize_game();
  gameOver = false;
  isPaused = false;
  isViewingHistory = false;
  currentHistoryIndex = 0;
  selected_piece = { piece: "", row: 0, col: 0 };
  lastMove = null;
  pendingPromotion = null;

  // Clear history
  moveHistory = [];
  boardHistory = [gameState.board.slice()];
  updateMoveHistoryDisplay();

  // Set engines
  const whiteEngine = whitePlayerSelect.value;
  const blackEngine = blackPlayerSelect.value;

  if (whiteEngine !== "user") {
    engineRegistry.setActiveEngine("white", whiteEngine);
  }
  if (blackEngine !== "user") {
    engineRegistry.setActiveEngine("black", blackEngine);
  }

  updateGameStatus("White to move");
  updateHTMLBoard();
  unhighlightAll();
  updateHistoryButtons();

  pauseBtn.textContent = "Pause";
  pauseBtn.classList.remove("paused");

  // If white is AI, make the first move
  if (whiteEngine !== "user" && !isPaused) {
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
    const currentColor = gameState.isWhiteTurn ? "white" : "black";
    const currentPlayerType = gameState.isWhiteTurn
      ? whitePlayerSelect.value
      : blackPlayerSelect.value;
    if (currentPlayerType !== "user" && !gameOver && !isViewingHistory) {
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
    square.textContent = getPiece(gameState.board, row, col);
    square.addEventListener("click", handleSquareClick);
    chessboard.appendChild(square);
  }
}

// Initialize game status
updateGameStatus("White to move");

// Function to handle square clicks
function handleSquareClick(event) {
  if (gameOver || isViewingHistory || pendingPromotion) return;

  const currentPlayerType = gameState.isWhiteTurn
    ? whitePlayerSelect.value
    : blackPlayerSelect.value;
  if (currentPlayerType !== "user") return; // Don't allow clicks when AI is playing

  const clickedSquare = event.target;
  const row = parseInt(clickedSquare.dataset.row, 10);
  const col = parseInt(clickedSquare.dataset.col, 10);

  if (selected_piece.piece === "") {
    // Select a piece
    selected_piece = selectPiece(gameState.board, row, col);
    if (selected_piece.piece !== "") {
      const pieceColor = is_white_piece(selected_piece.piece)
        ? "white"
        : "black";
      const currentColor = gameState.isWhiteTurn ? "white" : "black";

      if (pieceColor === currentColor) {
        highlightPieceAndMoves(selected_piece, gameState, chessboard);
      } else {
        selected_piece.piece = "";
      }
    }
  } else {
    // Try to make a move
    const validMoves = generate_piece_moves(
      gameState,
      selected_piece.row,
      selected_piece.col,
    );
    const selectedMove = validMoves.find(
      (move) =>
        move.to.row === row &&
        move.to.col === col &&
        is_legal_move(gameState, move),
    );

    if (selectedMove) {
      if (selectedMove.moveType === "promotion") {
        // Handle pawn promotion
        showPromotionDialog(selectedMove);
      } else {
        makeMove(selectedMove);
      }
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

function showPromotionDialog(move) {
  pendingPromotion = move;
  const isWhite = is_white_piece(move.piece);

  promotionPieces.innerHTML = "";

  const pieces = isWhite
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

  pieces.forEach((piece) => {
    const pieceDiv = document.createElement("div");
    pieceDiv.className = "promotion-piece";
    pieceDiv.textContent = piece;
    pieceDiv.addEventListener("click", () => {
      move.promotionPiece = piece;
      hidePromotionDialog();
      makeMove(move);
    });
    promotionPieces.appendChild(pieceDiv);
  });

  promotionOverlay.style.display = "block";
  promotionDialog.style.display = "block";
}

function hidePromotionDialog() {
  promotionOverlay.style.display = "none";
  promotionDialog.style.display = "none";
  pendingPromotion = null;
}

function makeMove(move) {
  // Apply the move to game state
  gameState = apply_move(gameState, move);

  // Update last move for highlighting
  lastMove = {
    from: { row: move.from.row, col: move.from.col },
    to: { row: move.to.row, col: move.to.col },
  };

  // Add to history for UI
  const historyMove = {
    piece: move.piece,
    from: { row: move.from.row, col: move.from.col },
    to: { row: move.to.row, col: move.to.col },
    captured: move.capturedPiece,
    moveNumber: Math.floor(moveHistory.length / 2) + 1,
    isWhite: !gameState.isWhiteTurn, // Flipped because we already applied the move
    moveType: move.moveType,
    promotionPiece: move.promotionPiece,
  };

  moveHistory.push(historyMove);
  boardHistory.push(gameState.board.slice());
  currentHistoryIndex = moveHistory.length;

  updateHTMLBoard();
  updateMoveHistoryDisplay();
  highlightLastMove();

  // Check for game end conditions
  if (checkGameEnd()) {
    return;
  }

  // Update status and potentially make AI move
  const nextColor = gameState.isWhiteTurn ? "white" : "black";
  const nextColorCap = nextColor.charAt(0).toUpperCase() + nextColor.slice(1);
  const nextPlayerType = gameState.isWhiteTurn
    ? whitePlayerSelect.value
    : blackPlayerSelect.value;

  if (is_in_check(gameState, nextColor)) {
    updateGameStatus(`${nextColorCap} is in check`);
  } else {
    updateGameStatus(`${nextColorCap} to move`);
  }

  if (nextPlayerType !== "user" && !isPaused) {
    setTimeout(() => makeAIMove(nextColor), 500);
  }
}

async function makeAIMove(color) {
  if (gameOver || isPaused || isViewingHistory) return;

  try {
    const move = await engineRegistry.getMove(gameState, color, 2000);

    if (move && !gameOver && !isPaused && !isViewingHistory) {
      // Update last move for highlighting
      lastMove = {
        from: { row: move.from.row, col: move.from.col },
        to: { row: move.to.row, col: move.to.col },
      };

      // Apply the move
      gameState = apply_move(gameState, move);

      // Add to history for UI
      const historyMove = {
        piece: move.piece,
        from: { row: move.from.row, col: move.from.col },
        to: { row: move.to.row, col: move.to.col },
        captured: move.capturedPiece,
        moveNumber: Math.floor(moveHistory.length / 2) + 1,
        isWhite: !gameState.isWhiteTurn, // Flipped because we already applied the move
        moveType: move.moveType,
        promotionPiece: move.promotionPiece,
      };

      moveHistory.push(historyMove);
      boardHistory.push(gameState.board.slice());
      currentHistoryIndex = moveHistory.length;

      updateHTMLBoard();
      updateMoveHistoryDisplay();
      highlightLastMove();
      updateHistoryButtons();

      if (checkGameEnd()) {
        return;
      }

      const nextColor = gameState.isWhiteTurn ? "white" : "black";
      const nextColorCap =
        nextColor.charAt(0).toUpperCase() + nextColor.slice(1);
      const nextPlayerType = gameState.isWhiteTurn
        ? whitePlayerSelect.value
        : blackPlayerSelect.value;

      if (is_in_check(gameState, nextColor)) {
        updateGameStatus(`${nextColorCap} is in check`);
      } else {
        updateGameStatus(`${nextColorCap} to move`);
      }

      if (nextPlayerType !== "user" && !isPaused) {
        setTimeout(() => makeAIMove(nextColor), 500);
      }
    }
  } catch (error) {
    console.error("AI move error:", error);
    updateGameStatus("AI Error - Please restart game");
  }
}

function checkGameEnd() {
  const result = get_game_result(gameState);

  if (result === "white_wins") {
    updateGameStatus("Checkmate! White wins!");
    gameStatus.className = "victory";
    gameOver = true;
    return true;
  } else if (result === "black_wins") {
    updateGameStatus("Checkmate! Black wins!");
    gameStatus.className = "defeat";
    gameOver = true;
    return true;
  } else if (result === "stalemate") {
    updateGameStatus("Stalemate!");
    gameStatus.className = "";
    gameOver = true;
    return true;
  } else if (result === "fifty_move_rule") {
    updateGameStatus("Draw by 50-move rule!");
    gameStatus.className = "";
    gameOver = true;
    return true;
  } else if (result === "threefold_repetition") {
    updateGameStatus("Draw by threefold repetition!");
    gameStatus.className = "";
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
  gameState.board = boardHistory[index].slice();
  gameState.isWhiteTurn = index % 2 === 0;

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
    const nextColor = gameState.isWhiteTurn ? "white" : "black";
    const nextColorCap = nextColor.charAt(0).toUpperCase() + nextColor.slice(1);

    if (gameOver) {
      // Keep the game over status
    } else if (is_in_check(gameState, nextColor)) {
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
    const currentPlayerType = gameState.isWhiteTurn
      ? whitePlayerSelect.value
      : blackPlayerSelect.value;
    if (currentPlayerType !== "user" && !gameOver && !isPaused) {
      const currentColor = gameState.isWhiteTurn ? "white" : "black";
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

    let moveText = "";

    if (move.moveType === "castle") {
      moveText = move.to.col === 6 ? "O-O" : "O-O-O";
    } else {
      const capture = move.captured ? "x" : "-";
      moveText = `${piece}${fromSquare}${capture}${toSquare}`;

      if (move.moveType === "promotion") {
        moveText += `=${getPieceSymbol(move.promotionPiece)}`;
      }
    }

    li.textContent = `${moveNumber}${moveText}`;

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

function highlightPieceAndMoves(piece, gameState, htmlBoard) {
  highlightSquare(piece.row, piece.col, htmlBoard, false);
  const moves = generate_piece_moves(gameState, piece.row, piece.col);

  for (const move of moves) {
    if (is_legal_move(gameState, move)) {
      const isCapture = move.capturedPiece || move.moveType === "enpassant";
      highlightSquare(move.to.row, move.to.col, htmlBoard, isCapture);
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

function updateHTMLBoard() {
  for (let square = 0; square < 64; square++) {
    chessboard.children[square].textContent = gameState.board[square];
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

// Close promotion dialog when clicking overlay
promotionOverlay.addEventListener("click", () => {
  if (pendingPromotion) {
    // Default to queen if user clicks away
    pendingPromotion.promotionPiece = is_white_piece(pendingPromotion.piece)
      ? piece_unicode.WhiteQueen
      : piece_unicode.BlackQueen;
    hidePromotionDialog();
    makeMove(pendingPromotion);
  }
});
