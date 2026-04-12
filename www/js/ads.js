/**
 * AdMob integration via @capacitor-community/admob.
 */
const Ads = (() => {
    const BANNER_ID = 'ca-app-pub-4718076434751586/8180818511';
    const INTERSTITIAL_ID = 'ca-app-pub-4718076434751586/2032769609';
    const REWARD_ID = 'ca-app-pub-4718076434751586/7999412159';

    let admobAvailable = false;
    let bannerShowing = false;
    let gameOverCount = 0;
    let rewardCallback = null;

    async function init() {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                const { AdMob } = window.Capacitor.Plugins;
                await AdMob.initialize({
                    initializeForTesting: false,
                });
                admobAvailable = true;

                // Listen for reward
                AdMob.addListener('onRewardedVideoAdReward', () => {
                    if (rewardCallback) {
                        rewardCallback();
                        rewardCallback = null;
                    }
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
            const { AdMob } = window.Capacitor.Plugins;
            await AdMob.showBanner({
                adId: BANNER_ID,
                adSize: 'BANNER',
                position: 'BOTTOM_CENTER',
                margin: 0,
            });
            bannerShowing = true;
        } catch (e) {
            console.warn('Banner show failed:', e);
        }
    }

    async function hideBanner() {
        if (!admobAvailable || !bannerShowing) return;
        try {
            const { AdMob } = window.Capacitor.Plugins;
            await AdMob.hideBanner();
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
            const { AdMob } = window.Capacitor.Plugins;
            await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
            await AdMob.showInterstitial();
        } catch (e) {
            console.warn('Interstitial failed:', e);
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
            const { AdMob } = window.Capacitor.Plugins;
            await AdMob.prepareRewardVideoAd({ adId: REWARD_ID });
            await AdMob.showRewardVideoAd();
        } catch (e) {
            console.warn('Reward ad failed:', e);
            rewardCallback = null;
        }
    }

    function isAvailable() {
        return admobAvailable;
    }

    function isBannerShowing() {
        return bannerShowing;
    }

    return {
        init,
        showBanner,
        hideBanner,
        showInterstitial,
        showReward,
        isAvailable,
        isBannerShowing,
    };
})();
