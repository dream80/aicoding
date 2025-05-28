// 俄罗斯方块游戏类
class TetrisGame {
    constructor() {
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.leaderboard = [];
        
        // 音效和音乐
        this.sounds = {
            move: new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'),
            rotate: new Audio('https://www.soundjay.com/misc/sounds/typewriter-key-1.wav'),
            drop: new Audio('https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav'),
            clear: new Audio('https://www.soundjay.com/misc/sounds/magic-chime-02.wav'),
            gameOver: new Audio('https://www.soundjay.com/misc/sounds/fail-trombone-02.wav')
        };
        
        this.backgroundMusic = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-02.wav');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
        
        // 设置音效音量
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5;
        });
        
        // 游戏板尺寸
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        
        // 方块类型定义
        this.pieces = {
            'I': {
                shape: [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                color: 'block-i'
            },
            'O': {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: 'block-o'
            },
            'T': {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-t'
            },
            'S': {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: 'block-s'
            },
            'Z': {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-z'
            },
            'J': {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-j'
            },
            'L': {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: 'block-l'
            }
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.loadHighScore();
        this.loadLeaderboard();
        this.updateDisplay();
        this.updateLeaderboard();
    }
    
    createBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        // 初始化游戏板数组
        this.board = [];
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                this.board[row][col] = 0;
                
                // 创建DOM元素
                const cell = document.createElement('div');
                cell.className = 'tetris-block';
                cell.id = `cell-${row}-${col}`;
                boardElement.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        // 按钮事件
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('music-toggle').addEventListener('click', () => this.toggleMusic());
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
        
        // 用户名输入框回车事件
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        // 暂停状态下只允许暂停/继续操作
        if (this.gamePaused) {
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                this.movePiece(-1, 0);
                this.playSound('move');
                break;
            case 'd':
            case 'arrowright':
                this.movePiece(1, 0);
                this.playSound('move');
                break;
            case 's':
            case 'arrowdown':
                this.movePiece(0, 1);
                break;
            case 'w':
            case 'arrowup':
                this.rotatePiece();
                this.playSound('rotate');
                break;
            case ' ':
                this.hardDrop();
                this.playSound('drop');
                break;
            case 'p':
                this.togglePause();
                break;
        }
        e.preventDefault();
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        
        this.createBoard();
        this.spawnPiece();
        this.spawnNextPiece();
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('game-status').textContent = '游戏进行中';
        document.getElementById('game-status').className = 'text-lg font-bold text-green-400 pulse-animation';
        
        // 播放背景音乐
        if (this.musicEnabled) {
            this.backgroundMusic.play().catch(e => {
                console.log('Background music play failed:', e);
            });
        }
        
        this.lastTime = performance.now();
        this.gameLoop();
        this.updateDisplay();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        if (!this.gamePaused) {
            this.dropTime += deltaTime;
            
            if (this.dropTime > this.dropInterval) {
                this.dropPiece();
                this.dropTime = 0;
            }
        }
        
        this.lastTime = currentTime;
        requestAnimationFrame(() => this.gameLoop());
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = this.createRandomPiece();
        }
        
        this.currentPiece.x = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        
        // 检查游戏是否结束
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
            return;
        }
        
        this.spawnNextPiece();
        this.drawBoard();
    }
    
    spawnNextPiece() {
        this.nextPiece = this.createRandomPiece();
        this.drawNextPiece();
    }
    
    createRandomPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        const piece = this.pieces[randomType];
        
        return {
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            x: 0,
            y: 0
        };
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.drawBoard();
        }
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        if (dropDistance > 0) {
            this.score += dropDistance * 2; // 硬下落额外得分
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
            this.drawBoard();
            this.updateDisplay();
        }
    }
    
    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => {
                // 忽略音频播放错误
                console.log('Audio play failed:', e);
            });
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        } else {
            this.drawBoard();
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    dropPiece() {
        if (!this.currentPiece) return;
        
        if (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        } else {
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
        }
        
        this.drawBoard();
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const boardX = newX + col;
                    const boardY = newY + row;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardX = this.currentPiece.x + col;
                    const boardY = this.currentPiece.y + row;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++; // 重新检查同一行
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.playSound('clear');
            this.updateDisplay();
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }
    
    drawBoard() {
        // 清空所有格子
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                const cell = document.getElementById(`cell-${row}-${col}`);
                cell.className = 'tetris-block';
                
                // 绘制已放置的方块
                if (this.board[row][col]) {
                    cell.className = `tetris-block ${this.board[row][col]}`;
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        const boardX = this.currentPiece.x + col;
                        const boardY = this.currentPiece.y + row;
                        
                        if (boardY >= 0 && boardY < this.BOARD_HEIGHT && 
                            boardX >= 0 && boardX < this.BOARD_WIDTH) {
                            const cell = document.getElementById(`cell-${boardY}-${boardX}`);
                            cell.className = `tetris-block ${this.currentPiece.color}`;
                        }
                    }
                }
            }
        }
    }
    
    drawNextPiece() {
        const nextPieceElement = document.getElementById('next-piece');
        nextPieceElement.innerHTML = '';
        
        if (!this.nextPiece) return;
        
        // 创建4x4网格，但使用更小的方块
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'w-5 h-5 border border-gray-700';
                cell.style.backgroundColor = '#1f2937'; // 默认背景色
                
                if (this.nextPiece.shape[row] && this.nextPiece.shape[row][col]) {
                    cell.className = `w-5 h-5 border border-gray-700 ${this.nextPiece.color}`;
                }
                
                nextPieceElement.appendChild(cell);
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pause-btn');
        const statusElement = document.getElementById('game-status');
        
        if (this.gamePaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play mr-2"></i>继续';
            statusElement.textContent = '游戏暂停';
            statusElement.className = 'text-lg font-bold text-yellow-400 pulse-animation';
            this.backgroundMusic.pause();
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>暂停';
            statusElement.textContent = '游戏进行中';
            statusElement.className = 'text-lg font-bold text-green-400 pulse-animation';
            if (this.musicEnabled) {
                this.backgroundMusic.play().catch(e => {
                    console.log('Background music play failed:', e);
                });
            }
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        
        // 停止背景音乐
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        
        this.createBoard();
        this.updateDisplay();
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').innerHTML = '<i class="fas fa-pause mr-2"></i>暂停';
        document.getElementById('game-status').textContent = '准备开始';
        document.getElementById('game-status').className = 'text-lg font-bold text-green-400 pulse-animation';
        
        // 清空下一个方块预览
        document.getElementById('next-piece').innerHTML = '';
        
        // 隐藏游戏结束弹窗
        document.getElementById('game-over-modal').classList.add('hidden');
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // 停止背景音乐并播放游戏结束音效
        this.backgroundMusic.pause();
        this.playSound('gameOver');
        
        // 显示游戏结束弹窗
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-lines').textContent = this.lines;
        document.getElementById('game-over-modal').classList.remove('hidden');
        
        // 自动聚焦到用户名输入框
        setTimeout(() => {
            document.getElementById('player-name').focus();
        }, 100);
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('game-status').textContent = '游戏结束';
        document.getElementById('game-status').className = 'text-lg font-bold text-red-400 pulse-animation';
    }
    
    restartGame() {
        document.getElementById('game-over-modal').classList.add('hidden');
        this.resetGame();
        this.startGame();
    }
    
    loadHighScore() {
        const highScore = localStorage.getItem('tetris-high-score') || '0';
        const highScorePlayer = localStorage.getItem('tetris-high-score-player') || '匿名玩家';
        document.getElementById('high-score').textContent = highScore;
        document.getElementById('high-score-player').textContent = highScorePlayer;
    }
    
    loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('tetris-leaderboard');
        if (savedLeaderboard) {
            this.leaderboard = JSON.parse(savedLeaderboard);
        } else {
            // 初始化默认排行榜
            this.leaderboard = [
                { name: '匿名玩家', score: 0, lines: 0, date: new Date().toLocaleDateString() }
            ];
        }
    }
    
    saveLeaderboard() {
        localStorage.setItem('tetris-leaderboard', JSON.stringify(this.leaderboard));
    }
    
    updateLeaderboard() {
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        
        // 按分数排序并取前10名
        const sortedLeaderboard = this.leaderboard
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        sortedLeaderboard.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'flex justify-between items-center text-sm';
            
            const rankColor = index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            index === 2 ? 'text-orange-400' : 'text-gray-400';
            
            entryElement.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span class="${rankColor} font-bold w-6">${index + 1}.</span>
                    <span class="text-white truncate max-w-20" title="${entry.name}">${entry.name}</span>
                </div>
                <div class="text-cyan-400 font-bold">${entry.score}</div>
            `;
            
            leaderboardElement.appendChild(entryElement);
        });
        
        // 如果排行榜为空，显示提示
        if (sortedLeaderboard.length === 0) {
            leaderboardElement.innerHTML = '<div class="text-gray-500 text-center text-sm">暂无记录</div>';
        }
    }
    
    submitScore() {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput.value.trim() || '匿名玩家';
        
        // 添加到排行榜
        const newEntry = {
            name: playerName,
            score: this.score,
            lines: this.lines,
            date: new Date().toLocaleDateString()
        };
        
        this.leaderboard.push(newEntry);
        
        // 更新最高分记录
        const currentHighScore = parseInt(localStorage.getItem('tetris-high-score') || '0');
        if (this.score > currentHighScore) {
            localStorage.setItem('tetris-high-score', this.score.toString());
            localStorage.setItem('tetris-high-score-player', playerName);
            this.loadHighScore();
        }
        
        // 保存排行榜
        this.saveLeaderboard();
        this.updateLeaderboard();
        
        // 清空输入框并隐藏弹窗
        playerNameInput.value = '';
        document.getElementById('game-over-modal').classList.add('hidden');
        
        // 显示提交成功提示
        const statusElement = document.getElementById('game-status');
        statusElement.textContent = '成绩已提交！';
        statusElement.className = 'text-lg font-bold text-green-400 pulse-animation';
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('sound-toggle');
        
        if (this.soundEnabled) {
            soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            soundBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-all duration-300 text-sm';
        } else {
            soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundBtn.className = 'bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-all duration-300 text-sm';
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const musicBtn = document.getElementById('music-toggle');
        
        if (this.musicEnabled) {
            musicBtn.innerHTML = '<i class="fas fa-music"></i>';
            musicBtn.className = 'bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-all duration-300 text-sm';
            // 如果游戏正在进行且未暂停，播放背景音乐
            if (this.gameRunning && !this.gamePaused) {
                this.backgroundMusic.play().catch(e => {
                    console.log('Background music play failed:', e);
                });
            }
        } else {
            musicBtn.innerHTML = '<i class="fas fa-music"></i>';
            musicBtn.className = 'bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-all duration-300 text-sm';
            this.backgroundMusic.pause();
        }
    }
}

// 初始化游戏
const game = new TetrisGame();

// 添加触摸控制支持（移动设备）
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!game.gameRunning || game.gamePaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                game.movePiece(1, 0); // 右移
            } else {
                game.movePiece(-1, 0); // 左移
            }
        }
    } else {
        // 垂直滑动
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                game.movePiece(0, 1); // 下移
            } else {
                game.rotatePiece(); // 旋转
            }
        }
    }
});

// 防止页面滚动
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });