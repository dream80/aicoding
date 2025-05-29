// 游戏配置
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// 方块形状定义
const TETROMINOES = {
    'I': {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        className: 'i-block'
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        className: 'j-block'
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        className: 'l-block'
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1]
        ],
        className: 'o-block'
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        className: 's-block'
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        className: 't-block'
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        className: 'z-block'
    }
};

// 游戏状态
let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let currentPiece = null;
let currentPiecePosition = { x: 0, y: 0 };
let nextPiece = null;
let gameInterval = null;
let score = 0;
let level = 1;
let lines = 0;
let isPaused = false;
let isGameOver = false;

// DOM 元素
const gameBoard = document.getElementById('game-board');
const nextPiecePreview = document.getElementById('next-piece');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const linesDisplay = document.getElementById('lines');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const themeToggle = document.getElementById('theme-toggle');

// 初始化游戏板
function initializeBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        for (let j = 0; j < BOARD_WIDTH; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            gameBoard.appendChild(cell);
        }
    }
}

// 更新游戏板显示
function updateBoard() {
    const cells = gameBoard.getElementsByClassName('cell');
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const index = y * BOARD_WIDTH + x;
            cells[index].className = 'cell';
            if (board[y][x]) {
                cells[index].classList.add(board[y][x]);
            }
        }
    }

    if (currentPiece) {
        const shape = TETROMINOES[currentPiece].shape;
        const className = TETROMINOES[currentPiece].className;
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardX = currentPiecePosition.x + x;
                    const boardY = currentPiecePosition.y + y;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT) {
                        const index = boardY * BOARD_WIDTH + boardX;
                        cells[index].classList.add(className);
                    }
                }
            });
        });
    }
}

// 更新下一个方块预览
function updateNextPiecePreview() {
    nextPiecePreview.innerHTML = '';
    if (nextPiece) {
        const shape = TETROMINOES[nextPiece].shape;
        const className = TETROMINOES[nextPiece].className;
        
        // 计算居中位置
        const offsetY = Math.floor((6 - shape.length) / 2);
        const offsetX = Math.floor((6 - shape[0].length) / 2);
        
        // 创建6x6网格
        for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 6; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                
                // 检查是否在方块形状范围内
                if (y >= offsetY && y < offsetY + shape.length &&
                    x >= offsetX && x < offsetX + shape[0].length) {
                    const pieceY = y - offsetY;
                    const pieceX = x - offsetX;
                    if (shape[pieceY][pieceX]) {
                        cell.classList.add(className);
                    }
                }
                
                nextPiecePreview.appendChild(cell);
            }
        }
    }
}

// 生成新方块
function generatePiece() {
    const pieces = Object.keys(TETROMINOES);
    return pieces[Math.floor(Math.random() * pieces.length)];
}

// 检查碰撞
function checkCollision(pieceType, position) {
    const shape = TETROMINOES[pieceType].shape;
    return shape.some((row, y) => {
        return row.some((value, x) => {
            if (!value) return false;
            const boardX = position.x + x;
            const boardY = position.y + y;
            return boardX < 0 || 
                   boardX >= BOARD_WIDTH || 
                   boardY >= BOARD_HEIGHT ||
                   (boardY >= 0 && board[boardY][boardX]);
        });
    });
}

// 固定当前方块
function lockPiece() {
    const shape = TETROMINOES[currentPiece].shape;
    const className = TETROMINOES[currentPiece].className;
    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiecePosition.y + y;
                if (boardY >= 0) {
                    board[boardY][currentPiecePosition.x + x] = className;
                }
            }
        });
    });
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 重新检查当前行，因为上面的行已经下移
        }
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateScore();
    }
    return linesCleared;
}

// 更新分数显示
function updateScore() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    linesDisplay.textContent = lines;
}

// 旋转方块
function rotatePiece() {
    if (!currentPiece || currentPiece === 'O') return;
    
    const shape = TETROMINOES[currentPiece].shape;
    const newShape = shape[0].map((_, i) =>
        shape.map(row => row[i]).reverse()
    );
    
    const originalShape = TETROMINOES[currentPiece].shape;
    TETROMINOES[currentPiece].shape = newShape;
    
    if (checkCollision(currentPiece, currentPiecePosition)) {
        TETROMINOES[currentPiece].shape = originalShape;
    } else {
        updateBoard();
    }
}

// 移动方块
function movePiece(dx, dy) {
    const newPosition = {
        x: currentPiecePosition.x + dx,
        y: currentPiecePosition.y + dy
    };
    
    if (!checkCollision(currentPiece, newPosition)) {
        currentPiecePosition = newPosition;
        updateBoard();
        return true;
    }
    return false;
}

// 快速下落
function hardDrop() {
    while (movePiece(0, 1)) {}
    lockPiece();
    clearLines();
    spawnNewPiece();
}

// 生成新的方块
function spawnNewPiece() {
    currentPiece = nextPiece || generatePiece();
    nextPiece = generatePiece();
    currentPiecePosition = {
        x: Math.floor((BOARD_WIDTH - TETROMINOES[currentPiece].shape[0].length) / 2),
        y: -2
    };
    
    updateNextPiecePreview();
    
    if (checkCollision(currentPiece, currentPiecePosition)) {
        gameOver();
    } else {
        updateBoard();
    }
}

// 游戏主循环
function gameLoop() {
    if (!isPaused && !isGameOver) {
        if (!movePiece(0, 1)) {
            lockPiece();
            clearLines();
            spawnNewPiece();
        }
    }
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    gameBoard.classList.add('game-over');
    startButton.textContent = '重新开始';
    startButton.disabled = false;
    pauseButton.disabled = true;
}

// 开始新游戏
function startNewGame() {
    // 重置游戏状态
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    isGameOver = false;
    isPaused = false;
    gameBoard.classList.remove('game-over');
    
    // 更新显示
    updateScore();
    initializeBoard();
    
    // 生成第一个方块
    nextPiece = generatePiece();
    spawnNewPiece();
    
    // 设置游戏循环
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / level);
    
    // 更新按钮状态
    startButton.textContent = '重新开始';
    pauseButton.disabled = false;
}

// 暂停/继续游戏
function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '继续' : '暂停';
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
});

// 主题切换
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-theme');
});

// 按钮事件监听
startButton.addEventListener('click', startNewGame);
pauseButton.addEventListener('click', togglePause);

// 初始化游戏板
initializeBoard();