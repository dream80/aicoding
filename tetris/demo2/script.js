// 游戏常量
const COLS = 10;
const ROWS = 18;
const BLOCK_SIZE = 30;

// 方块形状定义
const SHAPES = [
    // I 形方块
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J 形方块
    [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // L 形方块
    [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // O 形方块
    [
        [1, 1],
        [1, 1]
    ],
    // S 形方块
    [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    // T 形方块
    [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    // Z 形方块
    [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
];

// 方块类型对应的CSS类名
const SHAPES_CLASSES = [
    'i-block',
    'j-block',
    'l-block',
    'o-block',
    's-block',
    't-block',
    'z-block'
];

// 游戏状态
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameInterval = null;
let isPaused = false;
let isGameOver = false;
let dropSpeed = 1000; // 初始下落速度（毫秒）

// DOM 元素
const boardElement = document.getElementById('tetris-board');
const nextPieceElement = document.getElementById('next-piece');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const themeSwitch = document.getElementById('theme-switch');

// 初始化游戏
function initGame() {
    // 创建游戏板
    createBoard();
    
    // 重置游戏状态
    resetGame();
    
    // 事件监听
    document.addEventListener('keydown', handleKeyPress);
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    themeSwitch.addEventListener('change', toggleTheme);

    // 初始化按钮状态
    startButton.innerHTML = '<i class="fas fa-play"></i> 开始';
    startButton.disabled = false;
    pauseButton.disabled = true;
}

// 创建游戏板
function createBoard() {
    // 清空游戏板
    boardElement.innerHTML = '';
    board = [];
    
    // 创建单元格
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'tetris-cell';
            boardElement.appendChild(cell);
            board[row][col] = { element: cell, value: 0 };
        }
    }
    
    // 创建下一个方块预览区域
    nextPieceElement.innerHTML = '';
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const cell = document.createElement('div');
            cell.className = 'tetris-cell';
            nextPieceElement.appendChild(cell);
        }
    }
}

// 重置游戏
function resetGame() {
    // 停止当前游戏
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // 重置游戏状态
    score = 0;
    level = 1;
    lines = 0;
    isPaused = false;
    isGameOver = false;
    dropSpeed = 1000;
    
    // 更新显示
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    // 清空游戏板
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            board[row][col].value = 0;
            board[row][col].element.className = 'tetris-cell';
        }
    }
    
    // 移除游戏结束效果
    boardElement.classList.remove('game-over');
    // 移除游戏结束提示
    const gameOverMessage = boardElement.querySelector('.game-over-message');
    if (gameOverMessage) {
        boardElement.removeChild(gameOverMessage);
    }
    
    // 生成新方块
    createNewPiece();
    createNewPiece();
    
    // 更新按钮状态
    startButton.disabled = false;
    pauseButton.disabled = true;
}

// 开始游戏
function startGame() {
    // 无论游戏状态如何，点击重新开始都应该重置游戏
    resetGame();
    
    if (!gameInterval) {
        // 确保游戏开始时立即移动一次
        moveDown();
        
        gameInterval = setInterval(() => {
            moveDown();
        }, dropSpeed);
        
        // 更新按钮状态
        startButton.innerHTML = '<i class="fas fa-rotate-right"></i> 重开';
        startButton.disabled = false;
        pauseButton.disabled = false;
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        isPaused = false;
    }
}

// 暂停/继续游戏
function togglePause() {
    if (isGameOver) return;
    
    if (isPaused) {
        // 继续游戏
        gameInterval = setInterval(() => {
            moveDown();
        }, dropSpeed);
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        startButton.disabled = false;
    } else {
        // 暂停游戏
        clearInterval(gameInterval);
        gameInterval = null;
        pauseButton.innerHTML = '<i class="fas fa-play"></i> 继续';
        startButton.disabled = true;
    }
    
    isPaused = !isPaused;
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    gameInterval = null;
    isGameOver = true;
    
    // 添加游戏结束效果
    boardElement.classList.add('game-over');
    
    // 清空预览区域
    const nextPieceCells = nextPieceElement.querySelectorAll('.tetris-cell');
    nextPieceCells.forEach(cell => {
        cell.className = 'tetris-cell';
    });
    
    // 更新按钮状态
    startButton.disabled = false;
    startButton.textContent = '重开始';
    pauseButton.disabled = true;
    
    // 显示游戏结束提示
    const gameOverMessage = document.createElement('div');
    gameOverMessage.className = 'game-over-message';
    gameOverMessage.textContent = '游戏结束';
    boardElement.appendChild(gameOverMessage);
}

// 创建新方块
function createNewPiece() {
    // 如果游戏已结束，不再生成新方块
    if (isGameOver) return;
    
    // 将下一个方块设为当前方块
    currentPiece = nextPiece;
    
    // 生成新的下一个方块
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    nextPiece = {
        shape: SHAPES[shapeIndex],
        class: SHAPES_CLASSES[shapeIndex],
        row: -2, // 从游戏板上方开始
        col: Math.floor((COLS - SHAPES[shapeIndex][0].length) / 2),
        shapeIndex: shapeIndex
    };
    
    // 如果是游戏开始，当前方块为空，则再生成一个当前方块
    if (!currentPiece) {
        clearPiece(); // 清除之前的方块
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        currentPiece = {
            shape: SHAPES[shapeIndex],
            class: SHAPES_CLASSES[shapeIndex],
            row: -2, // 从游戏板上方开始
            col: Math.floor((COLS - SHAPES[shapeIndex][0].length) / 2),
            shapeIndex: shapeIndex
        };
        // 初始化时不检查游戏结束
        drawPiece();
        drawNextPiece();
        return;
    }
    
    // 检查游戏是否结束
    // 只有当方块完全进入游戏区域时才检查
    if (currentPiece.row >= 0 && !canMove(currentPiece.shape, currentPiece.row, currentPiece.col)) {
        gameOver();
        return;
    }
    
    // 检查是否有方块超出游戏区域顶部
    // 只检查已经固定的方块
    for (let col = 0; col < COLS; col++) {
        if (board[0][col].value === 1) {
            gameOver();
            return;
        }
    }
    
    // 绘制方块
    drawPiece();
    drawNextPiece();
}

// 绘制当前方块
function drawPiece() {
    // 清除之前的方块
    clearPiece();
    
    // 绘制新方块
    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardRow = currentPiece.row + row;
                const boardCol = currentPiece.col + col;
                
                // 确保在游戏板范围内
                if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                    board[boardRow][boardCol].element.classList.add(currentPiece.class);
                }
            }
        }
    }
}

// 清除当前方块
function clearPiece() {
    if (!currentPiece) return;
    
    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardRow = currentPiece.row + row;
                const boardCol = currentPiece.col + col;
                
                // 确保在游戏板范围内
                if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                    // 只清除当前活动方块的样式
                    board[boardRow][boardCol].element.classList.remove(currentPiece.class);
                }
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    // 清除预览区域
    const cells = nextPieceElement.querySelectorAll('.tetris-cell');
    cells.forEach(cell => {
        cell.className = 'tetris-cell';
    });
    
    // 绘制下一个方块
    const shape = nextPiece.shape;
    
    // 计算方块的实际尺寸
    let maxRow = 0;
    let maxCol = 0;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                maxRow = Math.max(maxRow, row);
                maxCol = Math.max(maxCol, col);
            }
        }
    }
    
    // 计算偏移量，确保方块居中且完整显示
    const rowOffset = Math.floor((4 - (maxRow + 1)) / 2);
    const colOffset = Math.floor((4 - (maxCol + 1)) / 2);
    
    // 绘制方块
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const index = (row + rowOffset) * 4 + (col + colOffset);
                if (cells[index] && index >= 0 && index < 16) {
                    cells[index].classList.add(nextPiece.class);
                }
            }
        }
    }
}

// 检查是否可以移动
function canMove(shape, newRow, newCol) {
    return !shape.some((row, y) => {
        return row.some((value, x) => {
            if (!value) return false;
            const boardRow = newRow + y;
            const boardCol = newCol + x;
            
            // 检查是否超出边界
            if (boardCol < 0 || boardCol >= COLS || boardRow >= ROWS) {
                return true; // 超出边界
            }
            
            // 检查是否与已固定的方块重叠
            // 注意：即使在顶部（boardRow < 0）也要检查是否有方块
            if (boardRow >= 0 && board[boardRow][boardCol].value === 1) {
                return true; // 与已有方块重叠
            }
            
            return false;
        });
    });
}

// 向左移动
function moveLeft() {
    if (isPaused || isGameOver) return;
    
    if (canMove(currentPiece.shape, currentPiece.row, currentPiece.col - 1)) {
        clearPiece();
        currentPiece.col--;
        drawPiece();
    }
}

// 向右移动
function moveRight() {
    if (isPaused || isGameOver) return;
    
    if (canMove(currentPiece.shape, currentPiece.row, currentPiece.col + 1)) {
        clearPiece();
        currentPiece.col++;
        drawPiece();
    }
}

// 向下移动
function moveDown() {
    if (isPaused || isGameOver) return;
    
    if (canMove(currentPiece.shape, currentPiece.row + 1, currentPiece.col)) {
        clearPiece();
        currentPiece.row++;
        drawPiece();
    } else {
        // 无法继续下落，固定方块
        fixPiece();
        // 检查并消除完整的行
        checkLines();
        // 创建新方块
        createNewPiece();
    }
}

// 快速下落（直接到底部）
function hardDrop() {
    if (isPaused || isGameOver) return;
    
    let dropDistance = 0;
    while (canMove(currentPiece.shape, currentPiece.row + dropDistance + 1, currentPiece.col)) {
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        clearPiece();
        currentPiece.row += dropDistance;
        drawPiece();
        // 延迟一帧再执行固定和消除操作，确保方块能够显示出来
        requestAnimationFrame(() => {
            fixPiece();
            checkLines();
            createNewPiece();
        });
    }
}

// 固定方块
function fixPiece() {
    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardRow = currentPiece.row + row;
                const boardCol = currentPiece.col + col;
                
                // 确保在游戏板范围内
                if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                    board[boardRow][boardCol].value = 1;
                    board[boardRow][boardCol].element.className = 'tetris-cell ' + currentPiece.class;
                }
            }
        }
    }
}

// 检查并消除完整的行
function checkLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        let isLineComplete = true;
        
        // 检查当前行是否已满
        for (let col = 0; col < COLS; col++) {
            if (board[row][col].value === 0) {
                isLineComplete = false;
                break;
            }
        }
        
        if (isLineComplete) {
            // 添加行消除动画
            for (let col = 0; col < COLS; col++) {
                board[row][col].element.classList.add('line-complete');
            }
            
            // 延迟一下，让动画效果显示出来
            setTimeout(() => {
                // 消除该行并向下移动上面的行
                for (let r = row; r > 0; r--) {
                    for (let c = 0; c < COLS; c++) {
                        board[r][c].value = board[r-1][c].value;
                        board[r][c].element.className = board[r-1][c].element.className;
                    }
                }
                
                // 清空最顶部的行
                for (let c = 0; c < COLS; c++) {
                    board[0][c].value = 0;
                    board[0][c].element.className = 'tetris-cell';
                }
                
                // 由于行消除后，当前检查的行需要重新检查
                row++;
            }, 200);
            
            linesCleared++;
        }
    }
    
    // 更新分数和等级
    if (linesCleared > 0) {
        // 更新消除的行数
        lines += linesCleared;
        linesElement.textContent = lines;
        
        // 根据消除的行数计算得分
        // 1行=100分，2行=300分，3行=500分，4行=800分
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;
        scoreElement.textContent = score;
        
        // 每消除10行升一级，提高游戏速度
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            
            // 提高游戏速度
            dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
            if (gameInterval) {
                clearInterval(gameInterval);
                gameInterval = setInterval(() => {
                    moveDown();
                }, dropSpeed);
            }
        }
    }
}

// 旋转方块
function rotatePiece() {
    if (isPaused || isGameOver || currentPiece.shapeIndex === 3) return; // O形方块不需要旋转
    
    // 创建旋转后的新形状
    const shape = currentPiece.shape;
    const newShape = [];
    
    // 执行90度顺时针旋转
    for (let col = 0; col < shape[0].length; col++) {
        newShape[col] = [];
        for (let row = shape.length - 1; row >= 0; row--) {
            newShape[col].push(shape[row][col]);
        }
    }
    
    // 检查旋转后是否可以放置，包括边界检查
    if (canMove(newShape, currentPiece.row, currentPiece.col)) {
        clearPiece();
        currentPiece.shape = newShape;
        drawPiece();
    } else {
        // 尝试左右移动来适应旋转（墙踢）
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (canMove(newShape, currentPiece.row, currentPiece.col + kick)) {
                clearPiece();
                currentPiece.shape = newShape;
                currentPiece.col += kick;
                drawPiece();
                return;
            }
        }
    }
}

// 处理键盘事件
function handleKeyPress(event) {
    if (isGameOver) return;
    
    switch (event.key) {
        case 'ArrowLeft':
            moveLeft();
            break;
        case 'ArrowRight':
            moveRight();
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            hardDrop();
            break;
    }
}

// 切换主题
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);