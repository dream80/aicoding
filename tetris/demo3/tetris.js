class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.nextCanvas = document.getElementById('next-piece');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.colors = [
            null,
            '#FF0D72',
            '#0DC2FF',
            '#0DFF72',
            '#F538FF',
            '#FF8E0D',
            '#FFE138',
            '#3877FF'
        ];

        this.pieces = [
            [[1, 1, 1, 1]],
            [[2, 2], [2, 2]],
            [[0, 3, 0], [3, 3, 3]],
            [[0, 4, 4], [4, 4, 0]],
            [[5, 5, 0], [0, 5, 5]],
            [[6, 0, 0], [6, 6, 6]],
            [[0, 0, 7], [7, 7, 7]]
        ];

        this.bindControls();
        this.initButtons();
    }

    initButtons() {
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('mode-btn').addEventListener('click', () => this.toggleColorMode());
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            // 记录键盘事件到控制台，帮助调试
            console.log('键盘事件:', e.key, e.code, e.keyCode);

            switch (e.key) {
                case 'ArrowLeft':
                case 'Left': // 兼容旧版浏览器
                    this.moveCurrentPiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 'Right': // 兼容旧版浏览器
                    this.moveCurrentPiece(1, 0);
                    break;
                case 'ArrowDown':
                case 'Down': // 兼容旧版浏览器
                    this.moveCurrentPiece(0, 1);
                    break;
                case 'ArrowUp':
                case 'Up': // 兼容旧版浏览器
                    this.rotateCurrentPiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });
        
        // 添加按键码的支持，以增加兼容性
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.isPaused) return;
            
            // 使用keyCode作为备选方案
            switch (e.keyCode) {
                case 37: // 左箭头
                    this.moveCurrentPiece(-1, 0);
                    break;
                case 39: // 右箭头
                    this.moveCurrentPiece(1, 0);
                    break;
                case 40: // 下箭头
                    this.moveCurrentPiece(0, 1);
                    break;
                case 38: // 上箭头
                    this.rotateCurrentPiece();
                    break;
                case 32: // 空格
                    this.hardDrop();
                    break;
            }
        });
    }

    createPiece() {
        const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        return {
            matrix: piece,
            pos: {x: Math.floor(this.cols / 2) - Math.floor(piece[0].length / 2), y: 0}
        };
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
    }

    drawMatrix(matrix, offset, ctx = this.ctx) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (ctx === this.nextCtx) {
                        const blockSize = 25;
                        ctx.fillStyle = this.colors[value];
                        ctx.fillRect(x * blockSize + offset.x, y * blockSize + offset.y, blockSize, blockSize);
                        ctx.strokeStyle = '#000';
                        ctx.strokeRect(x * blockSize + offset.x, y * blockSize + offset.y, blockSize, blockSize);
                    } else {
                        this.drawBlock(x + offset.x, y + offset.y, this.colors[value]);
                    }
                }
            });
        });
    }

    draw() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawMatrix(this.board, {x: 0, y: 0});
        if (this.currentPiece) {
            this.drawMatrix(this.currentPiece.matrix, this.currentPiece.pos);
        }

        this.nextCtx.fillStyle = '#f8f8f8';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        if (this.nextPiece) {
            const offset = {
                x: (this.nextCanvas.width - this.nextPiece.matrix[0].length * 25) / 2,
                y: (this.nextCanvas.height - this.nextPiece.matrix.length * 25) / 2
            };
            this.drawMatrix(this.nextPiece.matrix, offset, this.nextCtx);
        }
    }

    collide() {
        const matrix = this.currentPiece.matrix;
        const pos = this.currentPiece.pos;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    // 检查是否超出游戏边界
                    if (x + pos.x < 0 || x + pos.x >= this.cols || y + pos.y >= this.rows) {
                        return true;
                    }
                    
                    // 检查是否与已有方块重叠
                    // 注意：只有当y+pos.y >= 0时才检查，因为方块可能部分在游戏区域上方（还未完全进入游戏区域）
                    if (y + pos.y >= 0 && this.board[y + pos.y][x + pos.x] !== 0) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    merge() {
        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.board[y + this.currentPiece.pos.y][x + this.currentPiece.pos.x] = value;
                }
            });
        });
    }

    rotate(matrix) {
        // 创建一个新的矩阵，旋转90度（顺时针）
        const rows = matrix.length;
        const cols = matrix[0].length;
        
        // 创建一个新的旋转后的矩阵（列变行，行变列）
        const rotated = [];
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }

    rotateCurrentPiece() {
        if (!this.currentPiece) return;

        // O形方块不需要旋转
        if (this.currentPiece.matrix.length === 2 && this.currentPiece.matrix[0].length === 2) return;

        // 保存原始状态，以便在旋转失败时恢复
        const originalMatrix = JSON.parse(JSON.stringify(this.currentPiece.matrix));
        const originalPos = {x: this.currentPiece.pos.x, y: this.currentPiece.pos.y};

        // 使用map方法实现矩阵旋转（顺时针90度）
        const rotated = this.currentPiece.matrix[0].map((_, i) =>
            this.currentPiece.matrix.map(row => row[i]).reverse()
        );

        this.currentPiece.matrix = rotated;

        // 定义位置调整尝试
        const kicks = [
            {x: 0, y: 0},   // 原位置
            {x: -1, y: 0},  // 左移
            {x: 1, y: 0},   // 右移
            {x: 0, y: -1},  // 上移
            {x: -1, y: -1}, // 左上
            {x: 1, y: -1},  // 右上
            {x: -2, y: 0},  // 左移两格
            {x: 2, y: 0},   // 右移两格
            {x: 0, y: -2}   // 上移两格
        ];

        // 针对I形方块的特殊处理
        if (this.currentPiece.matrix.length === 1 || this.currentPiece.matrix[0].length === 1) {
            kicks.push(
                {x: -2, y: -1}, // 左上两格
                {x: 2, y: -1},  // 右上两格
                {x: -1, y: -2}, // 左上斜向
                {x: 1, y: -2}   // 右上斜向
            );
        }

        // 尝试不同的位置调整
        let rotationSuccessful = false;
        for (const kick of kicks) {
            this.currentPiece.pos.x = originalPos.x + kick.x;
            this.currentPiece.pos.y = originalPos.y + kick.y;
            
            if (!this.collide()) {
                rotationSuccessful = true;
                break;
            }
        }

        // 如果所有调整都失败，恢复原始状态
        if (!rotationSuccessful) {
            this.currentPiece.matrix = originalMatrix;
            this.currentPiece.pos.x = originalPos.x;
            this.currentPiece.pos.y = originalPos.y;
            return;
        }

        // 确保方块在边界内
        this.ensureWithinBoundaries();
        
        // 更新游戏显示
        this.draw();
    }

    ensureWithinBoundaries() {
        // 确保方块不会超出左边界
        if (this.currentPiece.pos.x < 0) {
            this.currentPiece.pos.x = 0;
        }
        
        // 确保方块不会超出右边界
        const maxX = this.cols - this.currentPiece.matrix[0].length;
        if (this.currentPiece.pos.x > maxX) {
            this.currentPiece.pos.x = maxX;
        }
    }
    
    moveCurrentPiece(offsetX, offsetY) {
        this.currentPiece.pos.x += offsetX;
        this.currentPiece.pos.y += offsetY;
        if (this.collide()) {
            this.currentPiece.pos.x -= offsetX;
            this.currentPiece.pos.y -= offsetY;
            return false;
        }
        return true;
    }

    hardDrop() {
        while (this.moveCurrentPiece(0, 1)) {}
        this.merge();
        this.checkLines();
        this.reset_piece();
    }

    checkLines() {
        let linesCleared = 0;
        outer: for (let y = this.board.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }

            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            y++;
            linesCleared++;
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [40, 100, 300, 1200][linesCleared - 1] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = 1000 * Math.pow(0.85, this.level - 1);

            document.getElementById('score').textContent = this.score;
            document.getElementById('level').textContent = this.level;
            document.getElementById('lines').textContent = this.lines;
        }
    }

    reset_piece() {
        this.currentPiece = this.nextPiece || this.createPiece();
        this.nextPiece = this.createPiece();

        if (this.collide()) {
            this.gameOver = true;
            alert('游戏结束！最终得分：' + this.score);
        }
    }

    update(time = 0) {
        if (this.gameOver || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            if (!this.moveCurrentPiece(0, 1)) {
                this.merge();
                this.checkLines();
                this.reset_piece();
            }
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropInterval = 1000;
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('lines').textContent = '0';
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.update();
    }

    start() {
        if (!this.currentPiece) {
            this.reset();
        } else if (this.isPaused) {
            this.togglePause();
        }
    }

    togglePause() {
        if (this.gameOver) return;
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? '继续' : '暂停';
        if (!this.isPaused) {
            this.lastTime = performance.now();
            this.update();
        }
    }
    
    toggleColorMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        document.getElementById('mode-btn').textContent = isDarkMode ? '浅色模式' : '深色模式';
        this.draw();
    }
}

const game = new Tetris();