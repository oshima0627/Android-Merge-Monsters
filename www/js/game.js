/**
 * Game state machine, main loop, scoring, and coin generation.
 */
const Game = (() => {
    // Game states
    const STATE_TITLE = 'title';
    const STATE_PLAYING = 'playing';
    const STATE_GAMEOVER = 'gameover';

    let state = STATE_TITLE;
    let coins = 0;
    let score = 0;
    let mergeCount = 0;
    let summonCount = 0;
    let highestLevel = 0;
    let highScore = 0;
    let bestLevel = 0;
    let isNewRecord = false;
    let hasRewardAvailable = true;
    let coinAccumulator = 0;
    let coinSoundTimer = 0;

    // Milestone tracking
    const MILESTONES = [5, 8, 10, 12, 15];
    const MILESTONE_BONUS = { 5: 100, 8: 500, 10: 2000, 12: 8000, 15: 50000 };
    let reachedMilestones = new Set();

    // Last frame time
    let lastTime = 0;

    function loadSave() {
        try {
            highScore = parseInt(localStorage.getItem('mm_highScore') || '0', 10);
            bestLevel = parseInt(localStorage.getItem('mm_bestLevel') || '0', 10);
        } catch (e) {
            highScore = 0;
            bestLevel = 0;
        }
    }

    function saveBest() {
        try {
            localStorage.setItem('mm_highScore', highScore.toString());
            localStorage.setItem('mm_bestLevel', bestLevel.toString());
        } catch (e) {
            // localStorage might not be available
        }
    }

    function startGame() {
        state = STATE_PLAYING;
        coins = 30;
        score = 0;
        mergeCount = 0;
        summonCount = 0;
        highestLevel = 0;
        isNewRecord = false;
        hasRewardAvailable = true;
        reachedMilestones = new Set();
        coinAccumulator = 0;

        Grid.init();
        Particles.clear();

        // Start with 3 random monsters
        for (let i = 0; i < 3; i++) {
            const result = Grid.spawnRandom(1);
            if (result) {
                const pos = Renderer.cellToPixel(result.row, result.col);
                Particles.spawnSummon(pos.x, pos.y);
            }
        }

        Ads.showBanner();
        Sound.resume();
        Sound.buttonTap();
    }

    function handleMerge(srcRow, srcCol, dstRow, dstCol) {
        if (state !== STATE_PLAYING) return;

        const result = Grid.merge(srcRow, srcCol, dstRow, dstCol);
        if (!result) return;

        mergeCount++;
        score = mergeCount * Math.max(highestLevel, result.level);

        // Update highest level
        if (result.level > highestLevel) {
            highestLevel = result.level;
            score = mergeCount * highestLevel;
        }

        // Merge animation + particles
        const pos = Renderer.cellToPixel(result.row, result.col);
        Renderer.addMergeAnimation(result.row, result.col, result.level);
        Particles.spawnMergeExplosion(pos.x, pos.y, result.level);
        Sound.merge();

        // Check milestones
        checkMilestones(result.level);

        // Check high score
        if (score > highScore) {
            if (!isNewRecord && highScore > 0) {
                isNewRecord = true;
                UI.showNewRecord();
                Particles.spawnNewRecord(Renderer.getWidth(), Renderer.getHeight());
                Sound.newRecord();
            }
            highScore = score;
            saveBest();
        }

        if (highestLevel > bestLevel) {
            bestLevel = highestLevel;
            saveBest();
        }
    }

    function handleMove(srcRow, srcCol, dstRow, dstCol) {
        if (state !== STATE_PLAYING) return;
        const monster = Grid.getCell(srcRow, srcCol);
        if (!monster) return;
        Grid.setCell(dstRow, dstCol, { level: monster.level });
        Grid.clearCell(srcRow, srcCol);
        Sound.drop();
    }

    function handleSummon() {
        if (state !== STATE_PLAYING) return;

        const cost = Monster.summonCost(summonCount);
        if (coins < cost) return;
        if (Grid.isFull()) return;

        coins -= cost;
        summonCount++;

        // Spawn Lv.1 or Lv.2
        const level = Math.random() < 0.8 ? 1 : 2;
        const result = Grid.spawnRandom(level);
        if (result) {
            const pos = Renderer.cellToPixel(result.row, result.col);
            Particles.spawnSummon(pos.x, pos.y);
            Renderer.addMergeAnimation(result.row, result.col, result.level);
            Sound.summon();
        }

        // Check game over after summon
        if (Grid.isGameOver()) {
            triggerGameOver();
        }
    }

    function handleTap(x, y) {
        Sound.resume();

        if (state === STATE_TITLE) {
            if (UI.hitTestStartButton(x, y)) {
                startGame();
                return;
            }
            if (UI.hitTestMuteButton(x, y)) {
                Sound.setMuted(!Sound.isMuted());
                Sound.buttonTap();
                return;
            }
        }

        if (state === STATE_PLAYING) {
            if (UI.hitTestSummonButton(x, y)) {
                handleSummon();
                return;
            }
            if (UI.hitTestMuteButton(x, y)) {
                Sound.setMuted(!Sound.isMuted());
                return;
            }
        }

        if (state === STATE_GAMEOVER) {
            if (UI.hitTestRewardButton(x, y) && hasRewardAvailable) {
                watchRewardAd();
                return;
            }
            if (UI.hitTestRestartButton(x, y)) {
                Ads.showInterstitial();
                startGame();
                return;
            }
        }
    }

    function watchRewardAd() {
        Ads.showReward(() => {
            // Reward: remove 2 lowest monsters
            const removed = Grid.removeLowestTwo();
            if (removed > 0) {
                hasRewardAvailable = false;
                state = STATE_PLAYING;
                Sound.summon();
            }
        });
    }

    function checkMilestones(level) {
        for (const ms of MILESTONES) {
            if (level >= ms && !reachedMilestones.has(ms)) {
                reachedMilestones.add(ms);
                const bonus = MILESTONE_BONUS[ms] || 0;
                coins += bonus;
                UI.showMilestone(`NEW! Lv.${ms}${bonus > 0 ? ` +${bonus} coins!` : ''}`);
                Particles.spawnConfetti(Renderer.getWidth(), Renderer.getHeight());
                Sound.milestone();
            }
        }
    }

    function triggerGameOver() {
        state = STATE_GAMEOVER;
        hasRewardAvailable = true;

        // Final score
        score = mergeCount * highestLevel;
        if (score > highScore) {
            highScore = score;
            isNewRecord = true;
            saveBest();
        }
        if (highestLevel > bestLevel) {
            bestLevel = highestLevel;
            saveBest();
        }

        Sound.gameOver();
    }

    function update(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap at 100ms
        lastTime = timestamp;

        const ctx = Renderer.getCtx();
        const w = Renderer.getWidth();
        const h = Renderer.getHeight();

        if (state === STATE_TITLE) {
            UI.drawTitleScreen(ctx, w, h, timestamp, highScore, bestLevel);
            Particles.update(dt);
            Particles.draw(ctx);
        }

        if (state === STATE_PLAYING) {
            // Generate coins
            const cps = Grid.getTotalCoinsPerSecond();
            coinAccumulator += cps * dt;
            if (coinAccumulator >= 1) {
                const whole = Math.floor(coinAccumulator);
                coins += whole;
                coinAccumulator -= whole;

                // Coin particle + sound (throttled)
                coinSoundTimer -= dt;
                if (coinSoundTimer <= 0) {
                    coinSoundTimer = 0.5;
                    // Spawn coin pop from a random occupied cell
                    const occupied = Grid.getOccupiedCells();
                    if (occupied.length > 0) {
                        const rndCell = occupied[Math.floor(Math.random() * occupied.length)];
                        const pos = Renderer.cellToPixel(rndCell.row, rndCell.col);
                        Particles.spawnCoinPop(pos.x, pos.y - Renderer.getGridLayout().monsterRadius);
                        Sound.coin();
                    }
                }
            } else {
                coinSoundTimer -= dt;
            }

            // Check game over
            if (Grid.isGameOver()) {
                triggerGameOver();
            }

            // Draw
            Renderer.drawBackground(timestamp);
            Renderer.updateAnimations(dt);
            Renderer.drawGrid(timestamp);
            Renderer.drawDraggedMonster(timestamp);

            const cost = Monster.summonCost(summonCount);
            const canSummon = coins >= cost && !Grid.isFull();
            UI.drawHUD(ctx, w, h, coins, score, cost, canSummon);

            Particles.update(dt);
            Particles.draw(ctx);
            UI.updateOverlays(dt);
            UI.drawOverlays(ctx, w, h, timestamp);

            // Banner ad space (bottom 60px)
            if (Ads.isBannerShowing()) {
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fillRect(0, h - 60, w, 60);
            }
        }

        if (state === STATE_GAMEOVER) {
            // Keep drawing the game behind
            Renderer.drawBackground(timestamp);
            Renderer.drawGrid(timestamp);

            const cost = Monster.summonCost(summonCount);
            UI.drawHUD(ctx, w, h, coins, score, cost, false);

            Particles.update(dt);
            Particles.draw(ctx);

            UI.drawGameOver(ctx, w, h, score, highestLevel, highScore, isNewRecord, hasRewardAvailable);
        }

        requestAnimationFrame(update);
    }

    function getState() { return state; }
    function getCoins() { return coins; }
    function getScore() { return score; }

    return {
        loadSave,
        startGame,
        handleMerge,
        handleMove,
        handleSummon,
        handleTap,
        update,
        getState,
        getCoins,
        getScore,
        STATE_TITLE,
        STATE_PLAYING,
        STATE_GAMEOVER,
    };
})();
