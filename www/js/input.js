/**
 * Touch/mouse drag-and-drop input handling.
 */
const Input = (() => {
    let dragging = false;
    let dragSrcRow = -1;
    let dragSrcCol = -1;
    let dragLevel = 0;
    let dragX = 0;
    let dragY = 0;
    let onMerge = null;    // callback(srcRow, srcCol, dstRow, dstCol)
    let onMove = null;     // callback(srcRow, srcCol, dstRow, dstCol)
    let onTap = null;      // callback(x, y)

    function init(canvas, callbacks) {
        onMerge = callbacks.onMerge;
        onMove = callbacks.onMove;
        onTap = callbacks.onTap || null;

        // Touch events
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('touchend', handleEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleCancel, { passive: false });

        // Mouse events (for desktop testing)
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
    }

    function getPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function startDrag(x, y) {
        const cell = Renderer.pixelToCell(x, y);
        if (!cell) return false;
        const monster = Grid.getCell(cell.row, cell.col);
        if (!monster) return false;

        dragging = true;
        dragSrcRow = cell.row;
        dragSrcCol = cell.col;
        dragLevel = monster.level;
        dragX = x;
        dragY = y;

        Renderer.setDragMonster({
            srcRow: cell.row,
            srcCol: cell.col,
            level: monster.level,
            x: x,
            y: y,
        });

        Sound.resume();
        Sound.pickup();
        return true;
    }

    function moveDrag(x, y) {
        if (!dragging) return;
        dragX = x;
        dragY = y;
        Renderer.setDragMonster({
            srcRow: dragSrcRow,
            srcCol: dragSrcCol,
            level: dragLevel,
            x: x,
            y: y,
        });
    }

    function endDrag(x, y) {
        if (!dragging) return;
        dragging = false;
        Renderer.setDragMonster(null);

        const targetCell = Renderer.pixelToCell(x, y);
        if (!targetCell) {
            Sound.drop();
            return;
        }

        // Same cell = no-op
        if (targetCell.row === dragSrcRow && targetCell.col === dragSrcCol) {
            return;
        }

        const target = Grid.getCell(targetCell.row, targetCell.col);

        if (target) {
            // Try merge
            if (Grid.canMerge(dragSrcRow, dragSrcCol, targetCell.row, targetCell.col)) {
                if (onMerge) {
                    onMerge(dragSrcRow, dragSrcCol, targetCell.row, targetCell.col);
                }
            } else {
                Sound.drop();
            }
        } else {
            // Move to empty cell
            if (onMove) {
                onMove(dragSrcRow, dragSrcCol, targetCell.row, targetCell.col);
            }
        }
    }

    function cancelDrag() {
        dragging = false;
        Renderer.setDragMonster(null);
    }

    // Touch handlers
    function handleStart(e) {
        e.preventDefault();
        const pos = getPos(e);
        if (!startDrag(pos.x, pos.y)) {
            // Not on a monster - might be a UI tap
            if (onTap) onTap(pos.x, pos.y);
        }
    }

    function handleMove(e) {
        e.preventDefault();
        const pos = getPos(e);
        moveDrag(pos.x, pos.y);
    }

    function handleEnd(e) {
        e.preventDefault();
        const pos = getPos(e);
        endDrag(pos.x, pos.y);
    }

    function handleCancel(e) {
        e.preventDefault();
        cancelDrag();
    }

    // Mouse handlers
    function handleMouseDown(e) {
        const pos = getPos(e);
        if (!startDrag(pos.x, pos.y)) {
            if (onTap) onTap(pos.x, pos.y);
        }
    }

    function handleMouseMove(e) {
        const pos = getPos(e);
        moveDrag(pos.x, pos.y);
    }

    function handleMouseUp(e) {
        const pos = getPos(e);
        endDrag(pos.x, pos.y);
    }

    function isDragging() {
        return dragging;
    }

    return {
        init,
        isDragging,
        cancelDrag,
    };
})();
