document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const pvpButton = document.getElementById('pvpButton');
    const pvcButton = document.getElementById('pvcButton');
    const resetButton = document.getElementById('resetButton');
    const modeSelectionElement = document.getElementById('modeSelection');
    const resetContainerElement = document.getElementById('resetContainer');


    const ROWS = 6;
    const COLS = 7;
    const PLAYER1 = 1;
    const PLAYER2 = 2; // Player 2 or Computer
    const EMPTY = 0;

    let board = [];
    let currentPlayer = PLAYER1;
    let gameMode = null; // 'pvp' or 'pvc' - Set when button clicked
    let gameOver = true; // Game is over until a mode is selected and game starts

    // --- Game State Management ---
    function showModeSelection() {
        modeSelectionElement.classList.remove('hidden');
        resetContainerElement.classList.add('hidden');
        boardElement.classList.add('hidden');
        boardElement.innerHTML = ''; // Clear board visually
        statusElement.textContent = "🎮 Select a game mode to start! 🎮";
        statusElement.className = "mb-2 sm:mb-4 text-lg sm:text-xl font-semibold text-gray-700 text-center h-12 flex items-center justify-center";
        gameOver = true;
        gameMode = null;
        board = []; // Clear internal board state
    }

    function startGame(selectedMode) {
        gameMode = selectedMode;
        modeSelectionElement.classList.add('hidden');
        resetContainerElement.classList.remove('hidden');
        boardElement.classList.remove('hidden');
        initGameInternal(); // Start the actual game logic
    }

    // Renamed internal init function
    function initGameInternal() {
        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
        currentPlayer = PLAYER1;
        gameOver = false;
        boardElement.classList.remove('game-over');
        renderBoard(); // Render the empty board
        updateStatus(); // Set initial turn status
        console.log("Game Initialized. Mode:", gameMode);
    }


    // --- Rendering ---
    function renderBoard() {
        boardElement.innerHTML = ''; // Clear previous board
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const piece = document.createElement('div');
                piece.classList.add('piece');
                if (board[r][c] === PLAYER1) {
                    piece.classList.add('player1');
                } else if (board[r][c] === PLAYER2) {
                    piece.classList.add('player2');
                } else {
                    piece.classList.add('empty');
                }
                cell.appendChild(piece);
                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
            }
        }
    }

    function updateStatus() {
        if (gameOver) {
            // Status updated by win/draw condition or mode selection
            return;
        }
        const playerEmoji = currentPlayer === PLAYER1 ? '🔴' : '🟡';
        const turnIdentifier = (gameMode === 'pvc' && currentPlayer === PLAYER2) ? '🤖 Computer' : `Player ${currentPlayer}`;
        statusElement.textContent = `${playerEmoji} ${turnIdentifier}'s Turn ${playerEmoji}`;
        statusElement.className = `mb-4 text-xl font-semibold ${currentPlayer === PLAYER1 ? 'text-red-600' : 'text-yellow-600'}`;
    }

    // --- Event Handlers ---
    pvpButton.addEventListener('click', () => startGame('pvp'));
    pvcButton.addEventListener('click', () => startGame('pvc'));
    resetButton.addEventListener('click', showModeSelection); // Reset goes back to mode selection


    function handleCellClick(event) {
        // Game only proceeds if not over AND a mode has been selected (which implies !gameOver)
        if (gameOver) return;

        // Prevent computer's turn click in PvC
        if (gameMode === 'pvc' && currentPlayer === PLAYER2) {
            console.log("Not player's turn (PvC)");
            return;
        }

        const col = parseInt(event.currentTarget.dataset.col);
        console.log(`Column clicked: ${col}`);

        dropPiece(col);
    }

    // --- Game Logic ---
    function dropPiece(col) {
        if (gameOver) return;

        // Find the lowest empty row in the selected column
        let row = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === EMPTY) {
                row = r;
                break;
            }
        }

        if (row === -1) {
            console.log(`Column ${col} is full.`);
            statusElement.textContent = "🚫 Column full! Try another. 🚫";
            // Keep player color for the message
            statusElement.className = `mb-4 text-xl font-semibold ${currentPlayer === PLAYER1 ? 'text-red-600' : 'text-yellow-600'}`;
            return; // Column is full
        }

        // Place the piece
        board[row][col] = currentPlayer;
        renderBoard(); // Re-render after placing piece

        // Check for win/draw
        if (checkWin(row, col)) {
            gameOver = true;
            boardElement.classList.add('game-over'); // Disable hover
            const winnerEmoji = currentPlayer === PLAYER1 ? '🔴' : '🟡';
            const winnerName = (gameMode === 'pvc' && currentPlayer === PLAYER2) ? '🤖 Computer' : `Player ${currentPlayer}`;
            statusElement.textContent = `🎉 ${winnerEmoji} ${winnerName} Wins! ${winnerEmoji} 🎉`;
            statusElement.className = `mb-4 text-xl font-bold ${currentPlayer === PLAYER1 ? 'text-red-700' : 'text-yellow-700'}`; // Keep color indication
            console.log(`Player ${currentPlayer} wins!`);

            // Trigger Confetti!
            const winnerColor = currentPlayer === PLAYER1 ? '#ef4444' : '#facc15'; // Red or Yellow
            if (typeof confetti === 'function') { // Check if confetti library loaded
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#ffffff', winnerColor] // Mix of white and winner's color
                });
            } else {
                console.warn("Confetti library not loaded.");
            }

            return; // End turn after win
        }

        if (checkDraw()) {
            gameOver = true;
            boardElement.classList.add('game-over');
            statusElement.textContent = "🤝 It's a Draw! 🤝";
            statusElement.className = "mb-4 text-xl font-bold text-gray-700";
            console.log("Draw game!");
            return;
        }

        // Switch player
        currentPlayer = (currentPlayer === PLAYER1) ? PLAYER2 : PLAYER1;
        updateStatus();

        // If PvC and it's computer's turn, trigger computer move
        if (!gameOver && gameMode === 'pvc' && currentPlayer === PLAYER2) {
            // Add a small delay for the computer's move to feel more natural
            // Ensure computer doesn't move if game ended on player's turn
            if (!gameOver) {
                setTimeout(computerMove, 500);
            }
        }
    }

    function checkWin(r, c) {
        const player = board[r][c];

        // Check Horizontal
        for (let col = 0; col <= COLS - 4; col++) {
            if (board[r][col] === player && board[r][col + 1] === player && board[r][col + 2] === player && board[r][col + 3] === player) return true;
        }
        // Check Vertical
        for (let row = 0; row <= ROWS - 4; row++) {
            if (board[row][c] === player && board[row + 1][c] === player && board[row + 2][c] === player && board[row + 3][c] === player) return true;
        }
        // Check Diagonal (Positive Slope /)
        for (let row = 0; row <= ROWS - 4; row++) {
            for (let col = 0; col <= COLS - 4; col++) {
                if (board[row][col] === player && board[row + 1][col + 1] === player && board[row + 2][col + 2] === player && board[row + 3][col + 3] === player) return true;
            }
        }
        // Check Diagonal (Negative Slope \)
        for (let row = 3; row < ROWS; row++) { // Start from row 3
            for (let col = 0; col <= COLS - 4; col++) {
                if (board[row][col] === player && board[row - 1][col + 1] === player && board[row - 2][col + 2] === player && board[row - 3][col + 3] === player) return true;
            }
        }

        return false; // No win found
    }


    function checkDraw() {
        // Check if any cell is still empty
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === EMPTY) {
                    return false; // Found an empty cell, not a draw
                }
            }
        }
        return true; // All cells are filled, it's a draw
    }

    // --- Computer AI (Minimax) ---

    const MINIMAX_DEPTH = 4; // How many moves ahead the AI looks

    // Helper: Find landing row for a given board state
    function findLandingRow(currentBoard, col) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (currentBoard[r][col] === EMPTY) {
                return r;
            }
        }
        return -1; // Column is full
    }

    // Helper: Get available columns for a given board state
    function getAvailableCols(currentBoard) {
        let cols = [];
        for (let c = 0; c < COLS; c++) {
            if (currentBoard[0][c] === EMPTY) {
                cols.push(c);
            }
        }
        return cols;
    }

    // Helper: Check for win on a given board state (more general than original checkWin)
    function checkWinOnBoard(currentBoard, player) {
        // Horizontal check
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (currentBoard[r][c] === player && currentBoard[r][c + 1] === player && currentBoard[r][c + 2] === player && currentBoard[r][c + 3] === player) return true;
            }
        }
        // Vertical check
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c < COLS; c++) {
                if (currentBoard[r][c] === player && currentBoard[r + 1][c] === player && currentBoard[r + 2][c] === player && currentBoard[r + 3][c] === player) return true;
            }
        }
        // Diagonal (positive slope) check
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (currentBoard[r][c] === player && currentBoard[r + 1][c + 1] === player && currentBoard[r + 2][c + 2] === player && currentBoard[r + 3][c + 3] === player) return true;
            }
        }
        // Diagonal (negative slope) check
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                if (currentBoard[r][c] === player && currentBoard[r - 1][c + 1] === player && currentBoard[r - 2][c + 2] === player && currentBoard[r - 3][c + 3] === player) return true;
            }
        }
        return false;
    }

    // Helper: Check for draw on a given board state
    function checkDrawOnBoard(currentBoard) {
        return currentBoard[0].every(cell => cell !== EMPTY);
    }

    // Helper: Evaluate a 4-cell window for scoring
    function evaluateWindow(window, player) {
        let score = 0;
        const opponent = (player === PLAYER1) ? PLAYER2 : PLAYER1;
        const playerCount = window.filter(cell => cell === player).length;
        const opponentCount = window.filter(cell => cell === opponent).length;
        const emptyCount = window.filter(cell => cell === EMPTY).length;

        if (playerCount === 4) {
            score += 1000; // Strong win preference
        } else if (playerCount === 3 && emptyCount === 1) {
            score += 10; // Good potential
        } else if (playerCount === 2 && emptyCount === 2) {
            score += 2; // Minor potential
        }

        if (opponentCount === 4) {
            score -= 800; // Strong loss avoidance (slightly less than winning)
        } else if (opponentCount === 3 && emptyCount === 1) {
            score -= 8; // Block opponent's potential
        } else if (opponentCount === 2 && emptyCount === 2) {
            score -= 1; // Minor block
        }

        return score;
    }

    // Helper: Score the entire board state for the AI player (PLAYER2)
    function scorePosition(currentBoard, player) {
        let score = 0;

        // Center column preference (slightly)
        const centerColIndex = Math.floor(COLS / 2);
        const centerArray = currentBoard.map(row => row[centerColIndex]);
        score += centerArray.filter(cell => cell === player).length * 3; // Give 3 points per piece in center

        // Score Horizontal
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                const window = currentBoard[r].slice(c, c + 4);
                score += evaluateWindow(window, player);
            }
        }
        // Score Vertical
        for (let c = 0; c < COLS; c++) {
            for (let r = 0; r <= ROWS - 4; r++) {
                const window = [currentBoard[r][c], currentBoard[r + 1][c], currentBoard[r + 2][c], currentBoard[r + 3][c]];
                score += evaluateWindow(window, player);
            }
        }
        // Score Diagonal (positive slope)
        for (let r = 0; r <= ROWS - 4; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                const window = [currentBoard[r][c], currentBoard[r + 1][c + 1], currentBoard[r + 2][c + 2], currentBoard[r + 3][c + 3]];
                score += evaluateWindow(window, player);
            }
        }
        // Score Diagonal (negative slope)
        for (let r = 3; r < ROWS; r++) {
            for (let c = 0; c <= COLS - 4; c++) {
                const window = [currentBoard[r][c], currentBoard[r - 1][c + 1], currentBoard[r - 2][c + 2], currentBoard[r - 3][c + 3]];
                score += evaluateWindow(window, player);
            }
        }
        return score;
    }

    // Helper: Check if the current board is a terminal node (win/draw)
    function isTerminalNode(currentBoard) {
        return checkWinOnBoard(currentBoard, PLAYER1) || checkWinOnBoard(currentBoard, PLAYER2) || checkDrawOnBoard(currentBoard);
    }

    // Minimax function
    function minimax(currentBoard, depth, maximizingPlayer) {
        const availableCols = getAvailableCols(currentBoard);
        const terminal = isTerminalNode(currentBoard);

        if (depth === 0 || terminal) {
            if (terminal) {
                if (checkWinOnBoard(currentBoard, PLAYER2)) return 100000 + depth; // Prioritize faster wins
                if (checkWinOnBoard(currentBoard, PLAYER1)) return -100000 - depth; // Avoid losses, penalize faster losses
                if (checkDrawOnBoard(currentBoard)) return 0; // Draw
            }
            return scorePosition(currentBoard, PLAYER2); // Return heuristic score if depth limit reached
        }

        if (maximizingPlayer) { // Computer's turn (PLAYER2)
            let value = -Infinity;
            for (const col of availableCols) {
                const row = findLandingRow(currentBoard, col);
                if (row !== -1) {
                    // Create a copy of the board to simulate the move
                    const boardCopy = currentBoard.map(r => [...r]);
                    boardCopy[row][col] = PLAYER2;
                    value = Math.max(value, minimax(boardCopy, depth - 1, false));
                }
            }
            return value;
        } else { // Human's turn (PLAYER1)
            let value = Infinity;
            for (const col of availableCols) {
                const row = findLandingRow(currentBoard, col);
                if (row !== -1) {
                    // Create a copy of the board to simulate the move
                    const boardCopy = currentBoard.map(r => [...r]);
                    boardCopy[row][col] = PLAYER1;
                    value = Math.min(value, minimax(boardCopy, depth - 1, true));
                }
            }
            return value;
        }
    }

    // Main function for computer's move using Minimax
    function computerMove() {
        if (gameOver) return;
        console.log("Computer's turn (thinking...)");

        let bestScore = -Infinity;
        let bestCol = -1;
        const availableCols = getAvailableCols(board);

        // Pick center column if available as a starting point or fallback
        const centerCol = Math.floor(COLS / 2);
        if (availableCols.includes(centerCol)) {
            bestCol = centerCol;
        } else if (availableCols.length > 0) {
            bestCol = availableCols[Math.floor(Math.random() * availableCols.length)]; // Random fallback if center not free
        }

        console.time("Minimax Calculation"); // Start timer

        for (const col of availableCols) {
            const row = findLandingRow(board, col);
            if (row !== -1) {
                const boardCopy = board.map(r => [...r]); // Use current game board 'board'
                boardCopy[row][col] = PLAYER2;
                // Start minimax for the opponent's turn (minimizing player)
                const score = minimax(boardCopy, MINIMAX_DEPTH, false); // Depth starts from defined constant
                console.log(`Column ${col} evaluated score: ${score}`); // Log score for debugging
                if (score > bestScore) {
                    bestScore = score;
                    bestCol = col;
                }
            }
        }

        console.timeEnd("Minimax Calculation"); // End timer
        console.log(`AI chooses column: ${bestCol} with score: ${bestScore}`);

        if (bestCol !== -1) {
            dropPiece(bestCol);
        } else {
            // This should ideally not happen if there are available columns
            console.error("Minimax failed to find a best column!");
            // Fallback to random if something went wrong
            if (availableCols.length > 0) {
                dropPiece(availableCols[Math.floor(Math.random() * availableCols.length)]);
            }
        }
    }

    // --- Initial Setup ---
    // Don't start game automatically, just ensure initial screen is correct
    showModeSelection();

});
