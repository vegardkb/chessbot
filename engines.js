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
    throw new Error('getMove method must be implemented by subclass');
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
    super('Random', 'Selects moves completely at random');
  }

  async getMove(gameState, color, timeLimit = 1000) {
    const moves = get_valid_moves(gameState, color);

    if (moves.length === 0) {
      return null;
    }

    // Add small delay to make it feel more natural
    await new Promise(resolve => setTimeout(resolve, Math.min(300, timeLimit / 2)));

    return moves[Math.floor(Math.random() * moves.length)];
  }
}

// Capture-Preferring Engine - prefers captures, otherwise random
class AggressiveEngine extends ChessEngine {
  constructor() {
    super('Aggressive', 'Prefers captures and checks, otherwise random');
  }

  async getMove(gameState, color, timeLimit = 1000) {
    const moves = get_valid_moves(gameState, color);

    if (moves.length === 0) {
      return null;
    }

    // Separate moves into categories
    const captureMoves = moves.filter(move => move.capturedPiece);
    const checkMoves = moves.filter(move => {
      const testState = apply_move(gameState, move);
      const opponentColor = color === 'white' ? 'black' : 'white';
      return is_in_check(testState, opponentColor);
    });

    // Add small delay
    await new Promise(resolve => setTimeout(resolve, Math.min(500, timeLimit / 2)));

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

    const result = this.minimax(gameState, this.depth, color === 'white', -Infinity, Infinity, startTime, timeLimit);

    console.log(`Minimax evaluated ${this.positionsEvaluated} positions in ${Date.now() - startTime}ms`);

    return result.move;
  }

  minimax(gameState, depth, isMaximizing, alpha, beta, startTime, timeLimit) {
    // Check time limit
    if (Date.now() - startTime > timeLimit * 0.9) {
      return { score: this.evaluatePosition(gameState), move: null };
    }

    const currentColor = isMaximizing ? 'white' : 'black';
    const moves = get_valid_moves(gameState, currentColor);

    // Terminal node or depth reached
    if (depth === 0 || moves.length === 0) {
      this.positionsEvaluated++;
      return { score: this.evaluatePosition(gameState), move: null };
    }

    let bestMove = null;

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (const move of moves) {
        const newState = apply_move(gameState, move);
        const result = this.minimax(newState, depth - 1, false, alpha, beta, startTime, timeLimit);

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
        const result = this.minimax(newState, depth - 1, true, alpha, beta, startTime, timeLimit);

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

    // Piece values
    const pieceValues = {
      [piece_unicode.WhitePawn]: 100,
      [piece_unicode.WhiteRook]: 500,
      [piece_unicode.WhiteKnight]: 300,
      [piece_unicode.WhiteBishop]: 300,
      [piece_unicode.WhiteQueen]: 900,
      [piece_unicode.WhiteKing]: 0,
      [piece_unicode.BlackPawn]: -100,
      [piece_unicode.BlackRook]: -500,
      [piece_unicode.BlackKnight]: -300,
      [piece_unicode.BlackBishop]: -300,
      [piece_unicode.BlackQueen]: -900,
      [piece_unicode.BlackKing]: 0,
    };

    // Material evaluation
    for (let square = 0; square < 64; square++) {
      const piece = board[square];
      if (piece && pieceValues[piece] !== undefined) {
        score += pieceValues[piece];
      }
    }

    // Position evaluation
    score += this.evaluatePosition_positional(gameState);

    // Game phase considerations
    const gameResult = get_game_result(gameState);
    if (gameResult === 'white_wins') score += 10000;
    if (gameResult === 'black_wins') score -= 10000;

    return score;
  }

  evaluatePosition_positional(gameState) {
    let score = 0;

    // Center control
    const centerSquares = [27, 28, 35, 36]; // d4, e4, d5, e5
    for (const square of centerSquares) {
      const piece = gameState.board[square];
      if (piece) {
        if (is_white_piece(piece)) score += 10;
        else score -= 10;
      }
    }

    // King safety (simplified)
    if (is_in_check(gameState, 'white')) score -= 50;
    if (is_in_check(gameState, 'black')) score += 50;

    // Mobility (number of legal moves)
    const whiteMoves = get_valid_moves(gameState, 'white').length;
    const blackMoves = get_valid_moves(gameState, 'black').length;
    score += (whiteMoves - blackMoves) * 2;

    return score;
  }

  getSettings() {
    return {
      depth: {
        type: 'number',
        min: 1,
        max: 5,
        value: this.depth,
        label: 'Search Depth'
      }
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
    this.registerEngine('random', new RandomEngine());
    this.registerEngine('aggressive', new AggressiveEngine());
    this.registerEngine('minimax-2', new MinimaxEngine(2));
    this.registerEngine('minimax-3', new MinimaxEngine(3));
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
      description: engine.description
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
    return getRandomMove(gameState, 'black');
  }
  return null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChessEngine,
    RandomEngine,
    AggressiveEngine,
    MinimaxEngine,
    EngineRegistry,
    engineRegistry,
    getRandomMove,
    get_black_move
  };
}
