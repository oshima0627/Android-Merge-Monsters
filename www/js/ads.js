/**
 * AdMob integration via @capacitor-community/admob v6.
 */
const Ads = (() => {
    const BANNER_ID = 'ca-app-pub-4718076434751586/8180818511';
    const INTERSTITIAL_ID = 'ca-app-pub-4718076434751586/2032769609';
    const REWARD_ID = 'ca-app-pub-4718076434751586/7999412159';

    let admobAvailable = false;
    let bannerShowing = false;
    let gameOverCount = 0;
    let rewardCallback = null;
    let AdMobRef = null;
    let adPlaying = false;
    let adPlayingTimeout = null;

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

    async function init() {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                AdMobRef = window.Capacitor.Plugins.AdMob;
                await AdMobRef.initialize({
                    initializeForTesting: false,
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

                console.log('AdMob initialized successfully');
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
                isTesting: false,
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
            await AdMobRef.prepareInterstitial({
                adId: INTERSTITIAL_ID,
                isTesting: false,
            });
            await AdMobRef.showInterstitial();
        } catch (e) {
            console.warn('Interstitial failed:', e);
            markAdEnd();
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
            await AdMobRef.prepareRewardVideoAd({
                adId: REWARD_ID,
                isTesting: false,
            });
            await AdMobRef.showRewardVideoAd();
        } catch (e) {
            console.warn('Reward ad failed:', e);
            rewardCallback = null;
            markAdEnd();
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
