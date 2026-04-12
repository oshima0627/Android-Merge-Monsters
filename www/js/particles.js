/**
 * Particle effects system for merge explosions, coin pops, confetti, etc.
 */
const Particles = (() => {
    let particles = [];

    function spawn(config) {
        const count = config.count || 10;
        for (let i = 0; i < count; i++) {
            const angle = config.angle !== undefined
                ? config.angle + (Math.random() - 0.5) * (config.spread || Math.PI * 2)
                : Math.random() * Math.PI * 2;
            const speed = (config.speed || 100) * (0.5 + Math.random() * 0.5);
            particles.push({
                x: config.x + (Math.random() - 0.5) * (config.scatter || 0),
                y: config.y + (Math.random() - 0.5) * (config.scatter || 0),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: (config.decay || 1.5) * (0.8 + Math.random() * 0.4),
                size: (config.size || 4) * (0.5 + Math.random() * 0.5),
                color: config.colors
                    ? config.colors[Math.floor(Math.random() * config.colors.length)]
                    : (config.color || '#FFD700'),
                gravity: config.gravity !== undefined ? config.gravity : 200,
                type: config.type || 'circle',
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 10,
                friction: config.friction !== undefined ? config.friction : 0.98,
            });
        }
    }

    function spawnMergeExplosion(x, y, level) {
        const data = Monster.getLevelData(level);
        const color = data.color === 'rainbow' ? '#FFD700' : data.color;
        // Ring burst
        spawn({
            x, y,
            count: 16,
            speed: 200,
            size: 6,
            decay: 2.0,
            colors: [color, '#FFFFFF', '#FFD700', lightenColor(color, 50)],
            gravity: 50,
        });
        // Sparkles
        spawn({
            x, y,
            count: 8,
            speed: 120,
            size: 3,
            decay: 1.5,
            type: 'star',
            color: '#FFD700',
            gravity: -20,
        });
    }

    function spawnCoinPop(x, y) {
        spawn({
            x, y,
            count: 1,
            angle: -Math.PI / 2,
            spread: 0.6,
            speed: 60,
            size: 6,
            decay: 1.2,
            type: 'coin',
            color: '#FFD700',
            gravity: 30,
        });
    }

    function spawnConfetti(canvasWidth, canvasHeight) {
        const colors = ['#FF6B6B', '#FFD700', '#66DD88', '#88DDFF', '#BB66FF', '#FF88BB', '#FFAA33'];
        for (let i = 0; i < 80; i++) {
            spawn({
                x: Math.random() * canvasWidth,
                y: -20,
                count: 1,
                angle: Math.PI / 2,
                spread: 0.8,
                speed: 100 + Math.random() * 150,
                size: 5 + Math.random() * 5,
                decay: 0.4 + Math.random() * 0.3,
                type: 'confetti',
                colors: colors,
                gravity: 80,
                friction: 0.99,
            });
        }
    }

    function spawnSummon(x, y) {
        spawn({
            x, y,
            count: 12,
            speed: 80,
            size: 5,
            decay: 2.5,
            type: 'star',
            colors: ['#88DDFF', '#FFFFFF', '#AAEEFF'],
            gravity: -30,
        });
    }

    function spawnNewRecord(canvasWidth, canvasHeight) {
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'];
        for (let i = 0; i < 50; i++) {
            spawn({
                x: canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.6,
                y: canvasHeight * 0.3,
                count: 1,
                speed: 150 + Math.random() * 100,
                size: 4 + Math.random() * 4,
                decay: 0.8 + Math.random() * 0.4,
                type: Math.random() > 0.5 ? 'star' : 'circle',
                colors: colors,
                gravity: 100,
                friction: 0.97,
            });
        }
    }

    function update(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            p.vy += p.gravity * dt;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotSpeed * dt;
        }
    }

    function draw(ctx) {
        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            switch (p.type) {
                case 'circle':
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'star':
                    Monster.drawStar(ctx, 0, 0, p.size * 0.4 * p.life, p.size * p.life, 4, p.color);
                    break;

                case 'coin':
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FFA500';
                    ctx.font = `bold ${p.size * 1.2 * p.life}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$', 0, 0);
                    break;

                case 'confetti':
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size * 0.5, -p.size * 0.25, p.size, p.size * 0.5);
                    break;

                default:
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            ctx.restore();
        }
    }

    function clear() {
        particles = [];
    }

    function count() {
        return particles.length;
    }

    function lightenColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
        return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }

    return {
        spawn,
        spawnMergeExplosion,
        spawnCoinPop,
        spawnConfetti,
        spawnSummon,
        spawnNewRecord,
        update,
        draw,
        clear,
        count,
    };
})();
