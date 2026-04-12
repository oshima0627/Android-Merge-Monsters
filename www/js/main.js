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
        Game.loadSave();
        Ads.init();

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
