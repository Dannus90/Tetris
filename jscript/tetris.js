const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
const scoreElement = document.getElementById("score");
const increaseSpeed = document.querySelector(".increaseSpeed");
const decreaseSpeed = document.querySelector(".decreaseSpeed");
const showSpeedElement = document.getElementById("dropdown-speed");
const ReloadGameElement = document.querySelector(".reload");
const scoreOutput = document.querySelector(".score-output");
const deleteResultElement = document.querySelector(".delete-result");

const ROW = 20;
const COL = 10;

const SQ = (squareSize = 30);

const VACANT = "WHITE"; //COLOR FOR THE EMPTY SQUARES

//Drawing a square function

function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SQ, y * SQ, SQ, SQ);

    ctx.strokeStyle = "BLACK";
    ctx.strokeRect(x * SQ, y * SQ, SQ, SQ);
}

//Create Board
let board = [];

for (r = 0; r < ROW; r++) {
    board[r] = [];
    for (c = 0; c < COL; c++) {
        board[r][c] = VACANT;
    }
}

// Drawing the board function
function drawBoard() {
    for (r = 0; r < ROW; r++) {
        for (c = 0; c < COL; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

drawBoard();

// The pieces and their colors
const PIECES = [
    [Z, "red"],
    [S, "green"],
    [T, "yellow"],
    [O, "blue"],
    [L, "purple"],
    [I, "cyan"],
    [J, "orange"],
];

// Generate random pieces
function randomPiece() {
    let r = (randomN = Math.floor(Math.random() * PIECES.length)); // 0 - 6 = Arraylength
    return new Piece(PIECES[r][0], PIECES[r][1]);
}

let p = randomPiece();

// Object Piece

function Piece(tetromino, color) {
    this.tetromino = tetromino;
    this.color = color;

    this.tetrominoN = 0; // Starting from first pattern
    this.activeTetromino = this.tetromino[this.tetrominoN];

    // Control pieces
    this.x = 3;
    this.y = -1;
}

// fill function
Piece.prototype.fill = function (color) {
    for (r = 0; r < this.activeTetromino.length; r++) {
        for (c = 0; c < this.activeTetromino.length; c++) {
            // Only drawing occupied squares
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c, this.y + r, color);
            }
        }
    }
};

// Draw a piece to the board

Piece.prototype.draw = function () {
    this.fill(this.color);
};

// Undraw piece after move
Piece.prototype.unDraw = function () {
    this.fill(VACANT);
};

//Move down piece
Piece.prototype.moveDown = function () {
    if (!this.collision(0, 1, this.activeTetromino)) {
        this.unDraw();
        this.y++;
        this.draw();
    } else {
        this.lock();
        p = randomPiece();
    }
};

//Move the piece right
Piece.prototype.moveRight = function () {
    if (!this.collision(1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x++;
        this.draw();
    }
};

//Move the piece left
Piece.prototype.moveLeft = function () {
    if (!this.collision(-1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x--;
        this.draw();
    }
};

// Rotate the piece
Piece.prototype.rotate = function () {
    let nextPattern = this.tetromino[
        (this.tetrominoN + 1) % this.tetromino.length
    ];
    let kick = 0;
    if (this.collision(0, 0, nextPattern)) {
        if (this.x > COL / 2) {
            //right wall
            kick = -1; // need to move the piece to the left
        } else {
            //left wall
            kick = 1; // need to move the piece to theright
        }
    }

    if (!this.collision(kick, 0, nextPattern)) {
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length; //(0+1)%4 => 1
        this.activeTetromino = this.tetromino[this.tetrominoN];
        this.draw();
    }
};

let score = 0;

Piece.prototype.lock = function () {
    for (r = 0; r < this.activeTetromino.length; r++) {
        for (c = 0; c < this.activeTetromino.length; c++) {
            // Skip the vacant squares
            if (!this.activeTetromino[r][c]) {
                continue;
            }
            // Pieces reaching the top = game over
            if (this.y + r < 0) {
                alert("GAME OVER!");
                // stop request animation frame
                console.log(window.localStorage.getItem("score"));
                gameOver = true;

                if (
                    !window.localStorage.getItem("score") ||
                    window.localStorage.getItem("score") < score
                ) {
                    window.localStorage.setItem("score", JSON.stringify(score));
                }

                location.reload();
                break;
            }
            // Locking the piece
            board[this.y + r][this.x + c] = this.color;
        }
    }
    // Remove full rows
    for (r = 0; r < ROW; r++) {
        let isRowFull = true;
        for (c = 0; c < COL; c++) {
            isRowFull = isRowFull && board[r][c] !== VACANT;
        }

        if (isRowFull) {
            //Row Full => move down all rows above it

            for (y = r; y > 1; y--) {
                for (c = 0; c < COL; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            // The top row board [0][..] has no row above it.
            for (c = 0; c < COL; c++) {
                board[0][c] = VACANT;
            }

            // INCREMENT SCORE
            score += 10;
        }
    }

    //update the board
    drawBoard();

    // Update the score
    scoreElement.innerHTML = score;
};

// Collision Detection
Piece.prototype.collision = function (x, y, piece) {
    for (r = 0; r < piece.length; r++) {
        for (c = 0; c < piece.length; c++) {
            // If sqaue is empty, we skip it
            if (!piece[r][c]) {
                continue;
            }
            // Coordinates of the piece after movement
            let newX = this.x + c + x;
            let newY = this.y + r + y;

            // conditions
            if (newX < 0 || newX >= COL || newY >= ROW) {
                return true;
            }
            // skip newY < 0; board[-1] will crush the game
            if (newY < 0) {
                continue;
            }
            // Check if there is a locked piece already in place.
            if (board[newY][newX] !== VACANT) {
                return true;
            }
        }
    }
    return false;
};

// Control the piece

document.addEventListener("keydown", CONTROL);

function CONTROL(e) {
    switch (e.keyCode) {
        case 37:
            p.moveLeft();
            dropStart = Date.now();
            break;
        case 38:
            p.rotate();
            dropStart = Date.now();
            break;
        case 39:
            p.moveRight();
            dropStart = Date.now();
            break;
        case 40:
            p.moveDown();
            dropStart = Date.now();
            break;
    }
}

// drop piece every 1 sec, controll speed buttons, update speed innerHTML and automatic speed increase

let dropStart = Date.now();
let gameOver = false;
let speed = 1000;
showSpeedElement.innerHTML = speed + "ms";

increaseSpeed.addEventListener("click", () => {
    if (speed > 100) {
        speed -= 50;
        showSpeedElement.innerHTML = speed + "ms";
    }
});

decreaseSpeed.addEventListener("click", () => {
    console.log("clicked");
    if (speed < 1200) {
        speed += 50;
        showSpeedElement.innerHTML = speed + "ms";
    }
});

setInterval(function () {
    if (speed > 100) {
        speed -= 50;
        showSpeedElement.innerHTML = speed + "ms";
    }
    console.log(speed);
}, 15000);

function drop() {
    let now = Date.now();
    let delta = now - dropStart;

    if (delta > speed) {
        p.moveDown();
        dropStart = Date.now();
    }
    if (!gameOver) {
        requestAnimationFrame(drop);
    }
}

// Reload game

ReloadGameElement.addEventListener("click", (e) => {
    location.reload();
});

// Output Top Score
const topScore = window.localStorage.getItem("score");
scoreOutput.innerHTML = topScore;

if (topScore) {
    scoreOutput.innerHTML = topScore;
} else {
    scoreOutput.innerHTML = "No result stored yet!";
}

// Delete result

deleteResultElement.addEventListener("click", () => {
    window.localStorage.clear();
    scoreOutput.innerHTML = "No result stored yet!";
});

drop();
