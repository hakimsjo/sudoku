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
    mediumSolution: [
        [9,8,7,6,5,4,3,2,1],
        [2,4,6,1,7,3,9,8,5],
        [3,5,1,9,2,8,7,4,6],
        [1,2,8,5,3,7,6,9,4],
        [6,3,4,8,9,2,1,5,7],
        [7,9,5,4,6,1,8,3,2],
        [5,1,9,2,8,6,4,7,3],
        [4,6,2,3,1,9,5,8,7],
        [8,7,3,7,4,5,2,1,9]
    ],
    hard: [
        [8,0,0,0,0,0,0,0,0],
        [0,0,3,6,0,0,0,0,0],
        [0,7,0,0,9,0,2,0,0],
        [0,5,0,0,0,7,0,0,0],
        [0,0,0,0,4,5,7,0,0],
        [0,0,0,1,0,0,0,3,0],
        [0,0,1,0,0,0,0,6,8],
        [0,0,8,5,0,0,0,1,0],
        [0,9,0,0,0,0,4,0,0]
    ]
};

let initialBoard = [];
let currentBoard = [];
let notesBoard = [];
let solution = [];
let selectedCell = null;
let timer = 0;
let timerInterval = null;
let difficulty = 'easy';
let checkResult = null; // To store check results ('right', 'wrong')
let entryMode = 'value';
let mistakeCount = 0;
let mistakeHistory = [];
const savedGameKey = 'sudoku_saved_game';
const scoreBaseByDifficulty = {
    easy: 10000,
    medium: 15000,
    hard: 22000
};
const timePenaltyPerSecond = 10;
const mistakePenalty = 250;

function deepCopy(board) {
    return board.map(row => row.slice());
}

function createEmptyNotesBoard() {
    return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
}

function isValidBoard(board) {
    return Array.isArray(board) &&
        board.length === 9 &&
        board.every(row => Array.isArray(row) && row.length === 9);
}

function isValidNotesBoard(board) {
    return isValidBoard(board) &&
        board.every(row => row.every(notes => Array.isArray(notes) && notes.length <= 4));
}

function updateTimerDisplay() {
    const min = Math.floor(timer/60);
    const sec = timer%60;
    document.getElementById('timer').textContent = `Tid: ${min}:${sec.toString().padStart(2,'0')}`;
    updateScoreDisplay();
}

function calculateScore() {
    const baseScore = scoreBaseByDifficulty[difficulty] || scoreBaseByDifficulty.easy;
    return Math.max(0, baseScore - (timer * timePenaltyPerSecond) - (mistakeCount * mistakePenalty));
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    if (!scoreElement) return;
    scoreElement.textContent = `Poäng: ${calculateScore()} | Fel: ${mistakeCount}`;
}

function registerMistake(row, col, value) {
    if (!value) return;

    const key = `${row}-${col}-${value}`;
    if (mistakeHistory.includes(key)) return;

    mistakeHistory.push(key);
    mistakeCount++;
    updateScoreDisplay();
    saveGameState();
}

function saveGameState() {
    if (!initialBoard.length || !currentBoard.length || !solution.length) return;

    const state = {
        initialBoard,
        currentBoard,
        notesBoard,
        solution,
        selectedCell,
        timer,
        difficulty,
        entryMode,
        mistakeCount,
        mistakeHistory,
        darkMode: document.body.classList.contains('bg-dark')
    };

    localStorage.setItem(savedGameKey, JSON.stringify(state));
}

function clearSavedGame() {
    localStorage.removeItem(savedGameKey);
}

function restoreSavedGame() {
    const saved = localStorage.getItem(savedGameKey);
    if (!saved) return false;

    try {
        const state = JSON.parse(saved);
        if (
            !isValidBoard(state.initialBoard) ||
            !isValidBoard(state.currentBoard) ||
            !isValidBoard(state.solution) ||
            !isValidNotesBoard(state.notesBoard)
        ) {
            clearSavedGame();
            return false;
        }

        initialBoard = deepCopy(state.initialBoard);
        currentBoard = deepCopy(state.currentBoard);
        notesBoard = state.notesBoard.map(row => row.map(notes => notes.slice(0, 4)));
        solution = deepCopy(state.solution);
        selectedCell = Array.isArray(state.selectedCell) ? state.selectedCell : null;
        timer = Number.isInteger(state.timer) && state.timer >= 0 ? state.timer : 0;
        difficulty = state.difficulty || 'easy';
        entryMode = state.entryMode === 'note' ? 'note' : 'value';
        mistakeCount = Number.isInteger(state.mistakeCount) && state.mistakeCount >= 0 ? state.mistakeCount : 0;
        mistakeHistory = Array.isArray(state.mistakeHistory) ? state.mistakeHistory : [];
        checkResult = null;

        document.body.classList.toggle('bg-dark', state.darkMode === true);
        document.body.classList.toggle('bg-light', state.darkMode !== true);
        document.body.classList.toggle('text-light', state.darkMode === true);

        return true;
    } catch (error) {
        clearSavedGame();
        return false;
    }
}


// Hjälpfunktioner för Sudoku-generering och lösning
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function isSafe(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (board[r][c] === num) return false;
        }
    }
    return true;
}

function fillBoard(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                let nums = shuffle([1,2,3,4,5,6,7,8,9]);
                for (let n of nums) {
                    if (isSafe(board, r, c, n)) {
                        board[r][c] = n;
                        if (fillBoard(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function isValidSolution(board) {
    if (!board || board.length !== 9) return false;
    for (let r = 0; r < 9; r++) {
        if (!board[r] || board[r].length !== 9) return false;
    }
    
    for (let i = 0; i < 9; i++) {
        let rowSet = new Set();
        let colSet = new Set();
        let boxSet = new Set();
        
        for (let j = 0; j < 9; j++) {
            let valRow = board[i][j];
            if (valRow < 1 || valRow > 9 || rowSet.has(valRow)) return false;
            rowSet.add(valRow);
            
            let valCol = board[j][i];
            if (valCol < 1 || valCol > 9 || colSet.has(valCol)) return false;
            colSet.add(valCol);
            
            let boxRow = Math.floor(i / 3) * 3 + Math.floor(j / 3);
            let boxCol = (i % 3) * 3 + (j % 3);
            let valBox = board[boxRow][boxCol];
            if (valBox < 1 || valBox > 9 || boxSet.has(valBox)) return false;
            boxSet.add(valBox);
        }
    }
    return true;
}

function isValidPuzzle(board) {
    if (!board || board.length !== 9) return false;
    for (let r = 0; r < 9; r++) {
        if (!board[r] || board[r].length !== 9) return false;
    }
    
    for (let i = 0; i < 9; i++) {
        let rowSet = new Set();
        let colSet = new Set();
        let boxSet = new Set();
        
        for (let j = 0; j < 9; j++) {
            let valRow = board[i][j];
            if (valRow !== 0) {
                if (valRow < 1 || valRow > 9 || rowSet.has(valRow)) return false;
                rowSet.add(valRow);
            }
            
            let valCol = board[j][i];
            if (valCol !== 0) {
                if (valCol < 1 || valCol > 9 || colSet.has(valCol)) return false;
                colSet.add(valCol);
            }
            
            let boxRow = Math.floor(i / 3) * 3 + Math.floor(j / 3);
            let boxCol = (i % 3) * 3 + (j % 3);
            let valBox = board[boxRow][boxCol];
            if (valBox !== 0) {
                if (valBox < 1 || valBox > 9 || boxSet.has(valBox)) return false;
                boxSet.add(valBox);
            }
        }
    }
    return true;
}

function countSolutions(board, limit = 2) {
    let count = 0;
    
    function solve(b) {
        if (count >= limit) return;
        
        let minCandidates = 10;
        let bestR = -1;
        let bestC = -1;
        let bestCandidates = [];
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (b[r][c] === 0) {
                    let candidates = [];
                    for (let n = 1; n <= 9; n++) {
                        if (isSafe(b, r, c, n)) {
                            candidates.push(n);
                        }
                    }
                    if (candidates.length < minCandidates) {
                        minCandidates = candidates.length;
                        bestR = r;
                        bestC = c;
                        bestCandidates = candidates;
                    }
                }
            }
        }
        
        if (bestR === -1) {
            count++;
            return;
        }
        
        if (minCandidates === 0) {
            return;
        }
        
        for (let n of bestCandidates) {
            b[bestR][bestC] = n;
            solve(b);
            b[bestR][bestC] = 0;
            if (count >= limit) return;
        }
    }
    
    let boardCopy = deepCopy(board);
    solve(boardCopy);
    return count;
}

// Enkel sudoku-generator med validering och återförsök vid misslyckande
function generateSudoku(difficulty) {
    const targetRemoved = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
    
    for (let attempt = 1; attempt <= 100; attempt++) {
        let solution = Array.from({length:9}, () => Array(9).fill(0));
        if (!fillBoard(solution)) {
            continue;
        }
        
        let puzzle = deepCopy(solution);
        
        let cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                cells.push({ r, c });
            }
        }
        shuffle(cells);
        
        let removedCount = 0;
        for (let cell of cells) {
            if (removedCount >= targetRemoved) {
                break;
            }
            
            const { r, c } = cell;
            const backup = puzzle[r][c];
            puzzle[r][c] = 0;
            
            if (countSolutions(puzzle, 2) === 1) {
                removedCount++;
            } else {
                puzzle[r][c] = backup;
            }
        }
        
        if (removedCount === targetRemoved && 
            isValidPuzzle(puzzle) && 
            isValidSolution(solution) && 
            countSolutions(puzzle, 2) === 1) {
            return { puzzle, solution };
        }
    }
    
    // Fallback om vi av någon anledning inte kan generera efter 100 försök (mycket osannolikt)
    const fallbackPuzzle = deepCopy(boards[difficulty] || boards.easy);
    const fallbackSolution = deepCopy(boards.mediumSolution);
    return { puzzle: fallbackPuzzle, solution: fallbackSolution };
}


function generateBoard(diff) {
    // Anropa generatorn för nytt bräde
    const { puzzle, solution: sol } = generateSudoku(diff);
    initialBoard = deepCopy(puzzle);
    currentBoard = deepCopy(puzzle);
    notesBoard = createEmptyNotesBoard();
    solution = deepCopy(sol);
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
            
            // Add thick borders
            if (r % 3 === 0) cell.classList.add('thick-top');
            if (c % 3 === 0) cell.classList.add('thick-left');
            if (r === 8) cell.classList.add('thick-bottom');
            if (c === 8) cell.classList.add('thick-right');

            if (initialBoard[r][c] !== 0) {
                const value = document.createElement('span');
                value.className = 'sudoku-value';
                value.textContent = initialBoard[r][c];
                cell.appendChild(value);
                cell.classList.add('prefilled');
            } else {
                if (currentBoard[r][c] !== 0) {
                    const value = document.createElement('span');
                    value.className = 'sudoku-value';
                    value.textContent = currentBoard[r][c];
                    cell.appendChild(value);
                } else {
                    renderNotes(cell, notesBoard[r][c]);
                }
                
                // Apply check result classes
                if (checkResult) {
                    if (checkResult[r][c] === 'right') {
                        cell.classList.add('cell-correct');
                    } else if (checkResult[r][c] === 'wrong') {
                        cell.classList.add('cell-incorrect');
                    }
                }
            }

            cell.onclick = () => selectCell(r, c);

            if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
                cell.classList.add('selected');
            }
            
            boardDiv.appendChild(cell);
        }
    }
}

function renderNotes(cell, notes) {
    if (!notes.length) return;

    const notesGrid = document.createElement('div');
    notesGrid.className = 'sudoku-notes';

    notes.forEach(note => {
        const noteElement = document.createElement('span');
        noteElement.textContent = note;
        notesGrid.appendChild(noteElement);
    });

    cell.appendChild(notesGrid);
}

// Add CSS for cell highlighting
if (typeof window !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .cell-correct { background: #c8e6c9 !important; }
        .cell-incorrect { background: #ffcdd2 !important; }
    `;
    document.head.appendChild(style);
}

function selectCell(r, c) {
    if (initialBoard[r][c] !== 0) return;
    selectedCell = [r, c];
    renderBoard();
}

function fillCell(num) {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    if (entryMode === 'note') {
        toggleNote(r, c, num);
        return;
    }

    currentBoard[r][c] = currentBoard[r][c] === num ? 0 : num;
    notesBoard[r][c] = [];
    checkResult = null;
    saveGameState();
    renderBoard();
    if (isBoardFull()) {
        if (isSolved()) {
            stopTimer();
            saveHighscore();
            clearSavedGame();
            setTimeout(() => alert(`Grattis! Du löste sudokut och fick ${calculateScore()} poäng!`), 100);
        } else {
            registerBoardMistakes();
            setTimeout(() => alert('Fel lösning!'), 100);
        }
    }
}

function toggleNote(r, c, num) {
    if (currentBoard[r][c] !== 0) return;

    const notes = notesBoard[r][c];
    if (notes.includes(num)) {
        notesBoard[r][c] = notes.filter(note => note !== num);
    } else if (notes.length < 4) {
        notesBoard[r][c] = [...notes, num].sort((a, b) => a - b);
    }

    checkResult = null;
    saveGameState();
    renderBoard();
}

function clearBoard() {
    if (!confirm('Vill du rensa hela brädet?')) return;

    currentBoard = deepCopy(initialBoard);
    notesBoard = createEmptyNotesBoard();
    selectedCell = null;
    checkResult = null;
    mistakeCount = 0;
    mistakeHistory = [];
    saveGameState();
    renderBoard();
    updateScoreDisplay();
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

function registerBoardMistakes() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (initialBoard[r][c] === 0 && currentBoard[r][c] !== 0 && currentBoard[r][c] !== solution[r][c]) {
                registerMistake(r, c, currentBoard[r][c]);
            }
        }
    }
}


function startTimer(reset = true) {
    if (reset) timer = 0;
    updateTimerDisplay();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        updateTimerDisplay();
        saveGameState();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function saveHighscore() {
    const scores = JSON.parse(localStorage.getItem('sudoku_highscores') || '{}');
    if (!scores[difficulty]) scores[difficulty] = [];

    scores[difficulty].push({
        score: calculateScore(),
        time: timer,
        mistakes: mistakeCount,
        completedAt: new Date().toISOString()
    });
    scores[difficulty].sort((a, b) => {
        const scoreDiff = getScoreValue(b) - getScoreValue(a);
        if (scoreDiff !== 0) return scoreDiff;
        return getTimeValue(a) - getTimeValue(b);
    });
    scores[difficulty] = scores[difficulty].slice(0,5);
    localStorage.setItem('sudoku_highscores', JSON.stringify(scores));
}

function getScoreValue(scoreEntry) {
    if (typeof scoreEntry === 'number') return -scoreEntry;
    return Number.isInteger(scoreEntry.score) ? scoreEntry.score : 0;
}

function getTimeValue(scoreEntry) {
    if (typeof scoreEntry === 'number') return scoreEntry;
    return Number.isInteger(scoreEntry.time) ? scoreEntry.time : 0;
}

function formatTime(totalSeconds) {
    const min = Math.floor(totalSeconds/60);
    const sec = totalSeconds%60;
    return `${min}:${sec.toString().padStart(2,'0')}`;
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
            const li = document.createElement('li');
            li.className = 'list-group-item';
            if (typeof s === 'number') {
                li.textContent = `${i+1}. ${formatTime(s)} (äldre tidresultat)`;
            } else {
                li.textContent = `${i+1}. ${s.score} poäng | ${formatTime(s.time)} | ${s.mistakes || 0} fel`;
            }
            list.appendChild(li);
        });
    }
    openHighscoreModal();
}

function openHighscoreModal() {
    const modal = document.getElementById('highscoreModal');
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeHighscoreModal() {
    const modal = document.getElementById('highscoreModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('bg-light');
    body.classList.toggle('bg-dark');
    body.classList.toggle('text-light');
    saveGameState();
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('difficulty').onchange = e => {
        difficulty = e.target.value;
        newGame();
    };
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.onclick = () => fillCell(Number(btn.dataset.num));
    });
    document.querySelectorAll('input[name="entryMode"]').forEach(input => {
        input.onchange = e => {
            entryMode = e.target.value;
            saveGameState();
        };
    });
    document.getElementById('clearBtn').onclick = clearBoard;
    
    document.getElementById('checkBtn').onclick = () => {
        if (!currentBoard || !solution) return;

        checkResult = Array.from({ length: 9 }, () => Array(9).fill(null));
        let allCorrect = true;
        let boardFull = true;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (initialBoard[r][c] !== 0) continue; // Skip pre-filled cells

                if (currentBoard[r][c] !== 0) {
                    if (currentBoard[r][c] === solution[r][c]) {
                        checkResult[r][c] = 'right';
                    } else {
                        checkResult[r][c] = 'wrong';
                        registerMistake(r, c, currentBoard[r][c]);
                        allCorrect = false;
                    }
                } else {
                    boardFull = false;
                    allCorrect = false;
                }
            }
        }

        renderBoard(); // Re-render with highlights

        if (boardFull && allCorrect) {
            stopTimer();
            saveHighscore();
            clearSavedGame();
            setTimeout(() => alert(`Grattis! Du löste sudokut och fick ${calculateScore()} poäng!`), 100);
        } else {
            // Clear highlights after 5 seconds
            setTimeout(() => {
                checkResult = null;
                renderBoard();
            }, 5000);
        }
    };

    document.getElementById('newGameBtn').onclick = newGame;
    document.getElementById('highscoreBtn').onclick = showHighscore;
    document.getElementById('closeHighscoreBtn').onclick = closeHighscoreModal;
    document.getElementById('highscoreModal').onclick = e => {
        if (e.target.id === 'highscoreModal') closeHighscoreModal();
    };
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeHighscoreModal();
    });
    document.getElementById('toggleTheme').onclick = toggleTheme;
    if (restoreSavedGame()) {
        document.getElementById('difficulty').value = difficulty;
        const modeInput = document.querySelector(`input[name="entryMode"][value="${entryMode}"]`);
        if (modeInput) modeInput.checked = true;
        renderBoard();
        startTimer(false);
    } else {
        newGame();
    }
});

function newGame() {
    generateBoard(difficulty);
    selectedCell = null;
    checkResult = null;
    entryMode = 'value';
    mistakeCount = 0;
    mistakeHistory = [];
    const valueMode = document.getElementById('valueMode');
    if (valueMode) valueMode.checked = true;
    renderBoard();
    startTimer();
    saveGameState();
}
