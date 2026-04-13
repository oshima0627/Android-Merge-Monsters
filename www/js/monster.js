/**
 * Monster data definitions and Canvas 2D drawing routines.
 */
const Monster = (() => {
    const MAX_LEVEL = 15;

    // Color and style definitions per level
    const LEVEL_DATA = {
        1:  { color: '#88DDFF', eyeType: 'smile',      decoration: null },
        2:  { color: '#66DD88', eyeType: 'wink',        decoration: null },
        3:  { color: '#FFDD44', eyeType: 'surprise',    decoration: null },
        4:  { color: '#FFAA33', eyeType: 'smirk',       decoration: null },
        5:  { color: '#FF6B6B', eyeType: 'sparkle',     decoration: 'crown' },
        6:  { color: '#BB66FF', eyeType: 'smug',        decoration: null },
        7:  { color: '#FF88BB', eyeType: 'heart',       decoration: null },
        8:  { color: '#4488FF', eyeType: 'sunglasses',  decoration: null },
        9:  { color: '#FFD700', eyeType: 'normal',      decoration: 'flame' },
        10: { color: 'rainbow',  eyeType: 'sparkle',    decoration: 'halo' },
        11: { color: 'rainbow',  eyeType: 'heart',      decoration: 'wings' },
        12: { color: 'rainbow',  eyeType: 'sunglasses', decoration: 'crown_jewel' },
        13: { color: 'rainbow',  eyeType: 'smug',       decoration: 'lightning' },
        14: { color: 'rainbow',  eyeType: 'sparkle',    decoration: 'flame_wings' },
        15: { color: 'rainbow',  eyeType: 'sparkle',    decoration: 'ultimate' },
    };

    const RAINBOW_COLORS = ['#FF6B6B', '#FFAA33', '#FFDD44', '#66DD88', '#88DDFF', '#4488FF', '#BB66FF'];

    function getLevelData(level) {
        if (level < 1) level = 1;
        if (level > MAX_LEVEL) level = MAX_LEVEL;
        return LEVEL_DATA[level];
    }

    function coinsPerSecond(level) {
        return Math.pow(level, 1.2);
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
        let bodyColor;
        if (data.color === 'rainbow') {
            bodyColor = createRainbowGradient(ctx, x, y, radius, time);
        } else {
            bodyColor = data.color;
        }

        // Body glow for high levels
        if (level >= 5) {
            ctx.shadowColor = data.color === 'rainbow' ? '#FFD700' : data.color;
            ctx.shadowBlur = 8 + Math.sin(time * 0.005) * 4;
        }

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body highlight
        const highlightGrad = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
        highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
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
        }
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
        getLevelData,
        coinsPerSecond,
        summonCost,
        draw,
        drawStar,
        drawHeart,
        roundRect,
        createRainbowGradient,
    };
})();
