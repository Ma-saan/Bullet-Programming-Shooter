// Enhanced Game Logic with Game Over functionality
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
        this.isGameOver = false;
        this.gameOverUI = null;
        this.gameConfig = {
            playerSpeed: 200,
            enemySpeed: 50,
            enemySpawnDelay: 3000
        };
    }

    preload() {
        // Load actual PNG images from assets
        console.log('Loading PNG sprites from assets...');
        
        // Load the actual uploaded PNG files
        this.load.image('player-sprite', 'assets/images/Player.png');
        this.load.image('enemy-sprite', 'assets/images/Enemy1.png');
        this.load.image('bullet-sprite', 'assets/images/Ballet.png');
        this.load.image('bullet-sprite2', 'assets/images/Ballet2.png'); // Alternative bullet sprite
        
        // Create fallback sprites in case images fail to load
        this.createFallbackSprites();
        
        // Handle load errors
        this.load.on('loaderror', (file) => {
            console.warn('Failed to load:', file.src);
        });
        
        this.load.on('complete', () => {
            console.log('All assets loaded successfully!');
        });
    }

    createFallbackSprites() {
        // Player sprite (improved green tank-like design) - fallback
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
        playerGraphics.generateTexture('player-fallback', 16, 16);
        playerGraphics.destroy();

        // Enemy sprite (improved gray aircraft-like design) - fallback
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
        enemyGraphics.generateTexture('enemy-fallback', 16, 16);
        enemyGraphics.destroy();

        // Bullet sprite (improved glowing effect) - fallback
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xFFFF00);
        bulletGraphics.fillCircle(4, 4, 4);
        bulletGraphics.fillStyle(0xFFAA00);
        bulletGraphics.fillCircle(4, 4, 2);
        bulletGraphics.generateTexture('bullet-fallback', 8, 8);
        bulletGraphics.destroy();

        console.log('Fallback sprites created successfully');
    }

    create() {
        console.log('GameScene create() called');
        
        // Reset game state
        this.isGameOver = false;
        this.score = 0;
        this.stage = 1;
        
        // Update debug status
        if (document.getElementById('game-status')) {
            document.getElementById('game-status').textContent = 'YES';
        }

        // Check which sprites are available and log them
        const playerTexture = this.textures.exists('player-sprite') ? 'player-sprite' : 'player-fallback';
        const enemyTexture = this.textures.exists('enemy-sprite') ? 'enemy-sprite' : 'enemy-fallback';
        const bulletTexture = this.textures.exists('bullet-sprite') ? 'bullet-sprite' : 'bullet-fallback';
        
        console.log('Using textures:');
        console.log('- Player:', playerTexture);
        console.log('- Enemy:', enemyTexture);
        console.log('- Bullet:', bulletTexture);
        
        // Store texture references for use throughout the game
        this.gameTextures = {
            player: playerTexture,
            enemy: enemyTexture,
            bullet: bulletTexture
        };

        // Initialize physics groups
        this.bullets = this.physics.add.group({
            runChildUpdate: true
        });

        this.enemies = this.physics.add.group();

        // Create player with the appropriate texture
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        this.player = this.physics.add.sprite(100, gameHeight / 2, playerTexture);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(14, 14);
        
        // Add a subtle glow effect to the player (if PNG loaded, less glow needed)
        if (playerTexture === 'player-sprite') {
            this.player.postFX.addGlow(0x00FF00, 1); // Less glow for PNG
        } else {
            this.player.postFX.addGlow(0x00FF00, 2); // More glow for fallback
        }

        console.log('Player created at:', this.player.x, this.player.y, 'using texture:', playerTexture);

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE,R');

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

        // Update instructions to mention the new sprites
        const instructionText = this.textures.exists('player-sprite') ? 
            'WASD: Move | Space: Fire | 🔧 RPA編集: Program bullets | ⚠️ 敵に当たるとゲームオーバー！' :
            'WASD: Move | Space: Fire | 🔧 RPA編集: Program bullets | ⚠️ 敵に当たるとゲームオーバー！';
        
        this.add.text(gameWidth / 2, 100, instructionText, {
            fontSize: '16px',
            fill: '#cccccc',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add background stars for visual appeal
        this.createStarField();

        // Show sprite loading status
        if (this.textures.exists('player-sprite')) {
            this.add.text(10, gameHeight - 40, '🎨 Custom PNG sprites loaded!', {
                fontSize: '14px',
                fill: '#4CAF50',
                stroke: '#000000',
                strokeThickness: 1
            });
        }

        console.log('Game initialized successfully with Game Over functionality!');
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
        // Don't update game logic if game is over
        if (this.isGameOver) {
            // Only listen for restart key
            if (Phaser.Input.Keyboard.JustDown(this.wasd.R)) {
                this.restartGame();
            }
            return;
        }

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
        if (this.isGameOver) return;
        
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
        if (this.isGameOver) return;
        
        if (time > this.enemySpawnTimer) {
            this.spawnEnemy();
            this.enemySpawnTimer = time + this.gameConfig.enemySpawnDelay;
        }
    }

    spawnEnemy() {
        if (this.isGameOver) return;
        
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
                if (!this.isGameOver) {
                    this.spawnEnemy();
                }
            }, i * 1000);
        }
    }

    testFire(program = null) {
        if (this.isGameOver) return;
        
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
            console.log('No valid program found, creating default normal bullet...');
            // Create a normal bullet that flies straight and gets destroyed on enemy contact
            program = [
                { type: 'when', action: 'enemy-contact', toString: () => '敵に接触時' },
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
    }

    bulletHitsEnemy(bullet, enemy) {
        if (this.isGameOver) return;
        
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

    // **GAME OVER FUNCTIONALITY** - Main change!
    playerHitsEnemy(player, enemy) {
        if (this.isGameOver) return;
        
        console.log('💀 GAME OVER - Player hit enemy!');
        
        // Set game over state
        this.isGameOver = true;
        
        // Massive camera shake for dramatic effect
        this.cameras.main.shake(500, 0.05);
        
        // Stop player movement
        player.setVelocity(0);
        player.setTint(0xff0000);
        
        // Stop all enemies
        this.enemies.children.entries.forEach(enemy => {
            enemy.setVelocity(0);
        });
        
        // Clear all bullets
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.destroy) {
                bullet.destroy();
            }
        });
        
        // Dramatic explosion effect at collision point
        const explosionX = (player.x + enemy.x) / 2;
        const explosionY = (player.y + enemy.y) / 2;
        
        // Create multiple explosion rings
        for (let i = 0; i < 5; i++) {
            const explosion = this.add.circle(explosionX, explosionY, 10 + i * 15, 0xff0000, 0.8 - i * 0.1);
            this.tweens.add({
                targets: explosion,
                scaleX: 3 + i,
                scaleY: 3 + i,
                alpha: 0,
                duration: 500 + i * 200,
                ease: 'Power2',
                onComplete: () => explosion.destroy()
            });
        }
        
        // Show Game Over UI after a short delay
        this.time.delayedCall(1000, () => {
            this.showGameOverScreen();
        });
        
        console.log('Game Over initiated - final score:', this.score);
    }

    showGameOverScreen() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.7);
        
        // Game Over title with dramatic effect
        const gameOverText = this.add.text(gameWidth / 2, gameHeight / 2 - 100, '💀 GAME OVER 💀', {
            fontSize: '64px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Pulsing effect for Game Over text
        this.tweens.add({
            targets: gameOverText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Final score
        const scoreText = this.add.text(gameWidth / 2, gameHeight / 2 - 20, `最終スコア: ${this.score}`, {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Restart instructions
        const restartText = this.add.text(gameWidth / 2, gameHeight / 2 + 40, 'Rキーを押してリスタート', {
            fontSize: '24px',
            fill: '#4CAF50',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Blinking effect for restart text
        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
        
        // Encouraging message based on score
        let encouragementMsg = '';
        if (this.score === 0) {
            encouragementMsg = '敵に弾丸を当ててスコアを稼ごう！';
        } else if (this.score < 50) {
            encouragementMsg = 'ホーミング弾を試してみよう！';
        } else if (this.score < 100) {
            encouragementMsg = 'いい調子！さらに上を目指そう！';
        } else {
            encouragementMsg = 'すばらしいスコア！君はエキスパートだ！';
        }
        
        const encouragementText = this.add.text(gameWidth / 2, gameHeight / 2 + 100, encouragementMsg, {
            fontSize: '18px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Store UI elements for cleanup
        this.gameOverUI = {
            overlay,
            gameOverText,
            scoreText,
            restartText,
            encouragementText
        };
        
        // Update HTML HUD to show game over
        if (document.getElementById('score')) {
            document.getElementById('score').textContent = `Final Score: ${this.score}`;
        }
        
        console.log('Game Over screen displayed');
    }

    restartGame() {
        console.log('🔄 Restarting game...');
        
        // Clean up Game Over UI
        if (this.gameOverUI) {
            Object.values(this.gameOverUI).forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.gameOverUI = null;
        }
        
        // Reset game state
        this.isGameOver = false;
        this.score = 0;
        this.stage = 1;
        
        // Clear player tint
        if (this.player) {
            this.player.clearTint();
        }
        
        // Restart the scene
        this.scene.restart();
        
        console.log('Game restarted successfully!');
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
        if (this.isGameOver) return;
        
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

// Enhanced Enemy class remains the same as before but with game over awareness
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Use the appropriate enemy texture
        const enemyTexture = scene.gameTextures ? scene.gameTextures.enemy : 
                           (scene.textures.exists('enemy-sprite') ? 'enemy-sprite' : 'enemy-fallback');
        super(scene, x, y, enemyTexture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Basic properties
        this.health = 1;
        this.maxHealth = 1;
        this.baseSpeed = scene.gameConfig.enemySpeed;
        this.speed = this.baseSpeed;
        
        // Status effects
        this.statusEffects = {
            poison: {
                active: false,
                damage: 0,
                tickInterval: 1000,
                lastTick: 0,
                visual: null
            },
            slow: {
                active: false,
                multiplier: 1.0,
                duration: 0,
                remaining: 0,
                visual: null
            },
            shield: {
                active: false,
                health: 0,
                visual: null
            }
        };
        
        // Add visual effects based on texture type
        if (enemyTexture === 'enemy-sprite') {
            this.postFX.addGlow(0xFF0000, 0.5);
        } else {
            this.postFX.addGlow(0xFF0000, 1);
        }
        
        // Move towards player initially
        this.moveTowardsPlayer();
        
        console.log('Enhanced Enemy created at:', x, y, 'using texture:', enemyTexture);
    }

    moveTowardsPlayer() {
        if (this.scene.player && !this.scene.isGameOver) {
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.scene.player.x, this.scene.player.y
            );
            
            // Apply slow effect
            const effectiveSpeed = this.speed * this.statusEffects.slow.multiplier;
            
            this.setVelocity(
                Math.cos(angle) * effectiveSpeed,
                Math.sin(angle) * effectiveSpeed
            );
            
            // Rotate enemy to face movement direction
            this.rotation = angle;
        }
    }

    // All other methods remain the same...
    applyPoison(damage, duration = 5000) {
        console.log('Enemy poisoned with damage:', damage, 'for duration:', duration);
        
        this.statusEffects.poison.active = true;
        this.statusEffects.poison.damage = damage * 0.5;
        this.statusEffects.poison.lastTick = this.scene.time.now;
        
        if (!this.statusEffects.poison.visual) {
            this.statusEffects.poison.visual = this.scene.add.circle(this.x, this.y, 12, 0x32CD32, 0.4);
            this.statusEffects.poison.visual.setBlendMode(Phaser.BlendModes.ADD);
        }
        
        this.scene.time.delayedCall(duration, () => {
            this.removePoison();
        });
    }

    removePoison() {
        this.statusEffects.poison.active = false;
        if (this.statusEffects.poison.visual) {
            this.statusEffects.poison.visual.destroy();
            this.statusEffects.poison.visual = null;
        }
    }

    applySlow(multiplier, duration) {
        this.statusEffects.slow.active = true;
        this.statusEffects.slow.multiplier = multiplier;
        this.statusEffects.slow.duration = duration;
        this.statusEffects.slow.remaining = duration;
        
        if (!this.statusEffects.slow.visual) {
            this.statusEffects.slow.visual = this.scene.add.circle(this.x, this.y, 16, 0x4682B4, 0.3);
            this.statusEffects.slow.visual.setBlendMode(Phaser.BlendModes.MULTIPLY);
        }
        
        this.scene.time.delayedCall(duration, () => {
            this.removeSlow();
        });
    }

    removeSlow() {
        this.statusEffects.slow.active = false;
        this.statusEffects.slow.multiplier = 1.0;
        if (this.statusEffects.slow.visual) {
            this.statusEffects.slow.visual.destroy();
            this.statusEffects.slow.visual = null;
        }
    }

    takeDamage(damage = 1, isShieldBreaking = false) {
        if (this.scene.isGameOver) return;
        
        this.health -= damage;
        
        // Visual feedback
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        if (this.health <= 0) {
            this.scene.addScore(10);
            
            // Clean up status effects
            this.removePoison();
            this.removeSlow();
            
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
            
            this.destroy();
        }
    }

    update() {
        if (this.scene.isGameOver) {
            this.setVelocity(0); // Stop movement when game over
            return;
        }
        
        // Update status effect visuals position
        if (this.statusEffects.poison.visual) {
            this.statusEffects.poison.visual.setPosition(this.x, this.y);
        }
        if (this.statusEffects.slow.visual) {
            this.statusEffects.slow.visual.setPosition(this.x, this.y);
        }
        
        // Handle poison damage
        if (this.statusEffects.poison.active) {
            const now = this.scene.time.now;
            if (now - this.statusEffects.poison.lastTick >= this.statusEffects.poison.tickInterval) {
                this.takeDamage(this.statusEffects.poison.damage);
                this.statusEffects.poison.lastTick = now;
            }
        }
        
        // Periodically adjust direction towards player
        if (this.scene.time.now % 1000 < 16) {
            this.moveTowardsPlayer();
        }
        
        // Remove enemies that go too far off screen
        if (this.x < -100 || this.x > this.scene.sys.game.config.width + 100 ||
            this.y < -100 || this.y > this.scene.sys.game.config.height + 100) {
            this.removePoison();
            this.removeSlow();
            this.destroy();
        }
    }
}

// Game initialization remains the same
function initializeGame() {
    console.log('Initializing game with Game Over functionality...');
    
    if (typeof Phaser === 'undefined') {
        console.error('Phaser.js not loaded!');
        document.getElementById('game-canvas').innerHTML = 
            '<div style="color: white; padding: 20px; text-align: center;">Error: Phaser.js not loaded.<br>Please check your internet connection and refresh.</div>';
        return;
    }

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
                debug: false
            }
        },
        scene: GameScene,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    try {
        const game = new Phaser.Game(gameConfig);
        
        window.addEventListener('resize', () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Game created successfully with Game Over functionality!');
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
    
    if (typeof Phaser !== 'undefined') {
        initializeGame();
    } else {
        let attempts = 0;
        const checkPhaser = setInterval(() => {
            attempts++;
            if (typeof Phaser !== 'undefined') {
                clearInterval(checkPhaser);
                initializeGame();
            } else if (attempts > 50) {
                clearInterval(checkPhaser);
                console.error('Phaser failed to load after 5 seconds');
                document.getElementById('game-canvas').innerHTML = 
                    '<div style="color: white; padding: 20px; text-align: center;">Failed to load game engine.<br>Please check your internet connection and refresh the page.</div>';
            }
        }, 100);
    }
});