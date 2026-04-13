/**
 * Grid logic: 4x4 grid management, merge detection, monster placement.
 */
const Grid = (() => {
    const COLS = 4;
    const ROWS = 4;

    // cells[row][col] = { level: number } or null
    let cells = [];

    function init() {
        cells = [];
        for (let r = 0; r < ROWS; r++) {
            cells[r] = [];
            for (let c = 0; c < COLS; c++) {
                cells[r][c] = null;
            }
        }
    }

    function getCell(row, col) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return undefined;
        return cells[row][col];
    }

    function setCell(row, col, monster) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
        cells[row][col] = monster;
    }

    function clearCell(row, col) {
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
        cells[row][col] = null;
    }

    function isEmpty(row, col) {
        return getCell(row, col) === null;
    }

    function getEmptyCells() {
        const empty = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (cells[r][c] === null) {
                    empty.push({ row: r, col: c });
                }
            }
        }
        return empty;
    }

    function getOccupiedCells() {
        const occupied = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (cells[r][c] !== null) {
                    occupied.push({ row: r, col: c, monster: cells[r][c] });
                }
            }
        }
        return occupied;
    }

    function isFull() {
        return getEmptyCells().length === 0;
    }

    function canMerge(row1, col1, row2, col2) {
        const a = getCell(row1, col1);
        const b = getCell(row2, col2);
        if (!a || !b) return false;
        if (row1 === row2 && col1 === col2) return false;
        return a.level === b.level && a.level < Monster.MAX_LEVEL;
    }

    function merge(srcRow, srcCol, dstRow, dstCol) {
        const src = getCell(srcRow, srcCol);
        const dst = getCell(dstRow, dstCol);
        if (!src || !dst) return null;
        if (src.level !== dst.level) return null;
        if (src.level >= Monster.MAX_LEVEL) return null;

        const newLevel = src.level + 1;
        clearCell(srcRow, srcCol);
        cells[dstRow][dstCol] = { level: newLevel };
        return { level: newLevel, row: dstRow, col: dstCol };
    }

    function placeMonster(row, col, level) {
        if (!isEmpty(row, col)) return false;
        cells[row][col] = { level: level };
        return true;
    }

    function spawnRandom(level) {
        const empty = getEmptyCells();
        if (empty.length === 0) return null;
        const spot = empty[Math.floor(Math.random() * empty.length)];
        cells[spot.row][spot.col] = { level: level };
        return { row: spot.row, col: spot.col, level: level };
    }

    function hasMergeablePair() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = cells[r][c];
                if (!cell) continue;
                if (cell.level >= Monster.MAX_LEVEL) continue;
                // Check all other cells for same level
                for (let r2 = 0; r2 < ROWS; r2++) {
                    for (let c2 = 0; c2 < COLS; c2++) {
                        if (r === r2 && c === c2) continue;
                        const other = cells[r2][c2];
                        if (other && other.level === cell.level) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function isGameOver() {
        if (!isFull()) return false;
        return !hasMergeablePair();
    }

    function getMergeablePairs() {
        const pairs = new Set();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = cells[r][c];
                if (!cell || cell.level >= Monster.MAX_LEVEL) continue;
                // Check neighbors (4 directions) for hint glow
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dr, dc] of dirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    const neighbor = getCell(nr, nc);
                    if (neighbor && neighbor.level === cell.level) {
                        const key1 = `${r},${c}`;
                        const key2 = `${nr},${nc}`;
                        pairs.add(key1);
                        pairs.add(key2);
                    }
                }
            }
        }
        return pairs;
    }

    function removeLowestTwo() {
        // For reward ad: remove 2 lowest-level monsters
        const occupied = getOccupiedCells();
        if (occupied.length === 0) return 0;
        occupied.sort((a, b) => a.monster.level - b.monster.level);
        const toRemove = Math.min(2, occupied.length);
        for (let i = 0; i < toRemove; i++) {
            clearCell(occupied[i].row, occupied[i].col);
        }
        return toRemove;
    }

    function getTotalCoinsPerSecond() {
        let total = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (cells[r][c]) {
                    total += Monster.coinsPerSecond(cells[r][c].level);
                }
            }
        }
        return total;
    }

    function getHighestLevel() {
        let max = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (cells[r][c]) {
                    max = Math.max(max, cells[r][c].level);
                }
            }
        }
        return max;
    }

    function getCells() {
        return cells;
    }

    return {
        COLS,
        ROWS,
        init,
        getCell,
        setCell,
        clearCell,
        isEmpty,
        getEmptyCells,
        getOccupiedCells,
        isFull,
        canMerge,
        merge,
        placeMonster,
        spawnRandom,
        hasMergeablePair,
        isGameOver,
        getMergeablePairs,
        removeLowestTwo,
        getTotalCoinsPerSecond,
        getHighestLevel,
        getCells,
    };
})();
