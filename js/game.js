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
        // Create simple colored rectangles as sprites
        this.createSprites();
    }

    createSprites() {
        // Player sprite (blue square)
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x0088ff);
        playerGraphics.fillRect(0, 0, 16, 16);
        playerGraphics.generateTexture('player', 16, 16);
        playerGraphics.destroy();

        // Enemy sprite (red square)
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xff4444);
        enemyGraphics.fillRect(0, 0, 16, 16);
        enemyGraphics.generateTexture('enemy', 16, 16);
        enemyGraphics.destroy();

        // Bullet sprite (yellow circle)
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffff00);
        bulletGraphics.fillCircle(4, 4, 4);
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
            classType: Bullet,
            maxSize: 50,
            runChildUpdate: true
        });

        this.enemies = this.physics.add.group({
            classType: Enemy,
            maxSize: 20
        });

        // Create player
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        this.player = this.physics.add.sprite(100, gameHeight / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(14, 14);

        console.log('Player created at:', this.player.x, this.player.y);

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');

        // Set up collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitsEnemy, null, this);
        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        // Initialize score and stage display
        this.updateHUD();

        // Spawn initial enemies
        this.spawnEnemies();

        // Connect to global game reference for RPA testing
        window.game = this;

        // Add visual feedback that the game is running
        this.add.text(gameWidth / 2, 50, 'Bullet Programming Shooter', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(gameWidth / 2, 80, 'WASD: Move | Space: Fire | Drag nodes to slots →', {
            fontSize: '14px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        console.log('Game initialized successfully!');
    }

    update(time, delta) {
        // Player movement
        this.handlePlayerMovement();

        // Enemy spawning
        this.handleEnemySpawning(time);

        // Update bullets
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.update) {
                bullet.update();
            }
        });

        // Test firing with space key
        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
            this.testFire();
        }
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
    }

    handleEnemySpawning(time) {
        if (time > this.enemySpawnTimer) {
            this.spawnEnemy();
            this.enemySpawnTimer = time + this.gameConfig.enemySpawnDelay;
        }
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(this.sys.game.config.width + 20, this.sys.game.config.width + 100);
        const y = Phaser.Math.Between(50, this.sys.game.config.height - 50);
        
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
        if (!program) {
            // Find the first valid program
            for (let i = 0; i < rpaProgram.slots.length; i++) {
                const validation = rpaProgram.validateProgram(i);
                if (validation.valid) {
                    program = rpaProgram.getProgram(i);
                    break;
                }
            }
        }

        if (!program || program.length === 0) {
            console.log('No valid program to test! Creating default bullet...');
            // Create a default bullet if no program exists
            program = [
                { type: 'when', action: 'immediate', toString: () => '即座に' },
                { type: 'do', action: 'destroy', toString: () => '消える' }
            ];
        }

        // Create and fire bullet
        const direction = 0; // Fire to the right
        const bullet = createProgrammedBullet(
            this,
            this.player.x + 20,
            this.player.y,
            direction,
            program
        );

        this.bullets.add(bullet);
        console.log('Fired bullet with program:', program.map(node => node.toString()).join(' → '));
    }

    bulletHitsEnemy(bullet, enemy) {
        if (bullet.onEnemyCollision) {
            bullet.onEnemyCollision(enemy);
        } else {
            // Default behavior
            this.addScore(10);
            bullet.destroy();
        }
    }

    onWorldBounds(event) {
        const body = event.body;
        const gameObject = body.gameObject;
        
        if (gameObject instanceof Bullet) {
            gameObject.onWallCollision();
        }
    }

    addScore(points) {
        this.score += points;
        this.updateHUD();
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
        super(scene, x, y, 'enemy');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.health = 1;
        this.speed = scene.gameConfig.enemySpeed;
        
        // Move towards player
        this.moveTowardsPlayer();
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
        }
    }

    takeDamage(damage = 1) {
        this.health -= damage;
        
        // Visual feedback
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        if (this.health <= 0) {
            this.scene.addScore(10);
            this.destroy();
        }
    }

    update() {
        // Periodically adjust direction towards player
        if (this.scene.time.now % 1000 < 16) { // Roughly every second
            this.moveTowardsPlayer();
        }
    }
}

// Game initialization with error handling
function initializeGame() {
    console.log('Initializing game...');
    
    if (typeof Phaser === 'undefined') {
        console.error('Phaser.js not loaded!');
        document.getElementById('game-canvas').innerHTML = 
            '<div style="color: white; padding: 20px;">Error: Phaser.js not loaded. Please check your internet connection.</div>';
        return;
    }

    // Game configuration
    const gameConfig = {
        type: Phaser.AUTO,
        width: Math.max(800, window.innerWidth - 350), // Account for UI panel, minimum 800px
        height: Math.max(600, window.innerHeight),     // Minimum 600px
        parent: 'game-canvas',
        backgroundColor: '#000000',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: GameScene
    };

    try {
        // Initialize the game
        const game = new Phaser.Game(gameConfig);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const newWidth = Math.max(800, window.innerWidth - 350);
            const newHeight = Math.max(600, window.innerHeight);
            game.scale.resize(newWidth, newHeight);
        });
        
        console.log('Game created successfully');
        return game;
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.getElementById('game-canvas').innerHTML = 
            '<div style="color: white; padding: 20px;">Error initializing game: ' + error.message + '</div>';
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
                    '<div style="color: white; padding: 20px;">Failed to load game engine. Please refresh the page.</div>';
            }
        }, 100);
    }
});