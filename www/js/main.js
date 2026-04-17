/**
 * Entry point: initializes all modules and starts the game loop.
 */
(function () {
    'use strict';

    function boot() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Initialize modules
        Renderer.init(canvas);
        Sound.init();
        Ads.init();
        Game.loadSave();

        // Set up input
        Input.init(canvas, {
            onMerge: Game.handleMerge,
            onMove: Game.handleMove,
            onTap: Game.handleTap,
        });

        // Handle resize
        window.addEventListener('resize', () => {
            Renderer.resize();
        });

        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Resume audio on first interaction
        document.addEventListener('click', () => Sound.resume(), { once: true });
        document.addEventListener('touchstart', () => Sound.resume(), { once: true });

        // Persist session when the app is backgrounded or closed
        const persist = () => {
            if (Game.getState && Game.getState() === Game.STATE_PLAYING) {
                Game.saveSession();
            }
        };
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') persist();
        });
        window.addEventListener('pagehide', persist);
        window.addEventListener('beforeunload', persist);

        // Start game loop
        requestAnimationFrame(Game.update);
    }

    // Wait for DOM and Capacitor (if available)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
