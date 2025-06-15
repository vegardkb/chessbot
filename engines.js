// Chess Engines Module
// Provides a pluggable architecture for different chess AI implementations

// Base Chess Engine Interface
class ChessEngine {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  // Must be implemented by subclasses
  async getMove(gameState, color, timeLimit = 1000) {
    throw new Error("getMove method must be implemented by subclass");
  }

  // Optional: called when engine is selected
  onActivate() {}

  // Optional: called when engine is deactivated
  onDeactivate() {}

  // Optional: returns engine-specific settings
  getSettings() {
    return {};
  }
}

// Random Move Engine - selects moves randomly
class RandomEngine extends ChessEngine {
  constructor() {
    super("Random", "Selects moves completely at random");
  }

  async getMove(gameState, color, timeLimit = 1000) {
    const moves = get_valid_moves(gameState, color);

    if (moves.length === 0) {
      return null;
    }

    // Add small delay to make it feel more natural
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(300, timeLimit / 2)),
    );

    return moves[Math.floor(Math.random() * moves.length)];
  }
}

// Capture-Preferring Engine - prefers captures, otherwise random
class AggressiveEngine extends ChessEngine {
  constructor() {
    super("Aggressive", "Prefers captures and checks, otherwise random");
  }

  async getMove(gameState, color, timeLimit = 1000) {
    const moves = get_valid_moves(gameState, color);

    if (moves.length === 0) {
      return null;
    }

    // Separate moves into categories
    const captureMoves = moves.filter((move) => move.capturedPiece);
    const checkMoves = moves.filter((move) => {
      const testState = apply_move(gameState, move);
      const opponentColor = color === "white" ? "black" : "white";
      return is_in_check(testState, opponentColor);
    });

    // Add small delay
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(500, timeLimit / 2)),
    );

    // Prefer captures first
    if (captureMoves.length > 0) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }

    // Then checks
    if (checkMoves.length > 0) {
      return checkMoves[Math.floor(Math.random() * checkMoves.length)];
    }

    // Otherwise random
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

// Simple Minimax Engine with basic evaluation
class MinimaxEngine extends ChessEngine {
  constructor(depth = 2) {
    super(`Minimax (${depth})`, `Basic minimax search with depth ${depth}`);
    this.depth = depth;
    this.positionsEvaluated = 0;
  }

  async getMove(gameState, color, timeLimit = 5000) {
    this.positionsEvaluated = 0;
    const startTime = Date.now();

    // Get all possible moves
    const moves = get_valid_moves(gameState, color);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    const result = this.minimax(
      gameState,
      this.depth,
      color === "white",
      -Infinity,
      Infinity,
      startTime,
      timeLimit,
    );

    console.log(
      `Minimax (${color}) evaluated ${this.positionsEvaluated} positions in ${Date.now() - startTime}ms, best score: ${result.score}`,
    );

    // Debug: Show the best move found
    if (result.move) {
      const from =
        String.fromCharCode(97 + result.move.from.col) +
        (8 - result.move.from.row);
      const to =
        String.fromCharCode(97 + result.move.to.col) + (8 - result.move.to.row);
      console.log(
        `Best move: ${result.move.piece} ${from} -> ${to} (score: ${result.score})`,
      );
    }

    return result.move || moves[0]; // Fallback to first move if no move found
  }

  minimax(gameState, depth, isMaximizing, alpha, beta, startTime, timeLimit) {
    if (Date.now() - startTime > timeLimit * 0.9) {
      return { score: this.evaluatePosition(gameState), move: null };
    }

    const currentColor = isMaximizing ? "white" : "black";
    const moves = get_valid_moves(gameState, currentColor);

    if (depth === 0 || moves.length === 0) {
      this.positionsEvaluated++;
      const score = this.evaluatePosition(gameState);
      return { score: score, move: null };
    }

    // Move ordering: try captures first for better pruning
    moves.sort((a, b) => {
      const aCapture = a.capturedPiece ? 1 : 0;
      const bCapture = b.capturedPiece ? 1 : 0;
      return bCapture - aCapture;
    });

    let bestMove = moves[0]; // Always have a fallback move

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (const move of moves) {
        const newState = apply_move(gameState, move);
        const result = this.minimax(
          newState,
          depth - 1,
          false,
          alpha,
          beta,
          startTime,
          timeLimit,
        );

        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break; // Alpha-beta prune
      }

      return { score: maxScore, move: bestMove };
    } else {
      let minScore = Infinity;

      for (const move of moves) {
        const newState = apply_move(gameState, move);
        const result = this.minimax(
          newState,
          depth - 1,
          true,
          alpha,
          beta,
          startTime,
          timeLimit,
        );

        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }

        beta = Math.min(beta, result.score);
        if (beta <= alpha) break; // Alpha-beta prune
      }

      return { score: minScore, move: bestMove };
    }
  }

  evaluatePosition(gameState) {
    const board = gameState.board;
    let score = 0;

    const gameResult = get_game_result(gameState);
    if (gameResult === "white_wins") return 10000;
    if (gameResult === "black_wins") return -10000;
    if (
      gameResult === "stalemate" ||
      gameResult === "fifty_move_rule" ||
      gameResult === "threefold_repetition"
    )
      return 0;

    // Piece values
    const pieceValues = {
      [piece_unicode.WhitePawn]: 100,
      [piece_unicode.WhiteRook]: 500,
      [piece_unicode.WhiteKnight]: 320,
      [piece_unicode.WhiteBishop]: 330,
      [piece_unicode.WhiteQueen]: 900,
      [piece_unicode.WhiteKing]: 0,
      [piece_unicode.BlackPawn]: -100,
      [piece_unicode.BlackRook]: -500,
      [piece_unicode.BlackKnight]: -320,
      [piece_unicode.BlackBishop]: -330,
      [piece_unicode.BlackQueen]: -900,
      [piece_unicode.BlackKing]: 0,
    };

    // Material evaluation with piece safety
    for (let square = 0; square < 64; square++) {
      const piece = board[square];
      if (piece && pieceValues[piece] !== undefined) {
        let pieceValue = pieceValues[piece];

        // Add piece safety evaluation
        const row = Math.floor(square / 8);
        const col = square % 8;
        const isWhite = is_white_piece(piece);
        const opponentColor = isWhite ? "black" : "white";

        // Check if piece is attacked
        if (is_square_attacked(gameState, row, col, opponentColor)) {
          // Piece is under attack - reduce its value significantly
          pieceValue *= isWhite ? 0.5 : 0.5;
          if (is_pawn(piece)) {
            pieceValue *= 0.8; // Pawns less critical when attacked
          }
        }

        // Check if piece is defended
        const friendlyColor = isWhite ? "white" : "black";
        if (is_square_attacked(gameState, row, col, friendlyColor)) {
          // Piece is defended - small bonus
          pieceValue *= isWhite ? 1.1 : 1.1;
        }

        score += pieceValue;
      }
    }

    // Position evaluation
    score += this.evaluatePosition_positional(gameState);

    return score;
  }

  evaluatePosition_positional(gameState) {
    let score = 0;

    // Center control - more sophisticated
    const centerSquares = [27, 28, 35, 36]; // d4, e4, d5, e5
    const extendedCenter = [18, 19, 20, 21, 26, 29, 34, 37, 42, 43, 44, 45]; // c3-f3, c6-f6, etc.

    for (const square of centerSquares) {
      const piece = gameState.board[square];
      if (piece) {
        if (is_white_piece(piece)) score += 30;
        else score -= 30;
      }
    }

    for (const square of extendedCenter) {
      const piece = gameState.board[square];
      if (piece) {
        if (is_white_piece(piece)) score += 10;
        else score -= 10;
      }
    }

    // King safety - much more important
    if (is_in_check(gameState, "white")) score -= 200;
    if (is_in_check(gameState, "black")) score += 200;

    // Piece development (knights and bishops not on back rank)
    score += this.evaluateDevelopment(gameState);

    // Mobility (simplified to avoid expensive calculations in deep search)
    if (this.depth <= 2) {
      const whiteMoves = get_valid_moves(gameState, "white").length;
      const blackMoves = get_valid_moves(gameState, "black").length;
      score += (whiteMoves - blackMoves) * 2;
    }

    // Pawn structure bonus
    score += this.evaluatePawnStructure(gameState);

    return score;
  }

  evaluatePawnStructure(gameState) {
    let score = 0;
    const board = gameState.board;

    for (let col = 0; col < 8; col++) {
      let whitePawns = 0;
      let blackPawns = 0;

      for (let row = 0; row < 8; row++) {
        const piece = board[row * 8 + col];
        if (piece === piece_unicode.WhitePawn) {
          whitePawns++;
          // Bonus for advanced pawns
          score += (6 - row) * 5;
        }
        if (piece === piece_unicode.BlackPawn) {
          blackPawns++;
          // Bonus for advanced pawns
          score -= (row - 1) * 5;
        }
      }

      // Penalty for doubled pawns
      if (whitePawns > 1) score -= (whitePawns - 1) * 25;
      if (blackPawns > 1) score += (blackPawns - 1) * 25;
    }

    return score;
  }

  evaluateDevelopment(gameState) {
    let score = 0;
    const board = gameState.board;

    // Check if knights and bishops are developed
    const whiteKnightSquares = [1, 6]; // b1, g1
    const blackKnightSquares = [57, 62]; // b8, g8
    const whiteBishopSquares = [2, 5]; // c1, f1
    const blackBishopSquares = [58, 61]; // c8, f8

    // Penalty for pieces still on starting squares
    for (const square of whiteKnightSquares) {
      if (board[square] === piece_unicode.WhiteKnight) score -= 20;
    }
    for (const square of blackKnightSquares) {
      if (board[square] === piece_unicode.BlackKnight) score += 20;
    }
    for (const square of whiteBishopSquares) {
      if (board[square] === piece_unicode.WhiteBishop) score -= 20;
    }
    for (const square of blackBishopSquares) {
      if (board[square] === piece_unicode.BlackBishop) score += 20;
    }

    return score;
  }

  getSettings() {
    return {
      depth: {
        type: "number",
        min: 1,
        max: 10,
        value: this.depth,
        label: "Search Depth",
      },
    };
  }
}

// Iterative Deepening Engine with time management and move ordering
class IterativeDeepeningEngine extends ChessEngine {
  constructor(maxDepth = 6) {
    super(
      `Iterative Deepening (${maxDepth})`,
      `Iterative deepening search up to depth ${maxDepth}`,
    );
    this.maxDepth = maxDepth;
    this.positionsEvaluated = 0;
    this.transpositionTable = new Map();
    this.killerMoves = new Map(); // killer move heuristic
    this.principalVariation = [];
  }

  async getMove(gameState, color, timeLimit = 5000) {
    this.positionsEvaluated = 0;
    this.transpositionTable.clear();
    this.killerMoves.clear();
    this.principalVariation = [];

    const startTime = Date.now();
    const moves = get_valid_moves(gameState, color);

    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    let bestMove = moves[0];
    let bestScore = color === "white" ? -Infinity : Infinity;
    const isMaximizing = color === "white";

    // Iterative deepening loop
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const timeElapsed = Date.now() - startTime;
      const timeRemaining = timeLimit - timeElapsed;

      // If we're running out of time, stop searching deeper
      if (timeRemaining < timeLimit * 0.1) {
        console.log(
          `Iterative deepening stopped at depth ${depth - 1} due to time limit`,
        );
        break;
      }

      try {
        const result = this.alphaBetaWithMoveOrdering(
          gameState,
          depth,
          isMaximizing,
          -Infinity,
          Infinity,
          startTime,
          timeLimit,
          moves,
        );

        if (result.move) {
          bestMove = result.move;
          bestScore = result.score;
          this.principalVariation = result.pv || [];

          console.log(
            `Depth ${depth}: Best move ${this.moveToString(bestMove)}, Score: ${result.score}`,
          );

          // If we found a mate, no need to search deeper
          if (Math.abs(result.score) > 9000) {
            console.log(`Mate found at depth ${depth}, stopping search`);
            break;
          }
        }
      } catch (error) {
        if (error.message === "TIME_UP") {
          console.log(
            `Iterative deepening stopped at depth ${depth} due to time limit`,
          );
          break;
        }
        throw error;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `Iterative Deepening (${color}) evaluated ${this.positionsEvaluated} positions in ${totalTime}ms`,
    );
    console.log(
      `Principal Variation: ${this.principalVariation.map((m) => this.moveToString(m)).join(" ")}`,
    );

    return bestMove;
  }

  alphaBetaWithMoveOrdering(
    gameState,
    depth,
    isMaximizing,
    alpha,
    beta,
    startTime,
    timeLimit,
    rootMoves = null,
  ) {
    // Time check
    if (Date.now() - startTime > timeLimit * 0.95) {
      throw new Error("TIME_UP");
    }

    // Transposition table lookup
    const positionKey = gameState.getPositionKey() + depth + isMaximizing;
    if (this.transpositionTable.has(positionKey)) {
      const cached = this.transpositionTable.get(positionKey);
      if (cached.depth >= depth) {
        return cached;
      }
    }

    const currentColor = isMaximizing ? "white" : "black";
    let moves = rootMoves || get_valid_moves(gameState, currentColor);

    // Terminal node check
    if (depth === 0 || moves.length === 0) {
      this.positionsEvaluated++;
      const score = this.evaluatePosition(gameState);
      return { score, move: null, pv: [] };
    }

    // Move ordering
    moves = this.orderMoves(moves, gameState, depth);

    let bestMove = null;
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let principalVariation = [];

    for (const move of moves) {
      const newState = apply_move(gameState, move);

      const result = this.alphaBetaWithMoveOrdering(
        newState,
        depth - 1,
        !isMaximizing,
        alpha,
        beta,
        startTime,
        timeLimit,
      );

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
          principalVariation = [move, ...(result.pv || [])];
        }
        alpha = Math.max(alpha, result.score);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
          principalVariation = [move, ...(result.pv || [])];
        }
        beta = Math.min(beta, result.score);
      }

      // Alpha-beta pruning
      if (beta <= alpha) {
        // Store killer move
        if (!move.capturedPiece) {
          this.killerMoves.set(depth, move);
        }
        break;
      }
    }

    // Store in transposition table
    const result = {
      score: bestScore,
      move: bestMove,
      depth,
      pv: principalVariation,
    };
    this.transpositionTable.set(positionKey, result);

    return result;
  }

  orderMoves(moves, gameState, depth) {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 1. Principal variation move gets highest priority
      if (this.principalVariation.length > 0) {
        const pvMove = this.principalVariation[0];
        if (this.movesEqual(a, pvMove)) scoreA += 10000;
        if (this.movesEqual(b, pvMove)) scoreB += 10000;
      }

      // 2. Captures ordered by MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      if (a.capturedPiece) {
        scoreA +=
          this.getPieceValue(a.capturedPiece) -
          this.getPieceValue(a.piece) * 0.1;
      }
      if (b.capturedPiece) {
        scoreB +=
          this.getPieceValue(b.capturedPiece) -
          this.getPieceValue(b.piece) * 0.1;
      }

      // 3. Killer moves
      const killerMove = this.killerMoves.get(depth);
      if (killerMove) {
        if (this.movesEqual(a, killerMove)) scoreA += 900;
        if (this.movesEqual(b, killerMove)) scoreB += 900;
      }

      // 4. Special moves
      if (a.moveType === "promotion") scoreA += 800;
      if (b.moveType === "promotion") scoreB += 800;

      if (a.moveType === "castle") scoreA += 50;
      if (b.moveType === "castle") scoreB += 50;

      // 5. Center moves
      const centerBonus = (move) => {
        const centerSquares = [27, 28, 35, 36]; // d4, e4, d5, e5
        const square = move.to.row * 8 + move.to.col;
        return centerSquares.includes(square) ? 20 : 0;
      };

      scoreA += centerBonus(a);
      scoreB += centerBonus(b);

      return scoreB - scoreA;
    });
  }

  movesEqual(move1, move2) {
    return (
      move1.from.row === move2.from.row &&
      move1.from.col === move2.from.col &&
      move1.to.row === move2.to.row &&
      move1.to.col === move2.to.col &&
      move1.promotionPiece === move2.promotionPiece
    );
  }

  getPieceValue(piece) {
    const values = {
      [piece_unicode.WhitePawn]: 100,
      [piece_unicode.BlackPawn]: 100,
      [piece_unicode.WhiteRook]: 500,
      [piece_unicode.BlackRook]: 500,
      [piece_unicode.WhiteKnight]: 320,
      [piece_unicode.BlackKnight]: 320,
      [piece_unicode.WhiteBishop]: 330,
      [piece_unicode.BlackBishop]: 330,
      [piece_unicode.WhiteQueen]: 900,
      [piece_unicode.BlackQueen]: 900,
      [piece_unicode.WhiteKing]: 0,
      [piece_unicode.BlackKing]: 0,
    };
    return values[piece] || 0;
  }

  moveToString(move) {
    if (!move) return "null";
    const from = String.fromCharCode(97 + move.from.col) + (8 - move.from.row);
    const to = String.fromCharCode(97 + move.to.col) + (8 - move.to.row);
    const piece = move.piece.charAt(move.piece.length - 1); // Get piece symbol
    return `${piece}${from}-${to}`;
  }

  // Reuse the same evaluation function as MinimaxEngine
  evaluatePosition(gameState) {
    const board = gameState.board;
    let score = 0;

    // Check for game end first
    const gameResult = get_game_result(gameState);
    if (gameResult === "white_wins") return 10000;
    if (gameResult === "black_wins") return -10000;
    if (
      gameResult === "stalemate" ||
      gameResult === "fifty_move_rule" ||
      gameResult === "threefold_repetition"
    )
      return 0;

    // Piece values
    const pieceValues = {
      [piece_unicode.WhitePawn]: 100,
      [piece_unicode.WhiteRook]: 500,
      [piece_unicode.WhiteKnight]: 320,
      [piece_unicode.WhiteBishop]: 330,
      [piece_unicode.WhiteQueen]: 900,
      [piece_unicode.WhiteKing]: 0,
      [piece_unicode.BlackPawn]: -100,
      [piece_unicode.BlackRook]: -500,
      [piece_unicode.BlackKnight]: -320,
      [piece_unicode.BlackBishop]: -330,
      [piece_unicode.BlackQueen]: -900,
      [piece_unicode.BlackKing]: 0,
    };

    // Material evaluation with piece safety
    for (let square = 0; square < 64; square++) {
      const piece = board[square];
      if (piece && pieceValues[piece] !== undefined) {
        let pieceValue = pieceValues[piece];

        // Add piece safety evaluation
        const row = Math.floor(square / 8);
        const col = square % 8;
        const isWhite = is_white_piece(piece);
        const opponentColor = isWhite ? "black" : "white";

        // Check if piece is attacked
        if (is_square_attacked(gameState, row, col, opponentColor)) {
          pieceValue *= 0.5;
          if (is_pawn(piece)) {
            pieceValue *= 0.8;
          }
        }

        // Check if piece is defended
        const friendlyColor = isWhite ? "white" : "black";
        if (is_square_attacked(gameState, row, col, friendlyColor)) {
          pieceValue *= 1.1;
        }

        score += pieceValue;
      }
    }

    // Position evaluation
    score += this.evaluatePosition_positional(gameState);

    return score;
  }

  evaluatePosition_positional(gameState) {
    let score = 0;

    // Center control
    const centerSquares = [27, 28, 35, 36];
    const extendedCenter = [18, 19, 20, 21, 26, 29, 34, 37, 42, 43, 44, 45];

    for (const square of centerSquares) {
      const piece = gameState.board[square];
      if (piece) {
        if (is_white_piece(piece)) score += 30;
        else score -= 30;
      }
    }

    for (const square of extendedCenter) {
      const piece = gameState.board[square];
      if (piece) {
        if (is_white_piece(piece)) score += 10;
        else score -= 10;
      }
    }

    // King safety
    if (is_in_check(gameState, "white")) score -= 200;
    if (is_in_check(gameState, "black")) score += 200;

    return score;
  }

  getSettings() {
    return {
      maxDepth: {
        type: "number",
        min: 3,
        max: 10,
        value: this.maxDepth,
        label: "Maximum Search Depth",
      },
    };
  }
}

// Engine Registry
class EngineRegistry {
  constructor() {
    this.engines = new Map();
    this.activeEngines = new Map(); // color -> engine
    this.registerDefaultEngines();
  }

  registerDefaultEngines() {
    this.registerEngine("random", new RandomEngine());
    this.registerEngine("aggressive", new AggressiveEngine());
    this.registerEngine("minimax-2", new MinimaxEngine(2));
    this.registerEngine("minimax-3", new MinimaxEngine(3));
    this.registerEngine("minimax-4", new MinimaxEngine(4));
    this.registerEngine("iterative-4", new IterativeDeepeningEngine(4));
    this.registerEngine("iterative-6", new IterativeDeepeningEngine(6));
    this.registerEngine("iterative-8", new IterativeDeepeningEngine(8));
  }

  registerEngine(id, engine) {
    this.engines.set(id, engine);
  }

  getEngine(id) {
    return this.engines.get(id);
  }

  getAllEngines() {
    return Array.from(this.engines.entries()).map(([id, engine]) => ({
      id,
      name: engine.name,
      description: engine.description,
    }));
  }

  setActiveEngine(color, engineId) {
    const engine = this.engines.get(engineId);
    if (!engine) {
      throw new Error(`Engine '${engineId}' not found`);
    }

    // Deactivate old engine
    const oldEngine = this.activeEngines.get(color);
    if (oldEngine) {
      oldEngine.onDeactivate();
    }

    // Activate new engine
    this.activeEngines.set(color, engine);
    engine.onActivate();
  }

  async getMove(gameState, color, timeLimit = 1000) {
    const engine = this.activeEngines.get(color);
    if (!engine) {
      throw new Error(`No engine active for ${color}`);
    }

    return await engine.getMove(gameState, color, timeLimit);
  }

  getActiveEngine(color) {
    return this.activeEngines.get(color);
  }
}

// Global engine registry instance
const engineRegistry = new EngineRegistry();

// Convenience functions for backward compatibility
function getRandomMove(gameState, color) {
  const moves = get_valid_moves(gameState, color);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

// Legacy compatibility
function get_black_move(board, type) {
  if (type === "random") {
    const gameState = new ChessGameState();
    gameState.board = board;
    return getRandomMove(gameState, "black");
  }
  return null;
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ChessEngine,
    RandomEngine,
    AggressiveEngine,
    MinimaxEngine,
    IterativeDeepeningEngine,
    EngineRegistry,
    engineRegistry,
    getRandomMove,
    get_black_move,
  };
}
