/**
 * AdMob integration via @capacitor-community/admob v6.
 */
const Ads = (() => {
    // ========================================================================
    // ⚠️ CLOSED TEST MODE: Using Google's official sample ad unit IDs so that
    // testers (and the developer) can tap ads without triggering AdMob
    // "invalid activity" enforcement.
    //
    // TODO: Before releasing to PRODUCTION, swap these back to the real
    // ca-app-pub-4718076434751586/* IDs listed below and set isTesting:false.
    // ========================================================================
    const USE_TEST_ADS = true;

    // Production ad unit IDs (do NOT tap these yourself)
    const PROD_BANNER_ID       = 'ca-app-pub-4718076434751586/8180818511';
    const PROD_INTERSTITIAL_ID = 'ca-app-pub-4718076434751586/2032769609';
    const PROD_REWARD_ID       = 'ca-app-pub-4718076434751586/7999412159';

    // Google sample test ad unit IDs (safe to tap during development/testing)
    const TEST_BANNER_ID       = 'ca-app-pub-3940256099942544/6300978111';
    const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
    const TEST_REWARD_ID       = 'ca-app-pub-3940256099942544/5224354917';

    const BANNER_ID       = USE_TEST_ADS ? TEST_BANNER_ID       : PROD_BANNER_ID;
    const INTERSTITIAL_ID = USE_TEST_ADS ? TEST_INTERSTITIAL_ID : PROD_INTERSTITIAL_ID;
    const REWARD_ID       = USE_TEST_ADS ? TEST_REWARD_ID       : PROD_REWARD_ID;

    let admobAvailable = false;
    let bannerShowing = false;
    let gameOverCount = 0;
    let rewardCallback = null;
    let AdMobRef = null;
    let adPlaying = false;
    let adPlayingTimeout = null;
    // Preloaded ad state so the user sees no lag when tapping 📺
    let rewardReady = false;
    let rewardLoading = false;
    let interstitialReady = false;
    let interstitialLoading = false;

    function markAdStart() {
        adPlaying = true;
        if (adPlayingTimeout) clearTimeout(adPlayingTimeout);
        // Fallback: clear flag after 2 minutes in case close event is missed
        adPlayingTimeout = setTimeout(() => { adPlaying = false; }, 120000);
    }

    function markAdEnd() {
        adPlaying = false;
        if (adPlayingTimeout) {
            clearTimeout(adPlayingTimeout);
            adPlayingTimeout = null;
        }
    }

    async function preloadRewardAd() {
        if (!admobAvailable || rewardReady || rewardLoading) return;
        rewardLoading = true;
        try {
            await AdMobRef.prepareRewardVideoAd({
                adId: REWARD_ID,
                isTesting: USE_TEST_ADS,
            });
            rewardReady = true;
        } catch (e) {
            console.warn('Reward preload failed:', e);
            rewardReady = false;
            // Retry after a short delay so a transient network hiccup doesn't
            // permanently kill the 📺 button
            setTimeout(() => { rewardLoading = false; preloadRewardAd(); }, 5000);
            return;
        }
        rewardLoading = false;
    }

    async function preloadInterstitialAd() {
        if (!admobAvailable || interstitialReady || interstitialLoading) return;
        interstitialLoading = true;
        try {
            await AdMobRef.prepareInterstitial({
                adId: INTERSTITIAL_ID,
                isTesting: USE_TEST_ADS,
            });
            interstitialReady = true;
        } catch (e) {
            console.warn('Interstitial preload failed:', e);
            interstitialReady = false;
            setTimeout(() => { interstitialLoading = false; preloadInterstitialAd(); }, 5000);
            return;
        }
        interstitialLoading = false;
    }

    async function init() {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                AdMobRef = window.Capacitor.Plugins.AdMob;
                await AdMobRef.initialize({
                    initializeForTesting: USE_TEST_ADS,
                });
                admobAvailable = true;

                // Listen for reward earned
                AdMobRef.addListener('onRewardedVideoAdReward', () => {
                    if (rewardCallback) {
                        rewardCallback();
                        rewardCallback = null;
                    }
                });

                // Track ad open/close so the game can pause sound/gen while an ad is visible
                const openEvents = [
                    'onRewardedVideoAdOpened',
                    'onInterstitialAdOpened',
                ];
                const closeEvents = [
                    'onRewardedVideoAdClosed',
                    'onInterstitialAdClosed',
                    'onRewardedVideoAdFailedToShow',
                    'onInterstitialAdFailedToShow',
                ];
                openEvents.forEach(ev => {
                    try { AdMobRef.addListener(ev, () => markAdStart()); } catch (e) {}
                });
                closeEvents.forEach(ev => {
                    try { AdMobRef.addListener(ev, () => markAdEnd()); } catch (e) {}
                });

                // Re-preload a fresh ad once the user closes the previous one
                try { AdMobRef.addListener('onRewardedVideoAdClosed', () => { rewardReady = false; preloadRewardAd(); }); } catch (e) {}
                try { AdMobRef.addListener('onRewardedVideoAdFailedToShow', () => { rewardReady = false; preloadRewardAd(); }); } catch (e) {}
                try { AdMobRef.addListener('onInterstitialAdClosed', () => { interstitialReady = false; preloadInterstitialAd(); }); } catch (e) {}
                try { AdMobRef.addListener('onInterstitialAdFailedToShow', () => { interstitialReady = false; preloadInterstitialAd(); }); } catch (e) {}

                console.log('AdMob initialized successfully');

                // Kick off initial preloads so the first tap is instant
                preloadRewardAd();
                preloadInterstitialAd();
            } else {
                console.log('AdMob not available (web environment)');
            }
        } catch (e) {
            console.warn('AdMob init failed:', e);
        }
    }

    async function showBanner() {
        if (!admobAvailable || bannerShowing) return;
        try {
            await AdMobRef.showBanner({
                adId: BANNER_ID,
                adSize: 'BANNER',
                position: 'BOTTOM_CENTER',
                margin: 0,
                isTesting: USE_TEST_ADS,
            });
            bannerShowing = true;
        } catch (e) {
            console.warn('Banner show failed:', e);
        }
    }

    async function hideBanner() {
        if (!admobAvailable || !bannerShowing) return;
        try {
            await AdMobRef.hideBanner();
            bannerShowing = false;
        } catch (e) {
            console.warn('Banner hide failed:', e);
        }
    }

    async function showInterstitial() {
        if (!admobAvailable) return;
        gameOverCount++;
        // Show every 3rd game over
        if (gameOverCount % 3 !== 0) return;
        try {
            markAdStart();
            if (!interstitialReady) {
                // Fallback: not preloaded yet, prepare on-demand
                await AdMobRef.prepareInterstitial({
                    adId: INTERSTITIAL_ID,
                    isTesting: USE_TEST_ADS,
                });
                interstitialReady = true;
            }
            await AdMobRef.showInterstitial();
            interstitialReady = false;
            // Preload next one in the background
            preloadInterstitialAd();
        } catch (e) {
            console.warn('Interstitial failed:', e);
            interstitialReady = false;
            markAdEnd();
            preloadInterstitialAd();
        }
    }

    async function showReward(callback) {
        if (!admobAvailable) {
            // In web/dev mode, simulate reward
            console.log('Simulating reward ad (dev mode)');
            if (callback) callback();
            return;
        }
        rewardCallback = callback;
        try {
            markAdStart();
            if (!rewardReady) {
                // Fallback: not preloaded yet, prepare on-demand
                await AdMobRef.prepareRewardVideoAd({
                    adId: REWARD_ID,
                    isTesting: USE_TEST_ADS,
                });
                rewardReady = true;
            }
            await AdMobRef.showRewardVideoAd();
            rewardReady = false;
            // Preload next one in the background
            preloadRewardAd();
        } catch (e) {
            console.warn('Reward ad failed:', e);
            rewardCallback = null;
            rewardReady = false;
            markAdEnd();
            preloadRewardAd();
        }
    }

    function isAvailable() {
        return admobAvailable;
    }

    function isBannerShowing() {
        return bannerShowing;
    }

    function isAdPlaying() {
        return adPlaying;
    }

    return {
        init,
        showBanner,
        hideBanner,
        showInterstitial,
        showReward,
        isAvailable,
        isBannerShowing,
        isAdPlaying,
    };
})();
