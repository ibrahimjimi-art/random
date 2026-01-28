/**
 * Rubik's Cube Emulator - Main Application
 * Ties together all components and handles user interactions
 */

class RubiksCubeApp {
    constructor() {
        // Core components
        this.cubeState = new CubeState();
        this.solver = new FastSolver();
        this.audio = new AudioSystem();
        this.renderer = null;

        // UI state
        this.moveCount = 0;
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.isSolving = false;
        this.currentSolution = null;
        this.solutionIndex = 0;

        // DOM elements
        this.elements = {};

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.setupRenderer();
        this.setupEventListeners();
        this.updateStatus();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            cube: document.getElementById('cube'),
            cubeContainer: document.getElementById('cubeContainer'),
            scrambleBtn: document.getElementById('scrambleBtn'),
            solveBtn: document.getElementById('solveBtn'),
            resetBtn: document.getElementById('resetBtn'),
            playBtn: document.getElementById('playBtn'),
            stepBtn: document.getElementById('stepBtn'),
            audioToggle: document.getElementById('audioToggle'),
            moveCount: document.getElementById('moveCount'),
            timer: document.getElementById('timer'),
            status: document.getElementById('status'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            solutionMoves: document.getElementById('solutionMoves'),
            solutionLength: document.getElementById('solutionLength'),
            solutionPanel: document.getElementById('solutionPanel')
        };
    }

    /**
     * Setup the 3D renderer
     */
    setupRenderer() {
        this.renderer = new CubeRenderer(this.elements.cube, this.cubeState);
        this.renderer.setAnimationSpeed(parseInt(this.elements.speedSlider.value));
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Main buttons
        this.elements.scrambleBtn.addEventListener('click', () => this.scramble());
        this.elements.solveBtn.addEventListener('click', () => this.solve());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        // Solution controls
        this.elements.playBtn.addEventListener('click', () => this.playSolution());
        this.elements.stepBtn.addEventListener('click', () => this.stepSolution());

        // Audio toggle
        this.elements.audioToggle.addEventListener('click', () => this.toggleAudio());

        // Speed slider
        this.elements.speedSlider.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.renderer.setAnimationSpeed(speed);
            this.elements.speedValue.textContent = speed + 'ms';
        });

        // View rotation buttons
        document.querySelectorAll('.rotate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const axis = btn.dataset.axis;
                const dir = parseInt(btn.dataset.dir);
                this.renderer.rotateView(axis, dir);
            });
        });

        // Move buttons
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.init();
                const move = btn.dataset.move;
                this.applyMove(move);
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Initialize audio on first click
        document.addEventListener('click', () => this.audio.init(), { once: true });
    }

    /**
     * Handle keyboard input
     */
    handleKeyboard(e) {
        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT') return;

        const key = e.key.toUpperCase();
        const validFaces = ['U', 'D', 'L', 'R', 'F', 'B'];

        if (validFaces.includes(key)) {
            e.preventDefault();
            this.audio.init();
            const move = e.shiftKey ? key + "'" : key;
            this.applyMove(move);
        }

        // Spacebar to step through solution
        if (e.key === ' ' && this.currentSolution) {
            e.preventDefault();
            this.stepSolution();
        }
    }

    /**
     * Apply a single move
     */
    applyMove(move) {
        if (this.renderer.isAnimating || this.isSolving) return;

        this.audio.playMoveSound();
        this.moveCount++;
        this.updateMoveCount();

        // Start timer on first move
        if (this.moveCount === 1 && !this.timerInterval) {
            this.startTimer();
        }

        this.renderer.animateMove(move, () => {
            this.updateStatus();
            this.clearSolution();
        });
    }

    /**
     * Scramble the cube
     */
    scramble() {
        if (this.renderer.isAnimating || this.isSolving) return;

        this.audio.init();
        this.audio.playScrambleSound();

        // Reset first
        this.cubeState.reset();
        this.renderer.quickRender();
        this.clearSolution();
        this.resetTimer();
        this.moveCount = 0;
        this.updateMoveCount();

        // Generate and apply scramble
        const scramble = CubeState.generateScramble(20);

        // Apply scramble instantly (not animated for speed)
        this.cubeState.applyMoves(scramble, false);
        this.renderer.quickRender();

        // Display scramble
        this.displayScramble(scramble);
        this.updateStatus();

        // Start timer
        this.startTimer();
    }

    /**
     * Display scramble sequence
     */
    displayScramble(scramble) {
        const moves = scramble.split(' ').filter(m => m);
        this.elements.solutionMoves.innerHTML = '';

        moves.forEach(move => {
            const span = document.createElement('span');
            span.className = 'solution-move';
            span.textContent = move;
            this.elements.solutionMoves.appendChild(span);
        });

        this.elements.solutionLength.textContent = `Scrambled: ${moves.length} moves`;
    }

    /**
     * Solve the cube
     */
    solve() {
        if (this.renderer.isAnimating || this.isSolving) return;

        if (this.cubeState.isSolved()) {
            this.audio.playErrorSound();
            return;
        }

        this.audio.init();
        this.isSolving = true;
        this.updateStatus('Solving...');

        // Small delay to show solving status
        setTimeout(() => {
            const result = this.solver.solveWithSteps(this.cubeState);

            if (result.steps.length === 0) {
                // Already solved or error
                this.isSolving = false;
                this.updateStatus();
                return;
            }

            this.currentSolution = result.steps;
            this.solutionIndex = 0;

            this.displaySolution(result.steps);
            this.enableSolutionControls(true);
            this.isSolving = false;
            this.updateStatus('Solution found!');

            setTimeout(() => this.updateStatus(), 1500);
        }, 100);
    }

    /**
     * Display solution moves
     */
    displaySolution(moves) {
        this.elements.solutionMoves.innerHTML = '';

        moves.forEach((move, i) => {
            const span = document.createElement('span');
            span.className = 'solution-move';
            span.textContent = move;
            span.dataset.index = i;
            this.elements.solutionMoves.appendChild(span);
        });

        this.elements.solutionLength.textContent = `${moves.length} moves`;
        this.highlightSolutionMove(0);
    }

    /**
     * Highlight current solution move
     */
    highlightSolutionMove(index) {
        const moves = this.elements.solutionMoves.querySelectorAll('.solution-move');
        moves.forEach((m, i) => {
            m.classList.remove('active', 'done');
            if (i < index) m.classList.add('done');
            if (i === index) m.classList.add('active');
        });
    }

    /**
     * Play through solution automatically
     */
    playSolution() {
        if (!this.currentSolution || this.renderer.isAnimating) return;

        this.audio.init();
        this.isSolving = true;
        this.enableSolutionControls(false);

        const remaining = this.currentSolution.slice(this.solutionIndex);

        this.renderer.animateMoves(
            remaining.join(' '),
            () => {
                // Complete
                this.isSolving = false;
                this.stopTimer();
                this.updateStatus();

                if (this.cubeState.isSolved()) {
                    this.celebrate();
                }
            },
            (move, relIndex) => {
                const absIndex = this.solutionIndex + relIndex;
                this.highlightSolutionMove(absIndex + 1);
                this.audio.playStepSound();
                this.solutionIndex++;
            }
        );
    }

    /**
     * Step through solution one move at a time
     */
    stepSolution() {
        if (!this.currentSolution || this.renderer.isAnimating) return;
        if (this.solutionIndex >= this.currentSolution.length) return;

        this.audio.init();
        const move = this.currentSolution[this.solutionIndex];
        this.audio.playStepSound();

        this.renderer.animateMove(move, () => {
            this.solutionIndex++;
            this.highlightSolutionMove(this.solutionIndex);

            if (this.solutionIndex >= this.currentSolution.length) {
                this.enableSolutionControls(false);
                this.stopTimer();
                this.updateStatus();

                if (this.cubeState.isSolved()) {
                    this.celebrate();
                }
            }
        });
    }

    /**
     * Enable/disable solution control buttons
     */
    enableSolutionControls(enabled) {
        this.elements.playBtn.disabled = !enabled;
        this.elements.stepBtn.disabled = !enabled;
    }

    /**
     * Clear current solution display
     */
    clearSolution() {
        this.currentSolution = null;
        this.solutionIndex = 0;
        this.elements.solutionMoves.innerHTML = '<span class="no-solution">Scramble the cube to see solution</span>';
        this.elements.solutionLength.textContent = '0 moves';
        this.enableSolutionControls(false);
    }

    /**
     * Reset the cube to solved state
     */
    reset() {
        if (this.renderer.isAnimating) {
            this.renderer.cancelAnimations();
        }

        this.cubeState.reset();
        this.renderer.quickRender();
        this.renderer.resetView();

        this.moveCount = 0;
        this.updateMoveCount();
        this.resetTimer();
        this.clearSolution();
        this.updateStatus();

        this.isSolving = false;
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio() {
        const enabled = this.audio.toggle();
        this.elements.audioToggle.textContent = enabled ? '🔊' : '🔇';
        this.elements.audioToggle.classList.toggle('muted', !enabled);
    }

    /**
     * Update status display
     */
    updateStatus(customStatus = null) {
        const statusEl = this.elements.status;

        if (customStatus) {
            statusEl.textContent = customStatus;
            statusEl.className = 'stat-value status status-solving';
            return;
        }

        if (this.cubeState.isSolved()) {
            statusEl.textContent = 'Solved';
            statusEl.className = 'stat-value status status-solved';
        } else {
            statusEl.textContent = 'Scrambled';
            statusEl.className = 'stat-value status status-scrambled';
        }
    }

    /**
     * Update move count display
     */
    updateMoveCount() {
        this.elements.moveCount.textContent = this.moveCount;
    }

    /**
     * Start the timer
     */
    startTimer() {
        if (this.timerInterval) return;

        this.timerSeconds = 0;
        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Reset the timer
     */
    resetTimer() {
        this.stopTimer();
        this.timerSeconds = 0;
        this.updateTimerDisplay();
    }

    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        this.elements.timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Celebration animation when solved
     */
    celebrate() {
        this.audio.playSolveSound();

        this.elements.cubeContainer.classList.add('celebrating');

        setTimeout(() => {
            this.elements.cubeContainer.classList.remove('celebrating');
        }, 2000);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RubiksCubeApp();
});
