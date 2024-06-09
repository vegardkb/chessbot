//import { initialize_board, is_valid_move } from './chessrules.js';

const chessboard = document.getElementById('chessboard');

var board = initialize_board();

var selected_piece = {
    piece: '',
    row: 0,
    col: 0,
};

// Create the chessboard
for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = (row + col) % 2 === 0 ? 'square white' : 'square black';
        square.dataset.row = row;
        square.dataset.col = col;
        square.textContent = get_piece(board, row, col); // Initial setup
        square.addEventListener('click', handleSquareClick);
        chessboard.appendChild(square);
    }
}

// Function to handle square clicks
function handleSquareClick(event) {
    const clickedSquare = event.target;
    const row = parseInt(clickedSquare.dataset.row, 10);
    const col = parseInt(clickedSquare.dataset.col, 10);

    const ind = row * 8 + col;

    if (selected_piece.piece == '') {
        selected_piece = select_piece(board, row, col);
        if (selected_piece.piece != '') {
            higlight_piece_and_moves(selected_piece, board, chessboard);
        }
    } else {
        if (is_valid_move(board, selected_piece, row, col)) {
            board = perform_move(board, selected_piece, row, col);
            update_html_board(board, chessboard);
        }
        unhighlight_all(chessboard);
        selected_piece.piece = '';
    }
}

function select_piece(board, r, c) {
    var selected_piece = {
        piece: '',
        row: r,
        col: c,
    };
    selected_piece.piece = get_piece(board, r, c);
    return selected_piece;
}

function higlight_piece_and_moves(piece, board, html_board) {
    highlight_square(piece.row, piece.col, html_board);
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (is_valid_move(board, piece, row, col)) {
                highlight_square(row, col, html_board);
            }
        }
    }
}

function highlight_square(row, col, html_board) {
    square = get_html_square(row, col, html_board);
    if (square.className == 'square white') {
        square.className = 'square white_highlight';
    } else if (square.className == 'square black') {
        square.className = 'square black_highlight';
    }
}

function unhighlight_square(row, col, html_board) {
    square = get_html_square(row, col, html_board);
    if (square.className == 'square white_highlight') {
        square.className = 'square white';
    } else if (square.className == 'square black_highlight') {
        square.className = 'square black';
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
    board[piece.row*8+piece.col] = '';
    board[row*8 + col] = piece.piece;
    return board;
}

function update_html_board(board, html_board) {
    for (let square = 0; square < 64; square++){
        html_board.children[square].textContent = board[square];
    }

}

function get_piece(board, row, col) {
    return board[row*8 + col];
}

function get_html_square(row, col, html_board) {
    return html_board.children[row*8 + col];
}