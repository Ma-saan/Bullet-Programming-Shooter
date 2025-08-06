// Main Game Logic
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.cursors = null;
        this.wasd = null;
        this.score = 0;
        this.stage = 1;
        this.enemySpawnTimer = 0;
        this.gameConfig = {
            playerSpeed: 200,
            enemySpeed: 50,
            enemySpawnDelay: 3000
        };
    }

    preload() {
        // Create assets directory if images are not available, create sprites programmatically
        this.createSprites();
        
        // Attempt to load external images if available
        // You can replace these URLs with actual image paths when assets are uploaded
        this.load.image('player-sprite', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <rect width="16" height="16" fill="#00AA00"/>
                <rect x="2" y="2" width="12" height="12" fill="#00FF00"/>
                <rect x="6" y="0" width="4" height="4" fill="#00FF00"/>
                <rect x="13" y="6" width="3" height="4" fill="#FFFF00"/>
            </svg>
        `));
        
        this.load.image('enemy-sprite', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <rect width="16" height="16" fill="#666666"/>
                <rect x="2" y="2" width="12" height="12" fill="#888888"/>
                <polygon points="0,8 8,4 8,12" fill="#AA0000"/>
                <rect x="10" y="6" width="4" height="4" fill="#FF0000"/>
            </svg>
        `));
        
        this.load.image('bullet-sprite', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4" cy="4" r="4" fill="#FFFF00"/>
                <circle cx="4" cy="4" r="2" fill="#FFAA00"/>
            </svg>
        `));
    }

    createSprites() {
        // Player sprite (improved green tank-like design)
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00AA00);
        playerGraphics.fillRect(0, 0, 16, 16);
        playerGraphics.fillStyle(0x00FF00);
        playerGraphics.fillRect(2, 2, 12, 12);
        // Tank cannon
        playerGraphics.fillRect(6, 0, 4, 4);
        // Muzzle flash area
        playerGraphics.fillStyle(0xFFFF00);
        playerGraphics.fillRect(13, 6, 3, 4);
        playerGraphics.generateTexture('player', 16, 16);
        playerGraphics.destroy();

        // Enemy sprite (improved gray aircraft-like design)
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0x666666);
        enemyGraphics.fillRect(0, 0, 16, 16);
        enemyGraphics.fillStyle(0x888888);
        enemyGraphics.fillRect(2, 2, 12, 12);
        // Enemy weapon/nose
        enemyGraphics.fillStyle(0xAA0000);
        enemyGraphics.fillTriangle(0, 8, 8, 4, 8, 12);
        // Enemy engine/detail
        enemyGraphics.fillStyle(0xFF0000);
        enemyGraphics.fillRect(10, 6, 4, 4);
        enemyGraphics.generateTexture('enemy', 16, 16);
        enemyGraphics.destroy();

        // Bullet sprite (improved glowing effect)
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xFFFF00);
        bulletGraphics.fillCircle(4, 4, 4);
        bulletGraphics.fillStyle(0xFFAA00);
        bulletGraphics.fillCircle(4, 4, 2);
        bulletGraphics.generateTexture('bullet', 8, 8);
        bulletGraphics.destroy();

        console.log('Sprites created successfully');
    }

    create() {
        console.log('GameScene create() called');
        
        // Update debug status
        if (document.getElementById('game-status')) {
            document.getElementById('game-status').textContent = 'YES';
        }

        // Initialize physics groups
        this.bullets = this.physics.add.group({
            runChildUpdate: true
        });

        this.enemies = this.physics.add.group();

        // Create player - try to use loaded sprite, fallback to generated one
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        const playerTexture = this.textures.exists('player-sprite') ? 'player-sprite' : 'player';
        this.player = this.physics.add.sprite(100, gameHeight / 2, playerTexture);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(14, 14);
        
        // Add a subtle glow effect to the player
        this.player.postFX.addGlow(0x00FF00, 2);

        console.log('Player created at:', this.player.x, this.player.y, 'using texture:', playerTexture);

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');

        // Set up collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitsEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitsEnemy, null, this);
        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        // Initialize score and stage display
        this.updateHUD();

        // Spawn initial enemies
        this.spawnEnemies();

        // Connect to global game reference for RPA testing
        window.game = this;

        // Add game title and instructions - positioned for full screen
        this.add.text(gameWidth / 2, 60, 'Bullet Programming Shooter', {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(gameWidth / 2, 100, 'WASD: Move | Space: Fire | 🔧 RPA編集: Program bullets', {
            fontSize: '16px',
            fill: '#cccccc',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add background stars for visual appeal
        this.createStarField();

        console.log('Game initialized successfully!');
    }

    createStarField() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Create random stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, gameWidth);
            const y = Phaser.Math.Between(0, gameHeight);
            const star = this.add.circle(x, y, 1, 0xffffff, 0.3 + Math.random() * 0.7);
            
            // Add twinkling effect
            this.tweens.add({
                targets: star,
                alpha: 0.1,
                duration: 2000 + Math.random() * 3000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update(time, delta) {
        // Only handle input if modal is not open
        if (!window.modalManager || !window.modalManager.isModalOpen()) {
            this.handlePlayerMovement();
            
            // Test firing with space key
            if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
                this.testFire();
            }
        }

        // Always update game logic
        this.handleEnemySpawning(time);

        // Update bullets - manual update call for bullets
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.update && typeof bullet.update === 'function') {
                bullet.update();
            }
        });

        // Update enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.update && typeof enemy.update === 'function') {
                enemy.update();
            }
        });
    }

    handlePlayerMovement() {
        const speed = this.gameConfig.playerSpeed;
        
        // Reset velocity
        this.player.setVelocity(0);

        // WASD movement
        if (this.wasd.A.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.wasd.D.isDown) {
            this.player.setVelocityX(speed);
        }

        if (this.wasd.W.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.wasd.S.isDown) {
            this.player.setVelocityY(speed);
        }

        // Add rotation based on movement for better visual feedback
        if (this.wasd.W.isDown) {
            this.player.rotation = -Math.PI / 12;
        } else if (this.wasd.S.isDown) {
            this.player.rotation = Math.PI / 12;
        } else {
            this.player.rotation = 0;
        }
    }

    handleEnemySpawning(time) {
        if (time > this.enemySpawnTimer) {
            this.spawnEnemy();
            this.enemySpawnTimer = time + this.gameConfig.enemySpawnDelay;
        }
    }

    spawnEnemy() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        const x = Phaser.Math.Between(gameWidth + 20, gameWidth + 100);
        const y = Phaser.Math.Between(50, gameHeight - 50);
        
        const enemy = new Enemy(this, x, y);
        this.enemies.add(enemy);
    }

    spawnEnemies() {
        // Spawn initial enemies
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 1000);
        }
    }

    testFire(program = null) {
        console.log('testFire called');
        
        if (!program && window.rpaProgram) {
            // Find the first valid program
            for (let i = 0; i < window.rpaProgram.slots.length; i++) {
                const validation = window.rpaProgram.validateProgram(i);
                if (validation.valid) {
                    program = window.rpaProgram.getProgram(i);
                    console.log('Using program from slot', i + 1, ':', program);
                    break;
                }
            }
        }

        if (!program || program.length === 0) {
            console.log('No valid program found, creating default bullet...');
            // Create a default bullet that moves to the right
            program = [
                { type: 'when', action: 'immediate', toString: () => '即座に' },
                { type: 'do', action: 'destroy', toString: () => '消える' }
            ];
        }

        // Create and fire bullet
        const direction = 0; // Fire to the right (0 radians)
        const startX = this.player.x + 20;
        const startY = this.player.y;
        
        console.log('Creating bullet at:', startX, startY, 'direction:', direction);
        
        const bullet = createProgrammedBullet(
            this,
            startX,
            startY,
            direction,
            program
        );

        // Make sure the bullet is added to the bullets group
        this.bullets.add(bullet);
        
        console.log('Bullet added to bullets group. Current bullet count:', this.bullets.children.entries.length);
        console.log('Bullet velocity:', bullet.body.velocity.x, bullet.body.velocity.y);

        // Visual feedback for firing
        this.cameras.main.shake(100, 0.005);
        
        // Muzzle flash effect
        const muzzleFlash = this.add.circle(this.player.x + 20, this.player.y, 8, 0xFFFF00, 0.8);
        this.tweens.add({
            targets: muzzleFlash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 100,
            onComplete: () => muzzleFlash.destroy()
        });
        
        // Show program info
        const programText = program.map(node => 
            typeof node.toString === 'function' ? node.toString() : node.action
        ).join(' → ');
        console.log('Fired bullet with program:', programText);
    }

    bulletHitsEnemy(bullet, enemy) {
        console.log('Bullet hit enemy');
        if (bullet.onEnemyCollision) {
            bullet.onEnemyCollision(enemy);
        } else {
            // Default behavior
            this.addScore(10);
            enemy.takeDamage(1);
            if (bullet.destroy) {
                bullet.destroy();
            }
        }
    }

    playerHitsEnemy(player, enemy) {
        console.log('Player hit enemy');
        // Player takes damage or game over logic
        this.cameras.main.shake(200, 0.02);
        
        // Visual feedback
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            player.clearTint();
        });
        
        // Destroy enemy on contact
        enemy.takeDamage(999);
        
        // Reduce score as penalty
        this.addScore(-5);
    }

    onWorldBounds(event) {
        const body = event.body;
        const gameObject = body.gameObject;
        
        console.log('World bounds collision:', gameObject.constructor.name);
        
        if (gameObject instanceof Bullet) {
            gameObject.onWallCollision();
        }
    }

    addScore(points) {
        this.score += points;
        if (this.score < 0) this.score = 0;
        this.updateHUD();
        
        // Visual feedback for scoring
        const gameWidth = this.sys.game.config.width;
        const color = points > 0 ? '#4CAF50' : '#F44336';
        const scoreText = this.add.text(gameWidth / 2, 150, `${points > 0 ? '+' : ''}${points}`, {
            fontSize: '24px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Animate score popup
        this.tweens.add({
            targets: scoreText,
            y: 120,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => scoreText.destroy()
        });
    }

    updateHUD() {
        const scoreElement = document.getElementById('score');
        const stageElement = document.getElementById('stage');
        
        if (scoreElement) scoreElement.textContent = `Score: ${this.score}`;
        if (stageElement) stageElement.textContent = `Stage: ${this.stage}`;
    }
}

// Enemy class
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Try to use loaded sprite, fallback to generated one
        const enemyTexture = scene.textures.exists('enemy-sprite') ? 'enemy-sprite' : 'enemy';
        super(scene, x, y, enemyTexture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.health = 1;
        this.speed = scene.gameConfig.enemySpeed;
        
        // Add subtle red glow effect
        this.postFX.addGlow(0xFF0000, 1);
        
        // Move towards player
        this.moveTowardsPlayer();
        
        console.log('Enemy created at:', x, y);
    }

    moveTowardsPlayer() {
        if (this.scene.player) {
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.scene.player.x, this.scene.player.y
            );
            
            this.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
            
            // Rotate enemy to face movement direction
            this.rotation = angle;
        }
    }

    takeDamage(damage = 1) {
        this.health -= damage;
        console.log('Enemy took damage:', damage, 'remaining health:', this.health);
        
        // Visual feedback
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        if (this.health <= 0) {
            this.scene.addScore(10);
            
            // Death effect
            const explosion = this.scene.add.circle(this.x, this.y, 20, 0xff6600, 0.7);
            this.scene.tweens.add({
                targets: explosion,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 300,
                onComplete: () => explosion.destroy()
            });
            
            // Add particle effect for explosion
            const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
                speed: { min: 50, max: 150 },
                lifespan: 300,
                quantity: 8,
                scale: { start: 0.5, end: 0 },
                tint: 0xff6600
            });
            
            this.scene.time.delayedCall(300, () => {
                particles.destroy();
            });
            
            console.log('Enemy destroyed');
            this.destroy();
        }
    }

    update() {
        // Periodically adjust direction towards player
        if (this.scene.time.now % 1000 < 16) { // Roughly every second
            this.moveTowardsPlayer();
        }
        
        // Remove enemies that go too far off screen
        if (this.x < -100 || this.x > this.scene.sys.game.config.width + 100 ||
            this.y < -100 || this.y > this.scene.sys.game.config.height + 100) {
            this.destroy();
        }
    }
}

// Game initialization with error handling
function initializeGame() {
    console.log('Initializing game...');
    
    if (typeof Phaser === 'undefined') {
        console.error('Phaser.js not loaded!');
        document.getElementById('game-canvas').innerHTML = 
            '<div style="color: white; padding: 20px; text-align: center;">Error: Phaser.js not loaded.<br>Please check your internet connection and refresh.</div>';
        return;
    }

    // Game configuration - Full screen
    const gameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-canvas',
        backgroundColor: '#000011',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false // Set to true for debugging physics
            }
        },
        scene: GameScene,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    try {
        // Initialize the game
        const game = new Phaser.Game(gameConfig);
        
        // Handle window resize for full screen experience
        window.addEventListener('resize', () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Game created successfully with full screen');
        return game;
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.getElementById('game-canvas').innerHTML = 
            '<div style="color: white; padding: 20px; text-align: center;">Error initializing game: ' + error.message + '<br>Please refresh the page.</div>';
    }
}

// Wait for DOM and Phaser to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for Phaser...');
    
    // Check if Phaser is already loaded
    if (typeof Phaser !== 'undefined') {
        initializeGame();
    } else {
        // Wait a bit more for Phaser to load
        let attempts = 0;
        const checkPhaser = setInterval(() => {
            attempts++;
            if (typeof Phaser !== 'undefined') {
                clearInterval(checkPhaser);
                initializeGame();
            } else if (attempts > 50) { // 5 seconds max wait
                clearInterval(checkPhaser);
                console.error('Phaser failed to load after 5 seconds');
                document.getElementById('game-canvas').innerHTML = 
                    '<div style="color: white; padding: 20px; text-align: center;">Failed to load game engine.<br>Please check your internet connection and refresh the page.</div>';
            }
        }, 100);
    }
});