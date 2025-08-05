// Bullet class with RPA program execution
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, program = []) {
        super(scene, x, y, 'bullet');
        
        this.scene = scene;
        this.program = program.slice(); // Copy the program
        this.programState = {
            currentStep: 0,
            timers: [],
            conditions: {},
            executed: new Set()
        };
        
        // Basic bullet properties
        this.speed = 200;
        this.damage = 1;
        this.size = 1;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.isActive = true;
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        this.body.setCollideWorldBounds(true);
        this.body.onWorldBounds = true;
        
        console.log('Bullet created at:', x, y, 'with program:', program.length, 'nodes');
        
        // Start program execution
        this.initializeProgram();
    }

    initializeProgram() {
        // Set up timers for WHEN nodes
        this.program.forEach((node, index) => {
            if (node.type === 'when') {
                this.setupWhenNode(node, index);
            }
        });
        
        // Execute immediate actions
        this.executeImmediateActions();
    }

    setupWhenNode(node, index) {
        switch (node.action) {
            case 'immediate':
                // Mark for immediate execution
                this.programState.conditions[`when_${index}`] = true;
                break;
                
            case 'timer-1':
                this.createTimer(1000, () => {
                    this.programState.conditions[`when_${index}`] = true;
                    this.evaluateProgram();
                });
                break;
                
            case 'timer-2':
                this.createTimer(2000, () => {
                    this.programState.conditions[`when_${index}`] = true;
                    this.evaluateProgram();
                });
                break;
                
            case 'enemy-contact':
                // Will be triggered by collision detection
                this.programState.conditions[`when_${index}`] = false;
                break;
                
            case 'wall-contact':
                // Will be triggered by world bounds collision
                this.programState.conditions[`when_${index}`] = false;
                break;
        }
    }

    createTimer(delay, callback) {
        const timer = this.scene.time.delayedCall(delay, callback);
        this.programState.timers.push(timer);
        return timer;
    }

    executeImmediateActions() {
        this.evaluateProgram();
    }

    evaluateProgram() {
        if (!this.isActive) return;
        
        // Find executable sequences
        for (let i = 0; i < this.program.length; i++) {
            const node = this.program[i];
            
            if (this.programState.executed.has(i)) continue;
            
            if (this.canExecuteNode(node, i)) {
                this.executeNode(node, i);
            }
        }
    }

    canExecuteNode(node, index) {
        switch (node.type) {
            case 'when':
                return this.programState.conditions[`when_${index}`] === true;
                
            case 'if':
                return this.evaluateCondition(node);
                
            case 'do':
                // Check if previous nodes are satisfied
                return this.arePreviousNodesSatisfied(index);
                
            default:
                return false;
        }
    }

    arePreviousNodesSatisfied(doIndex) {
        // Look backwards to find the controlling WHEN/IF nodes
        let hasValidWhen = false;
        let hasValidIf = true; // Default to true if no IF node
        
        for (let i = doIndex - 1; i >= 0; i--) {
            const node = this.program[i];
            
            if (node.type === 'when') {
                hasValidWhen = this.programState.conditions[`when_${i}`] === true;
                break;
            } else if (node.type === 'if') {
                hasValidIf = this.evaluateCondition(node);
            }
        }
        
        return hasValidWhen && hasValidIf;
    }

    evaluateCondition(ifNode) {
        const enemies = this.scene.enemies ? this.scene.enemies.children.entries : [];
        
        switch (ifNode.action) {
            case 'enemy-near':
                return enemies.some(enemy => 
                    Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < 100
                );
                
            case 'enemy-far':
                return enemies.every(enemy => 
                    Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) > 100
                );
                
            case 'enemy-many':
                return enemies.length >= 3;
                
            case 'no-enemy':
                return enemies.length === 0;
                
            default:
                return false;
        }
    }

    executeNode(node, index) {
        if (node.type === 'do') {
            this.executeAction(node);
            this.programState.executed.add(index);
        }
    }

    executeAction(doNode) {
        switch (doNode.action) {
            case 'split':
                this.split();
                break;
                
            case 'explode':
                this.explode();
                break;
                
            case 'bounce':
                this.enableBounce();
                break;
                
            case 'speed-up':
                this.speedUp();
                break;
                
            case 'destroy':
                this.destroy();
                break;
        }
    }

    split() {
        if (!this.isActive) return;
        
        // Create two new bullets
        const currentVelocity = { x: this.body.velocity.x, y: this.body.velocity.y };
        const currentAngle = Phaser.Math.Angle.Between(0, 0, currentVelocity.x, currentVelocity.y);
        
        const angle1 = currentAngle - Math.PI / 6;
        const angle2 = currentAngle + Math.PI / 6;
        
        const bullet1 = new Bullet(this.scene, this.x, this.y, this.program);
        const bullet2 = new Bullet(this.scene, this.x, this.y, this.program);
        
        bullet1.setVelocity(Math.cos(angle1) * this.speed, Math.sin(angle1) * this.speed);
        bullet2.setVelocity(Math.cos(angle2) * this.speed, Math.sin(angle2) * this.speed);
        
        // Add to scene's bullet group
        if (this.scene.bullets) {
            this.scene.bullets.add(bullet1);
            this.scene.bullets.add(bullet2);
        }
        
        console.log('Bullet split into two');
        this.destroy();
    }

    explode() {
        if (!this.isActive) return;
        
        // Create explosion effect
        const explosion = this.scene.add.circle(this.x, this.y, 50, 0xff6600, 0.7);
        explosion.setStrokeStyle(3, 0xff0000);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => explosion.destroy()
        });
        
        // Damage nearby enemies
        const enemies = this.scene.enemies ? this.scene.enemies.children.entries : [];
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < 80) {
                // Damage enemy
                if (enemy.takeDamage) {
                    enemy.takeDamage(this.damage * 2);
                }
            }
        });
        
        console.log('Bullet exploded');
        this.destroy();
    }

    enableBounce() {
        this.body.setBounce(1, 1);
        this.maxBounces = 5;
        console.log('Bullet bounce enabled');
    }

    speedUp() {
        this.speed *= 1.5;
        const currentAngle = Phaser.Math.Angle.Between(0, 0, this.body.velocity.x, this.body.velocity.y);
        this.setVelocity(Math.cos(currentAngle) * this.speed, Math.sin(currentAngle) * this.speed);
        console.log('Bullet speed increased to', this.speed);
    }

    onWallCollision() {
        // Trigger wall contact events
        this.program.forEach((node, index) => {
            if (node.type === 'when' && node.action === 'wall-contact') {
                this.programState.conditions[`when_${index}`] = true;
            }
        });
        
        this.bounceCount++;
        if (this.bounceCount >= this.maxBounces) {
            this.destroy();
        } else {
            this.evaluateProgram();
        }
    }

    onEnemyCollision(enemy) {
        // Trigger enemy contact events
        this.program.forEach((node, index) => {
            if (node.type === 'when' && node.action === 'enemy-contact') {
                this.programState.conditions[`when_${index}`] = true;
            }
        });
        
        // Damage the enemy
        if (enemy.takeDamage) {
            enemy.takeDamage(this.damage);
        }
        
        this.evaluateProgram();
    }

    update() {
        if (!this.isActive) return;
        
        // Check if bullet is out of bounds
        const gameWidth = this.scene.sys.game.config.width;
        const gameHeight = this.scene.sys.game.config.height;
        
        if (this.x < -50 || this.x > gameWidth + 50 ||
            this.y < -50 || this.y > gameHeight + 50) {
            this.destroy();
            return;
        }
        
        // Continuously evaluate conditions that might change
        this.evaluateProgram();
    }

    destroy() {
        this.isActive = false;
        
        // Clear all timers
        this.programState.timers.forEach(timer => {
            if (timer) timer.destroy();
        });
        
        // Remove from bullet group
        if (this.scene.bullets && this.scene.bullets.children.entries.includes(this)) {
            this.scene.bullets.remove(this);
        }
        
        super.destroy();
    }
}

// Bullet factory function for easier creation
function createProgrammedBullet(scene, x, y, direction, program) {
    const bullet = new Bullet(scene, x, y, program);
    
    // Set initial velocity based on direction
    const speed = bullet.speed;
    const velocityX = Math.cos(direction) * speed;
    const velocityY = Math.sin(direction) * speed;
    
    bullet.setVelocity(velocityX, velocityY);
    
    console.log('Created bullet with velocity:', velocityX, velocityY);
    
    return bullet;
}