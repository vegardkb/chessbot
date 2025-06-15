# Interactive Chess Game

A fully-featured web-based chess game with advanced AI engines, special moves support, and comprehensive game analysis tools.

## Features

### 🎮 Game Modes
- **Human vs Human**: Two players on the same device
- **Human vs AI**: Play against various AI engines
- **AI vs AI**: Watch AI engines play against each other

### 🤖 AI Engines
- **Random Engine**: Makes completely random legal moves
- **Aggressive Engine**: Prefers captures and checks
- **Minimax Engine**: Strategic play with configurable depth (2-3 levels)
  - Uses alpha-beta pruning for optimization
  - Evaluates material, position, and mobility
  - Displays search statistics

### ♟️ Complete Chess Rules
- **All Standard Moves**: Full piece movement rules
- **Special Moves**:
  - Castling (kingside and queenside)
  - En passant captures
  - Pawn promotion (Queen, Rook, Bishop, Knight)
- **Game End Detection**:
  - Checkmate and stalemate
  - 50-move rule
  - Threefold repetition

### 🎯 Visual Features
- **Move Highlighting**:
  - Selected piece and valid moves
  - Different highlighting for captures (red)
  - Last move highlighting (green)
- **Interactive Board**: 
  - Drag-and-drop style piece selection
  - Clear visual feedback for all interactions
- **Pawn Promotion Dialog**: Choose promotion piece with visual interface

### 📜 Game Analysis
- **Complete Move History**: 
  - Navigate through entire game
  - Click any move to jump to that position
  - Standard chess notation display
- **Navigation Controls**:
  - First/Previous/Next/Last buttons
  - Viewing mode with position highlighting
- **Game State Tracking**:
  - Current player indication
  - Check warnings
  - Game result notifications

### ⏯️ Game Control
- **Pause/Resume**: Stop AI thinking and resume play
- **New Game**: Reset board and clear history
- **Engine Selection**: Choose different AI opponents mid-game
- **Turn Management**: Flexible player type assignment

## File Structure

```
chessbot/
├── index.html          # Main HTML interface
├── main.js            # Game logic and UI management
├── chessrules.js      # Chess rules engine and move generation
├── engines.js         # AI engine implementations
└── README.md          # This documentation
```

## How to Play

1. **Setup**: Open `index.html` in a web browser
2. **Choose Players**: Select Human or AI for white and black
3. **Make Moves**: Click piece, then click destination
4. **Special Moves**: 
   - Castling: Move king two squares toward rook
   - En Passant: Automatic when conditions are met
   - Promotion: Choose piece when pawn reaches end rank
5. **Game Control**: Use pause/resume and navigation buttons as needed

## AI Engine Architecture

The chess engine system is modular and extensible:

### Base Engine Class
```javascript
class ChessEngine {
  async getMove(gameState, color, timeLimit)
  onActivate() / onDeactivate()
  getSettings()
}
```

### Adding New Engines
1. Extend the `ChessEngine` class
2. Implement the `getMove` method
3. Register with `engineRegistry.registerEngine()`

### Engine Registry
- Manages active engines for each color
- Handles engine switching and time limits
- Provides consistent interface for game logic

## Technical Implementation

### Game State Management
- Immutable game state with copy-on-write
- Complete position tracking for repetition detection
- Efficient move generation and validation

### Move Representation
```javascript
class ChessMove {
  from: {row, col}
  to: {row, col}
  piece: string
  moveType: 'normal'|'castle'|'enpassant'|'promotion'
  promotionPiece?: string
  capturedPiece?: string
}
```

### Performance Optimizations
- Alpha-beta pruning in minimax search
- Efficient board representation
- Lazy move generation
- Time-limited AI thinking

## Browser Compatibility

- Modern browsers with ES6+ support
- No external dependencies
- Responsive design for different screen sizes

## Future Enhancements

### Potential Additions
- **Advanced Engines**: 
  - Opening book support
  - Endgame tablebase integration
  - Neural network evaluation
- **Game Features**:
  - PGN import/export
  - Position setup (FEN)
  - Analysis mode with best move suggestions
- **UI Improvements**:
  - Board themes and piece sets
  - Sound effects
  - Mobile touch controls
- **Multiplayer**:
  - Online play with WebSockets
  - Tournament mode
  - Rating system

### Engine Development
The modular engine architecture makes it easy to add sophisticated chess engines:
- Implement evaluation functions
- Add opening books
- Create specialized endgame engines
- Experiment with machine learning approaches

## Contributing

The codebase is designed for extensibility:
1. Chess rules are separated from UI logic
2. Engine interface allows easy AI development
3. Game state is immutable for reliable testing
4. Clear separation of concerns throughout

Feel free to extend the engine collection or enhance the user interface!

## License

This project is open source and available for educational and personal use.