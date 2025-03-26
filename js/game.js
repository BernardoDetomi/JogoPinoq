// Configuração do canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuração do tamanho do canvas
canvas.width = 800;
canvas.height = 400;

// Configurações do jogo
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
let GAME_SPEED = 5;
const MAX_GAME_SPEED = 12;
const SPEED_INCREMENT = 0.1;
const SPEED_INTERVAL = 1000; // Aumenta a velocidade a cada 1 segundo

// Carregamento de imagens
const sprites = {
    pintinho: new Image(),
    galinha: new Image(),
    galo: new Image(),
    obstaculo: new Image()
};

// Configurar caminhos das imagens
sprites.pintinho.src = 'assets/pintinho.png';
sprites.galinha.src = 'assets/galinha.png';
sprites.galo.src = 'assets/galo.png';
sprites.obstaculo.src = 'assets/obstaculo.png';

// Carregamento de sons
const sounds = {
    jump: new Audio('assets/sounds/jump.mp3'),
    evolution: new Audio('assets/sounds/evolution.mp3'),
    gameOver: new Audio('assets/sounds/gameover.mp3'),
    point: new Audio('assets/sounds/point.mp3')
};

// Classe do jogador (Pintinho)
class Player {
    constructor() {
        this.x = 50;
        this.y = canvas.height - 100;
        this.width = 40;
        this.height = 40;
        this.velocityY = 0;
        this.isJumping = false;
        this.evolutionStage = 0; // 0: Pintinho, 1: Galinha, 2: Galo
        this.sprite = sprites.pintinho;
        this.rotation = 0;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = JUMP_FORCE;
            this.isJumping = true;
            sounds.jump.currentTime = 0;
            sounds.jump.play();
        }
    }

    update(currentTime) {
        // Aplicar gravidade
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Verificar colisão com o chão
        if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.rotation = 0;
        }

        // Atualizar sprite baseado no estágio de evolução
        if (this.evolutionStage === 1) {
            this.sprite = sprites.galinha;
        } else if (this.evolutionStage === 2) {
            this.sprite = sprites.galo;
        }

        // Atualizar rotação durante o pulo
        if (this.isJumping) {
            this.rotation = -0.2;
        }
    }

    draw() {
        // Desenhar sprite com rotação
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        ctx.drawImage(
            this.sprite,
            0, 0,
            this.width, this.height,
            -this.width/2, -this.height/2,
            this.width, this.height
        );
        ctx.restore();
    }
}

// Classe dos obstáculos
class Obstacle {
    constructor() {
        this.width = 30;
        this.height = 50;
        this.x = canvas.width;
        this.y = canvas.height - this.height;
        this.type = Math.random() < 0.3 ? 'high' : 'normal'; // 30% de chance de ser um obstáculo alto
        if (this.type === 'high') {
            this.height = 70;
            this.y = canvas.height - this.height;
        }
    }

    update() {
        this.x -= GAME_SPEED;
    }

    draw() {
        ctx.drawImage(sprites.obstaculo, this.x, this.y, this.width, this.height);
    }
}

// Inicialização do jogo
const player = new Player();
let obstacles = [];
let score = 0;
let gameOver = false;
let lastSpeedIncrease = 0;
let lastObstacleTime = 0;
const MIN_OBSTACLE_INTERVAL = 1500; // Intervalo mínimo entre obstáculos (1.5 segundos)

// Controles
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else {
            player.jump();
        }
    }
});

// Função para criar obstáculos
function createObstacle(currentTime) {
    if (currentTime - lastObstacleTime > MIN_OBSTACLE_INTERVAL) {
        obstacles.push(new Obstacle());
        lastObstacleTime = currentTime;
    }
}

// Função para verificar colisões
function checkCollision(player, obstacle) {
    return player.x < obstacle.x + obstacle.width &&
           player.x + player.width > obstacle.x &&
           player.y < obstacle.y + obstacle.height &&
           player.y + player.height > obstacle.y;
}

// Função para resetar o jogo
function resetGame() {
    player.y = canvas.height - 100;
    player.velocityY = 0;
    player.isJumping = false;
    player.evolutionStage = 0;
    player.sprite = sprites.pintinho;
    player.rotation = 0;
    obstacles = [];
    score = 0;
    gameOver = false;
    GAME_SPEED = 5;
    lastSpeedIncrease = 0;
    lastObstacleTime = 0;
}

// Loop principal do jogo
function gameLoop(timestamp) {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aumentar velocidade do jogo gradualmente
    if (!gameOver && timestamp - lastSpeedIncrease > SPEED_INTERVAL) {
        GAME_SPEED = Math.min(GAME_SPEED + SPEED_INCREMENT, MAX_GAME_SPEED);
        lastSpeedIncrease = timestamp;
    }

    // Atualizar e desenhar jogador
    player.update(timestamp);
    player.draw();

    // Criar e gerenciar obstáculos
    createObstacle(timestamp);
    obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);
    obstacles.forEach(obstacle => {
        obstacle.update();
        obstacle.draw();
        if (checkCollision(player, obstacle)) {
            gameOver = true;
            sounds.gameOver.play();
        }
    });

    // Atualizar pontuação e evolução
    score++;
    if (score % 100 === 0) { // Toca som a cada 100 pontos
        sounds.point.currentTime = 0;
        sounds.point.play();
    }
    if (score % 1000 === 0 && player.evolutionStage < 2) {
        player.evolutionStage++;
        sounds.evolution.currentTime = 0;
        sounds.evolution.play();
    }

    // Desenhar pontuação
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Pontuação: ${Math.floor(score/10)}`, 20, 30);
    ctx.fillText(`Velocidade: ${Math.floor(GAME_SPEED)}`, 20, 60);

    // Mostrar game over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Pressione ESPAÇO para reiniciar', canvas.width/2 - 150, canvas.height/2 + 40);
    }

    // Continuar loop
    requestAnimationFrame(gameLoop);
}

// Iniciar o jogo
gameLoop(); 