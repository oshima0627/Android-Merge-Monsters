/**
 * UI drawing: title screen, HUD, summon button, game over overlay.
 */
const UI = (() => {
    // Button rectangles for hit testing
    let startButton = { x: 0, y: 0, w: 0, h: 0 };
    let summonButton = { x: 0, y: 0, w: 0, h: 0 };
    let freeSummonButton = { x: 0, y: 0, w: 0, h: 0 };
    let bonusCoinButton = { x: 0, y: 0, w: 0, h: 0 };
    let coinUpgradeButton = { x: 0, y: 0, w: 0, h: 0 };
    let speedBoostButton = { x: 0, y: 0, w: 0, h: 0 };
    let restartButton = { x: 0, y: 0, w: 0, h: 0 };
    let rewardButton = { x: 0, y: 0, w: 0, h: 0 };
    let muteButton = { x: 0, y: 0, w: 0, h: 0 };

    // Milestone text animation
    let milestoneText = null;   // { text, progress, duration }
    let newRecordText = null;   // { progress, duration }

    function drawTitleScreen(ctx, w, h, time, highScore, highestLevel) {
        // Background
        const bgHue = 190 + Math.sin(time * 0.0002) * 15;
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `hsl(${bgHue}, 60%, 90%)`);
        grad.addColorStop(1, `hsl(${bgHue + 40}, 50%, 88%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Floating decorative monsters in background
        for (let i = 0; i < 6; i++) {
            const mx = w * (0.1 + (i % 3) * 0.35) + Math.sin(time * 0.001 + i) * 20;
            const my = h * (0.15 + Math.floor(i / 3) * 0.55) + Math.cos(time * 0.0015 + i * 2) * 15;
            ctx.save();
            ctx.globalAlpha = 0.15;
            Monster.draw(ctx, mx, my, 30 + i * 5, (i % 5) + 1, time, 0.15);
            ctx.restore();
        }

        // Title
        const titleY = h * 0.22;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.font = `bold ${w * 0.11}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText('MERGE', w / 2 + 2, titleY - w * 0.06 + 3);
        ctx.fillText('MONSTERS', w / 2 + 2, titleY + w * 0.06 + 3);

        // Title text
        ctx.fillStyle = '#FF6B6B';
        ctx.fillText('MERGE', w / 2, titleY - w * 0.06);
        ctx.fillStyle = '#6B88FF';
        ctx.fillText('MONSTERS', w / 2, titleY + w * 0.06);

        // Animated title monster
        const tmX = w / 2;
        const tmY = h * 0.42;
        const tmR = w * 0.12;
        const bounce = Math.sin(time * 0.004) * 8;
        Monster.draw(ctx, tmX, tmY + bounce, tmR, Math.floor((time * 0.001) % 9) + 1, time, 1);

        // Stats
        ctx.font = `bold ${w * 0.04}px Arial, sans-serif`;
        ctx.fillStyle = '#666';
        if (highestLevel > 0) {
            ctx.fillText(`Best Level: ${highestLevel}`, w / 2, h * 0.55);
        }
        if (highScore > 0) {
            ctx.fillText(`High Score: ${highScore}`, w / 2, h * 0.60);
        }

        // START button
        const btnW = w * 0.55;
        const btnH = h * 0.075;
        const btnX = (w - btnW) / 2;
        const btnY = h * 0.68;
        startButton = { x: btnX, y: btnY, w: btnW, h: btnH };

        // Button shadow
        ctx.shadowColor = 'rgba(255,107,107,0.3)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#FF6B6B';
        Renderer.drawRoundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Button highlight
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        btnGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
        btnGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = btnGrad;
        Renderer.drawRoundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
        ctx.fill();

        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${w * 0.06}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText('START', w / 2, btnY + btnH / 2);

        // Mute button
        const muteSize = w * 0.08;
        muteButton = { x: w - muteSize - 12, y: 12, w: muteSize, h: muteSize };
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.arc(muteButton.x + muteSize / 2, muteButton.y + muteSize / 2, muteSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.font = `${muteSize * 0.5}px Arial`;
        ctx.fillText(Sound.isMuted() ? '🔇' : '🔊', muteButton.x + muteSize / 2, muteButton.y + muteSize / 2);

        ctx.restore();
    }

    function drawHUD(ctx, w, h, coins, score, summonCost, canSummon, bonusCoinInfo, freeSummonInfo, coinSpeedInfo) {
        ctx.save();

        // Top bar background
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        Renderer.drawRoundRect(ctx, 8, 6, w - 16, 42, 12);
        ctx.fill();

        ctx.textBaseline = 'middle';
        const hudY = 27;

        // Coins (left)
        ctx.textAlign = 'left';
        ctx.font = `bold ${15}px Arial, sans-serif`;
        ctx.fillStyle = '#FFB800';
        ctx.fillText('🪙', 18, hudY);
        ctx.fillStyle = '#333';
        ctx.fillText(formatNumber(Math.floor(coins)), 38, hudY);

        // Score (right)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#888';
        ctx.font = `bold ${13}px Arial, sans-serif`;
        ctx.fillText('SCORE', w - 18, hudY - 8);
        ctx.fillStyle = '#333';
        ctx.font = `bold ${15}px Arial, sans-serif`;
        ctx.fillText(formatNumber(score), w - 18, hudY + 8);

        // Coins per second (center) with multiplier
        ctx.textAlign = 'center';
        ctx.font = `${11}px Arial, sans-serif`;
        const mult = coinSpeedInfo ? coinSpeedInfo.currentMult : 1;
        const cps = Grid.getTotalCoinsPerSecond() * mult;
        if (mult > 1) {
            ctx.fillStyle = coinSpeedInfo && coinSpeedInfo.adBoostActive ? '#FF6B6B' : '#4CAF50';
            ctx.fillText(`+${cps.toFixed(1)}/s (x${mult.toFixed(1)})`, w / 2, hudY);
        } else {
            ctx.fillStyle = '#999';
            ctx.fillText(`+${cps.toFixed(1)}/s`, w / 2, hudY);
        }

        ctx.restore();

        // Summon button (includes free summon indicator)
        drawSummonButton(ctx, w, h, summonCost, canSummon, freeSummonInfo);

        // Ad row: bonus coins (left) + speed boost (right)
        drawAdRow(ctx, w, h, bonusCoinInfo, coinSpeedInfo);

        // Speed upgrade (compact, below ad row)
        drawSpeedUpgrade(ctx, w, h, coinSpeedInfo);

        // Mute button (left side, below HUD bar)
        const muteSize = 32;
        muteButton = { x: 8, y: 52, w: muteSize, h: muteSize };
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(muteButton.x + muteSize / 2, muteButton.y + muteSize / 2, muteSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${muteSize * 0.45}px Arial`;
        ctx.fillStyle = '#666';
        ctx.fillText(Sound.isMuted() ? '🔇' : '🔊', muteButton.x + muteSize / 2, muteButton.y + muteSize / 2);
        ctx.restore();
    }

    function drawSummonButton(ctx, w, h, cost, canSummon, freeInfo) {
        const layout = Renderer.getGridLayout();
        const freeReady = freeInfo && freeInfo.ready;

        // Main summon button (left 60%)
        const mainW = w * 0.52;
        const btnH = 54;
        const mainX = 8;
        const btnY = layout.gridY + layout.gridSize + 20;
        summonButton = { x: mainX, y: btnY, w: mainW, h: btnH };

        ctx.save();
        const baseColor = canSummon ? '#4CAF50' : '#999';
        ctx.globalAlpha = canSummon ? 1.0 : 0.6;
        ctx.shadowColor = canSummon ? 'rgba(76,175,80,0.3)' : 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = baseColor;
        Renderer.drawRoundRect(ctx, mainX, btnY, mainW, btnH, btnH / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${16}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText('SUMMON', mainX + mainW / 2, btnY + btnH / 2 - 8);
        ctx.font = `${12}px Arial, sans-serif`;
        ctx.fillStyle = canSummon ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)';
        ctx.fillText(`🪙 ${formatNumber(cost)}`, mainX + mainW / 2, btnY + btnH / 2 + 11);
        ctx.restore();

        // Free summon button (right 35%)
        const freeW = w - mainW - 24;
        const freeX = mainX + mainW + 8;
        freeSummonButton = { x: freeX, y: btnY, w: freeW, h: btnH };

        ctx.save();
        if (freeReady) {
            ctx.shadowColor = 'rgba(68,136,255,0.4)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = '#4488FF';
        } else {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#888';
        }
        Renderer.drawRoundRect(ctx, freeX, btnY, freeW, btnH, btnH / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        if (freeReady) {
            ctx.font = `bold ${13}px 'Arial Rounded MT Bold', Arial, sans-serif`;
            ctx.fillText('FREE!', freeX + freeW / 2, btnY + btnH / 2);
        } else {
            ctx.font = `bold ${12}px Arial, sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            const secs = Math.ceil(freeInfo ? freeInfo.cooldownLeft : 0);
            ctx.fillText(`FREE`, freeX + freeW / 2, btnY + btnH / 2 - 8);
            ctx.font = `${11}px Arial, sans-serif`;
            ctx.fillText(`${secs}s`, freeX + freeW / 2, btnY + btnH / 2 + 9);
        }
        ctx.restore();
    }

    function drawAdRow(ctx, w, h, coinInfo, speedInfo) {
        const layout = Renderer.getGridLayout();
        const rowY = layout.gridY + layout.gridSize + 82;
        const btnH = 38;
        const halfW = (w - 24) / 2;

        // Left: bonus coin ad
        const lcX = 8;
        bonusCoinButton = { x: lcX, y: rowY, w: halfW, h: btnH };

        ctx.save();
        if (coinInfo && coinInfo.available) {
            ctx.fillStyle = '#FFB800';
            Renderer.drawRoundRect(ctx, lcX, rowY, halfW, btnH, btnH / 2);
            ctx.fill();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${11}px Arial, sans-serif`;
            ctx.fillText(`📺 +${formatNumber(coinInfo.bonusAmount)}`, lcX + halfW / 2, rowY + btnH / 2);
        } else {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#999';
            Renderer.drawRoundRect(ctx, lcX, rowY, halfW, btnH, btnH / 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = `bold ${11}px Arial, sans-serif`;
            const secs = coinInfo ? Math.ceil(coinInfo.cooldownLeft) : 0;
            ctx.fillText(`📺 coin (${secs}s)`, lcX + halfW / 2, rowY + btnH / 2);
        }
        ctx.restore();

        // Right: speed boost ad
        const rcX = lcX + halfW + 8;
        speedBoostButton = { x: rcX, y: rowY, w: halfW, h: btnH };

        ctx.save();
        if (speedInfo && speedInfo.adBoostActive) {
            ctx.fillStyle = '#FF6B6B';
            Renderer.drawRoundRect(ctx, rcX, rowY, halfW, btnH, btnH / 2);
            ctx.fill();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${11}px Arial, sans-serif`;
            const bm = speedInfo.adBoostMult || 1.5;
            ctx.fillText(`🔥 x${bm.toFixed(1)} ${Math.ceil(speedInfo.adBoostLeft)}s`, rcX + halfW / 2, rowY + btnH / 2);
        } else {
            ctx.fillStyle = '#FF8800';
            Renderer.drawRoundRect(ctx, rcX, rowY, halfW, btnH, btnH / 2);
            ctx.fill();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${11}px Arial, sans-serif`;
            const bm = speedInfo ? speedInfo.adBoostMult || 1.5 : 1.5;
            ctx.fillText(`📺 x${bm.toFixed(1)} boost`, rcX + halfW / 2, rowY + btnH / 2);
        }
        ctx.restore();
    }

    function drawSpeedUpgrade(ctx, w, h, info) {
        if (!info) {
            coinUpgradeButton = { x: 0, y: 0, w: 0, h: 0 };
            return;
        }

        const layout = Renderer.getGridLayout();
        const btnW = w * 0.5;
        const btnH = 32;
        const btnX = (w - btnW) / 2;
        const btnY = layout.gridY + layout.gridSize + 126;
        coinUpgradeButton = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.save();
        if (info.level < info.maxLevel) {
            const canBuy = info.canUpgrade;
            ctx.fillStyle = canBuy ? '#8B5CF6' : '#888';
            ctx.globalAlpha = canBuy ? 1 : 0.5;
            Renderer.drawRoundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${11}px Arial, sans-serif`;
            ctx.fillText(`⬆ SPEED Lv.${info.level + 1}  🪙${formatNumber(info.nextCost)}`, btnX + btnW / 2, btnY + btnH / 2);
        } else {
            ctx.fillStyle = '#8B5CF6';
            ctx.globalAlpha = 0.6;
            Renderer.drawRoundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${11}px Arial, sans-serif`;
            ctx.fillText('⬆ SPEED MAX', btnX + btnW / 2, btnY + btnH / 2);
        }
        ctx.restore();
    }

    function drawGameOver(ctx, w, h, score, highestLevel, highScore, isNewRecord, hasRewardAvailable) {
        // Dark overlay
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, h);

        // Panel
        const panelW = w * 0.82;
        const panelH = h * 0.52;
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2 - h * 0.03;

        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        Renderer.drawRoundRect(ctx, panelX, panelY, panelW, panelH, 20);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Game Over title
        ctx.fillStyle = '#FF6B6B';
        ctx.font = `bold ${w * 0.075}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText('GAME OVER', w / 2, panelY + panelH * 0.12);

        // Score
        ctx.fillStyle = '#333';
        ctx.font = `${w * 0.04}px Arial, sans-serif`;
        ctx.fillText('SCORE', w / 2, panelY + panelH * 0.25);
        ctx.font = `bold ${w * 0.08}px Arial, sans-serif`;
        ctx.fillText(formatNumber(score), w / 2, panelY + panelH * 0.33);

        // Highest level
        ctx.fillStyle = '#666';
        ctx.font = `${w * 0.035}px Arial, sans-serif`;
        ctx.fillText(`Highest Level: ${highestLevel}`, w / 2, panelY + panelH * 0.43);

        // High score
        ctx.fillStyle = '#FFB800';
        ctx.font = `bold ${w * 0.035}px Arial, sans-serif`;
        if (isNewRecord) {
            ctx.fillText(`🏆 NEW RECORD: ${formatNumber(highScore)} 🏆`, w / 2, panelY + panelH * 0.51);
        } else {
            ctx.fillStyle = '#999';
            ctx.fillText(`Best: ${formatNumber(highScore)}`, w / 2, panelY + panelH * 0.51);
        }

        // Reward ad button
        if (hasRewardAvailable) {
            const rbW = panelW * 0.8;
            const rbH = 44;
            const rbX = (w - rbW) / 2;
            const rbY = panelY + panelH * 0.60;
            rewardButton = { x: rbX, y: rbY, w: rbW, h: rbH };

            ctx.fillStyle = '#FFB800';
            Renderer.drawRoundRect(ctx, rbX, rbY, rbW, rbH, rbH / 2);
            ctx.fill();

            const rbGrad = ctx.createLinearGradient(rbX, rbY, rbX, rbY + rbH);
            rbGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
            rbGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
            ctx.fillStyle = rbGrad;
            Renderer.drawRoundRect(ctx, rbX, rbY, rbW, rbH, rbH / 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = `bold ${14}px Arial, sans-serif`;
            ctx.fillText('📺 Watch Ad: Free 2 Spaces', w / 2, rbY + rbH / 2);
        } else {
            rewardButton = { x: 0, y: 0, w: 0, h: 0 };
        }

        // Restart button
        const rbtnW = panelW * 0.65;
        const rbtnH = 48;
        const rbtnX = (w - rbtnW) / 2;
        const rbtnY = panelY + panelH * (hasRewardAvailable ? 0.78 : 0.72);
        restartButton = { x: rbtnX, y: rbtnY, w: rbtnW, h: rbtnH };

        ctx.fillStyle = '#FF6B6B';
        Renderer.drawRoundRect(ctx, rbtnX, rbtnY, rbtnW, rbtnH, rbtnH / 2);
        ctx.fill();

        const rGrad = ctx.createLinearGradient(rbtnX, rbtnY, rbtnX, rbtnY + rbtnH);
        rGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
        rGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        ctx.fillStyle = rGrad;
        Renderer.drawRoundRect(ctx, rbtnX, rbtnY, rbtnW, rbtnH, rbtnH / 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${18}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText('RESTART', w / 2, rbtnY + rbtnH / 2);

        ctx.restore();
    }

    function drawStageInfo(ctx, w, h, status) {
        // Draw stage info panel on the right side of the grid area
        const layout = Renderer.getGridLayout();
        const panelX = 8;
        const panelY = layout.gridY + layout.gridSize + 164;
        const panelW = w - 16;
        const panelH = 92;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        Renderer.drawRoundRect(ctx, panelX, panelY, panelW, panelH, 10);
        ctx.fill();

        // Stage title
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FF6B6B';
        ctx.font = `bold ${12}px Arial, sans-serif`;
        ctx.fillText(`STAGE ${status.stageId} - ${status.stageName}`, panelX + 10, panelY + 14);

        // Main goal
        const mainCheck = status.mainDone ? '✅' : '⬜';
        ctx.fillStyle = status.mainDone ? '#4CAF50' : '#333';
        ctx.font = `bold ${11}px Arial, sans-serif`;
        ctx.fillText(`${mainCheck} ${status.mainLabel}`, panelX + 10, panelY + 32);

        // Bonus missions
        for (let i = 0; i < status.missions.length; i++) {
            const m = status.missions[i];
            const check = m.done ? '✅' : '⬜';
            ctx.fillStyle = m.done ? '#4CAF50' : '#888';
            ctx.font = `${10}px Arial, sans-serif`;
            ctx.fillText(`${check} ${m.label}`, panelX + 10, panelY + 50 + i * 13);
        }

        // Stars preview
        ctx.textAlign = 'right';
        ctx.font = `${13}px Arial`;
        const mainStar = status.mainDone ? '★' : '☆';
        const bonusStars = status.missions.map(m => m.done ? '★' : '☆').join('');
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${mainStar}${bonusStars}`, panelX + panelW - 10, panelY + 14);

        ctx.restore();
    }

    function drawStageClear(ctx, w, h, results, progress) {
        ctx.save();

        // Fade in
        const alpha = Math.min(1, progress * 3);
        ctx.globalAlpha = alpha;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, w, h);

        // Panel
        const panelW = w * 0.78;
        const panelH = h * 0.32;
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2 - h * 0.05;

        // Bounce in
        const scale = progress < 0.15 ? (progress / 0.15) * 1.1 : progress < 0.25 ? 1.1 - (progress - 0.15) / 0.1 * 0.1 : 1.0;
        ctx.translate(w / 2, h / 2 - h * 0.05);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2, -(h / 2 - h * 0.05));

        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff';
        Renderer.drawRoundRect(ctx, panelX, panelY, panelW, panelH, 16);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // "STAGE CLEAR!"
        ctx.fillStyle = '#FF6B6B';
        ctx.font = `bold ${w * 0.065}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText('STAGE CLEAR!', w / 2, panelY + panelH * 0.18);

        // Stage name
        ctx.fillStyle = '#666';
        ctx.font = `${w * 0.035}px Arial, sans-serif`;
        ctx.fillText(`Stage ${results.stageId} - ${results.stageName}`, w / 2, panelY + panelH * 0.38);

        // Stars
        ctx.font = `${w * 0.08}px Arial`;
        const maxStars = results.maxStars || 4;
        let starsText = '';
        for (let i = 0; i < maxStars; i++) {
            starsText += i < results.stars ? '★' : '☆';
        }
        ctx.fillStyle = '#FFD700';
        ctx.fillText(starsText, w / 2, panelY + panelH * 0.6);

        // Reward
        ctx.fillStyle = '#4CAF50';
        ctx.font = `bold ${w * 0.04}px Arial, sans-serif`;
        ctx.fillText(`+${formatNumber(results.reward)} coins!`, w / 2, panelY + panelH * 0.82);

        ctx.restore();
    }

    function drawTutorial(ctx, w, h, step) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const messages = [
            { title: 'ドラッグ＆ドロップ', desc: 'モンスターを指でドラッグして\n移動させよう！' },
            { title: '同じレベルで合体！', desc: '同じレベル同士を重ねると\n進化するよ！' },
            { title: '召喚でモンスター追加', desc: '下のボタンでモンスターを\n召喚しよう！' },
        ];
        const msg = messages[step];

        // Panel
        const pw = w * 0.75;
        const ph = h * 0.22;
        const px = (w - pw) / 2;
        const py = h * 0.35;

        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 15;
        Renderer.drawRoundRect(ctx, px, py, pw, ph, 16);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Step indicator
        ctx.fillStyle = '#FF6B6B';
        ctx.font = `bold ${w * 0.04}px Arial, sans-serif`;
        ctx.fillText(`${step + 1} / 3`, w / 2, py + ph * 0.15);

        // Title
        ctx.fillStyle = '#333';
        ctx.font = `bold ${w * 0.055}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.fillText(msg.title, w / 2, py + ph * 0.38);

        // Description (multiline)
        ctx.fillStyle = '#666';
        ctx.font = `${w * 0.038}px Arial, sans-serif`;
        const lines = msg.desc.split('\n');
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], w / 2, py + ph * 0.6 + i * w * 0.05);
        }

        // Tap to continue
        ctx.fillStyle = '#999';
        ctx.font = `${w * 0.03}px Arial, sans-serif`;
        ctx.fillText('タップで次へ', w / 2, py + ph * 0.92);

        ctx.restore();
    }

    function showMilestone(text) {
        milestoneText = { text: text, progress: 0, duration: 2.0 };
    }

    function showNewRecord() {
        newRecordText = { progress: 0, duration: 2.5 };
    }

    function updateOverlays(dt) {
        if (milestoneText) {
            milestoneText.progress += dt;
            if (milestoneText.progress >= milestoneText.duration) {
                milestoneText = null;
            }
        }
        if (newRecordText) {
            newRecordText.progress += dt;
            if (newRecordText.progress >= newRecordText.duration) {
                newRecordText = null;
            }
        }
    }

    function drawOverlays(ctx, w, h, time) {
        if (milestoneText) {
            const t = milestoneText.progress / milestoneText.duration;
            let alpha;
            if (t < 0.2) alpha = t / 0.2;
            else if (t > 0.7) alpha = (1 - t) / 0.3;
            else alpha = 1;

            const scale = 0.8 + (t < 0.2 ? (t / 0.2) * 0.2 : 0.2);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${w * 0.09 * scale}px 'Arial Rounded MT Bold', Arial, sans-serif`;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillText(milestoneText.text, w / 2 + 2, h * 0.12 + 2);

            // Rainbow text
            const grad = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
            grad.addColorStop(0, '#FF6B6B');
            grad.addColorStop(0.25, '#FFD700');
            grad.addColorStop(0.5, '#66DD88');
            grad.addColorStop(0.75, '#88DDFF');
            grad.addColorStop(1, '#BB66FF');
            ctx.fillStyle = grad;
            ctx.fillText(milestoneText.text, w / 2, h * 0.12);
            ctx.restore();
        }

        if (newRecordText) {
            const t = newRecordText.progress / newRecordText.duration;
            let alpha;
            if (t < 0.15) alpha = t / 0.15;
            else if (t > 0.75) alpha = (1 - t) / 0.25;
            else alpha = 1;

            const pulse = 1 + Math.sin(newRecordText.progress * 8) * 0.05;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${w * 0.07 * pulse}px 'Arial Rounded MT Bold', Arial, sans-serif`;
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 3;
            ctx.strokeText('🏆 NEW RECORD! 🏆', w / 2, h * 0.08);
            ctx.fillText('🏆 NEW RECORD! 🏆', w / 2, h * 0.08);
            ctx.restore();
        }
    }

    function hitTestStartButton(x, y) {
        return hitRect(startButton, x, y);
    }

    function hitTestSummonButton(x, y) {
        return hitRect(summonButton, x, y);
    }

    function hitTestRestartButton(x, y) {
        return hitRect(restartButton, x, y);
    }

    function hitTestRewardButton(x, y) {
        return hitRect(rewardButton, x, y);
    }

    function hitTestFreeSummonButton(x, y) {
        return hitRect(freeSummonButton, x, y);
    }

    function hitTestBonusCoinButton(x, y) {
        return hitRect(bonusCoinButton, x, y);
    }

    function hitTestCoinUpgradeButton(x, y) {
        return hitRect(coinUpgradeButton, x, y);
    }

    function hitTestSpeedBoostButton(x, y) {
        return hitRect(speedBoostButton, x, y);
    }

    function hitTestMuteButton(x, y) {
        return hitRect(muteButton, x, y);
    }

    function hitRect(rect, x, y) {
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    function formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
        return Math.floor(n).toLocaleString();
    }

    return {
        drawTitleScreen,
        drawHUD,
        drawSummonButton,
        drawGameOver,
        drawOverlays,
        drawStageInfo,
        drawStageClear,
        drawTutorial,
        showMilestone,
        showNewRecord,
        updateOverlays,
        hitTestStartButton,
        hitTestSummonButton,
        hitTestFreeSummonButton,
        hitTestBonusCoinButton,
        hitTestCoinUpgradeButton,
        hitTestSpeedBoostButton,
        hitTestRestartButton,
        hitTestRewardButton,
        hitTestMuteButton,
        formatNumber,
    };
})();
