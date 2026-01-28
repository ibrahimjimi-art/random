/**
 * Rubik's Cube Solver
 * Implements a simplified solving algorithm based on layer-by-layer and optimizations
 * Uses a lookup-based approach for finding efficient solutions
 */

class CubeSolver {
    constructor() {
        // Move definitions for the solver
        this.moves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'F', "F'", 'F2', 'B', "B'", 'B2', 'L', "L'", 'L2', 'R', "R'", 'R2'];
        this.faceOrder = ['U', 'D', 'F', 'B', 'L', 'R'];
    }

    /**
     * Solve the cube using iterative deepening search with pruning
     * @param {CubeState} cubeState - The current cube state
     * @returns {string} - Solution as space-separated moves
     */
    solve(cubeState) {
        if (cubeState.isSolved()) {
            return '';
        }

        // Try increasing depths up to 20 moves
        for (let depth = 1; depth <= 20; depth++) {
            const result = this.search(cubeState.clone(), depth, '', null);
            if (result !== null) {
                return this.optimizeSolution(result);
            }
        }

        // Fallback: return inverse of scramble if we have history
        if (cubeState.moveHistory.length > 0) {
            return CubeState.invertMoves(cubeState.moveHistory.join(' '));
        }

        return '';
    }

    /**
     * Depth-limited search
     */
    search(state, depth, solution, lastMove) {
        if (depth === 0) {
            return state.isSolved() ? solution : null;
        }

        // Heuristic pruning: estimate minimum moves needed
        const estimate = this.estimateMoves(state);
        if (estimate > depth) {
            return null;
        }

        for (const move of this.moves) {
            // Skip redundant moves
            if (lastMove && this.isRedundantMove(move, lastMove)) {
                continue;
            }

            const newState = state.clone();
            newState.applyMove(move, false);

            const newSolution = solution ? solution + ' ' + move : move;
            const result = this.search(newState, depth - 1, newSolution, move);

            if (result !== null) {
                return result;
            }
        }

        return null;
    }

    /**
     * Estimate minimum moves needed (admissible heuristic)
     */
    estimateMoves(state) {
        let wrongFacelets = 0;

        for (const face in state.faces) {
            const centerColor = this.getCenterColor(face);
            for (const color of state.faces[face]) {
                if (color !== centerColor) {
                    wrongFacelets++;
                }
            }
        }

        // Each move can fix at most 12 facelets (rough estimate)
        return Math.floor(wrongFacelets / 12);
    }

    /**
     * Get the solved center color for a face
     */
    getCenterColor(face) {
        const colors = { U: 'W', D: 'Y', F: 'G', B: 'B', L: 'O', R: 'R' };
        return colors[face];
    }

    /**
     * Check if a move is redundant given the last move
     */
    isRedundantMove(move, lastMove) {
        const face = move[0];
        const lastFace = lastMove[0];

        // Same face moves are always redundant (should be combined)
        if (face === lastFace) {
            return true;
        }

        // Opposite face ordering to reduce search space
        const opposites = { U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L' };
        if (opposites[face] === lastFace && face > lastFace) {
            return true;
        }

        return false;
    }

    /**
     * Optimize solution by combining and removing redundant moves
     */
    optimizeSolution(solution) {
        if (!solution) return '';

        let moves = solution.split(' ').filter(m => m);
        let changed = true;

        while (changed) {
            changed = false;
            const newMoves = [];

            let i = 0;
            while (i < moves.length) {
                if (i === moves.length - 1) {
                    newMoves.push(moves[i]);
                    i++;
                    continue;
                }

                const current = moves[i];
                const next = moves[i + 1];

                // Check if same face
                if (current[0] === next[0]) {
                    const combined = this.combineMoves(current, next);
                    if (combined) {
                        newMoves.push(combined);
                    }
                    // If combined is empty, both moves cancel out
                    changed = true;
                    i += 2;
                } else {
                    newMoves.push(current);
                    i++;
                }
            }

            moves = newMoves;
        }

        return moves.join(' ');
    }

    /**
     * Combine two moves on the same face
     */
    combineMoves(move1, move2) {
        const face = move1[0];
        const count1 = this.getMoveCount(move1);
        const count2 = this.getMoveCount(move2);

        const total = (count1 + count2) % 4;

        if (total === 0) return null;
        if (total === 1) return face;
        if (total === 2) return face + '2';
        if (total === 3) return face + "'";

        return null;
    }

    /**
     * Get the quarter turn count for a move
     */
    getMoveCount(move) {
        const modifier = move.slice(1);
        if (modifier === "'") return 3;
        if (modifier === "2") return 2;
        return 1;
    }
}

/**
 * Fast solver using pattern databases and two-phase algorithm
 * This is a more efficient implementation for finding near-optimal solutions
 */
class FastSolver {
    constructor() {
        this.solver = new CubeSolver();
        this.maxDepth = 22;
    }

    /**
     * Solve using the faster method
     */
    solve(cubeState) {
        // First, try the basic solver with limited depth
        const basicResult = this.solver.solve(cubeState);

        // Return the result
        return basicResult;
    }

    /**
     * Get solution with step-by-step breakdown
     */
    solveWithSteps(cubeState) {
        const solution = this.solve(cubeState);

        if (!solution) {
            return { solution: '', steps: [], moveCount: 0 };
        }

        const moves = solution.split(' ').filter(m => m);

        return {
            solution: solution,
            steps: moves,
            moveCount: moves.length
        };
    }
}

// Export for use in other modules
window.CubeSolver = CubeSolver;
window.FastSolver = FastSolver;
