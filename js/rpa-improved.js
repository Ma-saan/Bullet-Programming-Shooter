// Enhanced RPA Node System with better homing examples
class RPANode {
    constructor(type, action, data = {}) {
        this.type = type; // 'property', 'when', 'if', 'do'
        this.action = action;
        this.data = data;
    }

    toString() {
        const actionNames = {
            // PROPERTY nodes
            'homing': 'ホーミング',
            'penetrate': '貫通',
            'high-damage': '高威力',
            'poison': '継続ダメージ',
            'magnetic': '磁力効果',
            'shield-break': 'シールド貫通',
            'slow-effect': '時間遅延',
            
            // WHEN nodes
            'immediate': '即座に',
            'timer-1': '1秒後',
            'timer-2': '2秒後',
            'enemy-contact': '敵に接触時',
            'wall-contact': '壁に接触時',
            
            // IF nodes
            'enemy-near': '敵が近い',
            'enemy-far': '敵が遠い',
            'enemy-many': '敵が3体以上',
            'no-enemy': '敵がいない',
            
            // DO nodes
            'split': '分裂する',
            'explode': '爆発する',
            'bounce': '跳ね返る',
            'speed-up': '速くなる',
            'destroy': '消える'
        };
        
        return actionNames[this.action] || this.action;
    }
}

class RPAProgram {
    constructor() {
        this.slots = [[], [], []]; // 3 slots for different programs
        this.currentSlot = 0;
    }

    addNode(slotIndex, node) {
        if (slotIndex >= 0 && slotIndex < this.slots.length) {
            this.slots[slotIndex].push(node);
            this.updateSlotDisplay(slotIndex);
            return true;
        }
        return false;
    }

    removeNode(slotIndex, nodeIndex) {
        if (slotIndex >= 0 && slotIndex < this.slots.length && 
            nodeIndex >= 0 && nodeIndex < this.slots[slotIndex].length) {
            this.slots[slotIndex].splice(nodeIndex, 1);
            this.updateSlotDisplay(slotIndex);
            return true;
        }
        return false;
    }

    clearSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.slots.length) {
            this.slots[slotIndex] = [];
            this.updateSlotDisplay(slotIndex);
        }
    }

    clearAll() {
        this.slots = [[], [], []];
        this.updateAllSlots();
    }

    validateProgram(slotIndex) {
        const program = this.slots[slotIndex];
        if (program.length === 0) return { valid: false, reason: 'プログラムが空です' };

        // Separate nodes by type
        const propertyNodes = program.filter(node => node.type === 'property');
        const whenNodes = program.filter(node => node.type === 'when');
        const ifNodes = program.filter(node => node.type === 'if');
        const doNodes = program.filter(node => node.type === 'do');

        // Basic validation rules - PROPERTY nodes are optional, but need WHEN and DO
        const hasWhen = whenNodes.length > 0;
        const hasDo = doNodes.length > 0;

        if (!hasWhen) return { valid: false, reason: 'WHEN ノードが必要です' };
        if (!hasDo) return { valid: false, reason: 'DO ノードが必要です' };

        // PROPERTY nodes can be anywhere and don't affect flow validation
        // Check valid flow sequences (ignoring PROPERTY nodes for flow validation)
        const flowNodes = program.filter(node => node.type !== 'property');
        
        if (flowNodes.length === 0) return { valid: false, reason: 'フローノードが必要です' };
        
        const whenIndex = flowNodes.findIndex(node => node.type === 'when');
        const ifIndex = flowNodes.findIndex(node => node.type === 'if');
        const doIndex = flowNodes.findIndex(node => node.type === 'do');

        // Valid patterns: WHEN→DO, WHEN→IF→DO, IF→WHEN→DO
        if (ifIndex === -1) {
            // WHEN→DO pattern
            if (whenIndex < doIndex) {
                return { valid: true };
            }
        } else {
            // Check IF patterns
            if ((whenIndex < ifIndex && ifIndex < doIndex) || 
                (ifIndex < whenIndex && whenIndex < doIndex)) {
                return { valid: true };
            }
        }

        return { valid: false, reason: '無効なノード順序です' };
    }

    updateSlotDisplay(slotIndex) {
        const slotElement = document.querySelector(`.slot[data-slot="${slotIndex}"]`);
        if (!slotElement) {
            console.warn(`Slot element not found for index ${slotIndex}`);
            return;
        }

        const program = this.slots[slotIndex];
        
        if (program.length === 0) {
            slotElement.innerHTML = '<span class="slot-placeholder">ノードをここにドラッグ</span>';
            slotElement.classList.remove('filled');
            return;
        }

        const content = document.createElement('div');
        content.className = 'slot-content';

        program.forEach((node, index) => {
            if (index > 0) {
                const arrow = document.createElement('span');
                arrow.className = 'arrow';
                arrow.textContent = '→';
                content.appendChild(arrow);
            }

            const nodeElement = document.createElement('span');
            nodeElement.className = 'slot-node';
            nodeElement.setAttribute('data-type', node.type);
            nodeElement.textContent = node.toString();
            
            // Add click to remove functionality
            nodeElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeNode(slotIndex, index);
            });
            
            content.appendChild(nodeElement);
        });

        slotElement.innerHTML = '';
        slotElement.appendChild(content);
        slotElement.classList.add('filled');

        // Add validation indicator
        const validation = this.validateProgram(slotIndex);
        if (validation.valid) {
            slotElement.style.borderColor = '#4CAF50';
        } else {
            slotElement.style.borderColor = '#f44336';
            slotElement.title = validation.reason;
        }
    }

    updateAllSlots() {
        for (let i = 0; i < this.slots.length; i++) {
            this.updateSlotDisplay(i);
        }
    }

    getProgram(slotIndex) {
        return this.slots[slotIndex] || [];
    }

    getAllPrograms() {
        return this.slots;
    }

    // Enhanced example programs with better homing demonstrations
    loadExample(exampleName) {
        const examples = {
            'timer-bomb': [
                { type: 'when', action: 'timer-2' },
                { type: 'do', action: 'explode' }
            ],
            'bounce-bullet': [
                { type: 'when', action: 'wall-contact' },
                { type: 'do', action: 'bounce' }
            ],
            'smart-split': [
                { type: 'when', action: 'timer-1' },
                { type: 'if', action: 'enemy-many' },
                { type: 'do', action: 'split' }
            ],
            // Improved homing examples that actually demonstrate homing behavior
            'homing-bomb': [
                { type: 'property', action: 'homing' },
                { type: 'when', action: 'timer-2' },
                { type: 'do', action: 'explode' }
            ],
            'homing-penetrate': [
                { type: 'property', action: 'homing' },
                { type: 'property', action: 'penetrate' },
                { type: 'when', action: 'timer-2' },
                { type: 'do', action: 'destroy' }
            ],
            'smart-homing': [
                { type: 'property', action: 'homing' },
                { type: 'when', action: 'timer-1' },
                { type: 'if', action: 'enemy-near' },
                { type: 'do', action: 'explode' }
            ],
            'poison-magnetic': [
                { type: 'property', action: 'poison' },
                { type: 'property', action: 'magnetic' },
                { type: 'when', action: 'immediate' },
                { type: 'do', action: 'explode' }
            ],
            'ultimate-homing': [
                { type: 'property', action: 'homing' },
                { type: 'property', action: 'high-damage' },
                { type: 'property', action: 'penetrate' },
                { type: 'when', action: 'timer-2' },
                { type: 'do', action: 'split' }
            ],
            'basic-homing': [
                { type: 'property', action: 'homing' },
                { type: 'when', action: 'immediate' },
                { type: 'do', action: 'destroy' }
            ]
        };

        const example = examples[exampleName];
        if (example) {
            // Find empty slot or use slot 0
            let targetSlot = 0;
            for (let i = 0; i < this.slots.length; i++) {
                if (this.slots[i].length === 0) {
                    targetSlot = i;
                    break;
                }
            }

            // Clear the target slot and load example
            this.clearSlot(targetSlot);
            example.forEach(nodeData => {
                const node = new RPANode(nodeData.type, nodeData.action);
                this.addNode(targetSlot, node);
            });

            console.log(`Loaded example "${exampleName}" into slot ${targetSlot + 1}`);
            
            // Show success message for homing examples
            if (exampleName.includes('homing')) {
                setTimeout(() => {
                    alert(`🎯 ホーミング弾の例を読み込みました！\n\n敵が近くにいることを確認してから「テスト発射」ボタンを押してください。\n\nピンク色のトレイルと追尾効果をお楽しみください！`);
                }, 500);
            }
        }
    }
}

// Global RPA program instance
const rpaProgram = new RPAProgram();

// Modal management
class ModalManager {
    constructor() {
        this.modal = null;
        this.isOpen = false;
    }

    init() {
        this.modal = document.getElementById('rpa-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Open modal button
        const openButton = document.getElementById('open-rpa-editor');
        if (openButton) {
            openButton.addEventListener('click', () => this.open());
        }

        // Close modal buttons
        const closeButton = document.getElementById('close-rpa-editor');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }

        const saveAndCloseButton = document.getElementById('save-and-close');
        if (saveAndCloseButton) {
            saveAndCloseButton.addEventListener('click', () => this.close());
        }

        // Close on outside click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'block';
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Refresh slot displays when opening
            rpaProgram.updateAllSlots();
            
            console.log('RPA Editor opened');
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;
            document.body.style.overflow = 'auto';
            
            console.log('RPA Editor closed');
        }
    }

    isModalOpen() {
        return this.isOpen;
    }
}

// Global modal manager
const modalManager = new ModalManager();

// Initialize RPA UI
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Enhanced RPA UI...');
    initializeRPAUI();
    modalManager.init();
});

function initializeRPAUI() {
    // Add drag and drop functionality to nodes
    const nodes = document.querySelectorAll('.node');
    nodes.forEach(node => {
        node.draggable = true;
        node.addEventListener('dragstart', handleDragStart);
    });

    // Add drop functionality to slots
    const slots = document.querySelectorAll('.slot');
    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragleave', handleDragLeave);
    });

    // Add button functionality
    const clearButton = document.getElementById('clear-program');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            rpaProgram.clearAll();
            console.log('All programs cleared');
        });
    }

    const testButton = document.getElementById('test-fire');
    if (testButton) {
        testButton.addEventListener('click', () => {
            testFireBullet();
        });
    }

    // Add quick homing test button
    const quickHomingButton = document.createElement('button');
    quickHomingButton.id = 'quick-homing-test';
    quickHomingButton.className = 'control-button primary';
    quickHomingButton.innerHTML = '🎯 ホーミングテスト';
    quickHomingButton.addEventListener('click', () => {
        quickHomingTest();
    });
    
    // Add to editor controls
    const editorControls = document.querySelector('.editor-controls');
    if (editorControls) {
        editorControls.appendChild(quickHomingButton);
    }

    // Add example card functionality
    const exampleCards = document.querySelectorAll('.example-card');
    exampleCards.forEach(card => {
        card.addEventListener('click', () => {
            const exampleName = card.getAttribute('data-example');
            rpaProgram.loadExample(exampleName);
            
            // Visual feedback
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    });

    console.log('Enhanced RPA UI initialized successfully');
}

function quickHomingTest() {
    // Automatically load a simple homing bullet for testing
    const slot = 0; // Use first slot
    rpaProgram.clearSlot(slot);
    
    // Create basic homing bullet: [ホーミング] → [2秒後] → [爆発する]
    const homingNode = new RPANode('property', 'homing');
    const whenNode = new RPANode('when', 'timer-2');
    const doNode = new RPANode('do', 'explode');
    
    rpaProgram.addNode(slot, homingNode);
    rpaProgram.addNode(slot, whenNode);
    rpaProgram.addNode(slot, doNode);
    
    console.log('Quick homing test loaded');
    
    // Test fire immediately
    if (window.game && window.game.testFire) {
        window.game.testFire(rpaProgram.getProgram(slot));
        modalManager.close();
        
        // Show guidance message
        setTimeout(() => {
            alert('🎯 ホーミング弾をテスト発射しました！\n\n• ピンク色のトレイルが見えます\n• 弾丸が敵を追尾します\n• 2秒後に爆発します\n\n効果が見えない場合は敵が近くにいるか確認してください。');
        }, 100);
    }
}

function handleDragStart(e) {
    const nodeType = e.target.getAttribute('data-type');
    const nodeAction = e.target.getAttribute('data-action');
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
        type: nodeType,
        action: nodeAction
    }));
    
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    if (e.currentTarget) {
        e.currentTarget.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.currentTarget) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    // Safety check for currentTarget
    if (!e.currentTarget) {
        console.warn('Drop event currentTarget is null');
        return;
    }
    
    e.currentTarget.classList.remove('drag-over');
    
    try {
        const nodeData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const slotIndex = parseInt(e.currentTarget.getAttribute('data-slot'));
        
        if (isNaN(slotIndex)) {
            console.warn('Invalid slot index');
            return;
        }
        
        const node = new RPANode(nodeData.type, nodeData.action);
        
        if (rpaProgram.addNode(slotIndex, node)) {
            // Visual feedback - check if element still exists
            if (e.currentTarget && e.currentTarget.classList) {
                e.currentTarget.classList.add('node-placed');
                setTimeout(() => {
                    if (e.currentTarget && e.currentTarget.classList) {
                        e.currentTarget.classList.remove('node-placed');
                    }
                }, 300);
            }
            
            console.log(`Added node ${node.toString()} to slot ${slotIndex + 1}`);
            
            // Give helpful hints for property nodes
            if (node.type === 'property' && node.action === 'homing') {
                setTimeout(() => {
                    alert('🎯 ホーミングプロパティを追加しました！\n\n次に以下を追加してください：\n1. WHENノード（いつ発動するか）\n2. DOノード（何をするか）\n\n例：[2秒後] → [爆発する]');
                }, 100);
            }
        }
    } catch (error) {
        console.error('Error adding node:', error);
    }
    
    // Remove dragging class from all nodes
    document.querySelectorAll('.node.dragging').forEach(node => {
        node.classList.remove('dragging');
    });
}

function testFireBullet() {
    // Find the first valid program
    for (let i = 0; i < rpaProgram.slots.length; i++) {
        const validation = rpaProgram.validateProgram(i);
        if (validation.valid) {
            const program = rpaProgram.getProgram(i);
            const hasHoming = program.some(node => node.type === 'property' && node.action === 'homing');
            
            console.log(`Testing program in slot ${i + 1}:`, program);
            
            // This will be connected to the game engine
            if (window.game && window.game.testFire) {
                window.game.testFire(program);
                
                // Close modal if test firing from modal
                if (modalManager.isModalOpen()) {
                    modalManager.close();
                }
                
                // Show helpful message for homing bullets
                if (hasHoming) {
                    setTimeout(() => {
                        alert('🎯 ホーミング弾を発射しました！\n\n• ピンク色のトレイルを探してください\n• 弾丸が敵を追尾しているか確認してください\n• 敵が画面にいない場合、しばらく待ってから再試行してください');
                    }, 100);
                }
            } else {
                console.log('Game engine not ready, simulating bullet behavior...');
                simulateBulletBehavior(program);
            }
            return;
        }
    }
    
    console.log('No valid programs found!');
    
    // Enhanced help message
    const message = '有効なプログラムが見つかりません！\n\n【基本パターン】\n1. PROPERTY ノード（属性・任意）\n2. WHEN ノード（いつ）\n3. DO ノード（実行）\n\n【ホーミング弾の例】\n1. [ホーミング]をドラッグ\n2. [2秒後]をドラッグ\n3. [爆発する]をドラッグ\n\nまたは「🎯 ホーミングテスト」ボタンを試してください！';
    alert(message);
}

function simulateBulletBehavior(program) {
    console.log('Simulating enhanced bullet with program:', program.map(node => node.toString()).join(' → '));
    
    // Enhanced simulation for testing
    let time = 0;
    const hasHoming = program.some(node => node.type === 'property' && node.action === 'homing');
    
    if (hasHoming) {
        console.log('🎯 Homing property detected - enhanced tracking simulation:');
    }
    
    program.forEach(node => {
        if (node.type === 'property') {
            console.log(`${time}ms: Apply property ${node.toString()}`);
            if (node.action === 'homing') {
                console.log('  -> Pink trail effect active');
                console.log('  -> Enemy targeting system enabled');
                console.log('  -> Enhanced turn rate: 0.08 rad/frame');
            }
        } else if (node.type === 'when') {
            if (node.action === 'immediate') {
                console.log(`${time}ms: Trigger immediate`);
            } else if (node.action.startsWith('timer-')) {
                const delay = parseInt(node.action.split('-')[1]) * 1000;
                console.log(`${time + delay}ms: Timer trigger`);
                if (hasHoming) {
                    console.log(`  -> Homing active for ${delay}ms`);
                }
            }
        } else if (node.type === 'do') {
            console.log(`${time}ms: Execute ${node.toString()}`);
        }
    });
}

// Export for global access
window.rpaProgram = rpaProgram;
window.modalManager = modalManager;