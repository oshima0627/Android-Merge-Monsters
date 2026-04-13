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

    // Bonus coin ad cooldown (seconds)
    const BONUS_AD_COOLDOWN = 60;
    let bonusAdCooldown = 0;

    // Free summon timer (seconds)
    const FREE_SUMMON_INTERVAL = 30;
    let freeSummonTimer = 0;

    // Coin speed system
    // 1) Permanent upgrade (purchased with coins)
    const UPGRADE_COSTS = [50, 150, 400, 1000, 2500, 6000, 15000, 40000, 100000, 250000];
    const UPGRADE_MULTIPLIERS = [1.0, 1.2, 1.4, 1.7, 2.0, 2.5, 3.0, 3.8, 4.8, 6.0, 8.0];
    let coinUpgradeLevel = 0;
    // 2) Ad boost (temporary, scales with upgrade level)
    const AD_BOOST_DURATION = 60;
    const AD_BOOST_MULTIPLIERS = [2.0, 2.2, 2.5, 2.8, 3.0, 3.5, 4.0, 5.0, 6.0, 8.0, 10.0];
    let adBoostTimer = 0;
    function getAdBoostMultiplier() {
        return AD_BOOST_MULTIPLIERS[coinUpgradeLevel] || AD_BOOST_MULTIPLIERS[AD_BOOST_MULTIPLIERS.length - 1];
    }
    // 3) Stage bonus (auto-increases with stage)
    function getStageMultiplier() {
        return 1 + (Stages.getStageNumber() - 1) * 0.1;
    }
    function getTotalCoinMultiplier() {
        const upgrade = UPGRADE_MULTIPLIERS[coinUpgradeLevel] || UPGRADE_MULTIPLIERS[UPGRADE_MULTIPLIERS.length - 1];
        const adBoost = adBoostTimer > 0 ? getAdBoostMultiplier() : 1.0;
        const stage = getStageMultiplier();
        return upgrade * adBoost * stage;
    }

    // Milestone tracking
    const MILESTONES = [5, 8, 10, 12, 15];
    const MILESTONE_BONUS = { 5: 100, 8: 500, 10: 2000, 12: 8000, 15: 50000 };
    let reachedMilestones = new Set();

    // Last frame time
    let lastTime = 0;

    // Stage clear overlay timer
    let stageClearTimer = 0;
    const STAGE_CLEAR_DURATION = 3.0;

    function loadSave() {
        try {
            highScore = parseInt(localStorage.getItem('mm_highScore') || '0', 10);
            bestLevel = parseInt(localStorage.getItem('mm_bestLevel') || '0', 10);
        } catch (e) {
            highScore = 0;
            bestLevel = 0;
        }
        Stages.loadStageProg();
        loadCoinUpgrade();
    }

    function saveBest() {
        try {
            localStorage.setItem('mm_highScore', highScore.toString());
            localStorage.setItem('mm_bestLevel', bestLevel.toString());
        } catch (e) {
            // localStorage might not be available
        }
    }

    function saveCoinUpgrade() {
        try { localStorage.setItem('mm_coinUpgrade', coinUpgradeLevel.toString()); } catch (e) {}
    }

    function loadCoinUpgrade() {
        try { coinUpgradeLevel = parseInt(localStorage.getItem('mm_coinUpgrade') || '0', 10); } catch (e) { coinUpgradeLevel = 0; }
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
        bonusAdCooldown = 0;
        freeSummonTimer = FREE_SUMMON_INTERVAL;
        adBoostTimer = 0;

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

        stageClearTimer = 0;
        Stages.init();
        Stages.loadStageProg();

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

        // Stage progress
        Stages.onMerge();
        checkStageProgress();

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
        if (Grid.isFull()) return;

        const cost = Monster.summonCost(summonCount);
        if (coins < cost) return;

        coins -= cost;
        summonCount++;
        doSummon();
    }

    function handleFreeSummon() {
        if (state !== STATE_PLAYING) return;
        if (Grid.isFull()) return;
        if (freeSummonTimer > 0) return;

        freeSummonTimer = FREE_SUMMON_INTERVAL;
        doSummon();
    }

    function doSummon() {
        // Spawn Lv.1 or Lv.2
        const level = Math.random() < 0.8 ? 1 : 2;
        const result = Grid.spawnRandom(level);
        if (result) {
            const pos = Renderer.cellToPixel(result.row, result.col);
            Particles.spawnSummon(pos.x, pos.y);
            Renderer.addMergeAnimation(result.row, result.col, result.level);
            Sound.summon();
        }

        Stages.onSummon();

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
            if (UI.hitTestFreeSummonButton(x, y) && freeSummonTimer <= 0) {
                handleFreeSummon();
                return;
            }
            if (UI.hitTestBonusCoinButton(x, y) && bonusAdCooldown <= 0) {
                watchBonusCoinAd();
                return;
            }
            if (UI.hitTestCoinUpgradeButton(x, y)) {
                handleCoinUpgrade();
                return;
            }
            if (UI.hitTestSpeedBoostButton(x, y) && adBoostTimer <= 0) {
                watchSpeedBoostAd();
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

    function getBonusCoinAmount() {
        // Bonus = enough coins to summon ~20 monsters from current summon count
        let total = 0;
        for (let i = 0; i < 20; i++) {
            total += Monster.summonCost(summonCount + i);
        }
        return Math.floor(total);
    }

    function watchBonusCoinAd() {
        const bonus = getBonusCoinAmount();
        Ads.showReward(() => {
            coins += bonus;
            bonusAdCooldown = BONUS_AD_COOLDOWN;
            UI.showMilestone(`+${bonus} coins!`);
            Particles.spawnConfetti(Renderer.getWidth(), Renderer.getHeight());
            Sound.milestone();
        });
    }

    function handleCoinUpgrade() {
        if (coinUpgradeLevel >= UPGRADE_COSTS.length) return;
        const cost = UPGRADE_COSTS[coinUpgradeLevel];
        if (coins < cost) return;
        coins -= cost;
        coinUpgradeLevel++;
        saveCoinUpgrade();
        const mult = UPGRADE_MULTIPLIERS[coinUpgradeLevel];
        UI.showMilestone(`SPEED UP! x${mult.toFixed(1)}`);
        Particles.spawnConfetti(Renderer.getWidth(), Renderer.getHeight());
        Sound.milestone();
    }

    function watchSpeedBoostAd() {
        const boostMult = getAdBoostMultiplier();
        Ads.showReward(() => {
            adBoostTimer = AD_BOOST_DURATION;
            UI.showMilestone(`COIN x${boostMult.toFixed(1)} BOOST! 60s`);
            Sound.milestone();
        });
    }

    function getCoinSpeedInfo() {
        const nextCost = coinUpgradeLevel < UPGRADE_COSTS.length ? UPGRADE_COSTS[coinUpgradeLevel] : null;
        const canUpgrade = nextCost !== null && coins >= nextCost;
        const adBoostMult = getAdBoostMultiplier();
        const currentMult = getTotalCoinMultiplier();
        const nextMult = coinUpgradeLevel < UPGRADE_MULTIPLIERS.length - 1
            ? UPGRADE_MULTIPLIERS[coinUpgradeLevel + 1] : null;
        return {
            level: coinUpgradeLevel,
            maxLevel: UPGRADE_COSTS.length,
            nextCost,
            canUpgrade,
            currentMult,
            nextMult,
            adBoostActive: adBoostTimer > 0,
            adBoostLeft: adBoostTimer,
            adBoostMult,
            stageBonus: getStageMultiplier(),
        };
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

    function getGameState() {
        return { highestLevel, coins, mergeCount };
    }

    function checkStageProgress() {
        if (Stages.isAllCleared() || Stages.isStageCleared()) return;
        Stages.checkProgress(getGameState());
        if (Stages.isStageCleared()) {
            const results = Stages.getStageResults();
            coins += results.reward;
            stageClearTimer = STAGE_CLEAR_DURATION;
            Particles.spawnConfetti(Renderer.getWidth(), Renderer.getHeight());
            Sound.milestone();
            Stages.saveStageProg();
        }
    }

    function advanceToNextStage() {
        Stages.advanceStage();
        Stages.saveStageProg();
        stageClearTimer = 0;
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
            // Generate coins (with multiplier)
            const baseCps = Grid.getTotalCoinsPerSecond();
            const cps = baseCps * getTotalCoinMultiplier();
            coinAccumulator += cps * dt;
            coinSoundTimer -= dt;
            if (coinAccumulator >= 1) {
                const whole = Math.floor(coinAccumulator);
                coins += whole;
                coinAccumulator -= whole;

                // Coin particle + sound (throttled)
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
            }

            // Bonus ad cooldown (skip cooldown when player can't afford summon)
            if (bonusAdCooldown > 0) {
                const cost = Monster.summonCost(summonCount);
                if (coins < cost && freeSummonTimer > 0) {
                    bonusAdCooldown = 0;
                } else {
                    bonusAdCooldown -= dt;
                    if (bonusAdCooldown < 0) bonusAdCooldown = 0;
                }
            }

            // Ad boost timer
            if (adBoostTimer > 0) {
                adBoostTimer -= dt;
                if (adBoostTimer < 0) adBoostTimer = 0;
            }

            // Free summon timer
            if (freeSummonTimer > 0) {
                freeSummonTimer -= dt;
                if (freeSummonTimer < 0) freeSummonTimer = 0;
            }

            // Draw
            Renderer.drawBackground(timestamp);
            Renderer.updateAnimations(dt);
            Renderer.drawGrid(timestamp);
            Renderer.drawDraggedMonster(timestamp);

            const summonCost = Monster.summonCost(summonCount);
            const canSummon = coins >= summonCost && !Grid.isFull();
            const bonusCoinInfo = {
                available: bonusAdCooldown <= 0,
                cooldownLeft: bonusAdCooldown,
                bonusAmount: getBonusCoinAmount(),
            };
            const freeSummonInfo = {
                ready: freeSummonTimer <= 0 && !Grid.isFull(),
                cooldownLeft: freeSummonTimer,
            };
            const coinSpeedInfo = getCoinSpeedInfo();
            UI.drawHUD(ctx, w, h, coins, score, summonCost, canSummon, bonusCoinInfo, freeSummonInfo, coinSpeedInfo);

            Particles.update(dt);
            Particles.draw(ctx);
            UI.updateOverlays(dt);
            UI.drawOverlays(ctx, w, h, timestamp);

            // Stage mission display
            if (!Stages.isAllCleared()) {
                const missionStatus = Stages.getMissionStatus(getGameState());
                if (missionStatus) {
                    UI.drawStageInfo(ctx, w, h, missionStatus);
                }
            }

            // Check stage progress for coin-based missions
            if (!Stages.isStageCleared()) {
                checkStageProgress();
            }

            // Stage clear overlay
            if (stageClearTimer > 0) {
                stageClearTimer -= dt;
                const results = Stages.getStageResults();
                if (results) {
                    UI.drawStageClear(ctx, w, h, results, 1 - (stageClearTimer / STAGE_CLEAR_DURATION));
                }
                if (stageClearTimer <= 0) {
                    advanceToNextStage();
                }
            }

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
