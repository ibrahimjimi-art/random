/**
 * Rubik's Cube State Management
 * Handles the internal state of the cube and all move operations
 */

class CubeState {
    constructor() {
        // Each face is represented as an array of 9 stickers
        // Sticker positions: 0-8 in reading order (top-left to bottom-right)
        // Faces: U (Up/White), D (Down/Yellow), F (Front/Green), B (Back/Blue), L (Left/Orange), R (Right/Red)
        this.faces = {
            U: Array(9).fill('W'), // White top
            D: Array(9).fill('Y'), // Yellow bottom
            F: Array(9).fill('G'), // Green front
            B: Array(9).fill('B'), // Blue back
            L: Array(9).fill('O'), // Orange left
            R: Array(9).fill('R')  // Red right
        };
        
        this.moveHistory = [];
    }
    
    /**
     * Clone the current state
     */
    clone() {
        const newState = new CubeState();
        for (const face in this.faces) {
            newState.faces[face] = [...this.faces[face]];
        }
        newState.moveHistory = [...this.moveHistory];
        return newState;
    }
    
    /**
     * Reset to solved state
     */
    reset() {
        this.faces = {
            U: Array(9).fill('W'),
            D: Array(9).fill('Y'),
            F: Array(9).fill('G'),
            B: Array(9).fill('B'),
            L: Array(9).fill('O'),
            R: Array(9).fill('R')
        };
        this.moveHistory = [];
    }
    
    /**
     * Check if the cube is solved
     */
    isSolved() {
        for (const face in this.faces) {
            const color = this.faces[face][0];
            if (!this.faces[face].every(c => c === color)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Rotate a face 90 degrees clockwise
     */
    rotateFaceClockwise(face) {
        const f = this.faces[face];
        const temp = [f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8]];
        f[0] = temp[6]; f[1] = temp[3]; f[2] = temp[0];
        f[3] = temp[7]; f[4] = temp[4]; f[5] = temp[1];
        f[6] = temp[8]; f[7] = temp[5]; f[8] = temp[2];
    }
    
    /**
     * Rotate a face 90 degrees counter-clockwise
     */
    rotateFaceCounterClockwise(face) {
        const f = this.faces[face];
        const temp = [f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8]];
        f[0] = temp[2]; f[1] = temp[5]; f[2] = temp[8];
        f[3] = temp[1]; f[4] = temp[4]; f[5] = temp[7];
        f[6] = temp[0]; f[7] = temp[3]; f[8] = temp[6];
    }
    
    /**
     * Apply a move to the cube
     * @param {string} move - Move notation (U, U', U2, D, D', D2, etc.)
     */
    applyMove(move, recordHistory = true) {
        const face = move[0];
        const modifier = move.slice(1);
        
        let times = 1;
        if (modifier === "'") times = 3; // Counter-clockwise = 3 clockwise
        if (modifier === "2") times = 2;
        
        for (let i = 0; i < times; i++) {
            this.applySingleMove(face);
        }
        
        if (recordHistory) {
            this.moveHistory.push(move);
        }
    }
    
    /**
     * Apply a single clockwise turn of a face
     */
    applySingleMove(face) {
        this.rotateFaceClockwise(face);
        
        // Now handle the edge pieces
        const { U, D, F, B, L, R } = this.faces;
        let temp;
        
        switch (face) {
            case 'U':
                temp = [F[0], F[1], F[2]];
                F[0] = R[0]; F[1] = R[1]; F[2] = R[2];
                R[0] = B[0]; R[1] = B[1]; R[2] = B[2];
                B[0] = L[0]; B[1] = L[1]; B[2] = L[2];
                L[0] = temp[0]; L[1] = temp[1]; L[2] = temp[2];
                break;
                
            case 'D':
                temp = [F[6], F[7], F[8]];
                F[6] = L[6]; F[7] = L[7]; F[8] = L[8];
                L[6] = B[6]; L[7] = B[7]; L[8] = B[8];
                B[6] = R[6]; B[7] = R[7]; B[8] = R[8];
                R[6] = temp[0]; R[7] = temp[1]; R[8] = temp[2];
                break;
                
            case 'F':
                temp = [U[6], U[7], U[8]];
                U[6] = L[8]; U[7] = L[5]; U[8] = L[2];
                L[2] = D[0]; L[5] = D[1]; L[8] = D[2];
                D[0] = R[6]; D[1] = R[3]; D[2] = R[0];
                R[0] = temp[0]; R[3] = temp[1]; R[6] = temp[2];
                break;
                
            case 'B':
                temp = [U[0], U[1], U[2]];
                U[0] = R[2]; U[1] = R[5]; U[2] = R[8];
                R[2] = D[8]; R[5] = D[7]; R[8] = D[6];
                D[6] = L[0]; D[7] = L[3]; D[8] = L[6];
                L[0] = temp[2]; L[3] = temp[1]; L[6] = temp[0];
                break;
                
            case 'L':
                temp = [U[0], U[3], U[6]];
                U[0] = B[8]; U[3] = B[5]; U[6] = B[2];
                B[2] = D[6]; B[5] = D[3]; B[8] = D[0];
                D[0] = F[0]; D[3] = F[3]; D[6] = F[6];
                F[0] = temp[0]; F[3] = temp[1]; F[6] = temp[2];
                break;
                
            case 'R':
                temp = [U[2], U[5], U[8]];
                U[2] = F[2]; U[5] = F[5]; U[8] = F[8];
                F[2] = D[2]; F[5] = D[5]; F[8] = D[8];
                D[2] = B[6]; D[5] = B[3]; D[8] = B[0];
                B[0] = temp[2]; B[3] = temp[1]; B[6] = temp[0];
                break;
        }
    }
    
    /**
     * Apply multiple moves from a string
     * @param {string} moves - Space-separated moves
     */
    applyMoves(moves, recordHistory = true) {
        const moveList = moves.trim().split(/\s+/).filter(m => m);
        for (const move of moveList) {
            this.applyMove(move, recordHistory);
        }
    }
    
    /**
     * Generate a random scramble
     * @param {number} length - Number of moves
     */
    static generateScramble(length = 20) {
        const faces = ['U', 'D', 'F', 'B', 'L', 'R'];
        const modifiers = ['', "'", '2'];
        const moves = [];
        let lastFace = '';
        let secondLastFace = '';
        
        for (let i = 0; i < length; i++) {
            let face;
            do {
                face = faces[Math.floor(Math.random() * faces.length)];
            } while (face === lastFace || (face === secondLastFace && isOppositeFace(lastFace, secondLastFace)));
            
            const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
            moves.push(face + modifier);
            
            secondLastFace = lastFace;
            lastFace = face;
        }
        
        return moves.join(' ');
    }
    
    /**
     * Get the inverse of a move
     */
    static invertMove(move) {
        const face = move[0];
        const modifier = move.slice(1);
        
        if (modifier === "'") return face;
        if (modifier === "2") return move;
        return face + "'";
    }
    
    /**
     * Get the inverse of a sequence of moves
     */
    static invertMoves(moves) {
        const moveList = moves.trim().split(/\s+/).filter(m => m);
        return moveList.reverse().map(m => CubeState.invertMove(m)).join(' ');
    }
    
    /**
     * Convert state to a string for comparison/hashing
     */
    toString() {
        return Object.values(this.faces).flat().join('');
    }
    
    /**
     * Get facelet string for solver (Kociemba format)
     * Order: U R F D L B (reading order for each face)
     */
    toFaceletString() {
        const order = ['U', 'R', 'F', 'D', 'L', 'B'];
        let result = '';
        for (const face of order) {
            result += this.faces[face].join('');
        }
        return result;
    }
}

/**
 * Check if two faces are opposite
 */
function isOppositeFace(face1, face2) {
    const opposites = { U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L' };
    return opposites[face1] === face2;
}

// Export for use in other modules
window.CubeState = CubeState;
