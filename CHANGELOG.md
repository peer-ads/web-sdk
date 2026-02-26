# Changelog

All notable changes to `@peerads/web` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-02-24

### Added
- Initial release of `@peerads/web`
- `PeerAds.init()` — SDK initialisation with live/test key pairs and environment switching
- `PeerAds.showBanner()` — fetch and render a banner ad into any DOM element (sizes: `320x50`, `728x90`, `300x250`)
- `PeerAds.loadInterstitial()` / `showInterstitial()` — pre-load and display full-screen interstitials
- `PeerAds.requestAd()` — low-level ad request returning raw `AdResponse`
- `PeerAds.track()` — track `impression`, `click`, and `install` events
- `PeerAds.reportDau()` — DAU reporting via secret key (server-side)
- SDK auth: `signInAnonymously()`, `signUp()`, `signIn()`, `linkWithEmail()`, `signOut()`
- Session persistence via `localStorage`; restored automatically on `init()`
- Ad network adapters: AdMob (GPT), AppLovin Exchange, Unity Ads JS, Meta iframe tag
- `AdapterManager` — lazy-load and delegate to network-specific adapters
- Test mode (`environment: 'test'`) with visual `[TEST]` label on peer/bid ads
- Full TypeScript types (`PeerAdsConfig`, `AdRequest`, `AdResponse`, `AdEvent`, `SdkUser`, `SdkAuthResult`)
