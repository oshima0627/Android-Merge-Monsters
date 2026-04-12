/**
 * Canvas renderer: background, grid, monsters, animations.
 */
const Renderer = (() => {
    let canvas, ctx;
    let width, height, dpr;
    let gridX, gridY, gridSize, cellSize, cellPadding, monsterRadius;
    let bgHue = 190;

    // Animation state
    let mergeAnimations = [];  // { row, col, level, progress, scale }
    let dragMonster = null;    // { row, col, level, x, y }

    function init(canvasEl) {
        canvas = canvasEl;
        ctx = canvas.getContext('2d');
        resize();
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        recalcLayout();
    }

    function recalcLayout() {
        const maxGridWidth = width * 0.92;
        const maxGridHeight = height * 0.48;
        gridSize = Math.min(maxGridWidth, maxGridHeight);
        cellSize = gridSize / Grid.COLS;
        cellPadding = cellSize * 0.08;
        monsterRadius = (cellSize - cellPadding * 2) * 0.42;
        gridX = (width - gridSize) / 2;
        gridY = height * 0.16;
    }

    function getGridLayout() {
        return { gridX, gridY, gridSize, cellSize, cellPadding, monsterRadius };
    }

    function cellToPixel(row, col) {
        return {
            x: gridX + col * cellSize + cellSize / 2,
            y: gridY + row * cellSize + cellSize / 2,
        };
    }

    function pixelToCell(px, py) {
        const col = Math.floor((px - gridX) / cellSize);
        const row = Math.floor((py - gridY) / cellSize);
        if (row < 0 || row >= Grid.ROWS || col < 0 || col >= Grid.COLS) return null;
        return { row, col };
    }

    function setDragMonster(info) {
        dragMonster = info;
    }

    function addMergeAnimation(row, col, level) {
        mergeAnimations.push({
            row, col, level,
            progress: 0,
            duration: 0.4,
        });
    }

    function drawBackground(time) {
        // Pastel gradient background that slowly shifts
        bgHue = 190 + Math.sin(time * 0.0002) * 15;
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, `hsl(${bgHue}, 60%, 90%)`);
        grad.addColorStop(1, `hsl(${bgHue + 40}, 50%, 88%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    function drawGrid(time) {
        // Grid background (white card with rounded corners and shadow)
        ctx.save();
        const padding = 8;
        const gx = gridX - padding;
        const gy = gridY - padding;
        const gw = gridSize + padding * 2;
        const gh = gridSize + padding * 2;
        const radius = 16;

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        drawRoundRect(ctx, gx, gy, gw, gh, radius);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let r = 1; r < Grid.ROWS; r++) {
            const ly = gridY + r * cellSize;
            ctx.beginPath();
            ctx.moveTo(gridX, ly);
            ctx.lineTo(gridX + gridSize, ly);
            ctx.stroke();
        }
        for (let c = 1; c < Grid.COLS; c++) {
            const lx = gridX + c * cellSize;
            ctx.beginPath();
            ctx.moveTo(lx, gridY);
            ctx.lineTo(lx, gridY + gridSize);
            ctx.stroke();
        }

        // Mergeable hint pairs
        const mergeablePairs = Grid.getMergeablePairs();

        // Draw empty cell guides and monsters
        for (let r = 0; r < Grid.ROWS; r++) {
            for (let c = 0; c < Grid.COLS; c++) {
                const cx = gridX + c * cellSize + cellSize / 2;
                const cy = gridY + r * cellSize + cellSize / 2;
                const cell = Grid.getCell(r, c);

                if (!cell) {
                    // Empty cell guide (dotted circle)
                    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.arc(cx, cy, monsterRadius * 0.7, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    // Skip if this cell is being dragged
                    if (dragMonster && dragMonster.srcRow === r && dragMonster.srcCol === c) {
                        // Draw faded placeholder
                        Monster.draw(ctx, cx, cy, monsterRadius, cell.level, time, 0.25);
                        continue;
                    }

                    // Merge hint glow
                    const key = `${r},${c}`;
                    if (mergeablePairs.has(key)) {
                        const pulse = 0.15 + Math.sin(time * 0.005) * 0.1;
                        const data = Monster.getLevelData(cell.level);
                        const glowColor = data.color === 'rainbow' ? '#FFD700' : data.color;
                        ctx.save();
                        ctx.shadowColor = glowColor;
                        ctx.shadowBlur = 12 + Math.sin(time * 0.005) * 6;
                        ctx.globalAlpha = pulse;
                        ctx.fillStyle = glowColor;
                        ctx.beginPath();
                        ctx.arc(cx, cy, monsterRadius * 1.1, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }

                    // Check for merge animation on this cell
                    const anim = mergeAnimations.find(a => a.row === r && a.col === c);
                    if (anim) {
                        const t = anim.progress / anim.duration;
                        // Bounce easing
                        let scale;
                        if (t < 0.4) {
                            scale = 0.3 + (t / 0.4) * 1.0;
                        } else if (t < 0.7) {
                            scale = 1.3 - ((t - 0.4) / 0.3) * 0.4;
                        } else {
                            scale = 0.9 + ((t - 0.7) / 0.3) * 0.1;
                        }
                        Monster.draw(ctx, cx, cy, monsterRadius * scale, cell.level, time, 1);
                    } else {
                        // Idle bobbing animation
                        const bob = Math.sin(time * 0.003 + r * 1.1 + c * 0.7) * 2;
                        Monster.draw(ctx, cx, cy + bob, monsterRadius, cell.level, time, 1);
                    }
                }
            }
        }

        ctx.restore();
    }

    function drawDraggedMonster(time) {
        if (!dragMonster) return;
        // Draw slightly larger + shadow offset
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 8;
        Monster.draw(ctx, dragMonster.x, dragMonster.y, monsterRadius * 1.15, dragMonster.level, time, 0.9);
        ctx.restore();
    }

    function updateAnimations(dt) {
        for (let i = mergeAnimations.length - 1; i >= 0; i--) {
            mergeAnimations[i].progress += dt;
            if (mergeAnimations[i].progress >= mergeAnimations[i].duration) {
                mergeAnimations.splice(i, 1);
            }
        }
    }

    function drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function getWidth() { return width; }
    function getHeight() { return height; }
    function getCtx() { return ctx; }
    function getCanvas() { return canvas; }

    return {
        init,
        resize,
        recalcLayout,
        getGridLayout,
        cellToPixel,
        pixelToCell,
        setDragMonster,
        addMergeAnimation,
        drawBackground,
        drawGrid,
        drawDraggedMonster,
        updateAnimations,
        drawRoundRect,
        getWidth,
        getHeight,
        getCtx,
        getCanvas,
    };
})();
