// sudoku.js
// Enkel sudoku med tre svårighetsgrader, highscore och mörkt/ljust läge

const boards = {
    easy: [
        [7,3,8,0,6,0,9,0,4],
        [0,0,0,2,8,3,0,7,6],
        [6,0,0,7,9,0,8,0,3],
        [0,2,0,0,7,5,0,0,0],
        [9,4,0,8,2,0,0,0,3],
        [5,0,0,0,0,6,0,8,0],
        [0,5,1,0,8,0,0,0,9],
        [8,1,0,0,3,0,0,0,0],
        [9,0,0,6,0,0,4,8,0]
    ],
    medium: [
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,3,0,8,5],
        [0,0,1,0,2,0,0,0,0],
        [0,0,0,5,0,7,0,0,0],
        [0,0,4,0,0,0,1,0,0],
        [0,9,0,0,0,0,0,0,0],
        [5,0,0,0,0,0,0,7,3],
        [0,0,2,0,1,0,0,0,0],
        [0,0,0,0,4,0,0,0,9]
    ],
    hard: [
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0]
    ]
};

let currentBoard = [];
let solution = [];
let selectedCell = null;
let timer = 0;
let timerInterval = null;
let difficulty = 'easy';

function deepCopy(board) {
    return board.map(row => row.slice());
}

function generateBoard(diff) {
    // For demo, use static boards. For real, implement generator/solver.
    currentBoard = deepCopy(boards[diff]);
    solution = solveSudoku(deepCopy(currentBoard));
}

function renderBoard() {
    const boardDiv = document.getElementById('sudoku-board');
    boardDiv.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            if (boards[difficulty][r][c] !== 0) {
                cell.textContent = boards[difficulty][r][c];
                cell.classList.add('prefilled');
            } else if (currentBoard[r][c] !== 0) {
                cell.textContent = currentBoard[r][c];
            } else {
                cell.textContent = '';
            }
            cell.onclick = () => selectCell(r, c);
            if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
                cell.classList.add('selected');
            }
            boardDiv.appendChild(cell);
        }
    }
}

function selectCell(r, c) {
    if (boards[difficulty][r][c] !== 0) return;
    selectedCell = [r, c];
    renderBoard();
}

function fillCell(num) {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (boards[difficulty][r][c] !== 0) return;
    currentBoard[r][c] = num;
    renderBoard();
    if (isBoardFull()) {
        if (isSolved()) {
            stopTimer();
            saveHighscore();
            setTimeout(() => alert('Grattis! Du löste sudokut!'), 100);
        } else {
            setTimeout(() => alert('Fel lösning!'), 100);
        }
    }
}

function clearCell() {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (boards[difficulty][r][c] !== 0) return;
    currentBoard[r][c] = 0;
    renderBoard();
}

function isBoardFull() {
    return currentBoard.flat().every(x => x !== 0);
}

function isSolved() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (currentBoard[r][c] !== solution[r][c]) return false;
        }
    }
    return true;
}

function solveSudoku(board) {
    // Simple backtracking solver
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) return false;
        }
        const br = Math.floor(row/3)*3, bc = Math.floor(col/3)*3;
        for (let r = br; r < br+3; r++) for (let c = bc; c < bc+3; c++) {
            if (board[r][c] === num) return false;
        }
        return true;
    }
    function solve(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    for (let n = 1; n <= 9; n++) {
                        if (isValid(board, r, c, n)) {
                            board[r][c] = n;
                            if (solve(board)) return true;
                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    solve(board);
    return board;
}

function startTimer() {
    timer = 0;
    document.getElementById('timer').textContent = 'Tid: 0:00';
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        const min = Math.floor(timer/60);
        const sec = timer%60;
        document.getElementById('timer').textContent = `Tid: ${min}:${sec.toString().padStart(2,'0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function saveHighscore() {
    const scores = JSON.parse(localStorage.getItem('sudoku_highscores') || '{}');
    if (!scores[difficulty]) scores[difficulty] = [];
    scores[difficulty].push(timer);
    scores[difficulty].sort((a,b)=>a-b);
    scores[difficulty] = scores[difficulty].slice(0,5);
    localStorage.setItem('sudoku_highscores', JSON.stringify(scores));
}

function showHighscore() {
    const scores = JSON.parse(localStorage.getItem('sudoku_highscores') || '{}');
    const list = document.getElementById('highscoreList');
    list.innerHTML = '';
    const arr = scores[difficulty] || [];
    if (arr.length === 0) {
        list.innerHTML = '<li class="list-group-item">Inga highscores än!</li>';
    } else {
        arr.forEach((s,i) => {
            const min = Math.floor(s/60);
            const sec = s%60;
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${i+1}. ${min}:${sec.toString().padStart(2,'0')}`;
            list.appendChild(li);
        });
    }
    const modal = new bootstrap.Modal(document.getElementById('highscoreModal'));
    modal.show();
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('bg-light');
    body.classList.toggle('bg-dark');
    body.classList.toggle('text-light');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('difficulty').onchange = e => {
        difficulty = e.target.value;
        newGame();
    };
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.onclick = () => fillCell(Number(btn.dataset.num));
    });
    document.getElementById('clearBtn').onclick = clearCell;
    document.getElementById('checkBtn').onclick = () => {
        if (isSolved()) {
            stopTimer();
            saveHighscore();
            alert('Grattis! Du löste sudokut!');
        } else {
            alert('Fel lösning!');
        }
    };
    document.getElementById('newGameBtn').onclick = newGame;
    document.getElementById('highscoreBtn').onclick = showHighscore;
    document.getElementById('toggleTheme').onclick = toggleTheme;
    newGame();
});

function newGame() {
    generateBoard(difficulty);
    selectedCell = null;
    renderBoard();
    startTimer();
}
