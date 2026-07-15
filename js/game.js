/* Math Treasure Quest - Main Game Loop & Orchestrator */
import { Player } from './player.js';
import { World } from './world.js';
import { mathEngine } from './math.js';
import { gameAudio } from './audio.js';

const THREE = window.THREE;
const OrbitControls = THREE.OrbitControls;

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.state = 'loading'; // loading, start, playing, interacting, victory
        
        // Timer and stats
        this.startTime = 0;
        this.elapsedTime = 0;
        this.attempts = 0;
        this.correctAnswers = 0;
        this.lives = 3;
        this.mistakesPerMonolith = 0;
        
        // Active math monolith being interacted with
        this.activeMonolith = null;
        this.selectedChoice = null;
        
        // Inventory
        this.inventory = {
            arithmetic: false,
            algebra: false,
            geometry: false
        };

        this.initThree();
        this.initModules();
        this.setupUIListeners();
        this.simulateLoading();
    }

    initThree() {
        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060913); // Spatial.io deep dark space

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 15);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.container.appendChild(this.renderer.domElement);

        // 4. Orbit Controls (Targeted to track the player)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
        this.controls.minDistance = 6;
        this.controls.maxDistance = 22;
        this.controls.enablePan = false; // Player controls position, not camera

        // 5. Resize handler
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    initModules() {
        // Instantiate the game world islands and bridges
        this.world = new World(this.scene);
        
        // Instantiate player avatar
        this.player = new Player(this.scene);
        this.player.onRespawnCallback = () => this.triggerRespawnEffect();
        
        // Snap controls camera directly behind player on start
        this.camera.position.set(0, 7, -10);
        this.controls.target.copy(this.player.position);
        this.controls.update();
        
        // Set player visor color to default neon cyan
        this.player.setVisorColor(0x00f2fe);
    }

    simulateLoading() {
        const progressBar = document.getElementById('load-progress');
        const statusText = document.getElementById('load-status');
        const startBtn = document.getElementById('start-btn');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                progressBar.style.width = '100%';
                statusText.innerText = 'Acoplamiento dimensional completado';
                startBtn.classList.remove('hidden');
            } else {
                progressBar.style.width = `${progress}%`;
                
                // Fancy Sci-fi statuses
                if (progress < 30) statusText.innerText = 'Inicializando motores 3D...';
                else if (progress < 60) statusText.innerText = 'Sintetizando geometrías flotantes...';
                else if (progress < 90) statusText.innerText = 'Conectando nexos matemáticos...';
            }
        }, 150);
    }

    startGame() {
        this.state = 'playing';
        
        // Initialize Audio context on first click interaction
        gameAudio.init();
        
        // Transition screens
        document.getElementById('loading-screen').classList.remove('active');
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
        }, 500);

        this.startTime = Date.now();
        
        // Start main loop
        this.animate();
    }

    setupUIListeners() {
        // Button trigger: start game
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Close math modal
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeMathModal();
        });

        // Submit answer action
        document.getElementById('submit-answer-btn').addEventListener('click', () => {
            this.checkAnswer();
        });

        // Keyboard Enter inside input submission
        document.getElementById('math-answer-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Key E trigger for keyboard interactions
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                if (this.state === 'playing') {
                    this.attemptInteraction();
                }
            }
        });

        // Restart buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetNexusGame();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.resetNexusGame();
        });
    }

    attemptInteraction() {
        // Find nearest monolith
        const monolith = this.getNearestMonolith();
        if (monolith) {
            this.openMathModal(monolith);
        }
    }

    getNearestMonolith() {
        if (!this.player) return null;
        let closest = null;
        let minDist = 9999;

        this.world.monoliths.forEach(m => {
            if (m.solved) return;
            
            // Allow bridge monoliths to be solved, but outer key monoliths can only be solved if bridge is active!
            if (m.id.startsWith('key_')) {
                const parentType = m.id.replace('key_', '');
                if (!this.world.bridges[parentType].active) return; // cannot interact if bridge not built
            }

            const dist = this.player.position.distanceTo(m.position);
            if (dist < m.radius && dist < minDist) {
                minDist = dist;
                closest = m;
            }
        });

        return closest;
    }

    openMathModal(monolith) {
        this.state = 'interacting';
        this.activeMonolith = monolith;
        gameAudio.playInteract();
        
        // Show modal and dim HUD
        document.getElementById('hud').style.opacity = '0.3';
        const modal = document.getElementById('math-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Clear previous state inputs
        document.getElementById('math-answer-input').value = '';
        this.selectedChoice = null;
        this.mistakesPerMonolith = 0;
        
        const feedback = document.getElementById('feedback-message');
        feedback.innerText = '';
        feedback.className = 'feedback-msg';

        // Load procedural question
        let categoryKey = 'arithmetic';
        let difficulty = 0;

        if (monolith.id === 'bridge_arithmetic') { difficulty = 0; categoryKey = 'arithmetic'; }
        else if (monolith.id === 'key_arithmetic') { difficulty = 1; categoryKey = 'arithmetic'; }
        else if (monolith.id === 'bridge_algebra') { difficulty = 0; categoryKey = 'algebra'; }
        else if (monolith.id === 'key_algebra') { difficulty = 1; categoryKey = 'algebra'; }
        else if (monolith.id === 'bridge_geometry') { difficulty = 0; categoryKey = 'geometry'; }
        else if (monolith.id === 'key_geometry') { difficulty = 1; categoryKey = 'geometry'; }

        // Fetch question object
        const q = mathEngine.generateQuestion(categoryKey, difficulty);
        this.activeQuestion = q;

        // Set UI labels
        document.getElementById('modal-monolith-type').innerText = monolith.label;
        document.getElementById('question-category').innerText = `Categoría: ${q.category} - Nivel de energía`;
        document.getElementById('question-text').innerHTML = q.text;

        // Setup input display
        const textContainer = document.getElementById('input-container-text');
        const choiceContainer = document.getElementById('input-container-choice');

        if (q.type === 'input') {
            textContainer.classList.remove('hidden');
            choiceContainer.classList.add('hidden');
            // autofocus
            setTimeout(() => document.getElementById('math-answer-input').focus(), 150);
        } else {
            textContainer.classList.add('hidden');
            choiceContainer.classList.remove('hidden');

            // Render choice buttons
            const grid = document.getElementById('math-choices-grid');
            grid.innerHTML = '';
            
            q.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerText = choice;
                btn.addEventListener('click', () => {
                    // Select option
                    document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.selectedChoice = choice;
                });
                grid.appendChild(btn);
            });
        }
    }

    closeMathModal() {
        const modal = document.getElementById('math-modal');
        modal.classList.remove('active');
        document.getElementById('hud').style.opacity = '1.0';
        
        setTimeout(() => {
            modal.classList.add('hidden');
            this.state = 'playing';
            this.activeMonolith = null;
        }, 300);
    }

    checkAnswer() {
        if (!this.activeQuestion) return;

        let userAnswer = "";
        if (this.activeQuestion.type === 'input') {
            userAnswer = document.getElementById('math-answer-input').value.trim();
        } else {
            userAnswer = this.selectedChoice ? this.selectedChoice.trim() : "";
        }

        if (userAnswer === "") {
            this.showFeedback("Por favor, ingresa o selecciona una respuesta.", false);
            return;
        }

        this.attempts++;
        const isCorrect = (userAnswer.toLowerCase() === this.activeQuestion.answer.toLowerCase());

        if (isCorrect) {
            this.correctAnswers++;
            this.showFeedback("¡Decodificación correcta! Canalizando energía...", true);
            gameAudio.playCorrect();
            
            // Wait slightly before closing modal so they see correctness
            setTimeout(() => {
                this.handleMonolithSolved(this.activeMonolith);
                this.closeMathModal();
            }, 1000);
        } else {
            this.mistakesPerMonolith++;
            
            if (this.mistakesPerMonolith >= 3) {
                this.showFeedback("¡Daño estructural! Redireccionando al nexo...", false);
                gameAudio.playWrong();
                
                // Shake visual cue
                const modalContent = document.querySelector('.modal-content');
                modalContent.classList.add('shake');
                setTimeout(() => modalContent.classList.remove('shake'), 400);
                
                setTimeout(() => {
                    this.closeMathModal();
                    this.deductLife();
                    if (this.lives > 0) {
                        this.player.respawn();
                    }
                }, 1000);
            } else {
                // Shake visual cue
                const modalContent = document.querySelector('.modal-content');
                modalContent.classList.add('shake');
                setTimeout(() => modalContent.classList.remove('shake'), 400);

                const remaining = 3 - this.mistakesPerMonolith;
                this.showFeedback(`Firma de energía errónea. Quedan ${remaining} intentos.`, false);
                gameAudio.playWrong();
            }
        }
    }

    showFeedback(message, isCorrect) {
        const feedback = document.getElementById('feedback-message');
        feedback.innerText = message;
        feedback.className = `feedback-msg show ${isCorrect ? 'correct' : 'incorrect'}`;
    }

    handleMonolithSolved(monolith) {
        monolith.solved = true;
        
        // Hide symbol glow/light slightly or shift color to solved green
        monolith.symbol.material.color.setHex(0x10b981);
        monolith.light.color.setHex(0x10b981);

        const id = monolith.id;
        
        if (id.startsWith('bridge_')) {
            // Build the bridge!
            const type = id.replace('bridge_', '');
            this.world.buildBridge(type);
            this.updateMissionText(`Puente hacia isla de ${type.toUpperCase()} construido. Cruza y reclama la Llave.`);
        } 
        else if (id.startsWith('key_')) {
            // Key collected!
            const type = id.replace('key_', '');
            this.inventory[type] = true;
            gameAudio.playKeyCollect();

            // Highlight key HUD
            const slot = document.getElementById(`slot-${type}`);
            slot.classList.add('acquired');
            
            // Mark checklist
            const dot = document.getElementById(`dot-${type}`);
            dot.className = 'dot completed';

            // Activate corresponding pedestal ring color in vault
            const keyIndex = type === 'arithmetic' ? 0 : type === 'algebra' ? 1 : 2;
            this.world.activateVaultLock(keyIndex);

            // Change visor color to matching color as aesthetic reward
            let nextColor = 0x00f2fe;
            if (type === 'arithmetic') nextColor = 0x00f2fe; // Cyan
            if (type === 'algebra') nextColor = 0xff007f; // Magenta
            if (type === 'geometry') nextColor = 0x10b981; // Emerald
            this.player.setVisorColor(nextColor);

            // Check if all keys collected
            if (this.inventory.arithmetic && this.inventory.algebra && this.inventory.geometry) {
                this.updateMissionText("¡Todas las llaves obtenidas! Dirígete al pedestal central para abrir la bóveda.");
            } else {
                this.updateMissionText(`¡Llave de ${type.toUpperCase()} recuperada! Encuentra las llaves restantes.`);
            }
        }
    }

    updateMissionText(text) {
        document.getElementById('current-quest').innerText = text;
    }

    triggerRespawnEffect() {
        const uiContainer = document.getElementById('ui-container');
        uiContainer.style.background = 'rgba(239, 68, 68, 0.4)'; // Flash red
        setTimeout(() => {
            uiContainer.style.background = 'transparent';
        }, 150);
        
        this.deductLife();
        
        if (this.lives > 0) {
            this.updateMissionText("¡Caída fuera de órbita! Reensamblando dron...");
        }
    }

    deductLife() {
        this.lives--;
        this.updateLivesHUD();
        
        if (this.lives <= 0) {
            this.triggerGameOver();
        } else {
            gameAudio.playLoseLife();
        }
    }

    updateLivesHUD() {
        for (let i = 1; i <= 3; i++) {
            const heart = document.getElementById(`heart-${i}`);
            if (heart) {
                if (i > this.lives) {
                    heart.classList.add('lost');
                } else {
                    heart.classList.remove('lost');
                }
            }
        }
    }

    triggerGameOver() {
        this.state = 'gameover';
        gameAudio.playGameOver();
        gameAudio.stopAmbientPad();
        
        // Hide HUD and modals, show Game Over
        document.getElementById('hud').classList.add('hidden');
        
        const modal = document.getElementById('math-modal');
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
        
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('hidden');
        setTimeout(() => gameOverScreen.classList.add('active'), 10);
    }

    checkVaultProximity() {
        // If all keys collected and player reaches center, open vault!
        if (this.inventory.arithmetic && this.inventory.algebra && this.inventory.geometry) {
            const dist = this.player.position.distanceTo(new THREE.Vector3(0, 0, 0));
            if (dist < 3.2 && this.state === 'playing') {
                this.triggerVictory();
            }
        }
    }

    triggerVictory() {
        this.state = 'victory';
        this.world.openVaultShield();
        
        // Stop background pad synth
        gameAudio.stopAmbientPad();

        // Calculate statistics
        const timeDiff = Date.now() - this.startTime;
        const minutes = Math.floor(timeDiff / 60000);
        const seconds = Math.floor((timeDiff % 60000) / 1000);
        const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        const accuracy = this.attempts > 0 ? Math.round((this.correctAnswers / this.attempts) * 100) : 100;
        
        // Display statistics
        document.getElementById('stat-time').innerText = timeStr;
        document.getElementById('stat-accuracy').innerText = `${accuracy}%`;

        // Slide in victory screen
        document.getElementById('hud').classList.add('hidden');
        const vict = document.getElementById('victory-screen');
        vict.classList.remove('hidden');
        setTimeout(() => vict.classList.add('active'), 100);
    }

    resetNexusGame() {
        // Destroy player & world
        this.player.destroy();
        
        // Reset scene
        // Remove everything but lights
        const toRemove = [];
        this.scene.children.forEach(child => {
            if (!(child instanceof THREE.HemisphereLight || child instanceof THREE.DirectionalLight || child instanceof THREE.PointLight)) {
                toRemove.push(child);
            }
        });
        toRemove.forEach(child => this.scene.remove(child));

        // Recreate World, Player, state
        this.initModules();

        // Reset Inventory and Lives
        this.inventory = { arithmetic: false, algebra: false, geometry: false };
        this.attempts = 0;
        this.correctAnswers = 0;
        this.lives = 3;
        this.updateLivesHUD();

        // Reset HUD styling
        document.querySelectorAll('.key-slot').forEach(s => s.classList.remove('acquired'));
        document.querySelectorAll('.dot').forEach(d => d.className = 'dot');
        this.updateMissionText("Explora el archipiélago y activa los Monolitos");

        // Hide modals, victory, and game-over screens
        document.getElementById('victory-screen').classList.remove('active');
        setTimeout(() => document.getElementById('victory-screen').classList.add('hidden'), 500);
        
        document.getElementById('game-over-screen').classList.remove('active');
        setTimeout(() => document.getElementById('game-over-screen').classList.add('hidden'), 500);
        
        document.getElementById('hud').classList.remove('hidden');

        // Restart timer and music
        this.startTime = Date.now();
        this.state = 'playing';
        gameAudio.startAmbientPad();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (this.state === 'loading') return;
        
        requestAnimationFrame(() => this.animate());

        // Update physics/move only if not in modal
        if (this.state === 'playing') {
            this.player.update(this.camera, this.world.colliders);
            this.checkVaultProximity();
            
            // Check monolith distances to display interact tooltip prompt
            const nearest = this.getNearestMonolith();
            const tooltip = document.getElementById('interact-prompt');
            if (nearest) {
                tooltip.classList.remove('hidden');
                
                // Dynamically update text depending on what it builds
                const tooltipText = tooltip.querySelector('.prompt-text');
                if (nearest.id.startsWith('bridge_')) {
                    tooltipText.innerText = `Presiona E para activar Puente`;
                } else {
                    tooltipText.innerText = `Presiona E para obtener Llave`;
                }
            } else {
                tooltip.classList.add('hidden');
            }
        }

        // Smoothly interpolate the controls target to the player's position to prevent motion sickness
        if (this.player) {
            this.controls.target.lerp(this.player.position, 0.08);
        }
        
        this.controls.update();
        this.world.update();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game instance once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
