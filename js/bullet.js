// Bullet class with RPA program execution
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, program = []) {
        // Use the appropriate bullet texture from game scene
        const bulletTexture = scene.gameTextures ? scene.gameTextures.bullet : 
                             (scene.textures.exists('bullet-sprite') ? 'bullet-sprite' : 'bullet-fallback');
        
        super(scene, x, y, bulletTexture);
        
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
        
        // Property attributes (set by PROPERTY nodes)
        this.properties = {
            homing: false,
            penetrate: false,
            highDamage: false,
            poison: false,
            magnetic: false,
            shieldBreak: false,
            slowEffect: false
        };
        
        // Visual effects tracking
        this.appliedColors = [];
        this.activeEffects = [];
        
        // Add to scene first
        scene.add.existing(this);
        
        // Then add physics - this is crucial for body to exist
        scene.physics.add.existing(this);
        
        // Ensure body exists before setting properties
        if (this.body) {
            this.body.setCollideWorldBounds(true);
            this.body.onWorldBounds = true;
        } else {
            console.error('Bullet body not created!');
        }
        
        // Add visual effects based on texture type
        try {
            if (bulletTexture === 'bullet-sprite') {
                // Less glow for PNG sprite
                this.postFX.addGlow(0xFFFF00, 0.5);
            } else {
                // More glow for fallback sprite
                this.postFX.addGlow(0xFFFF00, 1);
            }
        } catch (error) {
            console.warn('Could not add glow effect:', error);
        }
        
        console.log('Bullet created at:', x, y, 'with texture:', bulletTexture, 'program:', program.length, 'nodes');
        console.log('Bullet body exists:', !!this.body);
        
        // Start program execution
        this.initializeProgram();
    }

    initializeProgram() {
        // Apply PROPERTY nodes first
        this.applyProperties();
        
        // Set up timers for WHEN nodes
        this.program.forEach((node, index) => {
            if (node.type === 'when') {
                this.setupWhenNode(node, index);
            }
        });
        
        // Execute immediate actions
        this.executeImmediateActions();
    }

    applyProperties() {
        this.program.forEach(node => {
            if (node.type === 'property') {
                this.applyProperty(node);
            }
        });
        
        // Apply combined visual effects after all properties are set
        this.updateCombinedVisuals();
    }

    applyProperty(propertyNode) {
        switch (propertyNode.action) {
            case 'homing':
                this.properties.homing = true;
                this.appliedColors.push(0xFF69B4); // Pink
                console.log('Applied homing property');
                break;
                
            case 'penetrate':
                this.properties.penetrate = true;
                this.appliedColors.push(0x00CED1); // Dark turquoise
                console.log('Applied penetrate property');
                break;
                
            case 'high-damage':
                this.properties.highDamage = true;
                this.damage *= 2;
                this.appliedColors.push(0xFF4500); // Orange red
                console.log('Applied high damage property - damage now:', this.damage);
                break;
                
            case 'poison':
                this.properties.poison = true;
                this.appliedColors.push(0x32CD32); // Lime green
                console.log('Applied poison property');
                break;
                
            case 'magnetic':
                this.properties.magnetic = true;
                this.appliedColors.push(0x8A2BE2); // Blue violet
                console.log('Applied magnetic property');
                break;
                
            case 'shield-break':
                this.properties.shieldBreak = true;
                this.appliedColors.push(0xFFD700); // Gold
                console.log('Applied shield break property');
                break;
                
            case 'slow-effect':
                this.properties.slowEffect = true;
                this.appliedColors.push(0x4682B4); // Steel blue
                console.log('Applied slow effect property');
                break;
        }
    }

    updateCombinedVisuals() {
        if (this.appliedColors.length === 0) return;
        
        if (this.appliedColors.length === 1) {
            // Single property - use that color
            this.setTint(this.appliedColors[0]);
        } else {
            // Multiple properties - create visual indicators
            this.createMultiPropertyVisuals();
        }
    }

    createMultiPropertyVisuals() {
        // For multiple properties, use a striped pattern or multiple rings
        if (this.appliedColors.length === 2) {
            // Two properties - use both colors with alternating tint
            const primaryColor = this.appliedColors[0];
            const secondaryColor = this.appliedColors[1];
            
            this.setTint(primaryColor);
            
            // Add a secondary ring effect
            const ring = this.scene.add.circle(this.x, this.y, 8, secondaryColor, 0.6);
            ring.setStrokeStyle(2, secondaryColor, 0.8);
            this.activeEffects.push(ring);
            
            // Follow bullet
            this.scene.tweens.add({
                targets: ring,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
        } else if (this.appliedColors.length >= 3) {
            // Three or more properties - use rainbow/prismatic effect
            this.setTint(0xFFFFFF); // White base
            
            // Create multiple rotating rings
            this.appliedColors.forEach((color, index) => {
                const ring = this.scene.add.circle(this.x, this.y, 6 + index * 2, color, 0.4);
                ring.setStrokeStyle(1, color, 0.9);
                this.activeEffects.push(ring);
                
                // Different rotation speeds for each ring
                this.scene.tweens.add({
                    targets: ring,
                    rotation: Math.PI * 2,
                    duration: 1000 + index * 200,
                    repeat: -1,
                    ease: 'Linear'
                });
            });
        }
        
        console.log(`Applied combined visuals for ${this.appliedColors.length} properties`);
    }

    updateEffectPositions() {
        // Update positions of all visual effects to follow the bullet
        this.activeEffects.forEach(effect => {
            if (effect && effect.setPosition) {
                effect.setPosition(this.x, this.y);
            }
        });
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
        // Look backwards to find the controlling WHEN/IF nodes (ignore PROPERTY nodes)
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
            // Skip PROPERTY nodes as they don't affect flow
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

    // PROPERTY implementations
    updateHoming() {
        if (!this.properties.homing || !this.body) return;
        
        const enemies = this.scene.enemies ? this.scene.enemies.children.entries : [];
        if (enemies.length === 0) return;
        
        // Find closest enemy
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        if (closestEnemy) {
            // Gradually turn towards target
            const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, closestEnemy.x, closestEnemy.y);
            const currentAngle = Phaser.Math.Angle.Between(0, 0, this.body.velocity.x, this.body.velocity.y);
            
            // Smooth turning
            const turnRate = 0.05; // How fast the bullet turns
            const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
            const newAngle = currentAngle + angleDiff * turnRate;
            
            this.setVelocity(
                Math.cos(newAngle) * this.speed,
                Math.sin(newAngle) * this.speed
            );
        }
    }

    updateMagnetic() {
        if (!this.properties.magnetic) return;
        
        const enemies = this.scene.enemies ? this.scene.enemies.children.entries : [];
        const magneticRange = 120;
        
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < magneticRange && enemy.body) {
                // Pull enemy towards bullet
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.x, this.y);
                const pullForce = (magneticRange - distance) / magneticRange * 30;
                
                enemy.body.velocity.x += Math.cos(angle) * pullForce;
                enemy.body.velocity.y += Math.sin(angle) * pullForce;
            }
        });
    }

    split() {
        if (!this.isActive || !this.body) return;
        
        // Create two new bullets with the same properties
        const currentVelocity = { x: this.body.velocity.x, y: this.body.velocity.y };
        const currentAngle = Phaser.Math.Angle.Between(0, 0, currentVelocity.x, currentVelocity.y);
        
        const angle1 = currentAngle - Math.PI / 6;
        const angle2 = currentAngle + Math.PI / 6;
        
        const bullet1 = new Bullet(this.scene, this.x, this.y, this.program);
        const bullet2 = new Bullet(this.scene, this.x, this.y, this.program);
        
        // Wait for bodies to be created, then set velocity
        this.scene.time.delayedCall(10, () => {
            if (bullet1.body) {
                bullet1.setVelocity(Math.cos(angle1) * this.speed, Math.sin(angle1) * this.speed);
            }
            if (bullet2.body) {
                bullet2.setVelocity(Math.cos(angle2) * this.speed, Math.sin(angle2) * this.speed);
            }
        });
        
        // Add to scene's bullet group
        if (this.scene.bullets) {
            this.scene.bullets.add(bullet1);
            this.scene.bullets.add(bullet2);
        }
        
        // Visual effect for split
        const splitEffect = this.scene.add.circle(this.x, this.y, 15, 0x00FFFF, 0.8);
        this.scene.tweens.add({
            targets: splitEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => splitEffect.destroy()
        });
        
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
        
        // Add particle explosion using the bullet texture
        try {
            const bulletTexture = this.scene.gameTextures ? this.scene.gameTextures.bullet : 'bullet-fallback';
            const explosionParticles = this.scene.add.particles(this.x, this.y, bulletTexture, {
                speed: { min: 100, max: 300 },
                lifespan: 400,
                quantity: 15,
                scale: { start: 0.8, end: 0.1 },
                tint: [0xFF6600, 0xFF0000, 0xFFAA00],
                blendMode: 'ADD'
            });
            
            this.scene.time.delayedCall(500, () => {
                if (explosionParticles && explosionParticles.destroy) {
                    explosionParticles.destroy();
                }
            });
        } catch (error) {
            console.warn('Could not create explosion particles:', error);
        }
        
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
        if (this.body) {
            this.body.setBounce(1, 1);
            this.maxBounces = 5;
            
            // Add visual indication of bounce ability
            this.setTint(0x00FFFF); // Cyan tint for bouncy bullets
            
            console.log('Bullet bounce enabled');
        }
    }

    speedUp() {
        if (!this.body) return;
        
        this.speed *= 1.5;
        const currentAngle = Phaser.Math.Angle.Between(0, 0, this.body.velocity.x, this.body.velocity.y);
        this.setVelocity(Math.cos(currentAngle) * this.speed, Math.sin(currentAngle) * this.speed);
        
        // Add visual indication of speed boost
        this.setTint(0xFF00FF); // Magenta tint for fast bullets
        
        // Add speed trail effect
        try {
            const trail = this.scene.add.particles(this.x, this.y, this.texture.key, {
                speed: 0,
                lifespan: 200,
                quantity: 1,
                scale: { start: 0.8, end: 0.1 },
                alpha: { start: 0.5, end: 0 },
                tint: 0xFF00FF,
                follow: this
            });
            
            this.activeEffects.push(trail);
            
            // Clean up trail when bullet is destroyed
            const originalDestroy = this.destroy.bind(this);
            this.destroy = function() {
                if (trail && trail.destroy) {
                    trail.destroy();
                }
                originalDestroy();
            };
        } catch (error) {
            console.warn('Could not create speed trail:', error);
        }
        
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
            // Visual feedback for wall bounce
            const bounceEffect = this.scene.add.circle(this.x, this.y, 10, 0xFFFFFF, 0.8);
            this.scene.tweens.add({
                targets: bounceEffect,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 150,
                onComplete: () => bounceEffect.destroy()
            });
            
            this.evaluateProgram();
        }
    }

    onEnemyCollision(enemy) {
        console.log('Bullet.onEnemyCollision called');
        
        // Apply special property effects
        if (this.properties.poison && enemy.applyPoison) {
            enemy.applyPoison(this.damage);
        }
        
        if (this.properties.slowEffect && enemy.applySlow) {
            enemy.applySlow(0.5, 2000); // 50% speed for 2 seconds
        }
        
        // Handle shield breaking
        const effectiveDamage = this.properties.shieldBreak ? this.damage : this.damage;
        const shouldBreakShield = this.properties.shieldBreak;
        
        // Trigger enemy contact events
        this.program.forEach((node, index) => {
            if (node.type === 'when' && node.action === 'enemy-contact') {
                this.programState.conditions[`when_${index}`] = true;
            }
        });
        
        // Visual feedback for enemy hit
        try {
            const hitEffect = this.scene.add.circle(this.x, this.y, 12, 0xFF4444, 0.9);
            this.scene.tweens.add({
                targets: hitEffect,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    if (hitEffect && hitEffect.destroy) {
                        hitEffect.destroy();
                    }
                }
            });
        } catch (error) {
            console.warn('Could not create hit effect:', error);
        }
        
        // Damage the enemy
        if (enemy && enemy.takeDamage && typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(effectiveDamage, shouldBreakShield);
        }
        
        // Check if bullet should be destroyed (not if penetrating)
        if (!this.properties.penetrate) {
            this.evaluateProgram();
        } else {
            console.log('Bullet penetrated enemy');
        }
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
        
        // Update positions of visual effects
        this.updateEffectPositions();
        
        // Apply continuous property effects
        this.updateHoming();
        this.updateMagnetic();
        
        // Add subtle rotation for visual appeal (only for PNG sprites)
        if (this.texture.key === 'bullet-sprite') {
            this.rotation += 0.1;
        }
        
        // Continuously evaluate conditions that might change
        this.evaluateProgram();
    }

    destroy() {
        if (!this.isActive) return; // Prevent double destruction
        
        this.isActive = false;
        
        // Clear all timers
        this.programState.timers.forEach(timer => {
            if (timer && timer.destroy) {
                timer.destroy();
            }
        });
        
        // Clean up visual effects
        this.activeEffects.forEach(effect => {
            if (effect && effect.destroy) {
                effect.destroy();
            }
        });
        this.activeEffects = [];
        
        // Remove from bullet group safely
        if (this.scene.bullets && this.scene.bullets.children && this.scene.bullets.children.entries.includes(this)) {
            this.scene.bullets.remove(this);
        }
        
        super.destroy();
    }
}

// Bullet factory function for easier creation
function createProgrammedBullet(scene, x, y, direction, program) {
    const bullet = new Bullet(scene, x, y, program);
    
    // Wait a frame to ensure physics body is created
    scene.time.delayedCall(10, () => {
        if (bullet.body && bullet.isActive) {
            const speed = bullet.speed;
            const velocityX = Math.cos(direction) * speed;
            const velocityY = Math.sin(direction) * speed;
            
            bullet.setVelocity(velocityX, velocityY);
            console.log('Set bullet velocity:', velocityX, velocityY);
        } else {
            console.error('Bullet body still not available after delay or bullet destroyed');
        }
    });
    
    console.log('Created bullet with texture:', bullet.texture.key);
    
    return bullet;
}