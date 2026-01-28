/**
 * 3D Cube Renderer
 * Handles rendering the cube using CSS 3D transforms
 */

class CubeRenderer {
    constructor(cubeElement, cubeState) {
        this.cubeElement = cubeElement;
        this.cubeState = cubeState;

        // Face mapping for display
        this.faceNames = {
            F: 'front',
            B: 'back',
            L: 'left',
            R: 'right',
            U: 'top',
            D: 'bottom'
        };

        // Current rotation state
        this.rotationX = -25;
        this.rotationY = -40;

        // Animation state
        this.isAnimating = false;
        this.animationQueue = [];
        this.animationSpeed = 300;

        // Mouse drag state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.init();
    }

    /**
     * Initialize the renderer
     */
    init() {
        this.createFaces();
        this.setupDragControls();
        this.render();
    }

    /**
     * Create the 3D face elements
     */
    createFaces() {
        this.cubeElement.innerHTML = '';

        for (const face in this.faceNames) {
            const faceElement = document.createElement('div');
            faceElement.className = `face face-${this.faceNames[face]}`;
            faceElement.dataset.face = face;

            // Create 9 stickers for each face
            for (let i = 0; i < 9; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'sticker';
                sticker.dataset.index = i;
                faceElement.appendChild(sticker);
            }

            this.cubeElement.appendChild(faceElement);
        }
    }

    /**
     * Setup mouse drag controls for cube rotation
     */
    setupDragControls() {
        const container = this.cubeElement.parentElement;

        container.addEventListener('mousedown', (e) => {
            if (this.isAnimating) return;
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            container.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.rotationY += deltaX * 0.5;
            this.rotationX -= deltaY * 0.5;

            // Clamp X rotation
            this.rotationX = Math.max(-90, Math.min(90, this.rotationX));

            this.updateCubeRotation();

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            container.style.cursor = 'grab';
        });

        // Touch support
        container.addEventListener('touchstart', (e) => {
            if (this.isAnimating) return;
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.touches[0].clientX - this.lastMouseX;
            const deltaY = e.touches[0].clientY - this.lastMouseY;

            this.rotationY += deltaX * 0.5;
            this.rotationX -= deltaY * 0.5;
            this.rotationX = Math.max(-90, Math.min(90, this.rotationX));

            this.updateCubeRotation();

            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    /**
     * Update the cube's visual rotation
     */
    updateCubeRotation() {
        this.cubeElement.style.transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
    }

    /**
     * Rotate the view by a specific amount
     */
    rotateView(axis, direction) {
        const amount = direction * 45;
        if (axis === 'x') {
            this.rotationX += amount;
            this.rotationX = Math.max(-90, Math.min(90, this.rotationX));
        } else if (axis === 'y') {
            this.rotationY += amount;
        }
        this.updateCubeRotation();
    }

    /**
     * Render the current cube state to the DOM
     */
    render() {
        for (const face in this.faceNames) {
            const faceElement = this.cubeElement.querySelector(`[data-face="${face}"]`);
            const stickers = faceElement.querySelectorAll('.sticker');

            stickers.forEach((sticker, i) => {
                const color = this.cubeState.faces[face][i];
                sticker.className = `sticker sticker-${color}`;
            });
        }
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
        document.documentElement.style.setProperty('--animation-speed', speed + 'ms');
    }

    /**
     * Animate a single move
     */
    animateMove(move, callback) {
        if (this.isAnimating) {
            this.animationQueue.push({ move, callback });
            return;
        }

        this.isAnimating = true;

        // Apply the move to the state
        this.cubeState.applyMove(move);

        // Render the new state with animation
        this.highlightFace(move[0]);

        setTimeout(() => {
            this.render();
            this.clearHighlights();
            this.isAnimating = false;

            if (callback) callback();

            // Process next in queue
            if (this.animationQueue.length > 0) {
                const next = this.animationQueue.shift();
                this.animateMove(next.move, next.callback);
            }
        }, this.animationSpeed);
    }

    /**
     * Animate a sequence of moves
     */
    animateMoves(moves, onComplete, onEachMove) {
        const moveList = moves.trim().split(/\s+/).filter(m => m);
        let index = 0;

        const doNext = () => {
            if (index >= moveList.length) {
                if (onComplete) onComplete();
                return;
            }

            const move = moveList[index];
            if (onEachMove) onEachMove(move, index);

            this.animateMove(move, () => {
                index++;
                doNext();
            });
        };

        doNext();
    }

    /**
     * Highlight a face being moved
     */
    highlightFace(face) {
        const faceElement = this.cubeElement.querySelector(`[data-face="${face}"]`);
        if (faceElement) {
            const stickers = faceElement.querySelectorAll('.sticker');
            stickers.forEach(s => s.classList.add('highlight'));
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        const stickers = this.cubeElement.querySelectorAll('.sticker.highlight');
        stickers.forEach(s => s.classList.remove('highlight'));
    }

    /**
     * Reset view to default angle
     */
    resetView() {
        this.rotationX = -25;
        this.rotationY = -40;
        this.updateCubeRotation();
    }

    /**
     * Quick render without animation (for instant state updates)
     */
    quickRender() {
        this.render();
    }

    /**
     * Cancel all pending animations
     */
    cancelAnimations() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.clearHighlights();
    }
}

// Export for use in other modules
window.CubeRenderer = CubeRenderer;
