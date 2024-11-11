const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// 遊戲變數
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX;
let ballRadius = 10;
let x, y, dx, dy;
let score = 0;
let lives = 3; // 設定初始生命數量
let bricks = [];
let brickRowCount;
let brickColumnCount;
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;
let isGameRunning = false;
let isGameWon = false; // 新增變數來追蹤遊戲是否過關
let timer; // 計時器
let timeLimit = 60; // 限定時間（秒）
let item; // 道具
let itemDuration = 5000; // 道具持續時間（毫秒）
let itemActive = false; // 道具是否啟用
let comboCount = 0; // 連擊計數
let currentItem = ""; // 當前獲得的道具
let rewardMessage = ""; // 獎勵信息

// 音效
const hitSound = new Audio('hit.mp3'); // 擊打磚塊音效
const backgroundMusic = new Audio('background.mp3'); // 背景音樂
backgroundMusic.loop = true; // 循環播放背景音樂

// 背景主題
let theme = "beach";
const themes = {
    beach: '1.jpg',
    forest: '2.jpg',
    nightSky: '3.JPG', // 新增夜空主題
};

// 隨機生成磚塊
function createBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let hitCount = 1; // 默認為一次擊打
            if (Math.random() < 0.3) { // 30% 機率生成特殊磚塊
                hitCount = 3; // 需要三次擊打的磚塊
            }
            bricks[c][r] = { x: 0, y: 0, status: 1, hitCount: hitCount }; // 不再使用隱藏磚塊
        }
    }
}

// 開始遊戲
document.getElementById("startButton").addEventListener("click", function() {
    const difficulty = document.getElementById("difficulty").value;
    setDifficulty(difficulty);
    setTheme(document.getElementById("theme").value);
    startGame();
});

// 設定難度
function setDifficulty(level) {
    if (level === "easy") {
        dx = 2;
        dy = -2;
        brickRowCount = 3;
        brickColumnCount = 3;
        lives = 3; // 設定生命數量
        currentItem = ""; // 確保簡單模式不會有道具
    } else if (level === "medium") {
        dx = 3;
        dy = -3;
        brickRowCount = 4;
        brickColumnCount = 4;
        lives = 2;
    } else if (level === "hard") {
        dx = 4;
        dy = -4;
        brickRowCount = 5;
        brickColumnCount = 5;
        lives = 1;
    }
}

// 設定主題
function setTheme(selectedTheme) {
    theme = selectedTheme;
}

// 繪製背景
function drawBackground() {
    const backgroundImage = new Image();
    backgroundImage.src = themes[theme];
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

// 開始遊戲
function startGame() {
    score = 0;
    paddleX = (canvas.width - paddleWidth) / 2;
    x = canvas.width / 2;
    y = canvas.height - 30;
    createBricks();
    isGameRunning = true;
    isGameWon = false; // 重置過關狀態
    backgroundMusic.play(); // 播放背景音樂
    document.getElementById("score").innerText = "分數: " + score + " 生命: " + lives;

    // 初始化計時器
    timer = timeLimit;
    startTimer(); // 開始計時

    draw();
}

// 開始計時
function startTimer() {
    const countdownInterval = setInterval(() => {
        if (isGameRunning) {
            timer--;
            // 更新計時器顯示
            document.getElementById("timer").innerText = "剩餘時間: " + timer + "秒";
            if (timer <= 0) {
                clearInterval(countdownInterval);
                drawGameOver(); // 時間到顯示遊戲結束
            }
        } else {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

// 控制擋板
document.addEventListener("mousemove", function(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(relativeX - paddleWidth / 2, canvas.width - paddleWidth));
    }
});

// 碰撞檢測
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    hitSound.play(); // 播放擊打音效
                    b.hitCount--;
                    comboCount++; // 增加連擊計數
                    if (b.hitCount <= 0) {
                        b.status = 0; // 磚塊被擊中
                        score++;
                        if (score % 10 === 0 && document.getElementById("difficulty").value === "medium") {
                            // 獎勵時間延長
                            if (Math.random() < 0.5) {
                                lives++; // 增加生命
                                rewardMessage = "獲得一條生命！"; // 設置獎勵信息
                            } else {
                                timer += 5; // 增加時間
                                rewardMessage = "時間延長5秒！"; // 設置獎勵信息
                            }
                        }
                    }
                    document.getElementById("score").innerText = "分數: " + score + " 生命: " + lives;
                    if (score % 5 === 0 && document.getElementById("difficulty").value === "medium") {
                        dropItem(); // 隨機掉落道具
                    }
                    if (score === brickRowCount * brickColumnCount) {
                        drawWinAnimation();
                    }
                }
            }
        }
    }
}

// 隨機掉落道具
function dropItem() {
    if (!item && document.getElementById("difficulty").value === "medium") { // 確保道具不重複掉落
        const itemType = Math.random() < 0.5 ? "expand" : "speed"; // 隨機選擇道具
        item = { type: itemType, x: Math.random() * (canvas.width - 20), y: 0, active: true };
        currentItem = itemType === "expand" ? "擴大擋板" : "加速球"; // 設置當前道具
    }
}

// 繪製道具
function drawItem() {
    if (item && item.active) {
        ctx.beginPath();
        ctx.rect(item.x, item.y, 20, 20);
        ctx.fillStyle = item.type === "expand" ? "green" : "red"; // 擴大擋板的道具為綠色，加速球的道具為紅色
        ctx.fill();
        ctx.closePath();
        item.y += 2; // 道具下落
        if (item.y > canvas.height) {
            item.active = false; // 道具超出畫布後消失
            item = null; // 重置道具
            currentItem = ""; // 清空道具顯示
        }
    }
}

// 碰撞檢測道具
function collisionDetectionItem() {
    if (item && item.active) {
        if (y + ballRadius > item.y && y + ballRadius < item.y + 20 && x > item.x && x < item.x + 20) {
            // 碰到道具
            if (item.type === "expand") {
                paddleWidth *= 1.5; // 擴大擋板
                setTimeout(() => {
                    paddleWidth /= 1.5; // 恢復擋板大小
                }, itemDuration); // 道具持續時間
            } else if (item.type === "speed") {
                dx *= 1.5; // 加速球
                dy *= 1.5;
                setTimeout(() => {
                    dx = Math.max(dx / 1.5, 2); // 恢復速度，確保不低於簡單模式速度
                    dy = Math.max(dy / 1.5, -2);
                }, itemDuration); // 道具持續時間
            }
            item.active = false; // 道具被使用後消失
            item = null; // 重置道具
            currentItem = ""; // 清空道具顯示
        }
    }
}

// 繪製磚塊
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) { // 磚塊可見
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                
                // 根據主題設定磚塊顏色
                if (theme === "beach") {
                    ctx.fillStyle = b.hitCount > 1 ? "#FFFFFF" : "#0095DD"; // 白色和藍色
                } else if (theme === "forest") {
                    ctx.fillStyle = b.hitCount > 1 ? "#8B4513" : "#228B22"; // 棕色和綠色
                } else if (theme === "nightSky") {
                    ctx.fillStyle = b.hitCount > 1 ? "#FFD700" : "#00008B"; // 金色和深藍色
                }
                
                ctx.fill();
                ctx.closePath();
                
                // 顯示需要擊打的次數
                ctx.fillStyle = "#000000"; // 字體顏色為黑色
                ctx.font = "16px Arial";
                ctx.fillText(b.hitCount, brickX + brickWidth / 2 - 5, brickY + brickHeight / 2 + 5);
            }
        }
    }
}

// 繪製擋板
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// 繪製球
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// 繪製尾跡效果
function drawBallTrail() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 150, 255, 0.5)"; // 藍色尾跡
    ctx.fill();
    ctx.closePath();
}

// 繪製過關動畫
function drawWinAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "30px Arial";
    ctx.fillText("過關！", canvas.width / 2 - 50, canvas.height / 2);
    isGameRunning = false; // 停止遊戲
}

// 繪製失敗畫面
function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "30px Arial";
    ctx.fillText("遊戲失敗！", canvas.width / 2 - 80, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("你的分數是：" + score, canvas.width / 2 - 60, canvas.height / 2 + 20);
    ctx.fillText("按下空白鍵重新開始", canvas.width / 2 - 100, canvas.height / 2 + 60);
    isGameRunning = false; // 停止遊戲
}

// 繪製遊戲
function draw() {
    if (!isGameRunning) return;

    drawBackground();
    drawBricks();
    drawBallTrail(); // 繪製尾跡效果
    drawBall();
    drawPaddle();
    drawItem(); // 繪製道具
    collisionDetection();
    collisionDetectionItem(); // 碰撞檢測道具

    // 球的邊界檢測
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
            comboCount = Math.max(0, comboCount - 1); // 擋板反彈時清除連擊
        } else {
            if (lives > 0) { // 確保生命不會變成負數
                lives--;
                document.getElementById("score").innerText = "分數: " + score + " 生命: " + lives;
            }
            if (lives <= 0) {
                drawGameOver(); // 顯示失敗畫面
            } else {
                resetBallToPaddle(); // 將球重置到擋板上
            }
        }
    }

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

// 將球重置到擋板上
function resetBallToPaddle() {
    x = paddleX + paddleWidth / 2;
    y = canvas.height - paddleHeight - ballRadius;
}

// 監聽空白鍵事件重新開始遊戲
document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        if (!isGameRunning) {
            startGame(); // 重新開始遊戲
        }
    }
});