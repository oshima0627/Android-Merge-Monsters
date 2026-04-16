/**
 * Game state machine, main loop, scoring, and coin generation.
 */
const Game = (() => {
    // Game states
    const STATE_TITLE = 'title';
    const STATE_PLAYING = 'playing';
    const STATE_GAMEOVER = 'gameover';
    const STATE_CODEX = 'codex';

    let state = STATE_TITLE;
    let codexReturnState = STATE_TITLE;
    let codexPage = 0;
    let seenLevels = new Set();
    let pendingStageIntro = null; // { id, name, intro }
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
    const UPGRADE_COSTS = [30, 100, 300, 800, 2000, 5000, 12000, 30000, 80000, 200000];
    const UPGRADE_MULTIPLIERS = [1.0, 1.3, 1.6, 2.0, 2.5, 3.0, 3.6, 4.2, 5.0, 6.0, 7.5];
    let coinUpgradeLevel = 0;
    // 2) Ad boost (temporary, scales with upgrade level)
    const AD_BOOST_DURATION = 60;
    const AD_BOOST_MULTIPLIERS = [1.5, 1.8, 2.0, 2.3, 2.5, 3.0, 3.3, 3.6, 4.0, 4.5, 5.0];
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
    const MILESTONES = [5, 8, 10, 12, 15, 18, 21, 24, 27, 30];
    const MILESTONE_BONUS = {
        5: 50, 8: 200, 10: 500, 12: 2000, 15: 10000,
        18: 50000, 21: 200000, 24: 1000000, 27: 5000000, 30: 50000000,
    };
    let reachedMilestones = new Set();

    // Tutorial
    let showTutorial = false;
    let tutorialStep = 0; // 0: drag, 1: merge, 2: summon

    // Last frame time
    let lastTime = 0;

    // Stage clear overlay timer
    let stageClearTimer = 0;
    const STAGE_CLEAR_DURATION = 3.0;

    // Periodic session save
    let saveTimer = 0;
    const SAVE_INTERVAL = 2.0;

    // Paid "clear lowest" coin sink
    const CLEAR_BASE_COST = 30;
    const CLEAR_COST_GROWTH = 1.4;
    let clearUseCount = 0;
    function getClearLowestCost() {
        return Math.floor(CLEAR_BASE_COST * Math.pow(CLEAR_COST_GROWTH, clearUseCount));
    }

    const SAVE_KEY = 'mm_session';

    function loadSave() {
        try {
            highScore = parseInt(localStorage.getItem('mm_highScore') || '0', 10);
            bestLevel = parseInt(localStorage.getItem('mm_bestLevel') || '0', 10);
        } catch (e) {
            highScore = 0;
            bestLevel = 0;
        }
        loadSeenLevels();
        Stages.loadStageProg();
        loadCoinUpgrade();
        tryResumeSession();
    }

    function loadSeenLevels() {
        try {
            const raw = localStorage.getItem('mm_seenLevels');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) seenLevels = new Set(arr.filter(n => typeof n === 'number'));
            }
        } catch (e) { seenLevels = new Set(); }
    }

    function saveSeenLevels() {
        try {
            localStorage.setItem('mm_seenLevels', JSON.stringify(Array.from(seenLevels)));
        } catch (e) {}
    }

    function markLevelSeen(level) {
        if (!level || seenLevels.has(level)) return;
        seenLevels.add(level);
        saveSeenLevels();
    }

    const CODEX_PER_PAGE = 6;
    function getCodexPageCount() {
        return Math.ceil(Monster.MAX_LEVEL / CODEX_PER_PAGE);
    }

    function openCodex(fromState) {
        codexReturnState = fromState || STATE_TITLE;
        codexPage = 0;
        state = STATE_CODEX;
        Sound.buttonTap();
    }

    function saveSession() {
        if (state !== STATE_PLAYING) return;
        try {
            const data = {
                v: 1,
                coins,
                score,
                mergeCount,
                summonCount,
                highestLevel,
                isNewRecord,
                hasRewardAvailable,
                reachedMilestones: Array.from(reachedMilestones),
                coinAccumulator,
                bonusAdCooldown,
                freeSummonTimer,
                adBoostTimer,
                coinUpgradeLevel,
                clearUseCount,
                stageClearTimer,
                showTutorial,
                tutorialStep,
                grid: Grid.getCells(),
                stages: Stages.getSnapshot(),
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function clearSession() {
        try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    }

    function tryResumeSession() {
        let data;
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            data = JSON.parse(raw);
        } catch (e) {
            return false;
        }
        if (!data || data.v !== 1 || !data.grid) return false;

        Grid.init();
        if (!Grid.setCells(data.grid)) {
            clearSession();
            return false;
        }

        coins = Number(data.coins) || 0;
        score = Number(data.score) || 0;
        mergeCount = Number(data.mergeCount) || 0;
        summonCount = Number(data.summonCount) || 0;
        highestLevel = Number(data.highestLevel) || 0;
        isNewRecord = !!data.isNewRecord;
        hasRewardAvailable = data.hasRewardAvailable !== false;
        reachedMilestones = new Set(Array.isArray(data.reachedMilestones) ? data.reachedMilestones : []);
        coinAccumulator = Number(data.coinAccumulator) || 0;
        bonusAdCooldown = Math.max(0, Number(data.bonusAdCooldown) || 0);
        freeSummonTimer = Math.max(0, Number(data.freeSummonTimer) || 0);
        adBoostTimer = Math.max(0, Number(data.adBoostTimer) || 0);
        coinUpgradeLevel = Number(data.coinUpgradeLevel) || 0;
        clearUseCount = Math.max(0, Number(data.clearUseCount) || 0);
        stageClearTimer = Math.max(0, Number(data.stageClearTimer) || 0);
        showTutorial = !!data.showTutorial;
        tutorialStep = Number(data.tutorialStep) || 0;

        Stages.restoreSnapshot(data.stages);
        Particles.clear();

        // Make sure levels present on the restored grid are in the codex
        Grid.getOccupiedCells().forEach(c => markLevelSeen(c.monster.level));

        state = STATE_PLAYING;
        Ads.showBanner();
        return true;
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
        clearSession();
        state = STATE_PLAYING;
        coins = 80;
        score = 0;
        mergeCount = 0;
        summonCount = 0;
        highestLevel = 0;
        isNewRecord = false;
        hasRewardAvailable = true;
        reachedMilestones = new Set();
        coinAccumulator = 0;
        bonusAdCooldown = 0;
        freeSummonTimer = 0;
        adBoostTimer = 0;
        coinUpgradeLevel = 0;
        clearUseCount = 0;
        saveCoinUpgrade();

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
        markLevelSeen(1);

        stageClearTimer = 0;
        saveTimer = 0;
        Stages.init();
        Stages.loadStageProg();
        pendingStageIntro = Stages.getCurrentIntro();

        // Show tutorial on first ever play
        try {
            if (!localStorage.getItem('mm_tutorialDone')) {
                showTutorial = true;
                tutorialStep = 0;
            }
        } catch (e) {}

        Ads.showBanner();
        Sound.resume();
        Sound.buttonTap();
    }

    function dismissTutorial() {
        tutorialStep++;
        if (tutorialStep >= 3) {
            showTutorial = false;
            try { localStorage.setItem('mm_tutorialDone', '1'); } catch (e) {}
        }
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
        markLevelSeen(result.level);

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

    function getSummonLevel() {
        // Higher levels unlock as highestLevel increases
        // highestLevel 1-3: Lv.1 (80%) / Lv.2 (20%)
        // highestLevel 4+:  rare chance of Lv.3+
        const maxBonus = Math.max(0, highestLevel - 3);
        if (maxBonus <= 0) return Math.random() < 0.8 ? 1 : 2;

        const roll = Math.random() * 100;
        // Rare: higher level monster (2% per bonus level, max 20%)
        const rareChance = Math.min(20, maxBonus * 2);
        if (roll < rareChance) {
            const maxLv = Math.min(highestLevel - 2, 3 + Math.floor(maxBonus / 2));
            return Math.max(3, 3 + Math.floor(Math.random() * (maxLv - 2)));
        }
        // Lv.2 (25%)
        if (roll < rareChance + 25) return 2;
        // Lv.1
        return 1;
    }

    function doSummon() {
        const level = getSummonLevel();
        const result = Grid.spawnRandom(level);
        if (result) {
            const pos = Renderer.cellToPixel(result.row, result.col);
            Particles.spawnSummon(pos.x, pos.y);
            Renderer.addMergeAnimation(result.row, result.col, result.level);
            Sound.summon();
            markLevelSeen(result.level);
        }

        Stages.onSummon();

        // Check game over after summon
        if (Grid.isGameOver()) {
            triggerGameOver();
        }
    }

    function handleTap(x, y) {
        Sound.resume();

        if (state === STATE_CODEX) {
            if (UI.hitTestCodexBack(x, y)) {
                state = codexReturnState;
                Sound.buttonTap();
                return;
            }
            if (UI.hitTestCodexPrev(x, y)) {
                codexPage = Math.max(0, codexPage - 1);
                Sound.buttonTap();
                return;
            }
            if (UI.hitTestCodexNext(x, y)) {
                codexPage = Math.min(getCodexPageCount() - 1, codexPage + 1);
                Sound.buttonTap();
                return;
            }
            return;
        }

        if (state === STATE_TITLE) {
            if (UI.hitTestStartButton(x, y)) {
                startGame();
                return;
            }
            if (UI.hitTestCodexButton(x, y)) {
                openCodex(STATE_TITLE);
                return;
            }
            if (UI.hitTestMuteButton(x, y)) {
                Sound.setMuted(!Sound.isMuted());
                Sound.buttonTap();
                return;
            }
        }

        if (state === STATE_PLAYING) {
            // Dismiss stage intro overlay first
            if (pendingStageIntro) {
                pendingStageIntro = null;
                Sound.buttonTap();
                return;
            }
            if (showTutorial) {
                dismissTutorial();
                return;
            }
            if (UI.hitTestCodexButton(x, y)) {
                openCodex(STATE_PLAYING);
                return;
            }
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
                activateSpeedBoost();
                return;
            }
            if (UI.hitTestClearLowestButton(x, y)) {
                handleClearLowest();
                return;
            }
            if (UI.hitTestMuteButton(x, y)) {
                Sound.setMuted(!Sound.isMuted());
                return;
            }
        }

        if (state === STATE_GAMEOVER) {
            if (UI.hitTestCodexButton(x, y)) {
                openCodex(STATE_GAMEOVER);
                return;
            }
            if (UI.hitTestRewardButton(x, y)) {
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
        // Bonus = enough coins to summon ~50 monsters from current summon count
        let total = 0;
        for (let i = 0; i < 50; i++) {
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

    function handleClearLowest() {
        if (state !== STATE_PLAYING) return;
        const cost = getClearLowestCost();
        if (coins < cost) return;
        const removed = Grid.removeOneLowest();
        if (!removed) return;
        coins -= cost;
        clearUseCount++;
        const pos = Renderer.cellToPixel(removed.row, removed.col);
        Particles.spawnSummon(pos.x, pos.y);
        Sound.drop();
    }

    function getClearLowestInfo() {
        const occupied = Grid.getOccupiedCells();
        const hasTarget = occupied.length > 0;
        const cost = getClearLowestCost();
        return {
            cost,
            hasTarget,
            canAfford: coins >= cost && hasTarget,
        };
    }

    function activateSpeedBoost() {
        if (adBoostTimer > 0) return;
        const boostMult = getAdBoostMultiplier();
        adBoostTimer = AD_BOOST_DURATION;
        UI.showMilestone(`COIN x${boostMult.toFixed(1)} BOOST! 60s`);
        Sound.milestone();
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
            // Reward: remove 2 lowest monsters (repeatable)
            const removed = Grid.removeLowestTwo();
            if (removed > 0) {
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
        pendingStageIntro = Stages.getCurrentIntro();
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
        clearSession();
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

        if (state === STATE_CODEX) {
            UI.drawCodex(ctx, w, h, timestamp, codexPage, getCodexPageCount(), seenLevels);
        }

        if (state === STATE_PLAYING) {
            // Pause coin generation / sound effects while an ad is on screen
            const paused = (Ads.isAdPlaying && Ads.isAdPlaying()) ||
                !!pendingStageIntro ||
                (typeof document !== 'undefined' && document.visibilityState === 'hidden');

            if (!paused) {
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
            const clearLowestInfo = getClearLowestInfo();
            UI.drawHUD(ctx, w, h, coins, score, summonCost, canSummon, bonusCoinInfo, freeSummonInfo, coinSpeedInfo, clearLowestInfo);

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

            // Tutorial overlay
            if (showTutorial) {
                UI.drawTutorial(ctx, w, h, tutorialStep);
            }

            // Stage intro narrative overlay (shown once when entering a stage)
            if (pendingStageIntro) {
                UI.drawStageIntro(ctx, w, h, pendingStageIntro);
            }

            // Banner ad space (bottom 60px)
            if (Ads.isBannerShowing()) {
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fillRect(0, h - 60, w, 60);
            }

            // Periodic session save
            saveTimer += dt;
            if (saveTimer >= SAVE_INTERVAL) {
                saveTimer = 0;
                saveSession();
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

            UI.drawGameOver(ctx, w, h, score, highestLevel, highScore, isNewRecord, true);
        }

        requestAnimationFrame(update);
    }

    function getState() { return state; }
    function getCoins() { return coins; }
    function getScore() { return score; }

    return {
        loadSave,
        saveSession,
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
