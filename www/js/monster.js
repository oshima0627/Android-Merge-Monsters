/**
 * Monster data definitions and Canvas 2D drawing routines.
 */
const Monster = (() => {
    const MAX_LEVEL = 30;

    // Color and style definitions per level.
    // `color` can be: hex string (solid), two-element array (linear gradient),
    // or the string 'rainbow' for the animated rainbow gradient (reserved for Lv.30).
    const LEVEL_DATA = {
        1:  { color: '#88DDFF',            eyeType: 'smile',       decoration: null },
        2:  { color: '#66DD88',            eyeType: 'wink',        decoration: null },
        3:  { color: '#FFDD44',            eyeType: 'surprise',    decoration: null },
        4:  { color: '#FFAA33',            eyeType: 'smirk',       decoration: null },
        5:  { color: '#FF6B6B',            eyeType: 'sparkle',     decoration: 'crown' },
        6:  { color: '#BB66FF',            eyeType: 'smug',        decoration: null },
        7:  { color: '#FF88BB',            eyeType: 'heart',       decoration: null },
        8:  { color: '#4488FF',            eyeType: 'sunglasses',  decoration: null },
        9:  { color: '#FFD700',            eyeType: 'normal',      decoration: 'flame' },
        10: { color: '#2EC4B6',            eyeType: 'sparkle',     decoration: 'halo' },
        11: { color: '#D62246',            eyeType: 'heart',       decoration: 'wings' },
        12: { color: '#7209B7',            eyeType: 'sunglasses',  decoration: 'crown_jewel' },
        13: { color: '#06D6A0',            eyeType: 'smug',        decoration: 'lightning' },
        14: { color: '#F72585',            eyeType: 'sparkle',     decoration: 'flame_wings' },
        15: { color: '#3A86FF',            eyeType: 'sparkle',     decoration: 'ultimate' },
        16: { color: ['#FF5722', '#FFC107'], eyeType: 'surprise',   decoration: 'stars' },         // fire
        17: { color: ['#00BFA6', '#1976D2'], eyeType: 'smirk',      decoration: 'stars' },         // ocean
        18: { color: ['#9C27B0', '#E91E63'], eyeType: 'wink',       decoration: 'stars_crown' },   // berry
        19: { color: ['#4CAF50', '#CDDC39'], eyeType: 'heart',      decoration: 'stars_crown' },   // meadow
        20: { color: ['#FF6F00', '#BF360C'], eyeType: 'sunglasses', decoration: 'stars_flame' },   // sunset
        21: { color: ['#673AB7', '#3F51B5'], eyeType: 'smug',       decoration: 'divine' },        // twilight
        22: { color: ['#FFECB3', '#FFB300'], eyeType: 'sparkle',    decoration: 'divine' },        // gold metallic
        23: { color: ['#E0E0E0', '#9E9E9E'], eyeType: 'heart',      decoration: 'divine' },        // silver metallic
        24: { color: ['#FFD54F', '#F57F17'], eyeType: 'sunglasses', decoration: 'cosmic' },        // amber
        25: { color: ['#80DEEA', '#006064'], eyeType: 'sparkle',    decoration: 'cosmic' },        // aqua metallic
        26: { color: ['#CE93D8', '#4A148C'], eyeType: 'smug',       decoration: 'cosmic' },        // violet metallic
        27: { color: ['#F48FB1', '#880E4F'], eyeType: 'heart',      decoration: 'cosmic' },        // rose metallic
        28: { color: ['#1A237E', '#000051'], eyeType: 'sunglasses', decoration: 'god' },           // void blue
        29: { color: ['#263238', '#000000'], eyeType: 'sparkle',    decoration: 'god' },           // obsidian
        30: { color: 'rainbow',              eyeType: 'sparkle',    decoration: 'god_ultimate' },  // ultimate rainbow
    };

    const RAINBOW_COLORS = ['#FF6B6B', '#FFAA33', '#FFDD44', '#66DD88', '#88DDFF', '#4488FF', '#BB66FF'];

    // Per-level name and short lore for the monster codex.
    const LORE = {
        1:  { name: 'ポポ',       desc: '青空の子。合体旅のはじまり。' },
        2:  { name: 'リーフィ',   desc: '若草のそよ風、はじめての芽吹き。' },
        3:  { name: 'タマゴン',   desc: '黄色いひよっこ、驚くのが得意。' },
        4:  { name: 'オレンジー', desc: 'やる気いっぱいのお調子者。' },
        5:  { name: 'クラウニー', desc: '小さな王冠を授かった若き戦士。' },
        6:  { name: 'ムラサメ',   desc: '紫の霧を操る、頭脳派のモンスター。' },
        7:  { name: 'ピンクル',   desc: '愛らしい微笑みで仲間を元気づける。' },
        8:  { name: 'ブルーノ',   desc: '青き戦士、頼れる兄貴分。' },
        9:  { name: 'ゴールドン', desc: '炎をまとう黄金の英雄。' },
        10: { name: 'テルビス',   desc: '翡翠の光輪、静寂の守り手。' },
        11: { name: 'レッドラ',   desc: '真紅の翼を広げ、戦場を駆ける。' },
        12: { name: 'ロイヤ',     desc: '紫紺の王、王冠の宝石を継ぐ者。' },
        13: { name: 'エメルダ',   desc: '緑玉の雷をまとう電撃使い。' },
        14: { name: 'フラミナ',   desc: '燃える翼を持つ魔性の舞姫。' },
        15: { name: 'コバルド',   desc: '蒼き究極の騎士、勇者の頂点。' },
        16: { name: 'イグニス',   desc: '永遠に燃えゆく炎、星を纏う火精。' },
        17: { name: 'マリナー',   desc: '深海と大空を繋ぐ蒼の守護者。' },
        18: { name: 'ベリーナ',   desc: '夜空のベリー、王冠を戴く魔女。' },
        19: { name: 'メドーウ',   desc: '草原の歌姫、星を呼び寄せる者。' },
        20: { name: 'サンセッタ', desc: '夕焼けを閉じ込めた終章の炎。' },
        21: { name: 'トワイラ',   desc: '黄昏の光、神の使いへ至る。' },
        22: { name: 'オーレア',   desc: '黄金の神聖、祝福を纏いし者。' },
        23: { name: 'アーギュラ', desc: '白銀の神聖、沈黙の守護者。' },
        24: { name: 'アンバラ',   desc: '琥珀の宇宙、時を封じる者。' },
        25: { name: 'アクアリス', desc: '深海の宇宙、蒼き神秘。' },
        26: { name: 'ヴァイオラ', desc: '菫色の宇宙、魔眼を持つ。' },
        27: { name: 'ローゼア',   desc: '薔薇色の宇宙、永遠の華。' },
        28: { name: 'ヴォイディス', desc: '虚無の青、宇宙の淵に立つ者。' },
        29: { name: 'ニグラム',   desc: '漆黒の神、すべてを呑む影。' },
        30: { name: 'プリズモン', desc: '虹色の創造神、全てを超越せし者。' },
    };

    function getLore(level) {
        return LORE[level] || { name: '???', desc: '???' };
    }

    function getLevelData(level) {
        if (level < 1) level = 1;
        if (level > MAX_LEVEL) level = MAX_LEVEL;
        return LEVEL_DATA[level];
    }

    function coinsPerSecond(level) {
        return level * 1.5;
    }

    function summonCost(summonCount) {
        return Math.floor(10 + summonCount * 2 + Math.pow(summonCount, 1.4) * 0.3);
    }

    function createRainbowGradient(ctx, x, y, radius, time) {
        const angle = (time * 0.001) % (Math.PI * 2);
        const gx = Math.cos(angle) * radius;
        const gy = Math.sin(angle) * radius;
        const grad = ctx.createLinearGradient(x - gx, y - gy, x + gx, y + gy);
        for (let i = 0; i < RAINBOW_COLORS.length; i++) {
            grad.addColorStop(i / (RAINBOW_COLORS.length - 1), RAINBOW_COLORS[i]);
        }
        return grad;
    }

    function createDuoGradient(ctx, x, y, radius, colors) {
        const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1] || colors[0]);
        return grad;
    }

    function resolveBodyFill(ctx, x, y, radius, data, time) {
        if (data.color === 'rainbow') {
            return createRainbowGradient(ctx, x, y, radius, time);
        }
        if (Array.isArray(data.color)) {
            return createDuoGradient(ctx, x, y, radius, data.color);
        }
        return data.color;
    }

    function getGlowColor(data) {
        if (data.color === 'rainbow') return '#FFD700';
        if (Array.isArray(data.color)) return data.color[0];
        return data.color;
    }

    function draw(ctx, x, y, radius, level, time, alpha) {
        if (alpha === undefined) alpha = 1;
        const data = getLevelData(level);
        ctx.save();
        ctx.globalAlpha = alpha;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.85, radius * 0.7, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyColor = resolveBodyFill(ctx, x, y, radius, data, time);

        // Body glow for high levels (lightweight ring instead of shadowBlur)
        if (level >= 5) {
            const glowColor = getGlowColor(data);
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.15 + Math.sin(time * 0.005) * 0.05;
            ctx.beginPath();
            ctx.arc(x, y, radius * 1.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = alpha;
        }

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Body highlight (simple white overlay, no gradient)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.2, y - radius * 0.25, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Little arms
        const armLen = radius * 0.35;
        const armY = y + radius * 0.1;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = radius * 0.12;
        ctx.lineCap = 'round';
        // Left arm
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.85, armY);
        ctx.lineTo(x - radius * 0.85 - armLen, armY - armLen * 0.5);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(x + radius * 0.85, armY);
        ctx.lineTo(x + radius * 0.85 + armLen, armY - armLen * 0.5);
        ctx.stroke();

        // Little feet
        const footY = y + radius * 0.85;
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x - radius * 0.3, footY, radius * 0.18, radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.3, footY, radius * 0.18, radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw decoration behind/around monster
        drawDecoration(ctx, x, y, radius, data.decoration, time, level);

        // Eyes
        drawEyes(ctx, x, y, radius, data.eyeType, time);

        // Mouth
        drawMouth(ctx, x, y, radius, data.eyeType);

        // Cheeks (blush)
        ctx.fillStyle = 'rgba(255,150,150,0.3)';
        ctx.beginPath();
        ctx.ellipse(x - radius * 0.45, y + radius * 0.15, radius * 0.15, radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.45, y + radius * 0.15, radius * 0.15, radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Level number
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 3;
        ctx.font = `bold ${radius * 0.55}px 'Arial Rounded MT Bold', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(level.toString(), x, y + radius * 0.42);
        ctx.fillText(level.toString(), x, y + radius * 0.42);

        ctx.restore();
    }

    function drawEyes(ctx, x, y, radius, eyeType, time) {
        const eyeY = y - radius * 0.15;
        const eyeSpacing = radius * 0.28;
        const eyeRadius = radius * 0.13;

        switch (eyeType) {
            case 'smile':
                // Simple round eyes
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                // Eye shine
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'wink':
                // Left eye open
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                // Right eye wink (arc)
                ctx.strokeStyle = '#333';
                ctx.lineWidth = radius * 0.06;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(x + eyeSpacing, eyeY, eyeRadius * 0.8, 0.1 * Math.PI, 0.9 * Math.PI);
                ctx.stroke();
                break;

            case 'surprise':
                // Big round eyes
                const bigR = eyeRadius * 1.4;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing, eyeY, bigR, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing, eyeY, bigR, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing, eyeY, bigR * 0.55, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing, eyeY, bigR * 0.55, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing + bigR * 0.2, eyeY - bigR * 0.2, bigR * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing + bigR * 0.2, eyeY - bigR * 0.2, bigR * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'smirk':
                // Half-closed confident eyes
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.ellipse(x - eyeSpacing, eyeY, eyeRadius * 1.1, eyeRadius * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(x + eyeSpacing, eyeY, eyeRadius * 1.1, eyeRadius * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.15, eyeRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.15, eyeRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'sparkle':
                // Star-shaped sparkle eyes
                drawStar(ctx, x - eyeSpacing, eyeY, eyeRadius * 0.5, eyeRadius * 1.2, 4, '#FFD700');
                drawStar(ctx, x + eyeSpacing, eyeY, eyeRadius * 0.5, eyeRadius * 1.2, 4, '#FFD700');
                break;

            case 'smug':
                // Thick eyebrow look
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.ellipse(x - eyeSpacing, eyeY, eyeRadius, eyeRadius * 0.7, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(x + eyeSpacing, eyeY, eyeRadius, eyeRadius * 0.7, 0.1, 0, Math.PI * 2);
                ctx.fill();
                // Eyebrows
                ctx.strokeStyle = '#333';
                ctx.lineWidth = radius * 0.07;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(x - eyeSpacing - eyeRadius * 1.2, eyeY - eyeRadius * 1.3);
                ctx.lineTo(x - eyeSpacing + eyeRadius * 0.8, eyeY - eyeRadius * 1.6);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + eyeSpacing + eyeRadius * 1.2, eyeY - eyeRadius * 1.3);
                ctx.lineTo(x + eyeSpacing - eyeRadius * 0.8, eyeY - eyeRadius * 1.6);
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.2, eyeRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing + eyeRadius * 0.3, eyeY - eyeRadius * 0.2, eyeRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'heart':
                // Heart-shaped eyes
                drawHeart(ctx, x - eyeSpacing, eyeY, eyeRadius * 1.5, '#FF4488');
                drawHeart(ctx, x + eyeSpacing, eyeY, eyeRadius * 1.5, '#FF4488');
                break;

            case 'sunglasses':
                // Cool sunglasses
                ctx.fillStyle = '#222';
                // Left lens
                roundRect(ctx, x - eyeSpacing - eyeRadius * 1.5, eyeY - eyeRadius * 0.9, eyeRadius * 3, eyeRadius * 1.8, eyeRadius * 0.4);
                ctx.fill();
                // Right lens
                roundRect(ctx, x + eyeSpacing - eyeRadius * 1.5, eyeY - eyeRadius * 0.9, eyeRadius * 3, eyeRadius * 1.8, eyeRadius * 0.4);
                ctx.fill();
                // Bridge
                ctx.strokeStyle = '#222';
                ctx.lineWidth = radius * 0.05;
                ctx.beginPath();
                ctx.moveTo(x - eyeSpacing + eyeRadius * 1.5, eyeY);
                ctx.lineTo(x + eyeSpacing - eyeRadius * 1.5, eyeY);
                ctx.stroke();
                // Shine on lenses
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.ellipse(x - eyeSpacing - eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.5, eyeRadius * 0.3, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(x + eyeSpacing - eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.5, eyeRadius * 0.3, -0.3, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Normal eyes
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(x - eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    function drawMouth(ctx, x, y, radius, eyeType) {
        const mouthY = y + radius * 0.2;

        ctx.strokeStyle = '#333';
        ctx.lineWidth = radius * 0.05;
        ctx.lineCap = 'round';

        switch (eyeType) {
            case 'smile':
            case 'sparkle':
            case 'heart':
                // Happy smile
                ctx.beginPath();
                ctx.arc(x, mouthY - radius * 0.05, radius * 0.2, 0.1 * Math.PI, 0.9 * Math.PI);
                ctx.stroke();
                break;
            case 'wink':
                // Small cheeky mouth
                ctx.beginPath();
                ctx.arc(x + radius * 0.1, mouthY, radius * 0.12, 0.1 * Math.PI, 0.9 * Math.PI);
                ctx.stroke();
                break;
            case 'surprise':
                // O mouth
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.ellipse(x, mouthY + radius * 0.05, radius * 0.1, radius * 0.13, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'smirk':
            case 'smug':
                // Smirk
                ctx.beginPath();
                ctx.moveTo(x - radius * 0.15, mouthY);
                ctx.quadraticCurveTo(x + radius * 0.1, mouthY + radius * 0.15, x + radius * 0.2, mouthY - radius * 0.05);
                ctx.stroke();
                break;
            case 'sunglasses':
                // Cool flat smile
                ctx.beginPath();
                ctx.moveTo(x - radius * 0.18, mouthY);
                ctx.lineTo(x + radius * 0.18, mouthY);
                ctx.quadraticCurveTo(x + radius * 0.1, mouthY + radius * 0.08, x, mouthY + radius * 0.05);
                ctx.stroke();
                break;
            default:
                ctx.beginPath();
                ctx.arc(x, mouthY - radius * 0.05, radius * 0.15, 0.15 * Math.PI, 0.85 * Math.PI);
                ctx.stroke();
                break;
        }
    }

    function drawDecoration(ctx, x, y, radius, decoration, time, level) {
        if (!decoration) return;

        switch (decoration) {
            case 'crown':
                drawCrown(ctx, x, y - radius * 0.9, radius * 0.5, '#FFD700');
                break;
            case 'flame':
                drawFlame(ctx, x, y, radius, time);
                break;
            case 'halo':
                drawHalo(ctx, x, y - radius * 1.1, radius * 0.5, time);
                break;
            case 'wings':
                drawWings(ctx, x, y, radius, time);
                break;
            case 'crown_jewel':
                drawCrown(ctx, x, y - radius * 0.9, radius * 0.5, '#FFD700');
                drawJewel(ctx, x, y - radius * 1.1, radius * 0.15);
                break;
            case 'lightning':
                drawLightning(ctx, x, y, radius, time);
                break;
            case 'flame_wings':
                drawFlame(ctx, x, y, radius, time);
                drawWings(ctx, x, y, radius, time);
                break;
            case 'ultimate':
                drawHalo(ctx, x, y - radius * 1.15, radius * 0.55, time);
                drawCrown(ctx, x, y - radius * 0.95, radius * 0.55, '#FFD700');
                drawWings(ctx, x, y, radius * 1.1, time);
                drawFlame(ctx, x, y, radius, time);
                break;
            case 'stars':
                drawOrbitalStars(ctx, x, y, radius, time, 4);
                break;
            case 'stars_crown':
                drawOrbitalStars(ctx, x, y, radius, time, 5);
                drawCrown(ctx, x, y - radius * 0.9, radius * 0.5, '#FFD700');
                break;
            case 'stars_flame':
                drawOrbitalStars(ctx, x, y, radius, time, 5);
                drawFlame(ctx, x, y, radius, time);
                break;
            case 'divine':
                drawHalo(ctx, x, y - radius * 1.15, radius * 0.55, time);
                drawCrown(ctx, x, y - radius * 0.95, radius * 0.55, '#FFD700');
                drawOrbitalStars(ctx, x, y, radius, time, 6);
                break;
            case 'cosmic':
                drawAura(ctx, x, y, radius, time);
                drawHalo(ctx, x, y - radius * 1.15, radius * 0.6, time);
                drawWings(ctx, x, y, radius * 1.1, time);
                drawOrbitalStars(ctx, x, y, radius, time, 7);
                drawFlame(ctx, x, y, radius, time);
                break;
            case 'god':
                drawAura(ctx, x, y, radius, time);
                drawHalo(ctx, x, y - radius * 1.2, radius * 0.65, time);
                drawCrown(ctx, x, y - radius * 1.0, radius * 0.6, '#FFD700');
                drawWings(ctx, x, y, radius * 1.2, time);
                drawOrbitalStars(ctx, x, y, radius, time, 8);
                drawFlame(ctx, x, y, radius, time);
                break;
            case 'god_ultimate':
                drawAura(ctx, x, y, radius * 1.1, time);
                drawHalo(ctx, x, y - radius * 1.25, radius * 0.7, time);
                drawCrown(ctx, x, y - radius * 1.05, radius * 0.65, '#FFD700');
                drawWings(ctx, x, y, radius * 1.3, time);
                drawOrbitalStars(ctx, x, y, radius, time, 10);
                drawFlame(ctx, x, y, radius, time);
                drawLightning(ctx, x, y, radius, time);
                drawJewel(ctx, x, y - radius * 1.3, radius * 0.18);
                break;
        }
    }

    function drawOrbitalStars(ctx, x, y, radius, time, count) {
        const orbitR = radius * 1.35;
        const starSize = radius * 0.12;
        const baseAngle = time * 0.0015;
        ctx.save();
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (i / count) * Math.PI * 2;
            const twinkle = 0.6 + 0.4 * Math.sin(time * 0.006 + i * 1.3);
            const sx = x + Math.cos(angle) * orbitR;
            const sy = y + Math.sin(angle) * orbitR * 0.6;
            ctx.globalAlpha = twinkle;
            drawStar(ctx, sx, sy, starSize * 0.4, starSize, 4, '#FFF7B0');
        }
        ctx.restore();
    }

    function drawAura(ctx, x, y, radius, time) {
        const pulse = 0.5 + 0.3 * Math.sin(time * 0.004);
        const auraR = radius * (1.7 + 0.1 * Math.sin(time * 0.003));
        const grad = ctx.createRadialGradient(x, y, radius * 0.9, x, y, auraR);
        grad.addColorStop(0, `rgba(255, 200, 255, ${0.35 * pulse})`);
        grad.addColorStop(0.5, `rgba(180, 220, 255, ${0.22 * pulse})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, auraR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawCrown(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#CC9900';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x - size * 0.7, y - size * 0.8);
        ctx.lineTo(x - size * 0.35, y - size * 0.2);
        ctx.lineTo(x, y - size);
        ctx.lineTo(x + size * 0.35, y - size * 0.2);
        ctx.lineTo(x + size * 0.7, y - size * 0.8);
        ctx.lineTo(x + size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Jewels on crown
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.65, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4444FF';
        ctx.beginPath();
        ctx.arc(x - size * 0.45, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.45, y - size * 0.35, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFlame(ctx, x, y, radius, time) {
        const flicker = Math.sin(time * 0.01) * 3;
        const flicker2 = Math.cos(time * 0.013) * 2;

        // Outer flame
        const grad = ctx.createRadialGradient(x, y - radius * 0.5, 0, x, y - radius * 0.3, radius * 1.3);
        grad.addColorStop(0, 'rgba(255,200,50,0.5)');
        grad.addColorStop(0.5, 'rgba(255,100,20,0.3)');
        grad.addColorStop(1, 'rgba(255,50,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x + flicker2, y - radius * 0.2, radius * 0.9, radius * 1.1 + flicker, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHalo(ctx, x, y, radius, time) {
        const glow = 0.5 + Math.sin(time * 0.004) * 0.2;
        ctx.strokeStyle = `rgba(255, 215, 0, ${glow})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 200, ${glow * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.1, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawWings(ctx, x, y, radius, time) {
        const flap = Math.sin(time * 0.006) * 0.15;
        ctx.save();
        ctx.globalAlpha = 0.6;

        // Left wing
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(x - radius * 1.2, y - radius * 0.1, radius * 0.6, radius * 0.9, -0.3 + flap, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,200,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right wing
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(x + radius * 1.2, y - radius * 0.1, radius * 0.6, radius * 0.9, 0.3 - flap, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,200,255,0.5)';
        ctx.stroke();

        ctx.restore();
    }

    function drawJewel(ctx, x, y, size) {
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.3, y - size * 0.2);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
    }

    function drawLightning(ctx, x, y, radius, time) {
        const flash = Math.sin(time * 0.015) > 0.7 ? 1 : 0.3;
        ctx.save();
        ctx.globalAlpha = flash;
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Left bolt
        ctx.beginPath();
        ctx.moveTo(x - radius * 1.1, y - radius * 0.6);
        ctx.lineTo(x - radius * 0.8, y - radius * 0.1);
        ctx.lineTo(x - radius * 1.0, y - radius * 0.1);
        ctx.lineTo(x - radius * 0.7, y + radius * 0.4);
        ctx.stroke();

        // Right bolt
        ctx.beginPath();
        ctx.moveTo(x + radius * 1.1, y - radius * 0.6);
        ctx.lineTo(x + radius * 0.8, y - radius * 0.1);
        ctx.lineTo(x + radius * 1.0, y - radius * 0.1);
        ctx.lineTo(x + radius * 0.7, y + radius * 0.4);
        ctx.stroke();

        ctx.restore();
    }

    function drawStar(ctx, cx, cy, innerR, outerR, points, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            if (i === 0) {
                ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            } else {
                ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawHeart(ctx, cx, cy, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        const topY = cy - size * 0.3;
        ctx.moveTo(cx, cy + size * 0.3);
        ctx.bezierCurveTo(cx - size * 0.6, cy - size * 0.1, cx - size * 0.6, topY - size * 0.3, cx, topY);
        ctx.bezierCurveTo(cx + size * 0.6, topY - size * 0.3, cx + size * 0.6, cy - size * 0.1, cx, cy + size * 0.3);
        ctx.fill();
    }

    function roundRect(ctx, x, y, w, h, r) {
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

    return {
        MAX_LEVEL,
        LEVEL_DATA,
        LORE,
        getLevelData,
        getLore,
        getGlowColor,
        coinsPerSecond,
        summonCost,
        draw,
        drawStar,
        drawHeart,
        roundRect,
        createRainbowGradient,
    };
})();
