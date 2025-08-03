// RPA Node System
class RPANode {
    constructor(type, action, data = {}) {
        this.type = type; // 'when', 'if', 'do'
        this.action = action;
        this.data = data;
    }

    toString() {
        const actionNames = {
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

        // Basic validation rules
        const hasWhen = program.some(node => node.type === 'when');
        const hasDo = program.some(node => node.type === 'do');

        if (!hasWhen) return { valid: false, reason: 'WHEN ノードが必要です' };
        if (!hasDo) return { valid: false, reason: 'DO ノードが必要です' };

        // Check valid sequences
        const whenIndex = program.findIndex(node => node.type === 'when');
        const ifIndex = program.findIndex(node => node.type === 'if');
        const doIndex = program.findIndex(node => node.type === 'do');

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
        if (!slotElement) return;

        const program = this.slots[slotIndex];
        
        if (program.length === 0) {
            slotElement.innerHTML = `スロット ${slotIndex + 1}`;
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
}

// Global RPA program instance
const rpaProgram = new RPAProgram();

// Initialize RPA UI
document.addEventListener('DOMContentLoaded', function() {
    initializeRPAUI();
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
    document.getElementById('clear-program').addEventListener('click', () => {
        rpaProgram.clearAll();
        console.log('All programs cleared');
    });

    document.getElementById('test-fire').addEventListener('click', () => {
        testFireBullet();
    });
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
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    try {
        const nodeData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const slotIndex = parseInt(e.currentTarget.getAttribute('data-slot'));
        
        const node = new RPANode(nodeData.type, nodeData.action);
        
        if (rpaProgram.addNode(slotIndex, node)) {
            e.currentTarget.classList.add('node-placed');
            setTimeout(() => {
                e.currentTarget.classList.remove('node-placed');
            }, 300);
            
            console.log(`Added node ${node.toString()} to slot ${slotIndex + 1}`);
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
            console.log(`Testing program in slot ${i + 1}:`, rpaProgram.getProgram(i));
            
            // This will be connected to the game engine later
            if (window.game && window.game.testFire) {
                window.game.testFire(rpaProgram.getProgram(i));
            } else {
                console.log('Game engine not ready, simulating bullet behavior...');
                simulateBulletBehavior(rpaProgram.getProgram(i));
            }
            return;
        }
    }
    
    console.log('No valid programs found!');
    alert('有効なプログラムがありません。WHEN ノードと DO ノードを正しい順序で配置してください。');
}

function simulateBulletBehavior(program) {
    console.log('Simulating bullet with program:', program.map(node => node.toString()).join(' → '));
    
    // Simple simulation for testing
    let time = 0;
    program.forEach(node => {
        if (node.type === 'when') {
            if (node.action === 'immediate') {
                console.log(`${time}ms: Trigger immediate`);
            } else if (node.action.startsWith('timer-')) {
                const delay = parseInt(node.action.split('-')[1]) * 1000;
                console.log(`${time + delay}ms: Timer trigger`);
            }
        } else if (node.type === 'do') {
            console.log(`${time}ms: Execute ${node.toString()}`);
        }
    });
}